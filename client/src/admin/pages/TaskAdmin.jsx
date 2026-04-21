import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    FileText, Search, Filter, Download, Eye, Trash2, Users,
    Calendar, Flag, RefreshCw, Plus, Clock, MessageSquare,
    AlertCircle, CheckCircle, PlayCircle, PauseCircle,
    MoreVertical, Mail, User, Briefcase, Building,
    ChevronUp, ChevronDown, SortAsc, Zap, X
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const API_URL = "https://ssinternsbackend-ltfn.onrender.com/api";

/* ─────────────────────────────────────────────────────────────────────────────
   MODULE-LEVEL CACHE  (survives React remounts → instant second-load)
───────────────────────────────────────────────────────────────────────────── */
const CACHE = {
    employees: null, tasks: null, map: null, ts: 0, TTL: 60_000,
    valid() { return !!this.tasks && Date.now() - this.ts < this.TTL; },
    set(employees, tasks) {
        this.employees = employees;
        this.tasks = tasks;
        this.map = Object.fromEntries(employees.map(e => [e._id, e]));
        this.ts = Date.now();
    },
    bust() { this.ts = 0; }
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
   PARALLEL STREAMING FETCH
   All employee task requests fire simultaneously.
   Each resolves independently and immediately pushes its batch to the UI.
───────────────────────────────────────────────────────────────────────────── */
async function streamAllData(signal, onBatch) {
    const empRes = await fetch(`${API_URL}/employee/get/employee`, { signal });
    if (!empRes.ok) throw new Error(`Employees: ${empRes.status}`);
    const empJson = await empRes.json();
    const employees = empJson.employees || empJson || [];
    if (!employees.length) throw new Error("No employees found");

    const promises = employees.map(emp =>
        fetch(`${API_URL}/employee/${emp._id}/tasks`, { signal })
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                const tasks = d?.employee?.tasks?.map(t => normalise(t, emp)) || [];
                if (tasks.length) onBatch(tasks);   // stream immediately
                return tasks;
            })
            .catch(() => [])
    );

    const results = await Promise.allSettled(promises);
    const allTasks = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
    allTasks.sort((a, b) => new Date(b.lastUpdated || b.createdAt || 0) - new Date(a.lastUpdated || a.createdAt || 0));
    CACHE.set(employees, allTasks);
    return { employees, tasks: allTasks };
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHIMMER PRIMITIVE
   A single moving highlight that sweeps across a placeholder shape.
───────────────────────────────────────────────────────────────────────────── */
const Shimmer = ({ className = "" }) => (
    <div className={`relative overflow-hidden bg-gray-100 rounded ${className}`}>
        <span
            className="absolute inset-0 block"
            style={{
                background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.75) 50%,transparent 100%)",
                animation: "sk-sweep 1.5s infinite",
                transform: "translateX(-100%)",
            }}
        />
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON CELLS — each mirrors the EXACT visual structure of its real column
───────────────────────────────────────────────────────────────────────────── */

/** Col 1 · Task Details: id badge + type pill + title line + 2-line desc */
const SKTaskDetails = () => (
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

/** Col 2 · Employee: circle avatar + name/email lines + dept/position */
const SKEmployee = () => (
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

/** Col 3 · Status & Priority: two stacked pill shapes */
const SKStatusPriority = () => (
    <td className="px-6 py-4">
        <div className="space-y-2.5">
            <Shimmer className="h-6 w-24 rounded-full" />
            <Shimmer className="h-6 w-20 rounded-full" />
        </div>
    </td>
);

/** Col 4 · Progress: narrow track + percentage label */
const SKProgress = () => (
    <td className="px-6 py-4">
        <div className="flex items-center gap-2 mb-1.5">
            <Shimmer className="h-2 w-24 rounded-full" />
            <Shimmer className="h-3.5 w-8 rounded" />
        </div>
        <Shimmer className="h-3 w-24 rounded" />
    </td>
);

/** Col 5 · Dates: three short text lines */
const SKDates = () => (
    <td className="px-6 py-4">
        <div className="space-y-2">
            <Shimmer className="h-3 w-28 rounded" />
            <Shimmer className="h-3 w-24 rounded" />
            <Shimmer className="h-3 w-20 rounded" />
        </div>
    </td>
);

/** Col 6 · Actions: single icon button */
const SKActions = () => (
    <td className="px-6 py-4">
        <Shimmer className="h-7 w-7 rounded-lg" />
    </td>
);

/**
 * Full skeleton row — staggered animation-delay per row index so the
 * shimmer wave cascades top-to-bottom instead of all firing in sync.
 */
const SkeletonRow = ({ index = 0 }) => (
    <tr className="border-b border-gray-50" style={{ opacity: Math.max(0.4, 1 - index * 0.08) }}>
        <SKTaskDetails />
        <SKEmployee />
        <SKStatusPriority />
        <SKProgress />
        <SKDates />
        <SKActions />
    </tr>
);

/** Stat card skeleton — mirrors the number + label card exactly */
const SkeletonStatCard = ({ index = 0 }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
         style={{ opacity: Math.max(0.5, 1 - index * 0.1) }}>
        <Shimmer className="h-8 w-12 mb-2 rounded" />
        <Shimmer className="h-3 w-20 rounded" />
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function TaskAdmin() {
    const [tasks,     setTasks]     = useState(CACHE.valid() ? CACHE.tasks : []);
    const [employees, setEmployees] = useState(CACHE.valid() ? CACHE.employees : []);
    const [loading,   setLoading]   = useState(!CACHE.valid());
    const [streaming, setStreaming] = useState(false);
    const [error,     setError]     = useState(null);

    const [selectedTask,    setSelectedTask]    = useState(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const [activeDropdown,  setActiveDropdown]  = useState(null);
    const [showAddTask,     setShowAddTask]     = useState(false);

    const abortRef      = useRef(null);
    const bufferRef     = useRef([]);
    const flushRef      = useRef(null);

    const [filters, setFilters] = useState({
        search:"", employee:"", status:"", priority:"", type:"", dateRange:"all"
    });
    const [sort, setSort] = useState({ key:"lastUpdated", dir:"desc" });

    const EMPTY = { title:"", description:"", type:"Daily", priority:"medium", progress:0, employeeId:"", dueDate:"", notes:"" };
    const [newTask, setNewTask] = useState(EMPTY);

    /* ── streaming flush: batches state updates to ≤1 re-render per 80ms ── */
    const scheduleBatchFlush = useCallback(() => {
        if (flushRef.current) return;
        flushRef.current = setTimeout(() => {
            const batch = bufferRef.current.splice(0);
            flushRef.current = null;
            if (!batch.length) return;
            setStreaming(true);
            setTasks(prev => {
                const seen = new Set(prev.map(t => t._id));
                const fresh = batch.filter(t => !seen.has(t._id));
                return fresh.length ? [...prev, ...fresh] : prev;
            });
        }, 80);
    }, []);

    const onBatch = useCallback(batch => {
        bufferRef.current.push(...batch);
        scheduleBatchFlush();
    }, [scheduleBatchFlush]);

    /* ── data loader ───────────────────────────────────────────────────────── */
    const load = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && CACHE.valid()) {
            setTasks(CACHE.tasks);
            setEmployees(CACHE.employees);
            setLoading(false);
            return;
        }
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        CACHE.bust();
        setLoading(true);
        setStreaming(false);
        setError(null);
        setTasks([]);

        try {
            const { employees: emps, tasks: all } = await streamAllData(ctrl.signal, onBatch);
            setEmployees(emps);
            setTasks(all);
        } catch (err) {
            if (err.name === "AbortError") return;
            setError(err.message);
            toast.error(`Load failed: ${err.message}`);
        } finally {
            setLoading(false);
            setStreaming(false);
        }
    }, [onBatch]);

    useEffect(() => {
        load();
        return () => { abortRef.current?.abort(); clearTimeout(flushRef.current); };
    }, [load]);

    /* ── filter + sort ─────────────────────────────────────────────────────── */
    const filtered = useMemo(() => {
        const sl = filters.search.toLowerCase();
        let out = tasks.filter(t => {
            const emp = t.employeeId;
            if (sl && !([t.title, t.description, emp?.name, t.notes].some(v => v?.toLowerCase().includes(sl)))) return false;
            if (filters.employee && emp?._id !== filters.employee) return false;
            if (filters.status   && t.status?.toLowerCase() !== filters.status) return false;
            if (filters.priority && t.priority !== filters.priority) return false;
            if (filters.type     && t.type !== filters.type) return false;
            if (filters.dateRange !== "all") {
                const d = new Date(t.dueDate || t.createdAt), now = new Date();
                if (filters.dateRange === "today"     && d.toDateString() !== now.toDateString()) return false;
                if (filters.dateRange === "thisWeek")  { const sow = new Date(now); sow.setDate(now.getDate()-now.getDay()); if (d < sow) return false; }
                if (filters.dateRange === "thisMonth" && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
                if (filters.dateRange === "overdue"   && !(t.dueDate && new Date(t.dueDate) < now)) return false;
                if (filters.dateRange === "upcoming"  && !(t.dueDate && new Date(t.dueDate) > now)) return false;
            }
            return true;
        });
        out.sort((a, b) => {
            let av = a[sort.key], bv = b[sort.key];
            if (sort.key === "employeeName") { av = a.employeeId?.name||""; bv = b.employeeId?.name||""; }
            if (["createdAt","lastUpdated","dueDate","completedAt"].includes(sort.key)) { av = new Date(av||0); bv = new Date(bv||0); }
            if (sort.key === "progress") { av = av||0; bv = bv||0; }
            return (av < bv ? -1 : av > bv ? 1 : 0) * (sort.dir === "asc" ? 1 : -1);
        });
        return out;
    }, [tasks, filters, sort]);

    /* ── stats ─────────────────────────────────────────────────────────────── */
    const stats = useMemo(() => {
        const now = new Date();
        const sow = new Date(now); sow.setDate(now.getDate() - now.getDay());
        return {
            total:     tasks.length,
            completed: tasks.filter(t => t.status?.toLowerCase() === "completed").length,
            inProgress:tasks.filter(t => t.status?.toLowerCase() === "in progress").length,
            pending:   tasks.filter(t => t.status?.toLowerCase() === "pending").length,
            overdue:   tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed").length,
            today:     tasks.filter(t => new Date(t.dueDate||t.createdAt).toDateString() === now.toDateString()).length,
            thisWeek:  tasks.filter(t => new Date(t.dueDate||t.createdAt) >= sow).length,
        };
    }, [tasks]);

    /* ── sort helper ───────────────────────────────────────────────────────── */
    const handleSort = k => setSort(p => ({ key:k, dir: p.key===k && p.dir==="asc" ? "desc" : "asc" }));
    const SortIcon = ({ k }) => sort.key !== k
        ? <SortAsc className="w-3 h-3 ml-1 opacity-30" />
        : sort.dir === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;

    /* ── CRUD ──────────────────────────────────────────────────────────────── */
    const handleAddTask = async () => {
        if (!newTask.title.trim()) { toast.error("Title is required"); return; }
        if (!newTask.employeeId)   { toast.error("Select an employee"); return; }
        try {
            const res  = await fetch(`${API_URL}/employee/task`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(newTask) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to add");
            const emp = CACHE.map?.[newTask.employeeId] || employees.find(e => e._id === newTask.employeeId);
            const enriched = normalise({ ...data.task, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() }, emp);
            setTasks(p => [enriched, ...p]);
            if (CACHE.tasks) CACHE.tasks = [enriched, ...CACHE.tasks];
            setNewTask(EMPTY);
            setShowAddTask(false);
            toast.success("Task added!");
        } catch (err) { toast.error(err.message); }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            const res  = await fetch(`${API_URL}/employee/task/${taskId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updates) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update");
            const ts = new Date().toISOString();
            const patch = t => t._id === taskId ? { ...t, ...updates, lastUpdated: ts } : t;
            setTasks(p => p.map(patch));
            if (CACHE.tasks) CACHE.tasks = CACHE.tasks.map(patch);
            setActiveDropdown(null);
            toast.success("Updated!");
        } catch (err) { toast.error(err.message); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            const res = await fetch(`${API_URL}/employee/task/${taskId}`, { method:"DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setTasks(p => p.filter(t => t._id !== taskId));
            if (CACHE.tasks) CACHE.tasks = CACHE.tasks.filter(t => t._id !== taskId);
            setActiveDropdown(null);
            toast.success("Deleted!");
        } catch (err) { toast.error(err.message); }
    };

    /* ── CSV export ────────────────────────────────────────────────────────── */
    const exportCSV = (range = "all") => {
        let rows = [...filtered];
        if (range !== "all") {
            const now = new Date();
            rows = rows.filter(t => {
                const d = new Date(t.dueDate || t.createdAt);
                if (range === "today")     return d.toDateString() === now.toDateString();
                if (range === "thisWeek")  { const sow = new Date(now); sow.setDate(now.getDate()-now.getDay()); return d >= sow; }
                if (range === "thisMonth") return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
                if (range === "overdue")   return t.dueDate && new Date(t.dueDate) < now;
                if (range === "upcoming")  return t.dueDate && new Date(t.dueDate) > now;
                return true;
            });
        }
        if (!rows.length) { toast.error("No tasks to export"); return; }
        const esc = v => { const s=String(v??""); return (s.includes(",")||s.includes('"')||s.includes("\n"))?`"${s.replace(/"/g,'""')}"`:s; };
        const hdr = ["S.No","Task ID","Employee","Email","Department","Position","Title","Description","Status","Priority","Type","Progress (%)","Due Date","Created","Last Updated","Completed At","Notes"];
        const body = rows.map((t,i) => {
            const e = t.employeeId;
            return [i+1,t._id||"",e?.name||"Unassigned",e?.email||"",e?.department||"",e?.position||"",
                t.title||"",t.description||"",cap(t.status||""),cap(t.priority||""),
                t.type||"",t.progress||0,fmt(t.dueDate),fmt(t.createdAt),fmt(t.lastUpdated),fmt(t.completedAt),t.notes||""
            ].map(esc).join(",");
        });
        const blob = new Blob([[hdr.join(","), ...body].join("\n")], { type:"text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Tasks_${range}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`Exported ${rows.length} tasks`);
    };

    const clearFilters = () => {
        setFilters({ search:"", employee:"", status:"", priority:"", type:"", dateRange:"all" });
        toast.success("Filters cleared");
    };

    const activeFilterCount = Object.entries(filters).filter(([k,v]) => v && v !== "all").length;

    /* ─────────────────────────────────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────────────────────────────────── */
    return (
        <>
            {/* Keyframe injected once */}
            <style>{`
                @keyframes sk-sweep {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(200%);  }
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    overflow: hidden;
                }
            `}</style>

            <Toaster position="top-right" toastOptions={{ style:{ fontSize:"0.875rem" } }} />

            {/* ── TASK DETAILS MODAL ─────────────────────────────────────────────── */}
            {showTaskDetails && selectedTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                            <h3 className="text-lg font-semibold text-gray-800">Task Details</h3>
                            <button onClick={() => setShowTaskDetails(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Title</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedTask.title}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedTask.status?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                                        {STATUS_ICONS[selectedTask.status?.toLowerCase()]}{cap(selectedTask.status)||"Pending"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 leading-relaxed">{selectedTask.description || "No description"}</p>
                            </div>
                            {selectedTask.employeeId && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assigned To</p>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                        {selectedTask.employeeId.profilePicture
                                            ? <img src={selectedTask.employeeId.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover"/>
                                            : <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center"><User className="w-5 h-5 text-violet-500"/></div>
                                        }
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{selectedTask.employeeId.name}</p>
                                            <p className="text-xs text-gray-500">{selectedTask.employeeId.email}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{selectedTask.employeeId.position} · {selectedTask.employeeId.department}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Type</p>
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[selectedTask.type]||"bg-gray-100 text-gray-600"}`}>{selectedTask.type}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Priority</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[selectedTask.priority]||"bg-gray-100 text-gray-600"}`}>
                                        {PRIORITY_ICONS[selectedTask.priority]}{cap(selectedTask.priority)||"Medium"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Progress — {selectedTask.progress||0}%</p>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width:`${selectedTask.progress||0}%` }}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                {[["Due Date",fmt(selectedTask.dueDate)],["Created",fmt(selectedTask.createdAt,true)],["Last Updated",fmt(selectedTask.lastUpdated,true)],["Completed At",fmt(selectedTask.completedAt,true)]].map(([l,v])=>(
                                    <div key={l}><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{l}</p><p className="text-sm text-gray-700">{v}</p></div>
                                ))}
                            </div>
                            {selectedTask.notes && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5"/>Notes</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-xl p-3">{selectedTask.notes}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Task ID</p>
                                <p className="text-xs text-gray-400 font-mono">{selectedTask._id}</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowTaskDetails(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ADD TASK MODAL ──────────────────────────────────────────────────── */}
            {showAddTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h3 className="text-lg font-semibold text-gray-800">Add New Task</h3>
                            <button onClick={() => setShowAddTask(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="text" placeholder="Task Title *" value={newTask.title}
                                onChange={e=>setNewTask(p=>({...p,title:e.target.value}))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"/>
                            <textarea rows={3} placeholder="Description" value={newTask.description}
                                onChange={e=>setNewTask(p=>({...p,description:e.target.value}))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"/>
                            <select value={newTask.employeeId} onChange={e=>setNewTask(p=>({...p,employeeId:e.target.value}))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                                <option value="">Select Employee *</option>
                                {employees.map(e=><option key={e._id} value={e._id}>{e.name} ({e.department})</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <select value={newTask.type} onChange={e=>setNewTask(p=>({...p,type:e.target.value}))}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                                    {["Daily","Weekly","Monthly","Project"].map(v=><option key={v}>{v}</option>)}
                                </select>
                                <select value={newTask.priority} onChange={e=>setNewTask(p=>({...p,priority:e.target.value}))}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                                    {["low","medium","high","urgent"].map(v=><option key={v} value={v}>{cap(v)}</option>)}
                                </select>
                            </div>
                            <input type="date" value={newTask.dueDate} onChange={e=>setNewTask(p=>({...p,dueDate:e.target.value}))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"/>
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                    <span>Progress</span><span className="font-medium text-gray-700">{newTask.progress}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={newTask.progress}
                                    onChange={e=>setNewTask(p=>({...p,progress:+e.target.value}))}
                                    className="w-full accent-violet-500"/>
                            </div>
                            <textarea rows={2} placeholder="Notes (optional)" value={newTask.notes}
                                onChange={e=>setNewTask(p=>({...p,notes:e.target.value}))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"/>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={()=>setShowAddTask(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                            <button onClick={handleAddTask} className="px-5 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors">Add Task</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MAIN PAGE ───────────────────────────────────────────────────────── */}
            <div className="min-h-screen bg-gray-50/60 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                                <span className="p-2 bg-violet-100 rounded-xl inline-flex">
                                    <FileText className="w-5 h-5 text-violet-600"/>
                                </span>
                                Task Administration
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5 pl-1">
                                <span className="text-sm text-gray-500">{tasks.length} tasks loaded</span>
                                {streaming && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                                        <Zap className="w-3 h-3"/>Streaming…
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setShowAddTask(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
                                <Plus className="w-4 h-4"/>Add Task
                            </button>
                            <button onClick={() => load(true)} disabled={loading}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 shadow-sm transition-colors disabled:opacity-50">
                                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}/>
                                {loading ? "Loading…" : "Refresh"}
                            </button>
                            {/* Export dropdown */}
                            <div className="relative group">
                                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors">
                                    <Download className="w-4 h-4"/>Export
                                </button>
                                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-1.5">
                                    {[["all","All Tasks"],["today","Today"],["thisWeek","This Week"],["thisMonth","This Month"],["overdue","Overdue"],["upcoming","Upcoming"]].map(([r,label])=>(
                                        <button key={r} onClick={()=>exportCSV(r)}
                                            className={`flex w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${r==="overdue"?"text-red-600":r==="upcoming"?"text-emerald-600":"text-gray-700"}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── STAT CARDS (skeleton or real) ─────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {loading && tasks.length === 0
                            ? Array.from({length:7}).map((_,i) => <SkeletonStatCard key={i} index={i}/>)
                            : [
                                { label:"Total",       val:stats.total,      color:"text-violet-600" },
                                { label:"Completed",   val:stats.completed,  color:"text-emerald-600" },
                                { label:"In Progress", val:stats.inProgress, color:"text-blue-600" },
                                { label:"Pending",     val:stats.pending,    color:"text-amber-600" },
                                { label:"Overdue",     val:stats.overdue,    color:"text-red-600" },
                                { label:"Today",       val:stats.today,      color:"text-teal-600" },
                                { label:"This Week",   val:stats.thisWeek,   color:"text-indigo-600" },
                            ].map(({ label, val, color }) => (
                                <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <div className={`text-2xl font-bold ${color}`}>{val}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                                </div>
                            ))
                        }
                    </div>

                    {/* ── FILTERS ───────────────────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-400"/>
                                <span className="text-sm font-semibold text-gray-700">Filters & Sort</span>
                                {activeFilterCount > 0 && (
                                    <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">{activeFilterCount}</span>
                                )}
                            </div>
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
                                    <X className="w-3 h-3"/>Clear all
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                                <input type="text" placeholder="Search…" value={filters.search}
                                    onChange={e=>setFilters(p=>({...p,search:e.target.value}))}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"/>
                            </div>
                            {[
                                { key:"employee",  label:"All Employees", opts: employees.map(e=>({ v:e._id, l:`${e.name} — ${e.department}` })) },
                                { key:"status",    label:"All Status",    opts: ["pending","in progress","completed","on hold"].map(v=>({ v, l:cap(v) })) },
                                { key:"dateRange", label:"All Dates",     opts: [["today","Today"],["thisWeek","This Week"],["thisMonth","This Month"],["overdue","Overdue"],["upcoming","Upcoming"]].map(([v,l])=>({ v, l })) },
                                { key:"priority",  label:"All Priority",  opts: ["low","medium","high","urgent"].map(v=>({ v, l:cap(v) })) },
                                { key:"type",      label:"All Types",     opts: ["Daily","Weekly","Monthly","Project"].map(v=>({ v, l:v })) },
                            ].map(({ key, label, opts }) => (
                                <select key={key} value={filters[key]}
                                    onChange={e=>setFilters(p=>({...p,[key]:e.target.value}))}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50">
                                    <option value={key==="dateRange"?"all":""}>{label}</option>
                                    {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                                </select>
                            ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[["createdAt","Created"],["dueDate","Due Date"],["lastUpdated","Updated"],["priority","Priority"],["employeeName","Employee"]].map(([k,label])=>(
                                <button key={k} onClick={()=>handleSort(k)}
                                    className={`inline-flex items-center px-3 py-1 text-xs rounded-lg font-medium transition-colors ${sort.key===k?"bg-violet-100 text-violet-700":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                    {label}<SortIcon k={k}/>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── TABLE ─────────────────────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {error ? (
                            <div className="p-12 text-center">
                                <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3"/>
                                <p className="font-semibold text-gray-700">Failed to load tasks</p>
                                <p className="text-sm text-gray-400 mt-1">{error}</p>
                                <button onClick={()=>load(true)} className="mt-4 px-4 py-2 bg-violet-600 text-white text-sm rounded-xl hover:bg-violet-700 transition-colors">Try Again</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/80">
                                            {["Task Details","Employee","Status & Priority","Progress","Dates","Actions"].map(h => (
                                                <th key={h} className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>

                                        {/* ── SKELETON ROWS (initial load only) ── */}
                                        {loading && tasks.length === 0 && (
                                            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)
                                        )}

                                        {/* ── REAL DATA ROWS ── */}
                                        {filtered.map(task => {
                                            const emp = task.employeeId;
                                            const now = new Date();
                                            const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== "completed";
                                            const isToday   = task.dueDate && new Date(task.dueDate).toDateString() === now.toDateString();

                                            return (
                                                <tr key={task._id}
                                                    className={`border-b border-gray-50 transition-colors hover:bg-gray-50/70
                                                        ${isOverdue?"bg-red-50/40":isToday?"bg-blue-50/30":""}`}>

                                                    {/* Col 1: Task Details */}
                                                    <td className="px-6 py-4 max-w-xs">
                                                        {/* id badge + type pill + flag badges */}
                                                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                            <span className="text-[11px] font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                                                                #{task._id?.slice(-8)}
                                                            </span>
                                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[task.type]||"bg-gray-100 text-gray-600"}`}>
                                                                {task.type}
                                                            </span>
                                                            {isOverdue && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Overdue</span>}
                                                            {isToday   && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Today</span>}
                                                        </div>
                                                        {/* title */}
                                                        <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
                                                        {/* description */}
                                                        {task.description && (
                                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                                                        )}
                                                        {/* note indicator */}
                                                        {task.notes && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 mt-1.5">
                                                                <MessageSquare className="w-3 h-3"/>Note
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Col 2: Employee */}
                                                    <td className="px-6 py-4">
                                                        {emp ? (
                                                            <>
                                                                {/* avatar + name/email */}
                                                                <div className="flex items-center gap-2.5 mb-2.5">
                                                                    {emp.profilePicture
                                                                        ? <img src={emp.profilePicture} alt={emp.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0"/>
                                                                        : <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                                                            <User className="w-4 h-4 text-violet-500"/>
                                                                          </div>
                                                                    }
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{emp.name}</p>
                                                                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                                            <Mail className="w-3 h-3 flex-shrink-0"/><span className="truncate">{emp.email}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* dept + position */}
                                                                <div className="flex gap-3 text-[11px] text-gray-400">
                                                                    <span className="flex items-center gap-1"><Building className="w-3 h-3"/>{emp.department||"—"}</span>
                                                                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3"/>{emp.position||"—"}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-gray-300">
                                                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"><Users className="w-4 h-4"/></div>
                                                                <span className="text-sm italic text-gray-400">Unassigned</span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Col 3: Status & Priority */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            {/* status pill */}
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${STATUS_COLORS[task.status?.toLowerCase()]||"bg-gray-100 text-gray-600"}`}>
                                                                {STATUS_ICONS[task.status?.toLowerCase()]}{cap(task.status)||"Pending"}
                                                            </span>
                                                            <br/>
                                                            {/* priority pill */}
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${PRIORITY_COLORS[task.priority]||"bg-gray-100 text-gray-600"}`}>
                                                                {PRIORITY_ICONS[task.priority]}{cap(task.priority)||"Medium"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Col 4: Progress */}
                                                    <td className="px-6 py-4">
                                                        {/* track + % */}
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className="w-20 bg-gray-100 rounded-full h-2 flex-shrink-0">
                                                                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width:`${task.progress||0}%` }}/>
                                                            </div>
                                                            <span className="text-xs font-semibold text-gray-600 tabular-nums">{task.progress||0}%</span>
                                                        </div>
                                                        {/* completed date */}
                                                        {task.completedAt && (
                                                            <p className="text-[11px] text-gray-400">Done: {fmt(task.completedAt)}</p>
                                                        )}
                                                    </td>

                                                    {/* Col 5: Dates */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1.5 text-[11px] text-gray-500">
                                                            <div className={`flex items-center gap-1 ${isOverdue?"text-red-600 font-semibold":""}`}>
                                                                <Calendar className="w-3 h-3 flex-shrink-0"/>Due: {fmt(task.dueDate)}
                                                            </div>
                                                            <div>Created: {fmt(task.createdAt)}</div>
                                                            <div>Updated: {fmt(task.lastUpdated)}</div>
                                                        </div>
                                                    </td>

                                                    {/* Col 6: Actions */}
                                                    <td className="px-6 py-4">
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setActiveDropdown(activeDropdown===task._id ? null : task._id)}
                                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors">
                                                                <MoreVertical className="w-4 h-4"/>
                                                            </button>
                                                            {activeDropdown === task._id && (
                                                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1.5 overflow-hidden">
                                                                    <button onClick={()=>{ setSelectedTask(task); setShowTaskDetails(true); setActiveDropdown(null); }}
                                                                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors">
                                                                        <Eye className="w-4 h-4 text-gray-400"/>View Details
                                                                    </button>
                                                                    <button onClick={()=>handleUpdateTask(task._id,{ status:"completed", progress:100 })}
                                                                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors">
                                                                        <CheckCircle className="w-4 h-4 text-emerald-500"/>Mark Complete
                                                                    </button>
                                                                    <div className="my-1 border-t border-gray-50"/>
                                                                    <button onClick={()=>handleDeleteTask(task._id)}
                                                                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors">
                                                                        <Trash2 className="w-4 h-4"/>Delete Task
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* ── EMPTY STATE ── */}
                                        {!loading && filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-20">
                                                    <div className="inline-flex flex-col items-center gap-3">
                                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                                                            <FileText className="w-8 h-8 text-gray-300"/>
                                                        </div>
                                                        <p className="font-semibold text-gray-600">No tasks found</p>
                                                        <p className="text-sm text-gray-400">
                                                            {activeFilterCount>0 ? "Try adjusting your filters." : "No tasks have been created yet."}
                                                        </p>
                                                        <button onClick={()=>setShowAddTask(true)}
                                                            className="px-4 py-2 bg-violet-600 text-white text-sm rounded-xl hover:bg-violet-700 transition-colors">
                                                            Create First Task
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
                    {filtered.length > 0 && (
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