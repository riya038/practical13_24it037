# Practical 6: Full-Stack Integration (React Frontend + Node/Express + MongoDB)

**Course:** Advanced Web Development Frameworks (ITUE301)  
**Program:** B.Tech (IT / CE / CSE / AIML) — CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY (CHARUSAT)  
**Author:** 24IT037  

---

## 📌 Objectives
1. Connect a modern **React (Vite)** single-page application frontend with an **Express.js** REST API backend.
2. Implement complete **CRUD (Create, Read, Update, Delete)** operations persisting to **MongoDB** via Mongoose.
3. Configure **CORS (Cross-Origin Resource Sharing)** and asynchronous `fetch` service layers for seamless client-server communication.
4. Provide state management for real-time task creation, editing, status toggles, deletion, filtering, searching, and progress tracking.
5. Implement graceful error handling, validation error toasts, and visual loading states.

---

## 🏗️ Full-Stack Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                │
│                   http://localhost:5173                │
│                                                        │
│  [TaskForm]  [TaskStats]  [TaskFilters]  [TaskList]   │
│                      │                                 │
│                      ▼                                 │
│             [src/api/taskApi.js]                       │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTP Requests (JSON)
                       │ (CORS Enabled)
                       ▼
┌────────────────────────────────────────────────────────┐
│               Express.js Server (Backend)              │
│                   http://localhost:5000                │
│                                                        │
│   GET /tasks          -> Fetch all tasks               │
│   POST /tasks         -> Create new task               │
│   PUT /tasks/:id      -> Update / Toggle completed     │
│   DELETE /tasks/:id   -> Remove task                   │
└──────────────────────┬─────────────────────────────────┘
                       │ Mongoose ODM
                       ▼
┌────────────────────────────────────────────────────────┐
│                  MongoDB Database                      │
│            mongodb://127.0.0.1:27017/taskdb            │
│                 └── tasks collection                   │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Execution Guide (In VS Code)

### Step 1: Open VS Code in Practical 6 Folder
Open terminal or VS Code directly in:
```bash
d:\Advanced Web\practical 6
```

---

### Step 2: Start the Backend Server (Terminal 1)
Open a new integrated terminal in VS Code:
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Start Express server with auto-reload (or npm start)
npm run dev
```
> ✅ You will see:
> `✅ MongoDB connected successfully to: mongodb://127.0.0.1:27017/taskdb`  
> `🚀 Task Manager API Server running on http://localhost:5000`

---

### Step 3: Start the Frontend Application (Terminal 2)
Split the terminal in VS Code (`Ctrl + Shift + 5` or click `+` to open Terminal 2):
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite React development server
npm run dev
```
> ✅ You will see:
> `VITE v8.x.x ready in xxx ms`  
> `➜ Local: http://localhost:5173/`

---

### Step 4: Open in Web Browser
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 📸 Screenshots Checklist for Practical Submission

Capture the following screenshots for your final word document / report:

| # | Screenshot Content | Where to capture |
|---|-------------------|------------------|
| **1** | **Backend Server Running** | VS Code Terminal 1 showing `MongoDB connected` & `Server running on http://localhost:5000` |
| **2** | **Frontend Vite Server** | VS Code Terminal 2 showing `Local: http://localhost:5173/` |
| **3** | **Task Management Dashboard (Initial View)** | Browser `http://localhost:5173` with stats, connected badge, and create form |
| **4** | **Creating a New Task** | Fill in Title, Description, select Priority (High/Medium/Low), and click "Add Task" |
| **5** | **Task List with Multiple Tasks & Priority Badges** | View cards showing High, Medium, Low badges and creation timestamps |
| **6** | **Toggling Task Completion** | Click checkbox on a task card (strikethrough effect + status badge updates to Done) |
| **7** | **Search & Filter in Action** | Filter by Status (Completed/Active) or Priority (High) and Search input |
| **8** | **Edit Task Modal** | Open Edit dialog, update task details, and save changes |
| **9** | **MongoDB Compass / Shell Verification** | MongoDB Compass or `mongosh` showing documents in `taskdb.tasks` collection |

---

## 🧪 API Endpoints Reference

| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/` | API Health & Info | - |
| `GET` | `/tasks` | Get all tasks (sorted newest first) | - |
| `GET` | `/tasks/:id` | Get task by MongoDB ObjectID | - |
| `POST` | `/tasks` | Create new task | `{"title": "MERN Task", "description": "Notes", "priority": "high"}` |
| `PUT` | `/tasks/:id` | Update task fields or completed status | `{"completed": true}` or `{"title": "Updated"}` |
| `DELETE` | `/tasks/:id` | Delete task document | - |

---

## ❓ Viva Questions & Key Concepts

### Q1: What is CORS and why is it essential in a decoupled React + Express architecture?
**Answer:**  
CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts web applications running on one origin (e.g., `http://localhost:5173`) from requesting resources from a different origin (e.g., `http://localhost:5000`).  
By using the `cors` middleware in Express (`app.use(cors())`), the server sends `Access-Control-Allow-Origin: *` response headers, authorizing the React client to make AJAX/fetch requests without being blocked by the browser's Same-Origin Policy.

### Q2: How does the React frontend interact with MongoDB asynchronously?
**Answer:**  
1. User triggers an action in the UI (e.g., submits the Task Form).
2. React calls an asynchronous helper function in `src/api/taskApi.js` using the standard `fetch()` API with HTTP methods (`POST`, `GET`, `PUT`, `DELETE`).
3. Express server receives the request, interacts with MongoDB through Mongoose models (`Task.find()`, `Task.create()`, etc.), and returns JSON.
4. React receives the JSON response, updates its component state (`setTasks`), and triggers an automatic UI re-render.

### Q3: What is the benefit of optimistic vs server-confirmed state updates in React?
**Answer:**  
- **Server-confirmed updates:** Wait for the backend response before altering the UI state. This ensures state is 100% consistent with database records and simplifies error recovery.
- **Optimistic updates:** Instantly reflect UI changes before the network response arrives, giving immediate feedback to the user, and rollback if the server returns an error.
