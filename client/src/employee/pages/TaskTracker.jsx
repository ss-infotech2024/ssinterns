import React, { useState, useEffect } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Plus, FileText, Check, Loader, Edit, Trash2, RefreshCw, AlertCircle, Filter, X } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const IST = "Asia/Kolkata";
const API_URL = "https://ssinternsbacknedv2.onrender.com/api";
const PUBLIC_USER_ID = "666666666666666666666666"; // Fixed public user ID

// Priority and Type options
const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const TYPE_OPTIONS = ["Daily", "Weekly", "Monthly", "Project"];
const STATUS_OPTIONS = ["all", "pending", "completed"];

// TaskCard Component
const TaskCard = ({ task, onUpdate, onDelete, isManager = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({ ...task });
  const [isExpanded, setIsExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const priorityColors = {
    low: "bg-green-100 text-green-800 border border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    high: "bg-orange-100 text-orange-800 border border-orange-200",
    urgent: "bg-red-100 text-red-800 border border-red-200",
  };

  const typeColors = {
    Daily: "bg-blue-100 text-blue-800 border border-blue-200",
    Weekly: "bg-purple-100 text-purple-800 border border-purple-200",
    Monthly: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    Project: "bg-pink-100 text-pink-800 border border-pink-200",
  };

  const statusColors = {
    Pending: "bg-gray-100 text-gray-800 border border-gray-200",
    "In Progress": "bg-blue-100 text-blue-800 border border-blue-200",
    Completed: "bg-green-100 text-green-800 border border-green-200",
    "On Hold": "bg-yellow-100 text-yellow-800 border border-yellow-200",
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      await onUpdate(editedTask);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await onDelete(task);
      } catch (error) {
        console.error("Failed to delete task:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  // Capitalize priority for display
  const displayPriority = task.priority ?
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1) :
    "Medium";

  // Auto-calculate status based on progress
  const displayStatus = task.status ||
    (task.progress >= 100 ? "Completed" :
      task.progress > 0 ? "In Progress" : "Pending");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editedTask.title || ""}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Task Title *"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={editedTask.type || "Daily"}
              onChange={(e) => setEditedTask({ ...editedTask, type: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={editedTask.priority || "medium"}
              onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Progress: {editedTask.progress || 0}%
              </label>
              <input
                type="number"
                value={editedTask.progress || 0}
                onChange={(e) => setEditedTask({
                  ...editedTask,
                  progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                })}
                className="w-20 p-2 border border-gray-300 rounded-lg text-center"
                min="0"
                max="100"
              />
            </div>
            <input
              type="range"
              value={editedTask.progress || 0}
              onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              min="0"
              max="100"
            />
          </div>

          <textarea
            value={editedTask.description || ""}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            placeholder="Description (optional)"
          />

          <textarea
            value={editedTask.notes || ""}
            onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="2"
            placeholder="Notes (optional)"
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updating || !editedTask.title?.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {updating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-800 truncate" title={task.title}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-gray-600 text-sm mt-2">
                  {isExpanded || task.description.length <= 100
                    ? task.description
                    : `${task.description.substring(0, 100)}...`}
                  {task.description.length > 100 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="ml-2 text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </p>
              )}
            </div>

            {isManager && (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit task"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeColors[task.type] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
              {task.type}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
              {displayPriority}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusColors[displayStatus] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
              {displayStatus}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-semibold text-purple-600">{task.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${(task.progress || 0) >= 100 ? 'bg-green-500' :
                  (task.progress || 0) >= 50 ? 'bg-blue-500' :
                    (task.progress || 0) > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                style={{ width: `${task.progress || 0}%` }}
              ></div>
            </div>
          </div>

          {task.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-800">Notes:</span> {task.notes}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="truncate">
              {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Today'}
            </span>
            {task.employeeId?.name && task.employeeId._id !== PUBLIC_USER_ID ? (
              <span className="truncate ml-2" title={`Assigned to: ${task.employeeId.name}`}>
                👤 {task.employeeId.name}
              </span>
            ) : (
              <span className="truncate ml-2 text-gray-400" title="Public Task">
                🌍 Public Task
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Main TaskTracker Component
const TaskTracker = ({ isManager = true }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    type: "Daily",
    priority: "medium",
    progress: 0,
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: "all",
    priority: "all",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc"
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tasks with filters
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.type !== "all") queryParams.append("type", filters.type);
      if (filters.priority !== "all") queryParams.append("priority", filters.priority);
      if (filters.status !== "all") queryParams.append("status", filters.status);
      queryParams.append("sortBy", filters.sortBy);
      queryParams.append("sortOrder", filters.sortOrder);
      queryParams.append("limit", "50");

      const url = `${API_URL}/employee/task${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log("Fetching tasks from:", url);

      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Tasks data:", data);

      // Handle different response structures
      const tasksArray = data.tasks || data.data || data || [];
      if (!Array.isArray(tasksArray)) {
        console.warn("Expected array but got:", typeof tasksArray, tasksArray);
        setTasks([]);
      } else {
        setTasks(tasksArray);
      }

    } catch (err) {
      console.error("Fetch tasks error:", err);
      setError(err.message);
      toast.error(`Failed to load tasks: ${err.message}`);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Add task - FIXED VERSION
  const handleAddTask = async () => {
    const title = newTask.title.trim();
    if (!title) {
      toast.error("Title is required");
      return;
    }

    setAddingTask(true);

    // Prepare payload with public user ID
    const payload = {
      title: title,
      description: newTask.description?.trim() || "",
      type: newTask.type,
      priority: newTask.priority,
      progress: parseInt(newTask.progress) || 0,
      notes: newTask.notes?.trim() || "",
      employeeId: PUBLIC_USER_ID, // Fixed public user ID
    };

    console.log("Sending task payload:", payload);

    try {
      const res = await fetch(`${API_URL}/employee/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Response:", data);

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(`Validation failed: ${data.errors.join(", ")}`);
        }
        throw new Error(data.message || `Failed to add task (${res.status})`);
      }

      // Add the new task to the list
      const addedTask = data.task || data;
      setTasks(prev => [addedTask, ...prev]);

      // Reset form
      setNewTask({
        title: "",
        description: "",
        type: "Daily",
        priority: "medium",
        progress: 0,
        notes: "",
      });

      toast.success("Task added successfully!");

    } catch (err) {
      console.error("Add task error:", err);
      toast.error(err.message || "Failed to add task");
    } finally {
      setAddingTask(false);
    }
  };

  // Update task
  const handleUpdateTask = async (task) => {
    const id = task._id || task.id;
    if (!id) {
      toast.error("Invalid task ID");
      return false;
    }

    // Prepare update payload
    const payload = {
      title: task.title?.trim() || "",
      description: task.description?.trim() || "",
      type: task.type || "Daily",
      priority: task.priority || "medium",
      progress: parseInt(task.progress) || 0,
      notes: task.notes?.trim() || "",
    };

    try {
      const res = await fetch(`${API_URL}/employee/task/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Update failed (${res.status})`);
      }

      // Update task in state
      const updatedTask = data.task || data;
      setTasks(prev => prev.map(t =>
        (t._id === id || t.id === id) ? updatedTask : t
      ));

      toast.success("Task updated!");
      return true;
    } catch (err) {
      console.error("Update task error:", err);
      toast.error(err.message || "Failed to update task");
      return false;
    }
  };

  // Delete task
  const handleDeleteTask = async (task) => {
    const id = task._id || task.id;
    if (!id) {
      toast.error("Cannot delete - invalid task ID");
      return false;
    }

    if (!window.confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
      return false;
    }

    try {
      const res = await fetch(`${API_URL}/employee/task/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Delete failed (${res.status})`);
      }

      // Remove task from state
      setTasks(prev => prev.filter(t => (t._id !== id && t.id !== id)));
      toast.success("Task deleted!");
      return true;
    } catch (err) {
      console.error("Delete task error:", err);
      toast.error(err.message || "Failed to delete task");
      return false;
    }
  };

  // Generate report
  const generateReport = () => {
    if (tasks.length === 0) {
      toast.error("No tasks to generate report");
      return;
    }

    const completed = tasks.filter(t => (t.progress || 0) >= 100).length;
    const total = tasks.length;
    const avg = total ? (tasks.reduce((a, t) => a + (t.progress || 0), 0) / total).toFixed(1) : 0;

    const report = {
      generatedAt: formatInTimeZone(new Date(), IST, "dd MMM yyyy, hh:mm a"),
      message: "Public Task Tracker Report",
      totalTasks: total,
      completed,
      pending: total - completed,
      averageProgress: `${avg}%`,
      filtersApplied: filters,
      tasksByType: {
        Daily: tasks.filter(t => t.type === "Daily").length,
        Weekly: tasks.filter(t => t.type === "Weekly").length,
        Monthly: tasks.filter(t => t.type === "Monthly").length,
        Project: tasks.filter(t => t.type === "Project").length,
      },
      tasksByPriority: {
        Low: tasks.filter(t => t.priority === "low").length,
        Medium: tasks.filter(t => t.priority === "medium").length,
        High: tasks.filter(t => t.priority === "high").length,
        Urgent: tasks.filter(t => t.priority === "urgent").length,
      },
      recentTasks: tasks.slice(0, 10).map(task => ({
        title: task.title,
        type: task.type,
        priority: task.priority,
        progress: task.progress || 0,
        status: task.status || "Pending",
        createdAt: task.createdAt,
        isPublic: task.employeeId?._id === PUBLIC_USER_ID || !task.employeeId
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Task-Report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Report downloaded!");
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: "all",
      priority: "all",
      status: "all",
      sortBy: "createdAt",
      sortOrder: "desc"
    });
  };

  // Calculate statistics
  const completedTasks = tasks.filter(t => (t.progress || 0) >= 100).length;
  const pendingTasks = tasks.length - completedTasks;
  const teamProgress = tasks.length > 0
    ? (tasks.reduce((a, t) => a + (t.progress || 0), 0) / tasks.length).toFixed(1)
    : 0;

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex flex-col justify-center items-center min-h-[400px]">
        <div className="relative">
          <Loader className="w-12 h-12 animate-spin text-purple-600" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
        </div>
        <span className="mt-4 text-gray-600 font-medium">Loading tasks...</span>
        <p className="mt-2 text-gray-500 text-sm">Fetching from server</p>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl shadow-sm">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Public Task Tracker
              </h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} in the system
                {error && " • Error loading tasks"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={fetchTasks}
              disabled={loading}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={generateReport}
              disabled={tasks.length === 0}
              className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
            >
              <Check className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gradient-to-br from-white to-gray-50 p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Filter Tasks</h3>
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Types</option>
                  {TYPE_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Priorities</option>
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending (&lt; 100%)</option>
                  <option value="completed">Completed (100%)</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="title">Title</option>
                  <option value="priority">Priority</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
            </div>

            {/* Active Filters Badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {(filters.type !== "all" || filters.priority !== "all" || filters.status !== "all") && (
                <>
                  <span className="text-sm text-gray-500">Active filters:</span>
                  {filters.type !== "all" && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Type: {filters.type}
                    </span>
                  )}
                  {filters.priority !== "all" && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Priority: {filters.priority}
                    </span>
                  )}
                  {filters.status !== "all" && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Status: {filters.status}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Error Loading Tasks</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                  onClick={fetchTasks}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-white p-4 md:p-5 rounded-xl border border-purple-100 shadow-sm">
            <div className="text-xl md:text-2xl font-bold text-purple-700">{tasks.length}</div>
            <div className="text-xs md:text-sm text-gray-600 font-medium">Total Tasks</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white p-4 md:p-5 rounded-xl border border-green-100 shadow-sm">
            <div className="text-xl md:text-2xl font-bold text-green-700">{completedTasks}</div>
            <div className="text-xs md:text-sm text-gray-600 font-medium">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-white p-4 md:p-5 rounded-xl border border-orange-100 shadow-sm">
            <div className="text-xl md:text-2xl font-bold text-orange-700">{pendingTasks}</div>
            <div className="text-xs md:text-sm text-gray-600 font-medium">Pending</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white p-4 md:p-5 rounded-xl border border-blue-100 shadow-sm">
            <div className="text-xl md:text-2xl font-bold text-blue-700">{teamProgress}%</div>
            <div className="text-xs md:text-sm text-gray-600 font-medium">Avg Progress</div>
          </div>
        </div>

        {/* Add Task Form */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Add New Task</h2>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              🌍 Public Task Board • All tasks are visible to everyone
            </div>
          </div>

          <div className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task Title *"
                className="p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={addingTask}
              />

              <select
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                className="p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all"
                disabled={addingTask}
              >
                {TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all"
                disabled={addingTask}
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>

              <button
                onClick={handleAddTask}
                disabled={addingTask || !newTask.title.trim()}
                className="p-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
              >
                {addingTask ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Task
                  </>
                )}
              </button>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Describe the task details..."
                className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                rows="3"
                disabled={addingTask}
              />
            </div>

            {/* Progress */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-4 md:p-5 rounded-xl border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Initial Progress
                    </label>
                    <span className="text-lg font-bold text-purple-600">{newTask.progress}%</span>
                  </div>
                  <input
                    type="range"
                    value={newTask.progress}
                    onChange={(e) => setNewTask({ ...newTask, progress: parseInt(e.target.value) })}
                    className="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                    min="0"
                    max="100"
                    disabled={addingTask}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={newTask.progress}
                    onChange={(e) => setNewTask({
                      ...newTask,
                      progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    })}
                    className="w-24 p-3 border border-gray-300 rounded-lg text-center font-medium text-gray-700 transition-all"
                    min="0"
                    max="100"
                    disabled={addingTask}
                  />
                  <span className="text-gray-500 font-medium">%</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={newTask.notes}
                onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                placeholder="Additional notes or comments..."
                className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                rows="2"
                disabled={addingTask}
              />
            </div>
          </div>
        </div>

        {/* Task List */}
        {tasks.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                All Tasks <span className="text-gray-400 font-normal">({tasks.length})</span>
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>{completedTasks} completed</span>
                <div className="h-2 w-2 rounded-full bg-orange-500 ml-3"></div>
                <span>{pendingTasks} pending</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task._id || task.id || `task-${index}`}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  isManager={isManager}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 md:py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-200">
            <div className="inline-flex p-4 bg-gradient-to-br from-purple-50 to-white rounded-full mb-6">
              <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No tasks yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              This public task board is empty. Be the first to add a task and start collaborating!
            </p>
            <button
              onClick={() => {
                const titleInput = document.querySelector('input[placeholder="Task Title *"]');
                if (titleInput) {
                  titleInput.focus();
                  window.scrollTo({
                    top: titleInput.offsetTop - 100,
                    behavior: 'smooth'
                  });
                }
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5" />
              Create Your First Task
            </button>
          </div>
        )}

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="text-center text-gray-500 text-sm py-6 border-t border-gray-100">

            <p className="text-xs">
              {tasks.length} total tasks • {completedTasks} completed • {pendingTasks} pending
              {teamProgress > 0 && ` • Overall progress: ${teamProgress}%`}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default TaskTracker;