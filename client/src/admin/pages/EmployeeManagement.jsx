// src/admin/pages/EmployeeManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

// API Configuration
const API = axios.create({
  baseURL: "https://interncrm.onrender.com/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Icons
const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DepartmentIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const SalaryIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const PerformanceIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrophyIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TaskIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const RefreshIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
      <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
    </div>
  </div>
);

// Performance calculation utility
const calculatePerformance = (tasks = [], attendance = 0) => {
  const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'completed').length;
  const taskCompletion = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  return Math.round((taskCompletion * 0.6) + (attendance * 0.4));
};

const EmployeeManagement = () => {
  // State
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState(null);

  // Departments data
  const departments = [
    { id: 1, name: "Sales", color: "bg-blue-100 text-blue-800" },
    { id: 2, name: "Marketing", color: "bg-purple-100 text-purple-800" },
    { id: 3, name: "Development", color: "bg-green-100 text-green-800" },
    { id: 4, name: "HR", color: "bg-pink-100 text-pink-800" },
    { id: 5, name: "Finance", color: "bg-yellow-100 text-yellow-800" },
    { id: 6, name: "Operations", color: "bg-indigo-100 text-indigo-800" }
  ];

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    salary: "",
    joiningDate: "",
    status: "Active",
    employeeType: "Employee",
    loginId: "",
    password: ""
  });

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "/admin/login";
    }
  }, []);

  // Fetch employees with optimized loading
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);

      // First fetch basic employee data
      const response = await API.get("/employee/get/employee");
      let employeesData = response.data?.employees || response.data || [];

      if (!Array.isArray(employeesData)) {
        employeesData = [];
      }

      // Set initial state with basic data (fast load)
      setEmployees(employeesData);
      setFilteredEmployees(employeesData);

      // Then fetch additional data in background for first few employees
      if (employeesData.length > 0) {
        // Load detailed data for first 5 employees immediately
        const initialBatch = employeesData.slice(0, 5);

        Promise.allSettled(
          initialBatch.map(async (emp) => {
            try {
              // Fetch tasks
              const tasksRes = await API.get(`/admin/tasks/${emp._id}`).catch(() => ({ data: [] }));
              const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data?.tasks || [];

              // Fetch attendance
              const attendanceRes = await API.get(`/attendance/${emp._id}/attendance`).catch(() => ({ data: [] }));
              const attendanceRecords = Array.isArray(attendanceRes.data) ? attendanceRes.data : attendanceRes.data?.attendance || [];
              const presentDays = attendanceRecords.filter(r => r.status === 'Present' || r.status === 'present').length;
              const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentDays / attendanceRecords.length) * 100) : 0;

              // Calculate performance
              const performance = calculatePerformance(tasks, attendanceRate);

              return {
                ...emp,
                tasks,
                completedTasks: tasks.filter(t => t.status === 'Completed' || t.status === 'completed').length,
                totalTasks: tasks.length,
                attendance: attendanceRate,
                performance
              };
            } catch (err) {
              console.error(`Error loading details for ${emp.name}:`, err);
              return {
                ...emp,
                tasks: [],
                completedTasks: 0,
                totalTasks: 0,
                attendance: 0,
                performance: 0
              };
            }
          })
        ).then(results => {
          const updatedEmployees = results.map((result, index) =>
            result.status === 'fulfilled' ? result.value : initialBatch[index]
          );

          // Update state with detailed data
          setEmployees(prev => prev.map(emp => {
            const detailedEmp = updatedEmployees.find(e => e?._id === emp._id);
            return detailedEmp || emp;
          }));
        });
      }

    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter and sort employees with useMemo
  const processedEmployees = useMemo(() => {
    let result = [...employees];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(emp =>
        emp.name?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term) ||
        emp.loginId?.toLowerCase().includes(term)
      );
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      result = result.filter(emp => emp.department === +departmentFilter);
    }

    // Apply employee type filter
    if (employeeTypeFilter !== "all") {
      result = result.filter(emp => emp.employeeType === employeeTypeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "performance":
          return (b.performance || 0) - (a.performance || 0);
        case "salary":
          return (b.salary || 0) - (a.salary || 0);
        case "name":
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    return result;
  }, [employees, searchTerm, departmentFilter, employeeTypeFilter, sortBy]);

  // Calculate statistics with useMemo
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === "Active").length;
    const interns = employees.filter(e => e.employeeType === "Intern").length;
    const avgPerformance = employees.length > 0
      ? Math.round(employees.reduce((sum, emp) => sum + (emp.performance || 0), 0) / employees.length)
      : 0;
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

    return { total, active, interns, avgPerformance, totalSalary };
  }, [employees]);

  // Handlers
  const handleAddEmployee = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("/employee/create/employee", formData);

      if (response.data) {
        setNewEmployeeCredentials({
          name: formData.name,
          email: formData.email,
          loginId: formData.loginId,
          password: formData.password
        });

        setIsAddModalOpen(false);
        setIsCredentialsModalOpen(true);
        setFormData({
          name: "", email: "", phone: "", department: "", position: "", salary: "",
          joiningDate: "", status: "Active", employeeType: "Employee", loginId: "", password: ""
        });

        toast.success("Employee created successfully!");
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create employee");
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();

    try {
      await API.patch(`/employee/update/${selectedEmployee._id}`, selectedEmployee);

      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      toast.success("Employee updated successfully!");
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update employee");
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      await API.delete(`/employee/delete/${id}`);
      toast.success("Employee deleted successfully!");
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete employee");
    }
  };

  const handleResetPassword = async (employeeId, newPassword) => {
    try {
      await API.post(`/employee/${employeeId}/reset-password`, { newPassword });
      toast.success("Password reset successfully!");
      return true;
    } catch (err) {
      toast.error("Failed to reset password");
      return false;
    }
  };

  const getDepartmentColor = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.color || "bg-gray-100 text-gray-800";
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (performance >= 80) return "bg-blue-100 text-blue-800 border-blue-200";
    if (performance >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return "bg-green-100 text-green-800";
    if (attendance >= 80) return "bg-blue-100 text-blue-800";
    if (attendance >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Render loading state
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Employee Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Employee Management</h1>
          <p className="text-gray-600 mt-2">Manage your team members efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Intern</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Interns</p>
                <p className="text-2xl font-bold text-purple-600">{stats.interns}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DepartmentIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Performance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgPerformance}%</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <PerformanceIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Salary</p>
                <p className="text-2xl font-bold text-indigo-600">₹{stats.totalSalary.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <SalaryIcon className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Actions</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-1 px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  + Add New
                </button>
              </div>
              <button
                onClick={fetchEmployees}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                <RefreshIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>

              <select
                value={employeeTypeFilter}
                onChange={(e) => setEmployeeTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="Employee">Employee</option>
                <option value="Intern">Intern</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="performance">Sort by Performance</option>
                <option value="salary">Sort by Salary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : processedEmployees.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">No Intern found</div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Your First Employee
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Salary</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Performance</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tasks</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {processedEmployees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {employee.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDepartmentColor(employee.department)}`}>
                          {departments.find(d => d.id === employee.department)?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{employee.position}</div>
                        <div className="text-xs text-gray-500">{employee.employeeType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">₹{employee.salary?.toLocaleString() || '0'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${employee.performance >= 80 ? 'bg-green-500' : employee.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(employee.performance || 0, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${getPerformanceColor(employee.performance || 0)}`}>
                            {employee.performance || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {employee.completedTasks || 0}/{employee.totalTasks || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.totalTasks > 0 ? `${Math.round(((employee.completedTasks || 0) / employee.totalTasks) * 100)}% completed` : 'No tasks'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedEmployee(employee)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                            title="Edit"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee._id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination/Info */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {processedEmployees.length} of {employees.length} Intern
        </div>

        {/* Add Employee Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Add New Employee</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter position"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter salary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Type
                    </label>
                    <select
                      value={formData.employeeType}
                      onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Login ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.loginId}
                      onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter login ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="text"
                      required
                      minLength="6"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter password (min 6 chars)"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Create Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Employee Modal */}
        {isEditModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Edit Employee</h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditEmployee} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedEmployee.name || ''}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={selectedEmployee.email || ''}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={selectedEmployee.phone || ''}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      required
                      value={selectedEmployee.department || ''}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedEmployee.position || ''}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={selectedEmployee.salary || ''}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, salary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Type
                    </label>
                    <select
                      value={selectedEmployee.employeeType || 'Employee'}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, employeeType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedEmployee.status || 'Active'}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedEmployee(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Update Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Credentials Modal */}
        {isCredentialsModalOpen && newEmployeeCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Credentials Generated</h3>
                <p className="text-sm text-gray-600 mt-1">Save these credentials securely</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Name:</span>
                  <span>{newEmployeeCredentials.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span>{newEmployeeCredentials.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Login ID:</span>
                  <span className="font-mono bg-gray-200 px-2 py-1 rounded">{newEmployeeCredentials.loginId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Password:</span>
                  <span className="font-mono bg-red-100 text-red-600 px-2 py-1 rounded">{newEmployeeCredentials.password}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    const text = `Name: ${newEmployeeCredentials.name}\nEmail: ${newEmployeeCredentials.email}\nLogin ID: ${newEmployeeCredentials.loginId}\nPassword: ${newEmployeeCredentials.password}`;
                    navigator.clipboard.writeText(text);
                    toast.success("Copied to clipboard!");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    setIsCredentialsModalOpen(false);
                    setNewEmployeeCredentials(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Details Modal */}
        {selectedEmployee && !isAddModalOpen && !isEditModalOpen && !isCredentialsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Employee Details</h3>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedEmployee.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{selectedEmployee.name}</h4>
                    <p className="text-gray-600">{selectedEmployee.position}</p>
                    <p className="text-sm text-gray-500">{selectedEmployee.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Department</label>
                    <p className="font-medium">
                      {departments.find(d => d.id === selectedEmployee.department)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Employee Type</label>
                    <p className="font-medium">{selectedEmployee.employeeType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${selectedEmployee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium">{selectedEmployee.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Salary</label>
                    <p className="font-medium">₹{selectedEmployee.salary?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Joining Date</label>
                    <p className="font-medium">
                      {selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Performance</label>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${selectedEmployee.performance >= 80 ? 'bg-green-500' : selectedEmployee.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(selectedEmployee.performance || 0, 100)}%` }}
                        />
                      </div>
                      <span className="font-medium">{selectedEmployee.performance || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Tasks</label>
                    <p className="font-medium">
                      {selectedEmployee.completedTasks || 0}/{selectedEmployee.totalTasks || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;