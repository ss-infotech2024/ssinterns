import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    FileText, Search, Filter, Download, Eye, Trash2, Users,
    Calendar, Flag, RefreshCw, Plus, Clock, MessageSquare,
    AlertCircle, CheckCircle, PlayCircle, PauseCircle, MoreVertical, Mail,
    User, Briefcase, Building, ChevronUp, ChevronDown, SortAsc, SortDesc
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const API_URL = "https://ssinternsbackend.onrender.com/api";

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
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        search: "",
        employee: "",
        status: "",
        priority: "",
        type: "",
        dateRange: "all"
    });

    // Sorting
    const [sortConfig, setSortConfig] = useState({
        key: "lastUpdated",
        direction: "desc"
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

    // Cache for employee tasks
    const [employeeTasksCache, setEmployeeTasksCache] = useState({});

    // Fetch employees
    const fetchEmployees = useCallback(async () => {
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
                setEmployees(employeesData);
                return employeesData;
            } else {
                const altRes = await fetch(`${API_URL}/employee`);
                if (altRes.ok) {
                    const altData = await altRes.json();
                    employeesData = altData.employees || altData || [];
                    setEmployees(employeesData);
                    return employeesData;
                } else {
                    throw new Error(`Failed to fetch employees: ${employeesRes.status}`);
                }
            }
        } catch (err) {
            toast.error("Failed to load employees");
            return [];
        }
    }, []);

    // Fetch tasks for a specific employee
    const fetchEmployeeTasks = useCallback(async (employeeId) => {
        try {
            const res = await fetch(`${API_URL}/employee/${employeeId}/tasks`);
            if (!res.ok) throw new Error(`Failed to fetch tasks for employee`);

            const data = await res.json();
            if (data.success && data.employee && data.employee.tasks) {
                return data.employee.tasks;
            }
            return [];
        } catch (err) {
            return [];
        }
    }, []);

    // Fetch all tasks in parallel
    const fetchAllTasks = useCallback(async (employeesData) => {
        // Create an array of promises for each employee's tasks
        const taskPromises = employeesData.map(emp =>
            fetchEmployeeTasks(emp._id)
                .then(tasks => {
                    return tasks.map(task => ({
                        ...task,
                        employeeId: {
                            _id: emp._id,
                            name: emp.name,
                            email: emp.email,
                            position: emp.position,
                            department: emp.department,
                            profilePicture: emp.profilePicture
                        },
                        lastUpdated: task.lastUpdated || task.updatedAt || task.updatedDate,
                        dueDate: task.dueDate || task.due,
                        completedAt: task.completedAt || task.completedDate,
                        createdAt: task.createdAt || task.createdDate,
                        status: task.status || 'pending',
                        priority: task.priority || 'medium',
                        progress: task.progress || 0,
                        type: task.type || 'Daily'
                    }));
                })
                .catch(() => {
                    return [];
                })
        );

        try {
            const results = await Promise.allSettled(taskPromises);

            let allTasks = [];

            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    allTasks = [...allTasks, ...result.value];
                }
            });

            // Sort tasks by lastUpdated (newest first)
            allTasks.sort((a, b) => {
                const dateA = new Date(a.lastUpdated || a.createdAt || 0);
                const dateB = new Date(b.lastUpdated || b.createdAt || 0);
                return dateB - dateA;
            });

            // Build cache for employee tasks
            const cache = {};
            allTasks.forEach(task => {
                if (task.employeeId && task.employeeId._id) {
                    const empId = task.employeeId._id;
                    if (!cache[empId]) {
                        cache[empId] = [];
                    }
                    cache[empId].push(task);
                }
            });

            setEmployeeTasksCache(cache);
            return allTasks;
        } catch (err) {
            throw err;
        }
    }, [fetchEmployeeTasks]);

    // Fetch all data
    const fetchAllData = useCallback(async (isRefresh = false) => {
        setLoading(!isRefresh);
        setRefreshing(isRefresh);
        setError(null);

        try {
            const employeesData = await fetchEmployees();
            if (employeesData.length === 0) {
                throw new Error("No employees found");
            }

            const allTasks = await fetchAllTasks(employeesData);
            setTasks(allTasks);

            if (isRefresh) {
                toast.success(`Refreshed! Loaded ${allTasks.length} tasks`);
            }
        } catch (err) {
            setError(err.message);
            toast.error(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchEmployees, fetchAllTasks]);

    // Fetch tasks for a specific employee when filter changes
    const fetchTasksByEmployee = useCallback(async (employeeId) => {
        if (!employeeId) {
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

            // Check cache first
            if (employeeTasksCache[employeeId]) {
                setTasks(employeeTasksCache[employeeId]);
                toast.success(`Showing ${employeeTasksCache[employeeId].length} cached tasks for ${employee.name}`);
                setLoading(false);
                return;
            }

            const employeeTasks = await fetchEmployeeTasks(employeeId);

            // Enrich tasks with employee information
            const enrichedTasks = employeeTasks.map(task => ({
                ...task,
                employeeId: {
                    _id: employee._id,
                    name: employee.name,
                    email: employee.email,
                    position: employee.position,
                    department: employee.department,
                    profilePicture: employee.profilePicture
                },
                lastUpdated: task.lastUpdated || task.updatedAt || task.updatedDate,
                dueDate: task.dueDate || task.due,
                completedAt: task.completedAt || task.completedDate,
                createdAt: task.createdAt || task.createdDate,
                status: task.status || 'pending',
                priority: task.priority || 'medium',
                progress: task.progress || 0,
                type: task.type || 'Daily'
            }));

            setTasks(enrichedTasks);

            // Update cache
            setEmployeeTasksCache(prev => ({
                ...prev,
                [employeeId]: enrichedTasks
            }));

            toast.success(`Showing ${enrichedTasks.length} tasks for ${employee.name}`);
        } catch (err) {
            toast.error("Failed to load employee tasks");

            // Fall back to cached data if available
            if (employeeTasksCache[employeeId]) {
                setTasks(employeeTasksCache[employeeId]);
            } else {
                fetchAllData();
            }
        } finally {
            setLoading(false);
        }
    }, [employees, employeeTasksCache, fetchEmployeeTasks, fetchAllData]);

    // Initial fetch
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Handle employee filter change
    const handleEmployeeFilterChange = (employeeId) => {
        setFilters(prev => ({ ...prev, employee: employeeId }));

        if (employeeId) {
            fetchTasksByEmployee(employeeId);
        } else {
            fetchAllData();
        }
    };

    // Handle sort
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Get sort icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <SortAsc className="w-3 h-3 ml-1" />;
        return sortConfig.direction === 'asc' ?
            <ChevronUp className="w-3 h-3 ml-1" /> :
            <ChevronDown className="w-3 h-3 ml-1" />;
    };

    // Filter and sort tasks with useMemo
    const filteredAndSortedTasks = useMemo(() => {
        let filtered = tasks.filter(task => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = !filters.search ||
                task.title?.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower) ||
                (task.employeeId && task.employeeId.name?.toLowerCase().includes(searchLower)) ||
                task.notes?.toLowerCase().includes(searchLower);

            const matchesEmployee = !filters.employee ||
                (task.employeeId && task.employeeId._id === filters.employee);

            const matchesStatus = !filters.status ||
                (task.status?.toLowerCase() === filters.status.toLowerCase());

            const matchesPriority = !filters.priority ||
                task.priority === filters.priority;

            const matchesType = !filters.type ||
                task.type === filters.type;

            // Date range filter
            let matchesDateRange = true;
            if (filters.dateRange !== "all") {
                const today = new Date();
                const taskDate = new Date(task.dueDate || task.createdAt);

                switch (filters.dateRange) {
                    case "today":
                        matchesDateRange = taskDate.toDateString() === today.toDateString();
                        break;
                    case "thisWeek":
                        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                        matchesDateRange = taskDate >= startOfWeek;
                        break;
                    case "thisMonth":
                        matchesDateRange = taskDate.getMonth() === today.getMonth() &&
                            taskDate.getFullYear() === today.getFullYear();
                        break;
                    case "overdue":
                        matchesDateRange = task.dueDate && new Date(task.dueDate) < new Date();
                        break;
                    case "upcoming":
                        matchesDateRange = task.dueDate && new Date(task.dueDate) > new Date();
                        break;
                }
            }

            return matchesSearch && matchesEmployee && matchesStatus &&
                matchesPriority && matchesType && matchesDateRange;
        });

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle nested properties
            if (sortConfig.key === 'employeeName' && a.employeeId) {
                aValue = a.employeeId.name || '';
                bValue = b.employeeId.name || '';
            }

            // Handle dates
            if (sortConfig.key.includes('Date') || sortConfig.key.includes('At') ||
                sortConfig.key === 'createdAt' || sortConfig.key === 'lastUpdated' ||
                sortConfig.key === 'dueDate' || sortConfig.key === 'completedAt') {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            }

            // Handle numeric values
            if (sortConfig.key === 'progress') {
                aValue = aValue || 0;
                bValue = bValue || 0;
            }

            // Compare values
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [tasks, filters, sortConfig]);

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
            type: "",
            dateRange: "all"
        });
        fetchAllData();
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
                employeeId: employee ? {
                    _id: employee._id,
                    name: employee.name,
                    email: employee.email,
                    position: employee.position,
                    department: employee.department,
                    profilePicture: employee.profilePicture
                } : newTask.employeeId,
                lastUpdated: data.task.lastUpdated || new Date().toISOString(),
                dueDate: data.task.dueDate || data.task.due,
                createdAt: data.task.createdAt || new Date().toISOString(),
                completedAt: data.task.completedAt || data.task.completedDate,
                status: data.task.status || 'pending',
                priority: data.task.priority || 'medium',
                progress: data.task.progress || 0,
                type: data.task.type || 'Daily'
            };

            // Add to tasks list
            setTasks(prev => [enrichedTask, ...prev]);

            // Update cache
            if (employee) {
                setEmployeeTasksCache(prev => {
                    const currentTasks = prev[employee._id] || [];
                    return {
                        ...prev,
                        [employee._id]: [enrichedTask, ...currentTasks]
                    };
                });
            }

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

            const currentDate = new Date().toISOString();

            setTasks(prev => prev.map(task => {
                if (task._id === taskId) {
                    const updatedTask = {
                        ...task,
                        ...updates,
                        lastUpdated: currentDate
                    };

                    // Update cache
                    if (task.employeeId && task.employeeId._id) {
                        setEmployeeTasksCache(prevCache => {
                            const employeeTasks = prevCache[task.employeeId._id];
                            if (employeeTasks) {
                                return {
                                    ...prevCache,
                                    [task.employeeId._id]: employeeTasks.map(t =>
                                        t._id === taskId ? updatedTask : t
                                    )
                                };
                            }
                            return prevCache;
                        });
                    }

                    return updatedTask;
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

            const taskToDelete = tasks.find(t => t._id === taskId);

            setTasks(prev => prev.filter(task => task._id !== taskId));

            // Update cache
            if (taskToDelete && taskToDelete.employeeId && taskToDelete.employeeId._id) {
                setEmployeeTasksCache(prevCache => {
                    const employeeTasks = prevCache[taskToDelete.employeeId._id];
                    if (employeeTasks) {
                        return {
                            ...prevCache,
                            [taskToDelete.employeeId._id]: employeeTasks.filter(t => t._id !== taskId)
                        };
                    }
                    return prevCache;
                });
            }

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
            return "N/A";
        }
    };

    // Export tasks to CSV - DATE WISE
    const exportTasksAsExcel = (dateRange = "all") => {
        if (filteredAndSortedTasks.length === 0) {
            toast.error("No tasks to export");
            return;
        }

        try {
            // Filter by date range if specified
            let tasksToExport = [...filteredAndSortedTasks];

            if (dateRange !== "all") {
                const today = new Date();
                tasksToExport = tasksToExport.filter(task => {
                    const taskDate = new Date(task.dueDate || task.createdAt);

                    switch (dateRange) {
                        case "today":
                            return taskDate.toDateString() === today.toDateString();
                        case "thisWeek":
                            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                            return taskDate >= startOfWeek;
                        case "thisMonth":
                            return taskDate.getMonth() === today.getMonth() &&
                                taskDate.getFullYear() === today.getFullYear();
                        case "overdue":
                            return task.dueDate && new Date(task.dueDate) < new Date();
                        case "upcoming":
                            return task.dueDate && new Date(task.dueDate) > new Date();
                        default:
                            return true;
                    }
                });
            }

            if (tasksToExport.length === 0) {
                toast.error(`No tasks found for ${dateRange}`);
                return;
            }

            // Prepare data for export
            const exportData = tasksToExport.map((task, index) => {
                const employee = getEmployeeObject(task.employeeId);
                return {
                    "S.No": index + 1,
                    "Task ID": task._id || "N/A",
                    "Employee Name": employee ? employee.name : "Unassigned",
                    "Employee Email": employee ? employee.email : "N/A",
                    "Department": employee ? employee.department : "N/A",
                    "Position": employee ? employee.position : "N/A",
                    "Title": task.title || "N/A",
                    "Description": task.description || "N/A",
                    "Status": task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : "N/A",
                    "Priority": task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "N/A",
                    "Task Type": task.type || "N/A",
                    "Progress (%)": task.progress || 0,
                    "Due Date": task.dueDate ? formatDate(task.dueDate) : "N/A",
                    "Created Date": task.createdAt ? formatDate(task.createdAt) : "N/A",
                    "Last Updated": task.lastUpdated ? formatDate(task.lastUpdated) : "N/A",
                    "Completed At": task.completedAt ? formatDate(task.completedAt) : "N/A",
                    "Notes": task.notes || "N/A"
                };
            });

            // Convert to CSV
            let csvContent = "";

            // Add headers
            const headers = Object.keys(exportData[0]);
            csvContent += headers.join(",") + "\n";

            // Add rows
            exportData.forEach(row => {
                const values = headers.map(header => {
                    let value = row[header];

                    // Handle special characters
                    if (typeof value === 'string') {
                        value = value.replace(/"/g, '""');
                        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                            value = `"${value}"`;
                        }
                    }

                    return value;
                });

                csvContent += values.join(",") + "\n";
            });

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');

            // Create filename with date range
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            const timeStr = `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;

            let rangeText = "";
            if (dateRange !== "all") {
                rangeText = `_${dateRange}`;
            }

            a.href = url;
            a.download = `Tasks${rangeText}_${dateStr}_${timeStr}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(`Successfully exported ${exportData.length} tasks (${dateRange}) to CSV`);
        } catch (error) {
            toast.error("Failed to export tasks. Please try again.");
        }
    };

    // Calculate task statistics
    const taskStats = useMemo(() => {
        const today = new Date();
        const thisWeekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const thisMonth = today.getMonth();

        return {
            total: tasks.length,
            completed: tasks.filter(t => t.status?.toLowerCase() === 'completed').length,
            inProgress: tasks.filter(t => t.status?.toLowerCase() === 'in progress').length,
            pending: tasks.filter(t => t.status?.toLowerCase() === 'pending').length,
            overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
            today: tasks.filter(t => {
                const taskDate = new Date(t.dueDate || t.createdAt);
                return taskDate.toDateString() === today.toDateString();
            }).length,
            thisWeek: tasks.filter(t => {
                const taskDate = new Date(t.dueDate || t.createdAt);
                return taskDate >= thisWeekStart;
            }).length,
            thisMonth: tasks.filter(t => {
                const taskDate = new Date(t.dueDate || t.createdAt);
                return taskDate.getMonth() === thisMonth;
            }).length
        };
    }, [tasks]);

    // Handle refresh
    const handleRefresh = () => {
        fetchAllData(true);
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
                            {tasks.length} Tasks Loaded
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
                            onClick={handleRefresh}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || refreshing}
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <div className="relative group">
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="py-1">
                                    <button
                                        onClick={() => exportTasksAsExcel("all")}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                        All Tasks
                                    </button>
                                    <button
                                        onClick={() => exportTasksAsExcel("today")}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                        Today's Tasks
                                    </button>
                                    <button
                                        onClick={() => exportTasksAsExcel("thisWeek")}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                        This Week's Tasks
                                    </button>
                                    <button
                                        onClick={() => exportTasksAsExcel("thisMonth")}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                        This Month's Tasks
                                    </button>
                                    <button
                                        onClick={() => exportTasksAsExcel("overdue")}
                                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                    >
                                        Overdue Tasks
                                    </button>
                                    <button
                                        onClick={() => exportTasksAsExcel("upcoming")}
                                        className="flex items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50 w-full text-left"
                                    >
                                        Upcoming Tasks
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
                        <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
                        <div className="text-sm text-gray-600">Overdue</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-teal-600">{taskStats.today}</div>
                        <div className="text-sm text-gray-600">Today</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-2xl font-bold text-indigo-600">{taskStats.thisWeek}</div>
                        <div className="text-sm text-gray-600">This Week</div>
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
                            Filters & Sorting
                        </h3>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

                        {/* Employee Filter */}
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

                        {/* Date Range Filter */}
                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="thisWeek">This Week</option>
                            <option value="thisMonth">This Month</option>
                            <option value="overdue">Overdue</option>
                            <option value="upcoming">Upcoming</option>
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

                    {/* Sorting Options */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            onClick={() => handleSort("createdAt")}
                            className={`px-3 py-1 text-sm rounded-lg flex items-center ${sortConfig.key === "createdAt" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                        >
                            Created Date {getSortIcon("createdAt")}
                        </button>
                        <button
                            onClick={() => handleSort("dueDate")}
                            className={`px-3 py-1 text-sm rounded-lg flex items-center ${sortConfig.key === "dueDate" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                        >
                            Due Date {getSortIcon("dueDate")}
                        </button>
                        <button
                            onClick={() => handleSort("lastUpdated")}
                            className={`px-3 py-1 text-sm rounded-lg flex items-center ${sortConfig.key === "lastUpdated" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                        >
                            Last Updated {getSortIcon("lastUpdated")}
                        </button>
                        <button
                            onClick={() => handleSort("priority")}
                            className={`px-3 py-1 text-sm rounded-lg flex items-center ${sortConfig.key === "priority" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                        >
                            Priority {getSortIcon("priority")}
                        </button>
                        <button
                            onClick={() => handleSort("employeeName")}
                            className={`px-3 py-1 text-sm rounded-lg flex items-center ${sortConfig.key === "employeeName" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                        >
                            Employee Name {getSortIcon("employeeName")}
                        </button>
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
                                onClick={handleRefresh}
                                className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredAndSortedTasks.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Task Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee Information
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
                                    {filteredAndSortedTasks.map((task) => {
                                        const employee = getEmployeeObject(task.employeeId);
                                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                                        const isToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();

                                        return (
                                            <tr key={task._id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : isToday ? 'bg-blue-50' : ''}`}>
                                                {/* Task Details Column */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-3">
                                                        <div className="space-y-2">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="inline-block px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded">
                                                                            #{task._id?.substring(0, 8)}...
                                                                        </span>
                                                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[task.type] || "bg-gray-100 text-gray-800"}`}>
                                                                            {task.type}
                                                                        </div>
                                                                        {isOverdue && (
                                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                                Overdue
                                                                            </span>
                                                                        )}
                                                                        {isToday && (
                                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                Today
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <div className="text-sm font-semibold text-gray-900">
                                                                            {task.title}
                                                                        </div>
                                                                        {task.description && (
                                                                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                                                {task.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {task.notes && (
                                                                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" title="Has notes" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Employee Information Column */}
                                                <td className="px-6 py-4">
                                                    {employee ? (
                                                        <div className="space-y-3">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex-shrink-0">
                                                                        {employee.profilePicture ? (
                                                                            <img
                                                                                src={employee.profilePicture}
                                                                                alt={employee.name}
                                                                                className="w-10 h-10 rounded-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                                                <User className="w-5 h-5 text-purple-600" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                                            {employee.name}
                                                                        </div>
                                                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                                                            <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                            <span className="truncate">{employee.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div className="flex items-center space-x-1">
                                                                    <Building className="w-3 h-3 text-gray-400" />
                                                                    <span className="text-gray-600 truncate">{employee.department || "N/A"}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    <Briefcase className="w-3 h-3 text-gray-400" />
                                                                    <span className="text-gray-600 truncate">{employee.position || "N/A"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4">
                                                            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                            <div className="text-sm text-gray-500 italic">Unassigned</div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Status & Priority Column */}
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

                                                {/* Progress Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
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

                                                {/* Dates Column */}
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                                                Due: {formatDate(task.dueDate) || "No due date"}
                                                            </span>
                                                        </div>
                                                        <div>Created: {formatDate(task.createdAt)}</div>
                                                        <div>Updated: {formatDate(task.lastUpdated) || formatDate(task.updatedAt) || "N/A"}</div>
                                                    </div>
                                                </td>

                                                {/* Actions Column */}
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
                                    : filters.search || filters.status || filters.priority || filters.type || filters.dateRange !== "all"
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
                {filteredAndSortedTasks.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing {filteredAndSortedTasks.length} {filters.employee ? "employee" : ""} task{filteredAndSortedTasks.length !== 1 ? 's' : ''}
                                {filters.search && ` matching "${filters.search}"`}
                                {filters.employee && ` for ${employees.find(e => e._id === filters.employee)?.name || "selected employee"}`}
                                {filters.status && ` with status "${filters.status}"`}
                                {filters.priority && ` with priority "${filters.priority}"`}
                                {filters.type && ` of type "${filters.type}"`}
                                {filters.dateRange !== "all" && ` for ${filters.dateRange}`}
                            </div>
                            <div className="text-xs text-gray-500">
                                Sorted by: {sortConfig.key} ({sortConfig.direction})
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
export default TaskAdmin;