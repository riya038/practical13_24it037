const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');

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
      'Task Manager API running for Practical 13 (AI API Integration)',
    version: '2.0.0',
    endpoints: {
      getAllTasks: 'GET /tasks',
      getTaskById: 'GET /tasks/:id',
      createTask: 'POST /tasks',
      updateTask: 'PUT /tasks/:id',
      deleteTask: 'DELETE /tasks/:id',
      generateAIDescription: 'POST /api/ai/generate-description',
    },
  });
});

// ==========================================
// PRACTICAL 13: AI API INTEGRATION ROUTE
// POST /api/ai/generate-description
// Auto-generates task description using OpenAI or Gemini
// Implements server-side key protection, rate limiting & graceful degradation
// ==========================================

const aiRateLimitMap = new Map();
const AI_RATE_LIMIT_MS = 60 * 1000; // 1 minute per task rate limit

app.post(['/api/ai/generate-description', '/ai/generate-description'], async (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      description: '',
      fallback: true,
      error: 'Task title is required to generate description.',
    });
  }

  const cleanTitle = title.trim();
  const normalizedKey = cleanTitle.toLowerCase();
  const now = Date.now();

  // Rate limiting check (max 1 AI request per task per minute)
  if (aiRateLimitMap.has(normalizedKey)) {
    const lastTime = aiRateLimitMap.get(normalizedKey);
    const elapsed = now - lastTime;
    if (elapsed < AI_RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((AI_RATE_LIMIT_MS - elapsed) / 1000);
      return res.status(429).json({
        description: '',
        fallback: true,
        rateLimited: true,
        message: `Rate limit: Please wait ${waitSeconds}s before requesting AI description for this task again.`,
      });
    }
  }

  try {
    let openaiKey = (process.env.OPENAI_API_KEY || '').trim();
    let geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    const enableMockAi = process.env.ENABLE_MOCK_AI === 'true';

    // Auto-detect if Google Gemini key was mistakenly entered under OPENAI_API_KEY
    if (openaiKey && !openaiKey.startsWith('sk-') && openaiKey !== 'your_key_here') {
      if (!geminiKey) {
        geminiKey = openaiKey;
      }
      openaiKey = '';
    }

    let generatedDescription = '';

    // Lab Demo/Evaluation mode: generate contextual AI suggestion if enabled
    if (enableMockAi) {
      generatedDescription = `Execute and complete ${cleanTitle} by following implementation guidelines, writing clean code, and verifying functionality.`;
    } else if (openaiKey && openaiKey !== 'your_key_here' && openaiKey.startsWith('sk-')) {
      const client = new OpenAI({ apiKey: openaiKey });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Write a short task description for: ${cleanTitle}`,
          },
        ],
        max_tokens: 150,
      });

      generatedDescription = completion.choices[0]?.message?.content?.trim() || '';
    } else if (geminiKey && geminiKey !== 'your_key_here' && geminiKey.trim() !== '') {
      // Direct fetch for Gemini API (supporting latest Gemini models)
      const modelsToTry = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-3.8-flash'];
      let geminiSuccess = false;

      for (const model of modelsToTry) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Write a concise 1-2 sentence task description for: ${cleanTitle}. Return only the description text.`,
                    },
                  ],
                },
              ],
            }),
          });

          if (response.ok) {
            const geminiData = await response.json();
            generatedDescription = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            if (generatedDescription) {
              geminiSuccess = true;
              break;
            }
          }
        } catch (innerErr) {
          // try next model
        }
      }

      if (!geminiSuccess && !generatedDescription) {
        throw new Error('Gemini API call failed across available models or requires billing.');
      }
    } else {
      // Graceful fallback when no key is configured
      console.warn('⚠️ Practical 13: Neither valid OPENAI_API_KEY nor GEMINI_API_KEY configured in backend .env. Returning fallback.');
      return res.status(200).json({
        description: '',
        fallback: true,
        message: 'AI API key not configured in backend .env. Please enter a description manually.',
      });
    }

    // Update rate limit timestamp on success
    aiRateLimitMap.set(normalizedKey, now);

    return res.status(200).json({
      description: generatedDescription,
      fallback: false,
    });
  } catch (err) {
    console.error('⚠️ Practical 13 AI API Error (graceful fallback triggered):', err.message);
    // Graceful degradation: return status 200 with fallback flag as specified in Practical 13
    return res.status(200).json({
      description: '',
      fallback: true,
      message: 'AI service unavailable or encountered an error. Core application continues working.',
    });
  }
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