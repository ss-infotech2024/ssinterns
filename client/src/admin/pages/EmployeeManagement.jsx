import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import * as XLSX from "xlsx";

// ─── API ──────────────────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: "http://localhost:5000/api",
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

const IUpload   = () => <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />;
const IDownload = () => <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />;
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsedEmployees, setParsedEmployees] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
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

  // ── Bulk Upload ────────────────────────────────────────────────────────────
    const downloadTemplate = () => {
    const templateData = [
      {
        "Full Name": "John Doe",
        "Email": "john.doe@example.com",
        "Phone": "9876543210",
        "Position": "Software Engineer",
        "Salary": 45000,
        "Joining Date": "2025-01-15",          // YYYY-MM-DD format
        "Login ID": "john.doe",
        "Password": "password123",
        "Department": "Development",           // Sales / Marketing / Development / HR / Finance / Operations
        "Type": "Employee"                     // Employee / Intern
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");

    // Column widths
    ws["!cols"] = [
      { wch: 20 }, // Full Name
      { wch: 28 }, // Email
      { wch: 14 }, // Phone
      { wch: 20 }, // Position
      { wch: 12 }, // Salary
      { wch: 14 }, // Joining Date
      { wch: 14 }, // Login ID
      { wch: 14 }, // Password
      { wch: 14 }, // Department
      { wch: 12 }, // Type
    ];

    XLSX.writeFile(wb, "Employee_Bulk_Upload_Template.xlsx");
  };

    const handleBulkFileChange = (e) => {
      const file = e.target.files?.[0];

      if (!file) return;

      setBulkFile(file);
      setBulkResult(null);
      setParsedEmployees([]);

      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);

          const workbook = XLSX.read(data, {
            type: "array",
            cellDates: true,
          });

          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          const json = XLSX.utils.sheet_to_json(sheet, {
            defval: "",
            raw: true,
          });

          if (!json.length) {
            toast.error("Excel file is empty");
            return;
          }

          // ---------------------------------------------------------
          // Normalize Excel headers
          // ---------------------------------------------------------
          const normalizeHeader = (value) => {
            return String(value || "")
              .trim()
              .toLowerCase()
              .replace(/\*/g, "")
              .replace(/\(₹\)/g, "")
              .replace(/\(rs\.?\)/gi, "")
              .replace(/₹/g, "")
              .replace(/_/g, " ")
              .replace(/\s+/g, " ")
              .trim();
          };

          // ---------------------------------------------------------
          // Department mapping
          // ---------------------------------------------------------
          const deptMap = {};

          DEPARTMENTS.forEach((d) => {
            deptMap[normalizeHeader(d.name)] = d.id;
          });

          // ---------------------------------------------------------
          // Get value from Excel row
          // ---------------------------------------------------------
          const getValue = (row, possibleHeaders) => {
            const rowKeys = Object.keys(row);

            for (const header of possibleHeaders) {
              const normalizedTarget = normalizeHeader(header);

              const actualKey = rowKeys.find(
                (key) => normalizeHeader(key) === normalizedTarget
              );

              if (actualKey !== undefined) {
                return row[actualKey];
              }
            }

            return "";
          };

          // ---------------------------------------------------------
          // Excel date converter
          // ---------------------------------------------------------
          const convertExcelDate = (value) => {
            if (value === null || value === undefined || value === "") {
              return "";
            }

            // JS Date object
            if (value instanceof Date) {
              if (isNaN(value.getTime())) return "";

              const year = value.getFullYear();
              const month = String(value.getMonth() + 1).padStart(2, "0");
              const day = String(value.getDate()).padStart(2, "0");

              return `${year}-${month}-${day}`;
            }

            // Excel serial number
            if (typeof value === "number") {
              const parsed = XLSX.SSF.parse_date_code(value);

              if (parsed) {
                return `${parsed.y}-${String(parsed.m).padStart(
                  2,
                  "0"
                )}-${String(parsed.d).padStart(2, "0")}`;
              }
            }

            const str = String(value).trim();

            if (!str) return "";

            // YYYY-MM-DD or YYYY/MM/DD
            let match = str.match(
              /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
            );

            if (match) {
              const [, year, month, day] = match;

              return `${year}-${String(month).padStart(
                2,
                "0"
              )}-${String(day).padStart(2, "0")}`;
            }

            // DD/MM/YYYY or DD-MM-YYYY
            match = str.match(
              /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
            );

            if (match) {
              const [, day, month, year] = match;

              return `${year}-${String(month).padStart(
                2,
                "0"
              )}-${String(day).padStart(2, "0")}`;
            }

            const parsedDate = new Date(str);

            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split("T")[0];
            }

            return "";
          };

          // ---------------------------------------------------------
          // Convert Excel rows
          // ---------------------------------------------------------
          const mapped = json.map((row, index) => {
            const name = String(
              getValue(row, [
                "Full Name",
                "Full Name *",
                "Name",
                "name",
              ])
            ).trim();

            const email = String(
              getValue(row, [
                "Email",
                "Email *",
                "email",
              ])
            )
              .trim()
              .toLowerCase();

            const phone = String(
              getValue(row, [
                "Phone",
                "Phone Number",
                "phone",
              ])
            ).trim();

            const position = String(
              getValue(row, [
                "Position",
                "Position *",
                "position",
              ])
            ).trim();

            // -------------------------------------------------------
            // Salary
            // -------------------------------------------------------
            const rawSalary = getValue(row, [
              "Salary",
              "Salary (₹)",
              "Salary (₹) *",
              "Salary ₹",
              "Salary Rs",
              "salary",
            ]);

            const salaryString = String(rawSalary ?? "")
              .replace(/[₹,]/g, "")
              .replace(/\/-/g, "")
              .replace(/rs\.?/gi, "")
              .replace(/inr/gi, "")
              .replace(/[^\d.-]/g, "")
              .trim();

            const salary = Number(salaryString) || 0;

            // -------------------------------------------------------
            // Joining Date
            // -------------------------------------------------------
            const rawJoiningDate = getValue(row, [
              "Joining Date",
              "Joining Date *",
              "JoiningDate",
              "joiningDate",
            ]);

            const joiningDate = convertExcelDate(rawJoiningDate);

            // -------------------------------------------------------
            // Login ID
            // -------------------------------------------------------
            const loginId = String(
              getValue(row, [
                "Login ID",
                "Login ID *",
                "LoginID",
                "loginId",
              ])
            ).trim();

            // -------------------------------------------------------
            // Password
            // -------------------------------------------------------
            const password = String(
              getValue(row, [
                "Password",
                "Password *",
                "password",
              ])
            ).trim();

            // -------------------------------------------------------
            // Department
            // -------------------------------------------------------
            const rawDepartment = String(
              getValue(row, [
                "Department",
                "Department *",
                "department",
              ])
            )
              .trim()
              .toLowerCase();

            let departmentId = null;

            if (rawDepartment) {
              // Excel contains numeric department ID
              if (/^\d+$/.test(rawDepartment)) {
                const numericDepartment = Number(rawDepartment);

                if (
                  DEPARTMENTS.some(
                    (department) =>
                      department.id === numericDepartment
                  )
                ) {
                  departmentId = numericDepartment;
                }
              } else {
                departmentId = deptMap[rawDepartment] || null;
              }
            }

            // -------------------------------------------------------
            // Employee Type
            // -------------------------------------------------------
            const rawType = String(
              getValue(row, [
                "Type",
                "Employee Type",
                "Employee Type *",
                "employeeType",
              ])
            )
              .trim()
              .toLowerCase();

            const employeeType =
              rawType === "intern" ? "Intern" : "Employee";

            return {
              name,
              email,
              phone,
              department: departmentId,
              position,
              salary,
              joiningDate,
              loginId,
              password,
              status: "Active",
              employeeType,
              _row: index + 2,
            };
          });

          // ---------------------------------------------------------
          // Save parsed employees
          // ---------------------------------------------------------
          setParsedEmployees(mapped);

          // ---------------------------------------------------------
          // Debug
          // ---------------------------------------------------------
          console.log("Excel rows:", json);
          console.log("Parsed employees:", mapped);

          // ---------------------------------------------------------
          // Validate rows and identify EXACT missing fields
          // ---------------------------------------------------------
          const invalidRows = mapped
            .map((employee) => {
              const missing = [];

              if (!employee.name) {
                missing.push("Full Name");
              }

              if (!employee.email) {
                missing.push("Email");
              }

              if (!employee.department) {
                missing.push("Department");
              }

              if (!employee.position) {
                missing.push("Position");
              }

              if (!employee.salary || Number(employee.salary) <= 0) {
                missing.push("Salary");
              }

              if (!employee.joiningDate) {
                missing.push("Joining Date");
              }

              if (!employee.loginId) {
                missing.push("Login ID");
              }

              if (!employee.password) {
                missing.push("Password");
              }

              return {
                ...employee,
                missing,
              };
            })
            .filter((employee) => employee.missing.length > 0);

          // ---------------------------------------------------------
          // Show validation errors
          // ---------------------------------------------------------
          if (invalidRows.length > 0) {
            console.table(
              invalidRows.map((row) => ({
                ExcelRow: row._row,
                Name: row.name,
                Email: row.email,
                Department: row.department,
                Position: row.position,
                Salary: row.salary,
                JoiningDate: row.joiningDate,
                LoginID: row.loginId,
                Password: row.password
                  ? "Provided"
                  : "MISSING",
                Missing: row.missing.join(", "),
              }))
            );

            // Count missing fields
            const missingCounts = {};

            invalidRows.forEach((row) => {
              row.missing.forEach((field) => {
                missingCounts[field] =
                  (missingCounts[field] || 0) + 1;
              });
            });

            console.log(
              "MISSING FIELD COUNTS:",
              missingCounts
            );

            const missingSummary = Object.entries(
              missingCounts
            )
              .map(
                ([field, count]) =>
                  `${field}: ${count}`
              )
              .join(" | ");

            toast.error(
              `${invalidRows.length} rows invalid — ${missingSummary}`,
              {
                duration: 6000,
              }
            );

            setBulkResult({
              success: false,
              message: `${invalidRows.length} rows need correction`,
              errors: [
                `Missing fields: ${missingSummary}`,
                ...invalidRows
                  .slice(0, 20)
                  .map(
                    (row) =>
                      `Excel Row ${row._row}: Missing ${row.missing.join(
                        ", "
                      )}`
                  ),
              ],
            });

            return;
          }

          // Everything is valid
          toast.success(
            `${mapped.length} employees ready for upload`
          );
        } catch (error) {
          console.error(
            "Excel parsing error:",
            error
          );

          toast.error(
            "Failed to read Excel file. Please check the file format."
          );

          setParsedEmployees([]);
          setBulkResult({
            success: false,
            message: "Failed to parse Excel file",
            errors: [
              error?.message ||
                "Unknown Excel parsing error",
            ],
          });
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read Excel file");
      };

      reader.readAsArrayBuffer(file);
    };

    const handleBulkUpload = async () => {

    // ---------------------------------------------------------
    // Validate every row and show exact row numbers
    // ---------------------------------------------------------
    const invalidRows = parsedEmployees
      .map((employee) => {
        const missing = [];

        if (!employee.name) missing.push("Full Name");
        if (!employee.email) missing.push("Email");
        if (!employee.department) missing.push("Department");
        if (!employee.position) missing.push("Position");
        if (!employee.salary || Number(employee.salary) <= 0) {
          missing.push("Salary");
        }
        if (!employee.joiningDate) missing.push("Joining Date");
        if (!employee.loginId) missing.push("Login ID");
        if (!employee.password) missing.push("Password");

        return {
          ...employee,
          missing,
        };
      })
      .filter((employee) => employee.missing.length > 0);

    // ---------------------------------------------------------
    // Stop before API if Excel has invalid rows
    // ---------------------------------------------------------
    if (invalidRows.length > 0) {
      console.table(
        invalidRows.map((row) => ({
          ExcelRow: row._row,
          Name: row.name,
          Missing: row.missing.join(", "),
        }))
      );

      toast.error(
        `${invalidRows.length} rows have missing required fields`
      );

      setBulkResult({
        success: false,
        message: `${invalidRows.length} rows need correction`,
        errors: invalidRows.map(
          (row) =>
            `Excel Row ${row._row}: Missing ${row.missing.join(", ")}`
        ),
      });

      return;
    }

    setBulkLoading(true);
    setBulkResult(null);

    try {
      const payload = parsedEmployees.map(({ _row, ...employee }) => ({
        ...employee,
        salary: Number(employee.salary),
      }));

      console.log("Bulk upload payload:", payload);

      const res = await API.post(
        "/employee/create/employee/batch",
        payload
      );

      const data = res.data;

      const summary = data.summary || {
        total: payload.length,
        success: data.count || 0,
        failed: payload.length - (data.count || 0),
        errors: [],
      };

      setBulkResult({
        success: true,
        message: data.message || "Bulk upload successful",
        summary,
        errors: summary.errors || [],
      });

      toast.success(
        data.message || "Employees added successfully"
      );

      await fetchEmployees();

      setBulkFile(null);
      setParsedEmployees([]);
    } catch (err) {
      console.error("Bulk upload error:", err);

      const msg =
        err.response?.data?.message ||
        "Bulk upload failed";

      const errors =
        err.response?.data?.errors ||
        err.response?.data?.summary?.errors ||
        [];

      setBulkResult({
        success: false,
        message: msg,
        errors,
      });

      toast.error(msg);
    } finally {
      setBulkLoading(false);
    }
  };

    const closeBulkModal = () => {
      setBulkOpen(false);
      setBulkFile(null);
      setParsedEmployees([]);
      setBulkResult(null);
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

                {/* ← Bulk Add Button */}
                <button
                  onClick={() => setBulkOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition shadow-sm"
                >
                  <IUpload /> Bulk Add
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
      {/* ══ Bulk Add Modal ═══════════════════════════════════════════════════════ */}
        {bulkOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold text-slate-800">Bulk Add Employees</h3>
                <button onClick={closeBulkModal} className="text-slate-400 hover:text-slate-700 transition">
                  <IClose />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Step 1 */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <h4 className="font-semibold text-blue-800 text-sm mb-1">Step 1 — Download Template</h4>
                  <p className="text-xs text-blue-600 mb-3">
                    Download the Excel template, fill the employee details, then upload it below.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <IDownload /> Download Template
                  </button>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="font-semibold text-slate-800 text-sm mb-1">Step 2 — Upload Filled Excel</h4>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkFileChange}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100 cursor-pointer mt-2"
                  />
                  {bulkFile && (
                    <p className="mt-2 text-xs text-emerald-600 font-medium">
                      {bulkFile.name} — {parsedEmployees.length} rows found
                    </p>
                  )}
                </div>

                {/* Preview */}
                {parsedEmployees.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm mb-2">
                      Preview ({parsedEmployees.length} employees)
                    </h4>
                    <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            {[
                              "Name",
                              "Email",
                              "Department",
                              "Position",
                              "Salary",
                              "Joining Date",
                              "Login ID",
                              "Password"
                            ].map((h) => (
                              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedEmployees.slice(0, 8).map((emp, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                {emp.name || <span className="text-red-500">Missing</span>}
                              </td>

                              <td className="px-3 py-2">
                                {emp.email || <span className="text-red-500">Missing</span>}
                              </td>

                              <td className="px-3 py-2">
                                {deptName(emp.department) === "Unknown"
                                  ? <span className="text-red-500">Invalid</span>
                                  : deptName(emp.department)}
                              </td>

                              <td className="px-3 py-2">
                                {emp.position || <span className="text-red-500">Missing</span>}
                              </td>

                              <td className="px-3 py-2">
                                {emp.salary > 0
                                  ? `₹${emp.salary.toLocaleString()}`
                                  : <span className="text-red-500">Missing</span>}
                              </td>

                              <td className="px-3 py-2">
                                {emp.joiningDate
                                  ? emp.joiningDate
                                  : <span className="text-red-500">Missing</span>}
                              </td>

                              <td className="px-3 py-2">
                                {emp.loginId || <span className="text-red-500">Missing</span>}
                              </td>

                              <td className="px-3 py-2">
                                {emp.password
                                  ? <span className="text-green-600">Provided</span>
                                  : <span className="text-red-500">Missing</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedEmployees.length > 8 && (
                        <p className="text-center text-xs text-slate-400 py-2">
                          ...and {parsedEmployees.length - 8} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Result */}
                {bulkResult && (
                  <div className={`rounded-xl p-4 text-sm ${
                    bulkResult.success
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}>
                    <p className="font-semibold">{bulkResult.message}</p>
                    {bulkResult.summary && (
                      <p className="mt-1 text-xs opacity-80">
                        Total: {bulkResult.summary.total} · Success: {bulkResult.summary.success} · Failed: {bulkResult.summary.failed}
                      </p>
                    )}
                    {bulkResult.errors?.length > 0 && (
                      <ul className="mt-2 text-xs list-disc list-inside max-h-28 overflow-y-auto space-y-0.5">
                        {bulkResult.errors.slice(0, 8).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={closeBulkModal}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={!parsedEmployees.length || bulkLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkLoading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <IUpload />
                        Upload {parsedEmployees.length > 0 ? `${parsedEmployees.length} Employees` : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
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