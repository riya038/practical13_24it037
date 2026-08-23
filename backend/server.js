const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Task = require('./models/Task');

const app = express();

// ==========================================
// 1. CORS & MIDDLEWARE CONFIGURATION
// ==========================================

// Allow requests from React frontend
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ==========================================
// 2. MONGODB CONNECTION
// ==========================================

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb';

mongoose
  .connect(MONGO_URI)
  .then(() =>
    console.log('✅ MongoDB connected successfully to:', MONGO_URI)
  )
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Helper function to wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// 3. API ROUTES
// ==========================================

// GET /
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message:
      'Task Manager API is running smoothly for Practical 6 (Full Stack Integration)',
    version: '1.0.0',
    endpoints: {
      getAllTasks: 'GET /tasks',
      getTaskById: 'GET /tasks/:id',
      createTask: 'POST /tasks',
      updateTask: 'PUT /tasks/:id',
      deleteTask: 'DELETE /tasks/:id',
    },
  });
});

// ==========================================
// GET /tasks
// Fetch all tasks
// ==========================================

app.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const tasks = await Task.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  })
);

// ==========================================
// GET /tasks/:id
// Fetch single task
// ==========================================

app.get(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Task not found with ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  })
);

// ==========================================
// POST /tasks
// Create new task
// ==========================================

app.post(
  '/tasks',
  asyncHandler(async (req, res) => {
    const { title, description, completed, priority } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: {
          title: 'Title is required',
        },
      });
    }

    const task = new Task({
      title: title.trim(),
      description: description || '',
      completed: completed === true,
      priority: priority || 'medium',
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  })
);

// ==========================================
// PUT /tasks/:id
// Update task
// ==========================================

app.put(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, completed, priority } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Task not found with ID: ${id}`,
      });
    }

    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: {
            title: 'Title cannot be empty',
          },
        });
      }

      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (completed !== undefined) {
      task.completed = Boolean(completed);
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  })
);

// ==========================================
// DELETE /tasks/:id
// Delete task
// ==========================================

app.delete(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Task not found with ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: task,
    });
  })
);

// ==========================================
// 4. GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error('⚠️ Error Handler Caught:', err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = {};

    Object.keys(err.errors).forEach((key) => {
      details[key] = err.errors[key].message;
    });

    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: details,
    });
  }

  // Mongoose Cast Error
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Resource not found. Invalid ID format: ${err.value}`,
    });
  }

  // Generic Server Error
  res.status(err.status || 500).json({
    success: false,
    error: 'Server Error',
    message:
      err.message || 'An unexpected error occurred on the server',
  });
});

// ==========================================
// 5. SERVER START
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Task Manager API Server running on http://localhost:${PORT}`
  );
});