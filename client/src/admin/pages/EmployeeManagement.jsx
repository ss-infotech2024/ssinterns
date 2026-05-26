import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

// ─── API ──────────────────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: "https://ssinternsbacknedv2.onrender.com/api",
  timeout: 10000,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcPerformance = (tasks = [], attendance = 0) => {
  const completed = tasks.filter(
    (t) => t.status === "Completed" || t.status === "completed"
  ).length;
  const taskScore = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  return Math.round(taskScore * 0.6 + attendance * 0.4);
};

const DEPARTMENTS = [
  { id: 1, name: "Sales",       color: "bg-blue-100 text-blue-800" },
  { id: 2, name: "Marketing",   color: "bg-purple-100 text-purple-800" },
  { id: 3, name: "Development", color: "bg-green-100 text-green-800" },
  { id: 4, name: "HR",          color: "bg-pink-100 text-pink-800" },
  { id: 5, name: "Finance",     color: "bg-yellow-100 text-yellow-800" },
  { id: 6, name: "Operations",  color: "bg-indigo-100 text-indigo-800" },
];

const deptColor  = (id) => DEPARTMENTS.find((d) => d.id === id)?.color || "bg-gray-100 text-gray-800";
const deptName   = (id) => DEPARTMENTS.find((d) => d.id === id)?.name  || "Unknown";
const perfColor  = (p) =>
  p >= 90 ? "text-green-700" : p >= 75 ? "text-blue-700" : p >= 60 ? "text-yellow-700" : "text-red-700";
const perfBg     = (p) =>
  p >= 90 ? "bg-green-500" : p >= 75 ? "bg-blue-500" : p >= 60 ? "bg-yellow-400" : "bg-red-400";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, cls = "w-5 h-5" }) => (
  <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {[].concat(d).map((path, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    ))}
  </svg>
);
const IUser      = () => <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
const IDept      = () => <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />;
const ISalary    = () => <Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />;
const IPerf      = () => <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
const ISearch    = () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const IEye       = () => <Icon d={["M15 12a3 3 0 11-6 0 3 3 0 016 0z","M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"]} />;
const IEdit      = () => <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />;
const IDelete    = () => <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
const IClose     = () => <Icon cls="w-6 h-6" d="M6 18L18 6M6 6l12 12" />;
const ICheck     = () => <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IRefresh   = () => <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ cls = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded ${cls}`}
    style={{ animation: "shimmer 1.4s infinite linear", backgroundSize: "200% 100%" }} />
);

const SkeletonRow = () => (
  <tr className="border-b border-slate-100">
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <Skeleton cls="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton cls="h-3.5 w-32" />
          <Skeleton cls="h-3 w-44" />
        </div>
      </div>
    </td>
    <td className="px-4 py-4"><Skeleton cls="h-6 w-20 rounded-full" /></td>
    <td className="px-4 py-4">
      <Skeleton cls="h-3.5 w-24 mb-1.5" />
      <Skeleton cls="h-3 w-14" />
    </td>
    <td className="px-4 py-4"><Skeleton cls="h-3.5 w-20" /></td>
    <td className="px-4 py-4">
      <div className="flex items-center gap-2">
        <Skeleton cls="h-2 w-16 rounded-full" />
        <Skeleton cls="h-5 w-10 rounded" />
      </div>
    </td>
    <td className="px-4 py-4">
      <Skeleton cls="h-3.5 w-12 mb-1.5" />
      <Skeleton cls="h-3 w-20" />
    </td>
    <td className="px-4 py-4">
      <div className="flex gap-1">
        <Skeleton cls="h-8 w-8 rounded-lg" />
        <Skeleton cls="h-8 w-8 rounded-lg" />
        <Skeleton cls="h-8 w-8 rounded-lg" />
      </div>
    </td>
  </tr>
);

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton cls="h-3 w-20" />
        <Skeleton cls="h-8 w-16" />
      </div>
      <Skeleton cls="w-11 h-11 rounded-xl" />
    </div>
  </div>
);

// ─── Inline shimmer keyframe ───────────────────────────────────────────────────
const shimmerStyle = `
@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
`;

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeManagement = () => {
  const [employees,     setEmployees]     = useState([]);
  const [enriched,      setEnriched]      = useState({}); // { _id: { tasks, attendance, performance } }
  const [loading,       setLoading]       = useState(true);   // initial skeleton
  const [enriching,     setEnriching]     = useState(false);  // background fetch
  const [searchTerm,    setSearchTerm]    = useState("");
  const [deptFilter,    setDeptFilter]    = useState("all");
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [sortBy,        setSortBy]        = useState("name");
  const [selectedEmp,   setSelectedEmp]   = useState(null);
  const [addOpen,       setAddOpen]       = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [credsOpen,     setCredsOpen]     = useState(false);
  const [newCreds,      setNewCreds]      = useState(null);
  const abortRef = useRef(null);

  const BLANK_FORM = {
    name: "", email: "", phone: "", department: "", position: "",
    salary: "", joiningDate: "", status: "Active", employeeType: "Employee",
    loginId: "", password: "",
  };
  const [formData, setFormData] = useState(BLANK_FORM);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("adminToken")) window.location.href = "/admin/login";
  }, []);

  // ── Step-1: fetch employee list (fast) ──────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await API.get("/employee/get/employee", {
        signal: abortRef.current.signal,
      });
      const list = Array.isArray(res.data?.employees)
        ? res.data.employees
        : Array.isArray(res.data) ? res.data : [];

      setEmployees(list);
      setLoading(false);

      if (list.length) enrichAll(list);
    } catch (err) {
      if (err.name !== "CanceledError") {
        toast.error("Failed to load employees");
        setLoading(false);
      }
    }
  }, []); // eslint-disable-line

  // ── Step-2: parallel enrich (tasks + attendance) ────────────────────────────
  const enrichAll = useCallback(async (list) => {
    setEnriching(true);

    // Fan-out ALL requests simultaneously – no batching delays
    const jobs = list.map(async (emp) => {
      try {
        const [tasksRes, attRes] = await Promise.allSettled([
          API.get(`/admin/tasks/${emp._id}`),
          API.get(`/attendance/${emp._id}/attendance`),
        ]);

        const tasks =
          tasksRes.status === "fulfilled"
            ? Array.isArray(tasksRes.value.data)
              ? tasksRes.value.data
              : tasksRes.value.data?.tasks || []
            : [];

        const attRecords =
          attRes.status === "fulfilled"
            ? Array.isArray(attRes.value.data)
              ? attRes.value.data
              : attRes.value.data?.attendance || []
            : [];

        const present = attRecords.filter(
          (r) => r.status === "Present" || r.status === "present"
        ).length;
        const attendanceRate =
          attRecords.length > 0
            ? Math.round((present / attRecords.length) * 100)
            : 0;

        const completed = tasks.filter(
          (t) => t.status === "Completed" || t.status === "completed"
        ).length;

        return {
          id: emp._id,
          tasks,
          completedTasks: completed,
          totalTasks: tasks.length,
          attendance: attendanceRate,
          performance: calcPerformance(tasks, attendanceRate),
        };
      } catch {
        return {
          id: emp._id, tasks: [], completedTasks: 0,
          totalTasks: 0, attendance: 0, performance: 0,
        };
      }
    });

    // Stream results into state as each resolves (fastest UX)
    const settled = await Promise.allSettled(jobs);
    const map = {};
    settled.forEach((r) => {
      if (r.status === "fulfilled" && r.value?.id) map[r.value.id] = r.value;
    });
    setEnriched(map);
    setEnriching(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // ── Merged employee list ─────────────────────────────────────────────────────
  const merged = useMemo(
    () => employees.map((e) => ({ ...e, ...(enriched[e._id] || {}) })),
    [employees, enriched]
  );

  // ── Filtered + sorted ────────────────────────────────────────────────────────
  const processed = useMemo(() => {
    let r = [...merged];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      r = r.filter(
        (e) =>
          e.name?.toLowerCase().includes(t) ||
          e.email?.toLowerCase().includes(t) ||
          e.position?.toLowerCase().includes(t) ||
          e.loginId?.toLowerCase().includes(t)
      );
    }
    if (deptFilter !== "all") r = r.filter((e) => e.department === +deptFilter);
    if (typeFilter !== "all") r = r.filter((e) => e.employeeType === typeFilter);
    r.sort((a, b) => {
      if (sortBy === "performance") return (b.performance || 0) - (a.performance || 0);
      if (sortBy === "salary")      return (b.salary      || 0) - (a.salary      || 0);
      return (a.name || "").localeCompare(b.name || "");
    });
    return r;
  }, [merged, searchTerm, deptFilter, typeFilter, sortBy]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = merged.length;
    const active  = merged.filter((e) => e.status === "Active").length;
    const interns = merged.filter((e) => e.employeeType === "Intern").length;
    const avgPerf = total
      ? Math.round(merged.reduce((s, e) => s + (e.performance || 0), 0) / total)
      : 0;
    const totalSalary = merged.reduce((s, e) => s + (e.salary || 0), 0);
    return { total, active, interns, avgPerf, totalSalary };
  }, [merged]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await API.post("/employee/create/employee", formData);
      setNewCreds({ name: formData.name, email: formData.email, loginId: formData.loginId, password: formData.password });
      setAddOpen(false); setCredsOpen(true);
      setFormData(BLANK_FORM);
      toast.success("Employee created!");
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create employee");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/employee/update/${selectedEmp._id}`, selectedEmp);
      setEditOpen(false); setSelectedEmp(null);
      toast.success("Employee updated!");
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update employee");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await API.delete(`/employee/delete/${id}`);
      toast.success("Deleted!");
      setEmployees((p) => p.filter((e) => e._id !== id));
      setEnriched((p) => { const n = { ...p }; delete n[id]; return n; });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{shimmerStyle}</style>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: "'DM Sans', sans-serif" } }} />

      <div className="min-h-screen bg-slate-50 font-[DM_Sans,sans-serif]">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Management</h1>
              <p className="text-slate-500 text-sm mt-0.5">Manage your team — {merged.length} members total</p>
            </div>
            <div className="flex items-center gap-2">
              {enriching && (
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  Loading performance data…
                </span>
              )}
              <button onClick={fetchEmployees} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm" title="Refresh">
                <IRefresh />
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition shadow-sm"
              >
                <span className="text-lg leading-none">+</span> Add Employee
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {loading ? (
              Array(5).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                {[
                  { label: "Total",       value: stats.total,                       icon: <IUser />,   color: "bg-slate-100 text-slate-700" },
                  { label: "Active",      value: stats.active,                      icon: <ICheck />,  color: "bg-emerald-50 text-emerald-600" },
                  { label: "Interns",     value: stats.interns,                     icon: <IDept />,   color: "bg-violet-50 text-violet-600" },
                  { label: "Avg Perf",    value: `${stats.avgPerf}%`,               icon: <IPerf />,   color: "bg-amber-50 text-amber-600" },
                  { label: "Total Salary",value: `₹${stats.totalSalary.toLocaleString()}`, icon: <ISalary />, color: "bg-blue-50 text-blue-600" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
                      </div>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* ── Filters ── */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><ISearch /></span>
                <input
                  type="text"
                  placeholder="Search by name, email or position…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none transition"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: deptFilter, set: setDeptFilter, opts: [["all","All Depts"], ...DEPARTMENTS.map(d=>[d.id,d.name])] },
                  { val: typeFilter, set: setTypeFilter, opts: [["all","All Types"],["Employee","Employee"],["Intern","Intern"]] },
                  { val: sortBy,     set: setSortBy,     opts: [["name","Name"],["performance","Performance"],["salary","Salary"]] },
                ].map(({ val, set, opts }, i) => (
                  <select key={i} value={val} onChange={(e) => set(e.target.value)}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none cursor-pointer">
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ))}
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Employee", "Department", "Position", "Salary", "Performance", "Tasks", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
                  ) : processed.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <p className="text-slate-400 text-sm mb-3">No employees found</p>
                        <button onClick={() => setAddOpen(true)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm hover:bg-slate-800 transition">
                          Add First Employee
                        </button>
                      </td>
                    </tr>
                  ) : (
                    processed.map((emp) => {
                      const enrichedRow = enriched[emp._id];
                      const isLoading   = !enrichedRow && enriching;
                      const perf        = emp.performance || 0;

                      return (
                        <tr key={emp._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                          {/* Employee */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {emp.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{emp.name}</p>
                                <p className="text-xs text-slate-400">{emp.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${deptColor(emp.department)}`}>
                              {deptName(emp.department)}
                            </span>
                          </td>

                          {/* Position */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm text-slate-700">{emp.position}</p>
                            <p className="text-xs text-slate-400">{emp.employeeType}</p>
                          </td>

                          {/* Salary */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-medium text-slate-800">₹{emp.salary?.toLocaleString() || "—"}</p>
                          </td>

                          {/* Performance */}
                          <td className="px-4 py-3.5">
                            {isLoading ? (
                              <div className="flex items-center gap-2">
                                <Skeleton cls="h-2 w-16 rounded-full" />
                                <Skeleton cls="h-4 w-8 rounded" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${perfBg(perf)} transition-all duration-500`}
                                    style={{ width: `${Math.min(perf, 100)}%` }} />
                                </div>
                                <span className={`text-xs font-semibold ${perfColor(perf)}`}>{perf}%</span>
                              </div>
                            )}
                          </td>

                          {/* Tasks */}
                          <td className="px-4 py-3.5">
                            {isLoading ? (
                              <>
                                <Skeleton cls="h-3.5 w-12 mb-1" />
                                <Skeleton cls="h-3 w-20" />
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-slate-800">
                                  {emp.completedTasks || 0}/{emp.totalTasks || 0}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {emp.totalTasks > 0
                                    ? `${Math.round(((emp.completedTasks || 0) / emp.totalTasks) * 100)}% done`
                                    : "No tasks"}
                                </p>
                              </>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelectedEmp(emp)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View">
                                <IEye />
                              </button>
                              <button onClick={() => { setSelectedEmp(emp); setEditOpen(true); }}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit">
                                <IEdit />
                              </button>
                              <button onClick={() => handleDelete(emp._id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                <IDelete />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && processed.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
                Showing <span className="font-medium text-slate-600">{processed.length}</span> of <span className="font-medium text-slate-600">{merged.length}</span> employees
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ Add Modal ══════════════════════════════════════════════════════════ */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Employee">
        <form onSubmit={handleAdd} className="p-6">
          <FieldGrid
            fields={[
              { label:"Full Name *",    key:"name",         type:"text",   required:true,  placeholder:"John Doe" },
              { label:"Email *",        key:"email",        type:"email",  required:true,  placeholder:"john@company.com" },
              { label:"Phone",          key:"phone",        type:"tel",    placeholder:"+91 98765 43210" },
              { label:"Position *",     key:"position",     type:"text",   required:true,  placeholder:"Software Engineer" },
              { label:"Salary (₹) *",  key:"salary",       type:"number", required:true,  placeholder:"50000" },
              { label:"Joining Date *", key:"joiningDate",  type:"date",   required:true },
              { label:"Login ID *",     key:"loginId",      type:"text",   required:true,  placeholder:"john.doe" },
              { label:"Password *",     key:"password",     type:"text",   required:true,  placeholder:"min 6 chars", minLength:6 },
            ]}
            selects={[
              { label:"Department *", key:"department", required:true, opts:[["","Select dept"], ...DEPARTMENTS.map(d=>[d.id,d.name])] },
              { label:"Type",         key:"employeeType",              opts:[["Employee","Employee"],["Intern","Intern"]] },
            ]}
            data={formData} onChange={(k, v) => setFormData(p => ({ ...p, [k]: v }))}
          />
          <ModalFooter onCancel={() => setAddOpen(false)} submitLabel="Create Employee" />
        </form>
      </Modal>

      {/* ══ Edit Modal ══════════════════════════════════════════════════════════ */}
      <Modal open={editOpen && !!selectedEmp} onClose={() => { setEditOpen(false); setSelectedEmp(null); }} title="Edit Employee">
        {selectedEmp && (
          <form onSubmit={handleEdit} className="p-6">
            <FieldGrid
              fields={[
                { label:"Full Name *", key:"name",     type:"text",   required:true },
                { label:"Email *",     key:"email",    type:"email",  required:true },
                { label:"Phone",       key:"phone",    type:"tel" },
                { label:"Position *",  key:"position", type:"text",   required:true },
                { label:"Salary (₹)*", key:"salary",   type:"number", required:true },
              ]}
              selects={[
                { label:"Department *", key:"department",  required:true, opts:[["","Select dept"], ...DEPARTMENTS.map(d=>[d.id,d.name])] },
                { label:"Type",         key:"employeeType",               opts:[["Employee","Employee"],["Intern","Intern"]] },
                { label:"Status",       key:"status",                     opts:[["Active","Active"],["Inactive","Inactive"]] },
              ]}
              data={selectedEmp} onChange={(k, v) => setSelectedEmp(p => ({ ...p, [k]: v }))}
            />
            <ModalFooter onCancel={() => { setEditOpen(false); setSelectedEmp(null); }} submitLabel="Save Changes" />
          </form>
        )}
      </Modal>

      {/* ══ Credentials Modal ══════════════════════════════════════════════════ */}
      {credsOpen && newCreds && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <ICheck />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Credentials Generated</h3>
            <p className="text-sm text-slate-500 mb-4">Save these securely before closing</p>
            <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2.5 text-sm mb-5">
              {[["Name", newCreds.name], ["Email", newCreds.email], ["Login ID", newCreds.loginId], ["Password", newCreds.password]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="font-mono text-slate-800 break-all">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
                navigator.clipboard.writeText(
                  `Name: ${newCreds.name}\nEmail: ${newCreds.email}\nLogin ID: ${newCreds.loginId}\nPassword: ${newCreds.password}`
                );
                toast.success("Copied!");
              }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition">
                Copy
              </button>
              <button onClick={() => { setCredsOpen(false); setNewCreds(null); }}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm hover:bg-slate-800 transition">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ View Details Modal ══════════════════════════════════════════════════ */}
      {selectedEmp && !addOpen && !editOpen && !credsOpen && (
        <Modal open title="Employee Details" onClose={() => setSelectedEmp(null)}>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center text-white text-2xl font-bold">
                {selectedEmp.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{selectedEmp.name}</h4>
                <p className="text-slate-500 text-sm">{selectedEmp.position} · {selectedEmp.employeeType}</p>
                <p className="text-slate-400 text-xs">{selectedEmp.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Department",  deptName(selectedEmp.department)],
                ["Status",      selectedEmp.status],
                ["Phone",       selectedEmp.phone || "N/A"],
                ["Salary",      `₹${selectedEmp.salary?.toLocaleString() || 0}`],
                ["Joining",     selectedEmp.joiningDate ? new Date(selectedEmp.joiningDate).toLocaleDateString() : "N/A"],
                ["Performance", `${selectedEmp.performance || 0}%`],
                ["Tasks",       `${selectedEmp.completedTasks || 0}/${selectedEmp.totalTasks || 0}`],
                ["Attendance",  `${selectedEmp.attendance || 0}%`],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="font-semibold text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────
const INPUT_CLS = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none transition";

const Modal = ({ open, onClose, title, children }) =>
  open ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition"><IClose /></button>
        </div>
        {children}
      </div>
    </div>
  ) : null;

const FieldGrid = ({ fields, selects, data, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {fields.map(({ label, key, type, required, placeholder, minLength }) => (
      <div key={key}>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
        <input type={type} required={required} placeholder={placeholder} minLength={minLength}
          value={data[key] || ""} onChange={(e) => onChange(key, e.target.value)} className={INPUT_CLS} />
      </div>
    ))}
    {selects.map(({ label, key, required, opts }) => (
      <div key={key}>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
        <select required={required} value={data[key] || ""} onChange={(e) => onChange(key, e.target.value)} className={INPUT_CLS}>
          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    ))}
  </div>
);

const ModalFooter = ({ onCancel, submitLabel }) => (
  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
    <button type="button" onClick={onCancel}
      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition">
      Cancel
    </button>
    <button type="submit"
      className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition">
      {submitLabel}
    </button>
  </div>
);

export default EmployeeManagement;