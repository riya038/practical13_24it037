const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Fetch health/status of the backend API
 */
export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Fetch all tasks from MongoDB
 */
export async function fetchTasks() {
  const res = await fetch(`${API_BASE_URL}/tasks`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to fetch tasks');
  }
  return data.data;
}

/**
 * Fetch a single task by ID
 */
export async function fetchTaskById(id) {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to fetch task');
  }
  return data.data;
}

/**
 * Create a new task in MongoDB
 */
export async function createTask(taskData) {
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const errorDetails = data.details
      ? Object.values(data.details).join(', ')
      : data.message || data.error || 'Failed to create task';
    throw new Error(errorDetails);
  }
  return data.data;
}

/**
 * Update an existing task
 */
export async function updateTask(id, updateData) {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const errorDetails = data.details
      ? Object.values(data.details).join(', ')
      : data.message || data.error || 'Failed to update task';
    throw new Error(errorDetails);
  }
  return data.data;
}

/**
 * Delete a task
 */
export async function deleteTask(id) {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to delete task');
  }
  return data.data;
}
