const express = require('express');
const chalk = require('chalk');
const moment = require('moment');
const mongoose= require('mongoose');
const task = require('./models/task');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const dotenv = require('dotenv').config();

const app = express();
const PORT =  process.env.PORT || 3000;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// Middleware
app.use(express.json());

// ROUTES
//connecting to mongoDB
// Use Atlas URI or fallback to local
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';

mongoose.connect(uri).then(() =>{
  console.log(chalk.blue('mongo DB connected successfully'))}).catch((err) =>{
    console.log(chalk.red('error connecting to mongo DB', err))});

// Registration end point .
app.post('/api/auth/register', async (req,res) =>{
  const { username, email, password} = req.body;
  if(!username|| !email || !password ){
    return res.status(400).json({
      status:'error',
      message:'all fields are required'
    });
  }
  
  try{
      const existingUser = await User.findOne({$or: [{username},{email}]});
      if (existingUser){
        return res.status(400).json({
          status:'error',
          message:'Username or email already in use'
        });
      }
    
    const user= await User.create({username, email, password});
    const token = jwt.sign({id: user._id}, 'JWT_SECRET_KEY', {expireIn : '1h'});
    res.status(201).json({
      status:'success',
      data:{
        user:{
          id: user._id,
          username: user.username,
          email: user.email,
          token
        }
      }
    });
  } catch (error){
    res.status(500).json({
      status:'error',
      message:'Server error'
    })
  }
});

//login
app.post('/api/auth/login', async (req, res) =>{
  const {email , password} = req.body;
  if(!email || !password){
    return res.status(400).json({
      status:'error',
      message:'email and password are required'
    });
  }
  try{ 
    const user = await User.findOne({email}).select('+password');
    if (!user || ! await user.comparePassword(password)){
      return res.status(400).json({
        status: 'error',
        message:'invalid credentials' 
      });
    }
    const token = jwt.sign({id: user._id}, 'JWT_SECRET_KEY', {expiresIn: '1h'});
    res.status(200).json({
      status: 'success',
      data : {user : {user_id : user._id, username: user.username, email: user.email} ,token}
    });
    }catch(error){
      res.status(500).json({
        status:'error',
        message: 'Server error'
      });
    }

  });
  const authMiddleware = async (req, res, next) =>{
  const token = req.header('Authorization')?.replace('Bearer','');
  if (!token){ 
    return res.status(401).json({
      status:'error',
      message:'no token provided'
    });
  }
  try{
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    req.user = decoded;
    next();


  }catch (error){
    res.status(401).json({
      status:'error',
      message:'invalid token'
    });
  }
  };

app.use('/api/tasks', authMiddleware);

// Home
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to my task manager! (MongoDB)</h1>
    <p>Time: ${moment().format('YYYY-MM-DD, HH:mm:ss')}</p>
    <a href="/api/tasks">Check tasks</a>
    <ul>
      <li><a href="/api/tasks">GET /api/tasks</a></li>
      <li>POST /api/tasks → { "title": "new task" }</li>
    </ul>
  `);
});

// GET all tasks
app.get('/api/tasks',async (req, res) => {
  try{
    const tasks = await task.find().lean();
    res.json({
    status: 'success',
    count: tasks.length,
    data: tasks,
    timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
    // Removed extra message
  });
}catch(err){
  res.status(500).json({
    status:'error',
    message:'can not fetch task..'
  })
}
});
//get individual tasks
app.get('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  // 1. Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid task ID format'
    });
  }

  try {
    const taskItem = await task.findById(id).lean();
    if (!taskItem) {
      return res.status(404).json({
        status: 'error',
        message: 'task not found'
      });
    }

    res.json({
      status: 'success',
      data: taskItem,
      timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
    });
  } catch (error) {
    console.error('GET /:id error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// POST new task
app.post('/api/tasks',async (req, res) => {
  const { title } = req.body;
  
  if(!title || title.trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'title is required'
    });
  }
   
  try{
    const newTask = await task.create({title});
   res.status(201).json({
    status:'success',
    data: newTask
  })
  } catch (error){
    console.error('POST /api/tasks error:', error); // Log for debugging
      res.status(500).json({
      status:'error',
      message:'server error'
    })
  }
});

// DELETE task by ID
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  // 1. Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid task ID format'
    });
  }

  try {
    const deletedTask = await task.findByIdAndDelete(id).lean();
    if (!deletedTask) {
      return res.status(404).json({
        status: 'error',
        message: 'task not found'
      });
    }

    res.json({
      status: 'success',
      data: deletedTask,
      message: 'task deleted successfully',
      timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
    });
  } catch (error) {
    console.error('DELETE /:id error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'could not delete task'
    });
  }
});
// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'server is working smoothly',
    timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
  });
});

// Start server
app.listen(PORT, () => {
  console.log(chalk.green(`server is running on port ${PORT}`)); // Fixed
  console.log(chalk.cyan(`Current time is ${moment().format('YYYY-MM-DD, HH:mm:ss')}`));
});