const express = require('express');
const chalk = require('chalk');
const moment = require('moment');
const mongoose= require('mongoose');
const task = require ('./models/task')

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// In-memory storage
let tasks = [
  { id: 1, title: 'build an api', completed: false },
  { id: 2, title: 'learn node.js', completed: true }
];

// ROUTES
//connecting to mongoDB
// Use Atlas URI or fallback to local
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';

mongoose.connect(uri).then(() =>{
  console.log(chalk.blue('mongo DB connected successfully'))}).catch((err) =>{
    console.log(chalk.red('error connecting to mongo DB', err))});


// Home
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to my task manager!(Mongo DB)</h1>
    <p>Time: ${moment().format('YYYY-MM-DD, HH:mm:ss')}</p>
    <a href="/api/tasks">Check tasks</a>
    <ul>
      <li><a href="/api/tasks">GET /api/tasks</a></li>
      <li>POST /api/tasks → { "title": "new task" }</li>
    </ul>
  `);
});

// GET all tasks
app.get('/api/tasks/',async (req, res) => {
  res.json({
    status: 'success',
    count: tasks.length,
    data: tasks,
    timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
    // Removed extra message
  });
});
//get individual tasks
app.get('/api/tasks/:id', async(req , res ) =>{
  const id =parseInt(req.params.id);
  const task =await task.find(t=> t.id ==id);
  if (!task) {
    return res.status(400).json({
      status:'error',
      message:'task not found'

    });
   
  }
    res.json({ 
      status:'success',
      data:task,
      timestamp:moment().format('YYYY-MM-DD,HH:mm:ss')
    });
});

// POST new task
app.post('/api/tasks',async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({
      status: 'error',
      message: 'title is required'
    });
  }

  const newTask = await task.create({title});
  return res.status(201).json({
    status:'success',
    data: task
  });
});
// DELETE task by ID
app.delete('/api/tasks/:id', async(req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({
      status: 'error',
      message: 'task not found'
    });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];

  res.json({
    status: 'success',
    data: deletedTask,
    message: 'task deleted successfully',
    timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
  });
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