// src/pages/admin/TaskAdmin.jsx
import React, { useState, useEffect } from "react";
import {
    FileText, Search, Filter, Download, Eye, Edit, Trash2, Users,
    Calendar, Flag, Loader, RefreshCw, Plus, Clock, MessageSquare,
    AlertCircle, CheckCircle, PlayCircle, PauseCircle, MoreVertical
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const API_URL = "https://interncrm.onrender.com/api";

const PRIORITY_COLORS = {
    low: "bg-blue-100 text-blue-800 border border-blue-200",
    medium: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    high: "bg-orange-100 text-orange-800 border border-orange-200",
    urgent: "bg-red-100 text-red-800 border border-red-200"
};

const PRIORITY_ICONS = {
    low: <Flag className="w-3 h-3 text-blue-600" />,
    medium: <Flag className="w-3 h-3 text-yellow-600" />,
    high: <Flag className="w-3 h-3 text-orange-600" />,
    urgent: <AlertCircle className="w-3 h-3 text-red-600" />
};

const STATUS_COLORS = {
    pending: "bg-gray-100 text-gray-800 border border-gray-200",
    "in progress": "bg-blue-100 text-blue-800 border border-blue-200",
    completed: "bg-green-100 text-green-800 border border-green-200",
    "on hold": "bg-purple-100 text-purple-800 border border-purple-200"
};

const STATUS_ICONS = {
    pending: <Clock className="w-3 h-3 text-gray-600" />,
    "in progress": <PlayCircle className="w-3 h-3 text-blue-600" />,
    completed: <CheckCircle className="w-3 h-3 text-green-600" />,
    "on hold": <PauseCircle className="w-3 h-3 text-purple-600" />
};

const TYPE_COLORS = {
    Daily: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    Weekly: "bg-pink-100 text-pink-800 border border-pink-200",
    Monthly: "bg-teal-100 text-teal-800 border border-teal-200",
    Project: "bg-amber-100 text-amber-800 border border-amber-200"
};

const TaskAdmin = () => {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        search: "",
        employee: "",
        status: "",
        priority: "",
        type: ""
    });

    // New task form
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        type: "Daily",
        priority: "medium",
        progress: 0,
        employeeId: "",
        dueDate: "",
        notes: ""
    });

    const [showAddTask, setShowAddTask] = useState(false);

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            const employeesRes = await fetch(`${API_URL}/employee/get/employee`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            let employeesData = [];
            if (employeesRes.ok) {
                const data = await employeesRes.json();
                employeesData = data.employees || data || [];
                console.log("Employees loaded:", employeesData.length);
                setEmployees(employeesData);
                return employeesData;
            } else {
                const altRes = await fetch(`${API_URL}/employee`);
                if (altRes.ok) {
                    const altData = await altRes.json();
                    employeesData = altData.employees || altData || [];
                    console.log("Employees from alternative endpoint:", employeesData.length);
                    setEmployees(employeesData);
                    return employeesData;
                } else {
                    throw new Error(`Failed to fetch employees: ${employeesRes.status}`);
                }
            }
        } catch (err) {
            console.error("Error fetching employees:", err);
            toast.error("Failed to load employees");
            return [];
        }
    };

    // Fetch tasks for a specific employee
    const fetchEmployeeTasks = async (employeeId) => {
        try {
            const res = await fetch(`${API_URL}/employee/${employeeId}/tasks`);
            if (!res.ok) throw new Error(`Failed to fetch tasks for employee ${employeeId}`);
            
            const data = await res.json();
            if (data.success && data.employee && data.employee.tasks) {
                return data.employee.tasks;
            }
            return [];
        } catch (err) {
            console.warn(`Error fetching tasks for employee ${employeeId}:`, err);
            return [];
        }
    };

    // Fetch all tasks using the new endpoint structure
    const fetchAllTasks = async (employeesData) => {
        let allTasks = [];
        
        // Fetch tasks for each employee
        for (const employee of employeesData) {
            try {
                const employeeTasks = await fetchEmployeeTasks(employee._id);
                
                // Enrich tasks with employee information
                const enrichedTasks = employeeTasks.map(task => {
                    // Handle different field names for dates
                    const lastUpdated = task.lastUpdated || task.updatedAt || task.updatedDate;
                    const dueDate = task.dueDate || task.due;
                    const completedAt = task.completedAt || task.completedDate;
                    const createdAt = task.createdAt || task.createdDate;
                    
                    return {
                        ...task,
                        employeeId: {
                            _id: employee._id,
                            name: employee.name,
                            email: employee.email,
                            position: employee.position,
                            department: employee.department
                        },
                        lastUpdated,
                        dueDate,
                        completedAt,
                        createdAt
                    };
                });
                
                allTasks = [...allTasks, ...enrichedTasks];
            } catch (err) {
                console.warn(`Skipping employee ${employee._id}:`, err);
            }
        }
        
        return allTasks;
    };

    // Fetch all data - UPDATED TO USE NEW ENDPOINT
    const fetchAllData = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log("Starting data fetch...");

            // Fetch employees first
            const employeesData = await fetchEmployees();
            if (employeesData.length === 0) {
                throw new Error("No employees found");
            }

            // Fetch all tasks using the new endpoint structure
            const allTasks = await fetchAllTasks(employeesData);

            console.log("Total tasks loaded:", allTasks.length);
            if (allTasks.length > 0) {
                console.log("Sample task:", allTasks[0]);
            }
            
            setTasks(allTasks);

        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message);
            toast.error(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch tasks for a specific employee when filter changes
    const fetchTasksByEmployee = async (employeeId) => {
        if (!employeeId) {
            // If no employee selected, fetch all tasks
            fetchAllData();
            return;
        }

        setLoading(true);
        try {
            const employee = employees.find(emp => emp._id === employeeId);
            if (!employee) {
                toast.error("Employee not found");
                return;
            }

            const employeeTasks = await fetchEmployeeTasks(employeeId);
            
            // Enrich tasks with employee information
            const enrichedTasks = employeeTasks.map(task => {
                const lastUpdated = task.lastUpdated || task.updatedAt || task.updatedDate;
                const dueDate = task.dueDate || task.due;
                const completedAt = task.completedAt || task.completedDate;
                const createdAt = task.createdAt || task.createdDate;
                
                return {
                    ...task,
                    employeeId: {
                        _id: employee._id,
                        name: employee.name,
                        email: employee.email,
                        position: employee.position,
                        department: employee.department
                    },
                    lastUpdated,
                    dueDate,
                    completedAt,
                    createdAt
                };
            });

            setTasks(enrichedTasks);
            toast.success(`Showing tasks for ${employee.name}`);
        } catch (err) {
            console.error("Error fetching employee tasks:", err);
            toast.error("Failed to load employee tasks");
            fetchAllData(); // Fall back to all tasks
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Handle employee filter change
    const handleEmployeeFilterChange = (employeeId) => {
        setFilters({ ...filters, employee: employeeId });
        
        if (employeeId) {
            fetchTasksByEmployee(employeeId);
        } else {
            fetchAllData();
        }
    };

    // Filter tasks - SIMPLIFIED FOR EMPLOYEE FILTER
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = !filters.search ||
            task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
            (task.employeeId && typeof task.employeeId === 'object' && 
             task.employeeId.name?.toLowerCase().includes(filters.search.toLowerCase())) ||
            task.notes?.toLowerCase().includes(filters.search.toLowerCase());

        // Employee filter is already handled by fetchTasksByEmployee
        // but we still check here for consistency
        const matchesEmployee = !filters.employee || 
            (task.employeeId && task.employeeId._id === filters.employee);

        const matchesStatus = !filters.status || 
            (task.status?.toLowerCase() === filters.status.toLowerCase());
        
        const matchesPriority = !filters.priority || 
            task.priority === filters.priority;
        
        const matchesType = !filters.type || 
            task.type === filters.type;

        return matchesSearch && matchesEmployee && matchesStatus && matchesPriority && matchesType;
    });

    // Get employee name for display
    const getEmployeeName = (employeeId) => {
        if (!employeeId) return "Unassigned";
        
        if (typeof employeeId === 'object' && employeeId.name) {
            return employeeId.name;
        }
        
        if (typeof employeeId === 'string') {
            const employee = employees.find(emp => emp._id === employeeId);
            return employee ? employee.name : "Unknown";
        }
        
        return "Unassigned";
    };

    // Get employee object for display
    const getEmployeeObject = (employeeId) => {
        if (!employeeId) return null;
        
        if (typeof employeeId === 'object' && employeeId._id) {
            return employeeId;
        }
        
        if (typeof employeeId === 'string') {
            return employees.find(emp => emp._id === employeeId);
        }
        
        return null;
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            search: "",
            employee: "",
            status: "",
            priority: "",
            type: ""
        });
        fetchAllData(); // Reset to show all tasks
        toast.success("Filters cleared");
    };

    // Add new task
    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!newTask.employeeId) {
            toast.error("Please select an employee");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/employee/task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTask)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to add task");

            // Find the employee data to enrich the new task
            const employee = employees.find(emp => emp._id === newTask.employeeId);
            const enrichedTask = {
                ...data.task,
                employeeId: employee || newTask.employeeId,
                lastUpdated: data.task.lastUpdated || data.task.updatedAt || new Date().toISOString(),
                dueDate: data.task.dueDate || data.task.due,
                createdAt: data.task.createdAt || data.task.createdDate || new Date().toISOString(),
                completedAt: data.task.completedAt || data.task.completedDate
            };

            setTasks(prev => [enrichedTask, ...prev]);
            setNewTask({
                title: "",
                description: "",
                type: "Daily",
                priority: "medium",
                progress: 0,
                employeeId: "",
                dueDate: "",
                notes: ""
            });
            setShowAddTask(false);
            toast.success("Task added successfully!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Update task
    const handleUpdateTask = async (taskId, updates) => {
        try {
            const res = await fetch(`${API_URL}/employee/task/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to update task");

            // Get current date for lastUpdated
            const currentDate = new Date().toISOString();
            
            setTasks(prev => prev.map(task => {
                if (task._id === taskId) {
                    const employeeData = task.employeeId;
                    return { 
                        ...task, 
                        ...updates,
                        employeeId: employeeData,
                        lastUpdated: currentDate
                    };
                }
                return task;
            }));
            
            setActiveDropdown(null);
            toast.success("Task updated successfully!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Delete task
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;

        try {
            const res = await fetch(`${API_URL}/employee/task/${taskId}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Failed to delete task");

            setTasks(prev => prev.filter(task => task._id !== taskId));
            setActiveDropdown(null);
            toast.success("Task deleted successfully!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    // View task details
    const handleViewDetails = (task) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
        setActiveDropdown(null);
    };

    // Export tasks
    const exportTasks = () => {
        if (filteredTasks.length === 0) {
            toast.error("No tasks to export");
            return;
        }

        const exportData = filteredTasks.map(task => {
            const employee = getEmployeeObject(task.employeeId);
            return {
                "Task ID": task._id,
                "Title": task.title,
                "Description": task.description,
                "Employee": employee ? employee.name : "Unassigned",
                "Email": employee ? employee.email : "N/A",
                "Department": employee ? employee.department : "N/A",
                "Position": employee ? employee.position : "N/A",
                "Status": task.status,
                "Priority": task.priority,
                "Type": task.type,
                "Progress": `${task.progress}%`,
                "Due Date": task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A",
                "Created": task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "N/A",
                "Last Updated": task.lastUpdated ? new Date(task.lastUpdated).toLocaleDateString() : "N/A",
                "Completed At": task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "N/A",
                "Notes": task.notes || "N/A"
            };
        });

        const csvHeaders = Object.keys(exportData[0]).join(",");
        const csvRows = exportData.map(row =>
            Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const csvContent = [csvHeaders, ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `all-tasks-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("Tasks exported successfully!");
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (err) {
            console.warn("Error formatting date:", dateString, err);
            return "N/A";
        }
    };

    // Format datetime
    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (err) {
            console.warn("Error formatting datetime:", dateString, err);
            return "N/A";
        }
    };

    // Calculate task statistics
    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status?.toLowerCase() === 'completed').length,
        inProgress: tasks.filter(t => t.status?.toLowerCase() === 'in progress').length,
        pending: tasks.filter(t => t.status?.toLowerCase() === 'pending').length,
        onHold: tasks.filter(t => t.status?.toLowerCase() === 'on hold').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length,
        highPriority: tasks.filter(t => t.priority === 'high').length
    };

    return (
        <>
            <Toaster position="top-right" />

            {/* Task Details Modal */}
            {showTaskDetails && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Task Details</h3>
                            <button
                                onClick={() => setShowTaskDetails(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedTask.title}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedTask.status?.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
                                            {STATUS_ICONS[selectedTask.status?.toLowerCase()] || <Clock className="w-3 h-3 mr-1" />}
                                            {selectedTask.status || "Pending"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                    {selectedTask.description || "No description provided"}
                                </p>
                            </div>

                            {/* Employee Info */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                                {selectedTask.employeeId ? (
                                    <div className="mt-1 flex items-center space-x-3">
                                        <Users className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {getEmployeeName(selectedTask.employeeId)}
                                            </p>
                                            {getEmployeeObject(selectedTask.employeeId) && (
                                                <>
                                                    <p className="text-sm text-gray-500">
                                                        {getEmployeeObject(selectedTask.employeeId).email}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {getEmployeeObject(selectedTask.employeeId).position} • {getEmployeeObject(selectedTask.employeeId).department}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-500">Unassigned</p>
                                )}
                            </div>

                            {/* Task Metadata */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[selectedTask.type] || "bg-gray-100 text-gray-800"}`}>
                                        {selectedTask.type}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selectedTask.priority] || "bg-gray-100 text-gray-800"}`}>
                                            {PRIORITY_ICONS[selectedTask.priority] || <Flag className="w-3 h-3 mr-1" />}
                                            {selectedTask.priority ? selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1) : "Medium"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Progress: {selectedTask.progress || 0}%
                                </label>
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${selectedTask.progress || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {formatDate(selectedTask.dueDate) || "No due date"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Created</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedTask.createdAt)}</p>
                                </div>
                            </div>

                            {/* Additional Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedTask.lastUpdated)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Completed At</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedTask.completedAt)}</p>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedTask.notes && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                        <MessageSquare className="w-4 h-4 mr-1" />
                                        Notes
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                                        {selectedTask.notes}
                                    </p>
                                </div>
                            )}

                            {/* Task ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Task ID</label>
                                <p className="mt-1 text-sm text-gray-500 font-mono">{selectedTask._id}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowTaskDetails(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Component */}
            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-purple-600" />
                        Task Administration
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Public Access
                        </span>
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAddTask(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Task
                        </button>
                        <button
                            onClick={fetchAllData}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={exportTasks}
                            disabled={filteredTasks.length === 0}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Debug Info */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-red-800 font-semibold">Error Details:</h4>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 hover:text-red-800"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Enhanced Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-purple-600">{taskStats.total}</div>
                        <div className="text-sm text-gray-600">Total Tasks</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                        <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-orange-600">{taskStats.pending}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-purple-600">{taskStats.onHold}</div>
                        <div className="text-sm text-gray-600">On Hold</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-red-600">{taskStats.urgent}</div>
                        <div className="text-sm text-gray-600">Urgent</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-orange-600">{taskStats.highPriority}</div>
                        <div className="text-sm text-gray-600">High Priority</div>
                    </div>
                </div>

                {/* Add Task Modal */}
                {showAddTask && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Task</h3>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Task Title *"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                                <textarea
                                    placeholder="Description"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows="3"
                                />
                                <select
                                    value={newTask.employeeId}
                                    onChange={(e) => setNewTask({ ...newTask, employeeId: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select Employee *</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.name} ({emp.department})
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={newTask.type}
                                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Project">Project</option>
                                </select>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                <input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Progress: {newTask.progress}%
                                    </label>
                                    <input
                                        type="range"
                                        value={newTask.progress}
                                        onChange={(e) => setNewTask({ ...newTask, progress: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <textarea
                                    placeholder="Notes (optional)"
                                    value={newTask.notes}
                                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows="2"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowAddTask(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddTask}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                                >
                                    Add Task
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filters
                        </h3>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Employee Filter - UPDATED */}
                        <select
                            value={filters.employee}
                            onChange={(e) => handleEmployeeFilterChange(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>
                                    {emp.name} - {emp.department}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on hold">On Hold</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>

                        {/* Type Filter */}
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Types</option>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Project">Project</option>
                        </select>
                    </div>
                </div>

                {/* Enhanced Tasks Table */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading tasks...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-600 bg-red-50">
                            <p className="font-semibold">Error loading tasks</p>
                            <p className="text-sm mt-1">{error}</p>
                            <button
                                onClick={fetchAllData}
                                className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredTasks.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Task Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status & Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Progress
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dates
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTasks.map((task) => {
                                        const employee = getEmployeeObject(task.employeeId);
                                        return (
                                            <tr key={task._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {task.title}
                                                        </div>
                                                        {task.description && (
                                                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                                {task.description}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[task.type] || "bg-gray-100 text-gray-800"}`}>
                                                                {task.type}
                                                            </span>
                                                            {task.notes && (
                                                                <MessageSquare className="w-3 h-3 text-gray-400" title="Has notes" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {employee ? (
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex-shrink-0">
                                                                <Users className="w-8 h-8 text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {employee.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {employee.email}
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    {employee.department} • {employee.position}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500 italic">Unassigned</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status?.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
                                                                {STATUS_ICONS[task.status?.toLowerCase()] || <Clock className="w-3 h-3 mr-1" />}
                                                                {task.status || "Pending"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority] || "bg-gray-100 text-gray-800"}`}>
                                                                {PRIORITY_ICONS[task.priority] || <Flag className="w-3 h-3 mr-1" />}
                                                                {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Medium"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${task.progress || 0}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-600">{task.progress || 0}%</span>
                                                    </div>
                                                    {task.completedAt && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Completed: {formatDate(task.completedAt)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            Due: {formatDate(task.dueDate) || "No due date"}
                                                        </div>
                                                        <div>Created: {formatDate(task.createdAt)}</div>
                                                        <div>Updated: {formatDate(task.lastUpdated) || formatDate(task.updatedAt) || "N/A"}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setActiveDropdown(activeDropdown === task._id ? null : task._id)}
                                                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {activeDropdown === task._id && (
                                                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                                                <div className="py-1">
                                                                    <button
                                                                        onClick={() => handleViewDetails(task)}
                                                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                                    >
                                                                        <Eye className="w-4 h-4 mr-2" />
                                                                        View Details
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateTask(task._id, { status: "completed", progress: 100 })}
                                                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Mark Complete
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteTask(task._id)}
                                                                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Delete Task
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No tasks found</h3>
                            <p className="text-gray-500">
                                {filters.employee 
                                    ? `No tasks found for selected employee.`
                                    : filters.search || filters.status || filters.priority || filters.type
                                    ? "No tasks match your filters. Try changing your filter criteria."
                                    : "No tasks have been created yet."}
                            </p>
                            <button
                                onClick={() => setShowAddTask(true)}
                                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                            >
                                Create First Task
                            </button>
                        </div>
                    )}
                </div>

                {/* Summary */}
                {filteredTasks.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-sm text-gray-600">
                            Showing {filteredTasks.length} {filters.employee ? "employee" : ""} task{filteredTasks.length !== 1 ? 's' : ''}
                            {filters.search && ` matching "${filters.search}"`}
                            {filters.employee && ` for ${employees.find(e => e._id === filters.employee)?.name || "selected employee"}`}
                            {filters.status && ` with status "${filters.status}"`}
                            {filters.priority && ` with priority "${filters.priority}"`}
                            {filters.type && ` of type "${filters.type}"`}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default TaskAdmin;