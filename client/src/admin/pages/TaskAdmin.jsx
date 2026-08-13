import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    FileText, Search, Filter, Download, Eye, Trash2, Users,
    Calendar, Flag, RefreshCw, Plus, Clock, MessageSquare,
    AlertCircle, CheckCircle, PlayCircle, PauseCircle,
    MoreVertical, Mail, User, Briefcase, Building,
    ChevronUp, ChevronDown, SortAsc, Zap, X
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const API_URL = "http://localhost:5000/api";

/* ─────────────────────────────────────────────────────────────────────────────
   OPTIMIZED CACHE with longer TTL and pre-fetch support
───────────────────────────────────────────────────────────────────────────── */
const CACHE = {
    employees: null, 
    tasks: null, 
    map: null, 
    ts: 0, 
    TTL: 300_000, // 5 minutes - much longer cache
    
    valid() { 
        return !!this.tasks && !!this.employees && Date.now() - this.ts < this.TTL; 
    },
    
    set(employees, tasks) {
        this.employees = employees;
        this.tasks = tasks;
        this.map = employees ? Object.fromEntries(employees.map(e => [e._id, e])) : {};
        this.ts = Date.now();
    },
    
    bust() { 
        this.ts = 0; 
        this.employees = null;
        this.tasks = null;
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const PRIORITY_COLORS = {
    low:    "bg-blue-50 text-blue-700 border border-blue-200",
    medium: "bg-amber-50 text-amber-700 border border-amber-200",
    high:   "bg-orange-50 text-orange-700 border border-orange-200",
    urgent: "bg-red-50 text-red-700 border border-red-200",
};
const PRIORITY_ICONS = {
    low:    <Flag className="w-3 h-3" />,
    medium: <Flag className="w-3 h-3" />,
    high:   <Flag className="w-3 h-3" />,
    urgent: <AlertCircle className="w-3 h-3" />,
};
const STATUS_COLORS = {
    pending:       "bg-slate-100 text-slate-600 border border-slate-200",
    "in progress": "bg-blue-50 text-blue-700 border border-blue-200",
    completed:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "on hold":     "bg-purple-50 text-purple-700 border border-purple-200",
};
const STATUS_ICONS = {
    pending:       <Clock className="w-3 h-3" />,
    "in progress": <PlayCircle className="w-3 h-3" />,
    completed:     <CheckCircle className="w-3 h-3" />,
    "on hold":     <PauseCircle className="w-3 h-3" />,
};
const TYPE_COLORS = {
    Daily:   "bg-indigo-50 text-indigo-700 border border-indigo-200",
    Weekly:  "bg-pink-50 text-pink-700 border border-pink-200",
    Monthly: "bg-teal-50 text-teal-700 border border-teal-200",
    Project: "bg-amber-50 text-amber-700 border border-amber-200",
};

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : "";

const fmt = (ds, time = false) => {
    if (!ds) return "—";
    try {
        const d = new Date(ds);
        if (isNaN(d)) return "—";
        return time
            ? d.toLocaleString("en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })
            : d.toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });
    } catch { return "—"; }
};

const normalise = (task, emp) => ({
    ...task,
    employeeId:  emp ? { _id:emp._id, name:emp.name, email:emp.email, position:emp.position, department:emp.department, profilePicture:emp.profilePicture } : task.employeeId,
    lastUpdated: task.lastUpdated || task.updatedAt   || task.updatedDate  || null,
    dueDate:     task.dueDate     || task.due          || null,
    completedAt: task.completedAt || task.completedDate|| null,
    createdAt:   task.createdAt   || task.createdDate  || null,
    status:      task.status      || "pending",
    priority:    task.priority    || "medium",
    progress:    task.progress    || 0,
    type:        task.type        || "Daily",
});

/* ─────────────────────────────────────────────────────────────────────────────
   OPTIMIZED FETCH - Parallel requests with Promise.all for speed
───────────────────────────────────────────────────────────────────────────── */
async function fetchAllDataOptimized(signal) {
    // Fetch employees first
    const empRes = await fetch(`${API_URL}/employee/get/employee`, { signal });
    if (!empRes.ok) throw new Error(`Employees: ${empRes.status}`);
    const empJson = await empRes.json();
    const employees = empJson.employees || empJson || [];
    if (!employees.length) throw new Error("No employees found");

    // Fetch all task data in parallel
    const taskPromises = employees.map(emp =>
        fetch(`${API_URL}/employee/${emp._id}/tasks`, { signal })
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                const tasks = d?.employee?.tasks?.map(t => normalise(t, emp)) || [];
                return tasks;
            })
            .catch(() => [])
    );

    const results = await Promise.all(taskPromises);
    const allTasks = results.flat();
    allTasks.sort((a, b) => new Date(b.lastUpdated || b.createdAt || 0) - new Date(a.lastUpdated || a.createdAt || 0));
    
    CACHE.set(employees, allTasks);
    return { employees, tasks: allTasks };
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHIMMER PRIMITIVE - Ultra smooth animation
───────────────────────────────────────────────────────────────────────────── */
const Shimmer = ({ className = "" }) => (
    <div className={`relative overflow-hidden bg-gray-100 rounded ${className}`}>
        <span
            className="absolute inset-0 block"
            style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                animation: "shimmer-wave 1.2s ease-in-out infinite",
            }}
        />
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON COMPONENTS - Mirrors exact visual structure
───────────────────────────────────────────────────────────────────────────── */
const SkeletonTaskDetails = () => (
    <td className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
            <Shimmer className="h-5 w-20 rounded-md" />
            <Shimmer className="h-5 w-14 rounded-full" />
        </div>
        <Shimmer className="h-4 w-48 mb-2 rounded" />
        <Shimmer className="h-3 w-40 mb-1.5 rounded" />
        <Shimmer className="h-3 w-32 rounded" />
    </td>
);

const SkeletonEmployee = () => (
    <td className="px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
            <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3.5 w-28 rounded" />
                <Shimmer className="h-3 w-36 rounded" />
            </div>
        </div>
        <div className="flex gap-3">
            <Shimmer className="h-3 w-20 rounded" />
            <Shimmer className="h-3 w-16 rounded" />
        </div>
    </td>
);

const SkeletonStatusPriority = () => (
    <td className="px-6 py-4">
        <div className="space-y-2.5">
            <Shimmer className="h-6 w-24 rounded-full" />
            <Shimmer className="h-6 w-20 rounded-full" />
        </div>
    </td>
);

const SkeletonProgress = () => (
    <td className="px-6 py-4">
        <div className="flex items-center gap-2 mb-1.5">
            <Shimmer className="h-2 w-24 rounded-full" />
            <Shimmer className="h-3.5 w-8 rounded" />
        </div>
        <Shimmer className="h-3 w-24 rounded" />
    </td>
);

const SkeletonDates = () => (
    <td className="px-6 py-4">
        <div className="space-y-2">
            <Shimmer className="h-3 w-28 rounded" />
            <Shimmer className="h-3 w-24 rounded" />
            <Shimmer className="h-3 w-20 rounded" />
        </div>
    </td>
);

const SkeletonActions = () => (
    <td className="px-6 py-4">
        <Shimmer className="h-7 w-7 rounded-lg" />
    </td>
);

const SkeletonRow = () => (
    <tr className="border-b border-gray-50">
        <SkeletonTaskDetails />
        <SkeletonEmployee />
        <SkeletonStatusPriority />
        <SkeletonProgress />
        <SkeletonDates />
        <SkeletonActions />
    </tr>
);

const SkeletonStatCard = () => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <Shimmer className="h-8 w-12 mb-2 rounded" />
        <Shimmer className="h-3 w-20 rounded" />
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function TaskAdmin() {
    // Start with empty data - skeleton shows immediately
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showAddTask, setShowAddTask] = useState(false);

    const abortRef = useRef(null);

    const [filters, setFilters] = useState({
        search: "", employee: "", status: "", priority: "", type: "", dateRange: "all"
    });
    const [sort, setSort] = useState({ key: "lastUpdated", dir: "desc" });

    const EMPTY = { title: "", description: "", type: "Daily", priority: "medium", progress: 0, employeeId: "", dueDate: "", notes: "" };
    const [newTask, setNewTask] = useState(EMPTY);

    /* ── OPTIMIZED DATA LOADER - Loads everything in parallel ── */
    const loadData = useCallback(async (forceRefresh = false) => {
        // Check cache first
        if (!forceRefresh && CACHE.valid()) {
            setEmployees(CACHE.employees);
            setTasks(CACHE.tasks);
            setLoading(false);
            return;
        }
        
        // Cancel any ongoing request
        if (abortRef.current) {
            abortRef.current.abort();
        }
        
        const controller = new AbortController();
        abortRef.current = controller;
        
        // Show loading skeleton immediately
        setLoading(true);
        setError(null);
        setTasks([]);
        setEmployees([]);
        
        try {
            const { employees: emps, tasks: allTasks } = await fetchAllDataOptimized(controller.signal);
            setEmployees(emps);
            setTasks(allTasks);
        } catch (err) {
            if (err.name === 'AbortError') return;
            setError(err.message);
            toast.error(`Failed to load: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadData();
        return () => {
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [loadData]);

    /* ── Filter and Sort with memoization ── */
    const filtered = useMemo(() => {
        const searchLower = filters.search.toLowerCase();
        let result = tasks.filter(task => {
            const emp = task.employeeId;
            
            // Search filter
            if (searchLower && !(
                task.title?.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower) ||
                emp?.name?.toLowerCase().includes(searchLower) ||
                task.notes?.toLowerCase().includes(searchLower)
            )) return false;
            
            // Employee filter
            if (filters.employee && emp?._id !== filters.employee) return false;
            
            // Status filter
            if (filters.status && task.status?.toLowerCase() !== filters.status) return false;
            
            // Priority filter
            if (filters.priority && task.priority !== filters.priority) return false;
            
            // Type filter
            if (filters.type && task.type !== filters.type) return false;
            
            // Date range filter
            if (filters.dateRange !== "all") {
                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                const createdDate = new Date(task.createdAt);
                const targetDate = dueDate || createdDate;
                const now = new Date();
                
                switch(filters.dateRange) {
                    case "today":
                        if (targetDate.toDateString() !== now.toDateString()) return false;
                        break;
                    case "thisWeek": {
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay());
                        if (targetDate < startOfWeek) return false;
                        break;
                    }
                    case "thisMonth":
                        if (targetDate.getMonth() !== now.getMonth() || targetDate.getFullYear() !== now.getFullYear()) return false;
                        break;
                    case "overdue":
                        if (!task.dueDate || new Date(task.dueDate) >= now || task.status === "completed") return false;
                        break;
                    case "upcoming":
                        if (!task.dueDate || new Date(task.dueDate) <= now) return false;
                        break;
                }
            }
            
            return true;
        });
        
        // Sort
        result.sort((a, b) => {
            let aVal = a[sort.key];
            let bVal = b[sort.key];
            
            if (sort.key === "employeeName") {
                aVal = a.employeeId?.name || "";
                bVal = b.employeeId?.name || "";
            }
            
            if (["createdAt", "lastUpdated", "dueDate", "completedAt"].includes(sort.key)) {
                aVal = new Date(aVal || 0);
                bVal = new Date(bVal || 0);
            }
            
            if (sort.key === "progress") {
                aVal = aVal || 0;
                bVal = bVal || 0;
            }
            
            if (aVal < bVal) return sort.dir === "asc" ? -1 : 1;
            if (aVal > bVal) return sort.dir === "asc" ? 1 : -1;
            return 0;
        });
        
        return result;
    }, [tasks, filters, sort]);

    /* ── Statistics ── */
    const stats = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.status?.toLowerCase() === "completed").length,
            inProgress: tasks.filter(t => t.status?.toLowerCase() === "in progress").length,
            pending: tasks.filter(t => t.status?.toLowerCase() === "pending").length,
            overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed").length,
            today: tasks.filter(t => {
                const date = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
                return date.toDateString() === now.toDateString();
            }).length,
            thisWeek: tasks.filter(t => {
                const date = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
                return date >= startOfWeek;
            }).length,
        };
    }, [tasks]);

    /* ── Sort handler ── */
    const handleSort = (key) => {
        setSort(prev => ({
            key,
            dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc"
        }));
    };
    
    const SortIcon = ({ columnKey }) => {
        if (sort.key !== columnKey) {
            return <SortAsc className="w-3 h-3 ml-1 opacity-30" />;
        }
        return sort.dir === "asc" 
            ? <ChevronUp className="w-3 h-3 ml-1" />
            : <ChevronDown className="w-3 h-3 ml-1" />;
    };

    /* ── CRUD Operations ── */
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
            const response = await fetch(`${API_URL}/employee/task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTask)
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to add task");
            
            const employee = employees.find(e => e._id === newTask.employeeId);
            const enrichedTask = normalise(data.task, employee);
            
            setTasks(prev => [enrichedTask, ...prev]);
            CACHE.bust(); // Invalidate cache
            
            setNewTask(EMPTY);
            setShowAddTask(false);
            toast.success("Task added successfully!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            const response = await fetch(`${API_URL}/employee/task/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to update");
            
            setTasks(prev => prev.map(task => 
                task._id === taskId 
                    ? { ...task, ...updates, lastUpdated: new Date().toISOString() }
                    : task
            ));
            CACHE.bust();
            setActiveDropdown(null);
            toast.success("Task updated!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        
        try {
            const response = await fetch(`${API_URL}/employee/task/${taskId}`, {
                method: "DELETE"
            });
            
            if (!response.ok) throw new Error("Failed to delete");
            
            setTasks(prev => prev.filter(task => task._id !== taskId));
            CACHE.bust();
            setActiveDropdown(null);
            toast.success("Task deleted!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    /* ── Export CSV ── */
    const exportCSV = (range = "all") => {
        let dataToExport = [...filtered];
        
        if (range !== "all") {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            
            dataToExport = dataToExport.filter(task => {
                const date = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
                
                switch(range) {
                    case "today": return date.toDateString() === now.toDateString();
                    case "thisWeek": return date >= startOfWeek;
                    case "thisMonth": return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    case "overdue": return task.dueDate && new Date(task.dueDate) < now && task.status !== "completed";
                    case "upcoming": return task.dueDate && new Date(task.dueDate) > now;
                    default: return true;
                }
            });
        }
        
        if (dataToExport.length === 0) {
            toast.error("No tasks to export");
            return;
        }
        
        const headers = ["S.No", "Task ID", "Employee", "Email", "Department", "Position", "Title", "Description", "Status", "Priority", "Type", "Progress (%)", "Due Date", "Created", "Last Updated", "Completed At", "Notes"];
        
        const csvRows = dataToExport.map((task, index) => {
            const emp = task.employeeId;
            return [
                index + 1,
                task._id || "",
                emp?.name || "Unassigned",
                emp?.email || "",
                emp?.department || "",
                emp?.position || "",
                task.title || "",
                task.description || "",
                cap(task.status || ""),
                cap(task.priority || ""),
                task.type || "",
                task.progress || 0,
                fmt(task.dueDate),
                fmt(task.createdAt),
                fmt(task.lastUpdated),
                fmt(task.completedAt),
                task.notes || ""
            ].map(cell => {
                const str = String(cell);
                return str.includes(",") || str.includes('"') || str.includes("\n") 
                    ? `"${str.replace(/"/g, '""')}"` 
                    : str;
            }).join(",");
        });
        
        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tasks_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${dataToExport.length} tasks`);
    };

    const clearFilters = () => {
        setFilters({
            search: "", employee: "", status: "", priority: "", type: "", dateRange: "all"
        });
        toast.success("Filters cleared");
    };

    const activeFilterCount = Object.values(filters).filter(v => v && v !== "all").length;

    return (
        <>
            <style>{`
                @keyframes shimmer-wave {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    overflow: hidden;
                }
            `}</style>
            
            <Toaster position="top-right" />
            
            {/* Task Details Modal */}
            {showTaskDetails && selectedTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">Task Details</h3>
                            <button onClick={() => setShowTaskDetails(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Title</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedTask.title}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedTask.status?.toLowerCase()] || "bg-gray-100"}`}>
                                        {STATUS_ICONS[selectedTask.status?.toLowerCase()]}{cap(selectedTask.status)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selectedTask.description || "No description"}</p>
                            </div>
                            {selectedTask.employeeId && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Assigned To</p>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                        {selectedTask.employeeId.profilePicture ? (
                                            <img src={selectedTask.employeeId.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                                                <User className="w-5 h-5 text-violet-500" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{selectedTask.employeeId.name}</p>
                                            <p className="text-xs text-gray-500">{selectedTask.employeeId.email}</p>
                                            <p className="text-xs text-gray-400">{selectedTask.employeeId.position} · {selectedTask.employeeId.department}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Type</p>
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[selectedTask.type]}`}>{selectedTask.type}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Priority</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[selectedTask.priority]}`}>
                                        {PRIORITY_ICONS[selectedTask.priority]}{cap(selectedTask.priority)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Progress — {selectedTask.progress || 0}%</p>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${selectedTask.progress || 0}%` }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Due Date</p><p className="text-sm">{fmt(selectedTask.dueDate)}</p></div>
                                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Created</p><p className="text-sm">{fmt(selectedTask.createdAt, true)}</p></div>
                                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Last Updated</p><p className="text-sm">{fmt(selectedTask.lastUpdated, true)}</p></div>
                                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Completed At</p><p className="text-sm">{fmt(selectedTask.completedAt, true)}</p></div>
                            </div>
                            {selectedTask.notes && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
                                    <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl p-3">{selectedTask.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowTaskDetails(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Add Task Modal */}
            {showAddTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">Add New Task</h3>
                            <button onClick={() => setShowAddTask(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Task Title *"
                                value={newTask.title}
                                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                            <textarea
                                rows={3}
                                placeholder="Description"
                                value={newTask.description}
                                onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                            />
                            <select
                                value={newTask.employeeId}
                                onChange={e => setNewTask(prev => ({ ...prev, employeeId: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            >
                                <option value="">Select Employee *</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={newTask.type}
                                    onChange={e => setNewTask(prev => ({ ...prev, type: e.target.value }))}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                >
                                    {["Daily", "Weekly", "Monthly", "Project"].map(type => (
                                        <option key={type}>{type}</option>
                                    ))}
                                </select>
                                <select
                                    value={newTask.priority}
                                    onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                >
                                    {["low", "medium", "high", "urgent"].map(priority => (
                                        <option key={priority} value={priority}>{cap(priority)}</option>
                                    ))}
                                </select>
                            </div>
                            <input
                                type="date"
                                value={newTask.dueDate}
                                onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                    <span>Progress</span>
                                    <span>{newTask.progress}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={newTask.progress}
                                    onChange={e => setNewTask(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                                    className="w-full accent-violet-500"
                                />
                            </div>
                            <textarea
                                rows={2}
                                placeholder="Notes (optional)"
                                value={newTask.notes}
                                onChange={e => setNewTask(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowAddTask(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                                Cancel
                            </button>
                            <button onClick={handleAddTask} className="px-5 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                                Add Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Content */}
            <div className="min-h-screen bg-gray-50/60 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                                <span className="p-2 bg-violet-100 rounded-xl">
                                    <FileText className="w-5 h-5 text-violet-600" />
                                </span>
                                Task Administration
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">{tasks.length} tasks loaded</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setShowAddTask(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Task
                            </button>
                            <button
                                onClick={() => loadData(true)}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 shadow-sm disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                {loading ? "Loading..." : "Refresh"}
                            </button>
                            <div className="relative group">
                                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-sm">
                                    <Download className="w-4 h-4" /> Export
                                </button>
                                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-1.5 z-10">
                                    {[
                                        ["all", "All Tasks"],
                                        ["today", "Today"],
                                        ["thisWeek", "This Week"],
                                        ["thisMonth", "This Month"],
                                        ["overdue", "Overdue"],
                                        ["upcoming", "Upcoming"]
                                    ].map(([range, label]) => (
                                        <button
                                            key={range}
                                            onClick={() => exportCSV(range)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Stats Cards - Skeleton or Real */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {loading && tasks.length === 0 ? (
                            Array.from({ length: 7 }).map((_, i) => <SkeletonStatCard key={i} />)
                        ) : (
                            <>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <div className="text-2xl font-bold text-violet-600">{stats.total}</div>
                                    <div className="text-xs text-gray-500">Total</div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
                                    <div className="text-xs text-gray-500">Completed</div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                                    <div className="text-xs text-gray-500">In Progress</div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                                    <div className="text-xs text-gray-500">Pending</div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                                    <div className="text-xs text-gray-500">Overdue</div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <div className="text-2xl font-bold text-teal-600">{stats.today}</div>
                                    <div className="text-xs text-gray-500">Today</div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <div className="text-2xl font-bold text-indigo-600">{stats.thisWeek}</div>
                                    <div className="text-xs text-gray-500">This Week</div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Filters */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-700">Filters & Sort</span>
                                {activeFilterCount > 0 && (
                                    <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                                )}
                            </div>
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Clear all
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={filters.search}
                                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                                />
                            </div>
                            <select
                                value={filters.employee}
                                onChange={e => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                            >
                                <option value="">All Employees</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name} — {emp.department}</option>
                                ))}
                            </select>
                            <select
                                value={filters.status}
                                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                            >
                                <option value="">All Status</option>
                                {["pending", "in progress", "completed", "on hold"].map(status => (
                                    <option key={status} value={status}>{cap(status)}</option>
                                ))}
                            </select>
                            <select
                                value={filters.dateRange}
                                onChange={e => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="thisWeek">This Week</option>
                                <option value="thisMonth">This Month</option>
                                <option value="overdue">Overdue</option>
                                <option value="upcoming">Upcoming</option>
                            </select>
                            <select
                                value={filters.priority}
                                onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                            >
                                <option value="">All Priority</option>
                                {["low", "medium", "high", "urgent"].map(priority => (
                                    <option key={priority} value={priority}>{cap(priority)}</option>
                                ))}
                            </select>
                            <select
                                value={filters.type}
                                onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                            >
                                <option value="">All Types</option>
                                {["Daily", "Weekly", "Monthly", "Project"].map(type => (
                                    <option key={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[
                                ["createdAt", "Created"],
                                ["dueDate", "Due Date"],
                                ["lastUpdated", "Updated"],
                                ["priority", "Priority"],
                                ["employeeName", "Employee"]
                            ].map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => handleSort(key)}
                                    className={`inline-flex items-center px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                        sort.key === key 
                                            ? "bg-violet-100 text-violet-700" 
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {label} <SortIcon columnKey={key} />
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Tasks Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {error ? (
                            <div className="p-12 text-center">
                                <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
                                <p className="font-semibold text-gray-700">Failed to load tasks</p>
                                <p className="text-sm text-gray-400 mt-1">{error}</p>
                                <button onClick={() => loadData(true)} className="mt-4 px-4 py-2 bg-violet-600 text-white text-sm rounded-xl">
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-gray-100 bg-gray-50/80">
                                        <tr>
                                            {["Task Details", "Employee", "Status & Priority", "Progress", "Dates", "Actions"].map(header => (
                                                <th key={header} className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* SKELETON ROWS - Show 8 skeleton rows while loading */}
                                        {loading && tasks.length === 0 && (
                                            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                        )}
                                        
                                        {/* REAL DATA ROWS */}
                                        {!loading && filtered.map(task => {
                                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
                                            const isToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();
                                            
                                            return (
                                                <tr key={task._id} className={`border-b border-gray-50 hover:bg-gray-50/70 ${isOverdue ? "bg-red-50/40" : isToday ? "bg-blue-50/30" : ""}`}>
                                                    <td className="px-6 py-4 max-w-xs">
                                                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                            <span className="text-[11px] font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                                                                #{task._id?.slice(-8)}
                                                            </span>
                                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[task.type]}`}>
                                                                {task.type}
                                                            </span>
                                                            {isOverdue && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Overdue</span>}
                                                            {isToday && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Today</span>}
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                                                        {task.description && (
                                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                                        )}
                                                        {task.notes && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 mt-1.5">
                                                                <MessageSquare className="w-3 h-3" /> Note
                                                            </span>
                                                        )}
                                                    </td>
                                                    
                                                    <td className="px-6 py-4">
                                                        {task.employeeId ? (
                                                            <>
                                                                <div className="flex items-center gap-2.5 mb-2.5">
                                                                    {task.employeeId.profilePicture ? (
                                                                        <img src={task.employeeId.profilePicture} alt={task.employeeId.name} className="w-9 h-9 rounded-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                                                                            <User className="w-4 h-4 text-violet-500" />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-900">{task.employeeId.name}</p>
                                                                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                                                            <Mail className="w-3 h-3" /> {task.employeeId.email}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-3 text-[11px] text-gray-400">
                                                                    <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {task.employeeId.department || "—"}</span>
                                                                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {task.employeeId.position || "—"}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-gray-300">
                                                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                                                                    <Users className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-sm italic">Unassigned</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_COLORS[task.status?.toLowerCase()]}`}>
                                                                {STATUS_ICONS[task.status?.toLowerCase()]} {cap(task.status)}
                                                            </span>
                                                            <br />
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
                                                                {PRIORITY_ICONS[task.priority]} {cap(task.priority)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className="w-20 bg-gray-100 rounded-full h-2">
                                                                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${task.progress || 0}%` }} />
                                                            </div>
                                                            <span className="text-xs font-semibold text-gray-600">{task.progress || 0}%</span>
                                                        </div>
                                                        {task.completedAt && (
                                                            <p className="text-[11px] text-gray-400">Done: {fmt(task.completedAt)}</p>
                                                        )}
                                                    </td>
                                                    
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1.5 text-[11px] text-gray-500">
                                                            <div className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                                                                <Calendar className="w-3 h-3" /> Due: {fmt(task.dueDate)}
                                                            </div>
                                                            <div>Created: {fmt(task.createdAt)}</div>
                                                            <div>Updated: {fmt(task.lastUpdated)}</div>
                                                        </div>
                                                    </td>
                                                    
                                                    <td className="px-6 py-4">
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setActiveDropdown(activeDropdown === task._id ? null : task._id)}
                                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            {activeDropdown === task._id && (
                                                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1.5">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedTask(task);
                                                                            setShowTaskDetails(true);
                                                                            setActiveDropdown(null);
                                                                        }}
                                                                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                                                    >
                                                                        <Eye className="w-4 h-4" /> View Details
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateTask(task._id, { status: "completed", progress: 100 })}
                                                                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Mark Complete
                                                                    </button>
                                                                    <div className="my-1 border-t border-gray-50" />
                                                                    <button
                                                                        onClick={() => handleDeleteTask(task._id)}
                                                                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" /> Delete Task
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        
                                        {/* EMPTY STATE - No tasks at all */}
                                        {!loading && tasks.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-20">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                                                            <FileText className="w-8 h-8 text-gray-300" />
                                                        </div>
                                                        <p className="font-semibold text-gray-600">No tasks found</p>
                                                        <p className="text-sm text-gray-400">Create your first task to get started</p>
                                                        <button onClick={() => setShowAddTask(true)} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-xl">
                                                            Create First Task
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        
                                        {/* NO RESULTS with filters */}
                                        {!loading && tasks.length > 0 && filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-16">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Filter className="w-12 h-12 text-gray-300" />
                                                        <p className="text-gray-500 font-medium">No matching tasks</p>
                                                        <p className="text-sm text-gray-400">Try adjusting your filters</p>
                                                        <button onClick={clearFilters} className="mt-2 text-violet-600 text-sm hover:underline">
                                                            Clear all filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    {!loading && filtered.length > 0 && (
                        <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                            <span>Showing <b className="text-gray-600">{filtered.length}</b> of <b className="text-gray-600">{tasks.length}</b> tasks</span>
                            <span>Sorted by {sort.key} · {sort.dir}</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}