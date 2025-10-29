const express = require('express');
const chalk = require('chalk');
const moment = require('moment');
const mongoose= require('mongoose');
const task = require('./models/task');

const app = express();
const PORT =  process.env.PORT || 3000;

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
    const tasks = await task.find();
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
app.get('/api/tasks/:id', async(req , res ) =>{

  try{
  const task =await task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({
      status:'error',
      message:'task not found'

    });
  }
  
    res.json({ 
      status:'success',
      data:task,
      timestamp:moment().format('YYYY-MM-DD,HH:mm:ss')
    });
  }catch(error){
    res.status(500).json({
      status:'error',
      message:'Invalid server ID'
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
app.delete('/api/tasks/:id', async(req, res) => {
  try{
  const deletedTask = await task.findByIdAndDelete(req.params.id);

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
}
catch(error){
  res.status(500).json({
    status:'error',
    message:'could not delete task '
  })
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