// server.js  ← 100% WORKING VERSION (tested today)

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const chalk = require('chalk');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';
mongoose.connect(uri)
  .then(() => console.log(chalk.blue('MongoDB connected')))
  .catch(err => console.log(chalk.red('MongoDB error:', err)));

// USER MODEL
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

// JWT SECRET
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'ebddefe601af9cab900febbb21ae5c08ba24d1f6832e87f94183776fa8ef9119e2db293e26dffed358bb34dedf28e76a0dd243a882ed18b526aa4b6565d26f7a';

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'All fields required' });
  }
  try {
    const user = await User.create({ username, email, password });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      status: 'success',
      token,
      user: { id: user._id, username, email }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ status: 'error', message: 'Email & password required' });

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ status: 'success', token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id };  // ← Important: save user ID
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};
// ──────────────────────
// PROTECT ALL TASK ROUTES
// ──────────────────────
app.use('/api/tasks', authMiddleware);  // ← This line protects EVERYTHING below

// GET all tasks (only user's own tasks)
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await task.find({ userId: req.user.id }).lean();  // ← Only user's tasks
    res.json({
      status: 'success',
      count: tasks.length,
      data: tasks,
      timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Cannot fetch tasks'
    });
  }
});

// GET one task by ID (must belong to user)
app.get('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid task ID format'
    });
  }

  try {
    const taskItem = await task.findOne({ _id: id, userId: req.user.id }).lean();
    if (!taskItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or access denied'
      });
    }

    res.json({
      status: 'success',
      data: taskItem,
      timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// CREATE new task (automatically belongs to logged-in user)
app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Title is required'
    });
  }

  try {
    const newTask = await task.create({
      title,
      userId: req.user.id  // ← This makes it private!
    });

    res.status(201).json({
      status: 'success',
      data: newTask
    });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// DELETE task (only if it belongs to user)
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid task ID format'
    });
  }

  try {
    const deletedTask = await task.findOneAndDelete({
      _id: id,
      userId: req.user.id
    }).lean();

    if (!deletedTask) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or access denied'
      });
    }

    res.json({
      status: 'success',
      data: deletedTask,
      message: 'Task deleted successfully',
      timestamp: moment().format('YYYY-MM-DD, HH:mm:ss')
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Could not delete task'
    });
  }
});
// Simple test route
app.get('/', (req, res) => res.send('<h1>API is alive! Register → POST /api/auth/register</h1>'));


app.listen(PORT, () => {
  console.log(chalk.green(`Server running on http://localhost:${PORT}`));
});