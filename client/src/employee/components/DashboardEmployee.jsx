// src/components/employee/DashboardEmployee.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

import {
  RiDashboardHorizontalFill,
  RiTaskLine,
  RiCalendarScheduleLine,
} from "react-icons/ri";
import {
  FaBusinessTime,
  FaUserClock,
  FaTasks,
  FaFileSignature,
  FaMoneyBillWave,
  FaUserGraduate,
  FaUserPlus
} from "react-icons/fa";

import { SiGoogletasks, SiGoogleforms } from "react-icons/si";
import { BsQrCodeScan } from "react-icons/bs";
import { FiSettings } from "react-icons/fi";

// Pages
import EmployeeAttendance from "../pages/EmployeeAttendance";
import EmployeeSettings from "../pages/EmployeeSettings";
import Expense from "../pages/Expense";
import QRStudentAttendance from "../pages/QRStudentAttendance";
import StudentAttendance from "../pages/StudentAttendance";
import TaskTracker from "../pages/TaskTracker";
import CourseManagement from "../pages/CourseMagement";
import StudentForm from "../../pages/StudentForm";
import EmployeeData from "../pages/EmployeeData";
import LeadManagement from "../pages/LeadManagement";
import LeaveApplicationForm from "../pages/LeaveApplicaationForm";

/* ==================== DASHBOARD CONTENT ==================== */
const DashboardContent = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    attendanceRate: 0,
    workingHours: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickActionLoading, setQuickActionLoading] = useState(null);

  const token = localStorage.getItem("employeeToken");
  const employee = useMemo(() => {
    const data = localStorage.getItem("employeeData");
    return data ? JSON.parse(data) : null;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [tasksRes, attRes] = await Promise.all([
        fetch("/api/employee/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/employee/attendance", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const tasksJson = tasksRes.ok ? await tasksRes.json() : { success: false, tasks: [] };
      const attJson = attRes.ok ? await attRes.json() : { success: false, attendance: [] };

      if (tasksJson.success) {
        const tasks = tasksJson.tasks || [];
        const completed = tasks.filter(t => t.status === "Completed").length;
        const pending = tasks.filter(t => ["Pending", "In Progress"].includes(t.status)).length;

        setRecentTasks(tasks.slice(0, 5));
        setStats(s => ({
          ...s,
          totalTasks: tasks.length,
          completedTasks: completed,
          pendingTasks: pending,
        }));
      }

      if (attJson.success) {
        const att = attJson.attendance || [];
        const recent = att.slice(0, 5);
        setRecentAttendance(recent);

        const totalHours = att.reduce((sum, r) => sum + (r.workingHours || 0), 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30 = att.filter(r => new Date(r.date) >= thirtyDaysAgo);
        const present = last30.filter(r => r.status === "Present").length;
        const rate = last30.length > 0 ? Math.round((present / last30.length) * 100) : 0;

        setStats(s => ({
          ...s,
          workingHours: Math.round(totalHours),
          attendanceRate: Math.min(rate, 100),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleQuickAction = async (action) => {
    if (!token) return;

    setQuickActionLoading(action);
    try {
      const endpoint = action === "clockIn" ? "clock-in" : "clock-out";
      const res = await fetch(`/api/employee/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Action failed");

      alert(data.message || `Clocked ${action === "clockIn" ? "in" : "out"}!`);
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setQuickActionLoading(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {employee?.name?.split(" ")[0] || "Employee"}!</h1>
        <p className="text-purple-100">
          {employee?.employeeType === "Intern"
            ? "Intern Dashboard - Limited Access Mode"
            : "Here's your dashboard overview for today."}
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          {["Position", "Department", "Status", "Type"].map((label, i) => (
            <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm opacity-90">{label}</p>
              <p className="font-semibold">
                {label === "Department"
                  ? employee?.department === 1 ? "Sales"
                    : employee?.department === 2 ? "Marketing"
                      : employee?.department === 3 ? "Development" : "Other"
                  : label === "Status" ? employee?.status || "Active"
                    : label === "Type" ? employee?.employeeType || "Employee"
                      : employee?.position || "Employee"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Hide clock in/out for interns if needed */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ...(employee?.employeeType !== "Intern" ? [
            { action: "clockIn", label: "Clock In", color: "green", icon: <FaUserClock /> },
            { action: "clockOut", label: "Clock Out", color: "red", icon: <FaUserClock /> },
          ] : []),
          { to: "/employee/dashboard/task", label: "My Tasks", color: "blue", icon: <FaTasks /> },
          { to: "/employee/dashboard/attendance", label: "Attendance", color: "purple", icon: <RiCalendarScheduleLine /> },
        ].map((btn, i) => (
          btn.to ? (
            <Link key={i} to={btn.to} className={`bg-${btn.color}-500 hover:bg-${btn.color}-600 text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-colors`}>
              {btn.icon} <span className="font-semibold">{btn.label}</span>
            </Link>
          ) : (
            <button key={i} onClick={() => handleQuickAction(btn.action)} disabled={quickActionLoading === btn.action}
              className={`bg-${btn.color}-500 hover:bg-${btn.color}-600 disabled:bg-${btn.color}-400 text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-colors`}>
              {quickActionLoading === btn.action ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : btn.icon}
              <span className="font-semibold">{quickActionLoading === btn.action ? "..." : btn.label}</span>
            </button>
          )
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Tasks", value: stats.totalTasks, icon: <RiTaskLine />, color: "blue", extra: `${stats.completedTasks} done • ${stats.pendingTasks} pending` },
          { label: "Attendance Rate", value: `${stats.attendanceRate}%`, icon: <FaBusinessTime />, color: "green", progress: stats.attendanceRate },
          { label: "Working Hours", value: `${stats.workingHours}h`, icon: <RiCalendarScheduleLine />, color: "purple" },
          { label: "Performance", value: `${employee?.performance ?? 0}%`, icon: <RiDashboardHorizontalFill />, color: "orange" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                <span className={`text-2xl text-${stat.color}-600`}>{stat.icon}</span>
              </div>
            </div>
            {stat.progress && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`bg-${stat.color}-600 h-2 rounded-full transition-all duration-500`} style={{ width: `${stat.progress}%` }}></div>
                </div>
              </div>
            )}
            {stat.extra && <p className="mt-2 text-xs text-gray-500">{stat.extra}</p>}
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          {
            title: "Recent Tasks", data: recentTasks, link: "/employee/dashboard/task", key: "_id", render: t => (
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${t.priority === "High" ? "bg-red-500" : t.priority === "Medium" ? "bg-yellow-500" : "bg-green-500"}`}></div>
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-sm text-gray-500">Due: {t.dueDate ? formatDate(t.dueDate) : "No due date"}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === "Completed" ? "bg-green-100 text-green-800" : t.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {t.status}
                </span>
              </div>
            )
          },
          {
            title: "Recent Attendance", data: recentAttendance, link: "/employee/dashboard/attendance", key: "_id", render: r => (
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">{formatDate(r.date)}</p>
                  <p className="text-sm text-gray-500">
                    {r.clockIn && `In: ${formatTime(r.clockIn)}`}
                    {r.clockOut && ` • Out: ${formatTime(r.clockOut)}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === "Present" ? "bg-green-100 text-green-800" : r.status === "Absent" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {r.status}
                  </span>
                  {r.workingHours && <p className="text-sm text-gray-500 mt-1">{r.workingHours}h</p>}
                </div>
              </div>
            )
          }
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              <Link to={section.link} className="text-purple-600 hover:text-purple-700 text-sm font-medium">View all</Link>
            </div>
            <div className="space-y-4">
              {section.data.length > 0 ? section.data.map(item => (
                <div key={item[section.key]}>{section.render(item)}</div>
              )) : <p className="text-gray-500 text-center py-4">No records found</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== MAIN LAYOUT ==================== */
const DashboardEmployee = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on mount only
  useEffect(() => {
    const token = localStorage.getItem("employeeToken");
    if (!token) {
      navigate("/employee/login", { replace: true });
    }
  }, [navigate]);

  const employee = useMemo(() => {
    const raw = localStorage.getItem("employeeData");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeData");
    localStorage.removeItem("userRole");
    localStorage.removeItem("employeeId");
    localStorage.removeItem("employeeEmail");
    navigate("/employee/login", { replace: true });
  };

  // Define all possible menu items
  const allMenuItems = [
    { path: "/employee/dashboard", label: "Dashboard", icon: <RiDashboardHorizontalFill /> },
    { path: "/employee/dashboard/students", label: "Students Attendance", icon: <FaUserGraduate /> },
    // { path: "/employee/dashboard/courses", label: "Course Management", icon: <FaFileSignature /> },
    { path: "/employee/dashboard/attendance", label: "My Attendance", icon: <FaBusinessTime /> },
    { path: "/employee/dashboard/QRstudentattendance", label: "Student QR Attendance", icon: <BsQrCodeScan /> },
    { path: "/employee/dashboard/leaverequest", label: "Leave Request", icon: <SiGoogleforms /> },
    { path: "/employee/dashboard/leadmanagement", label: "Lead Management", icon: <FaUserPlus /> },
    { path: "/employee/dashboard/task", label: "My Tasks", icon: <SiGoogletasks /> },
    { path: "/employee/dashboard/settings", label: "Settings", icon: <FiSettings /> },
  ];

  // Filter menu items based on employeeType
  const getFilteredMenuItems = () => {
    if (!employee) return allMenuItems;

    // If employeeType is "Intern", only show specific routes
    if (employee.employeeType === "Intern") {
      return allMenuItems.filter(item => {
        const allowedRoutes = [
          "/employee/dashboard", // Dashboard
          "/employee/dashboard/attendance", // My Attendance
          "/employee/dashboard/leaverequest", // Leave Request
          "/employee/dashboard/leadmanagement", // Lead Management (if interns need this)
          "/employee/dashboard/expense", // Expense
          "/employee/dashboard/task", // My Tasks
          "/employee/dashboard/settings", // Settings
        ];
        return allowedRoutes.includes(item.path);
      });
    }

    // For other employee types (Full-time, Part-time, etc.), show all routes
    return allMenuItems;
  };

  const menuItems = getFilteredMenuItems();

  // Check if current route is allowed for the employee
  const isRouteAllowed = (path) => {
    if (!employee) return true;

    if (employee.employeeType === "Intern") {
      const allowedRoutes = [
        "/employee/dashboard",
        "/employee/dashboard/attendance",
        "/employee/dashboard/leaverequest",
        "/employee/dashboard/leadmanagement",
        "/employee/dashboard/expense",
        "/employee/dashboard/task",
        "/employee/dashboard/settings",
      ];

      // Handle nested routes
      if (path.startsWith("/employee/dashboard")) {
        return allowedRoutes.some(allowedPath =>
          path === allowedPath || path.startsWith(allowedPath + "/")
        );
      }

      return allowedRoutes.includes(path);
    }

    return true; // All routes allowed for non-interns
  };

  // Redirect if trying to access unauthorized route
  useEffect(() => {
    if (employee && !isRouteAllowed(location.pathname)) {
      navigate("/employee/dashboard", { replace: true });
    }
  }, [location.pathname, employee, navigate]);

  // Check authentication and redirect if needed
  if (!localStorage.getItem("employeeToken")) {
    return <Navigate to="/employee/login" replace />;
  }

  // Show unauthorized message if intern tries to access restricted pages
  const isIntern = employee?.employeeType === "Intern";
  const currentRoute = menuItems.find(i => i.path === location.pathname);
  const isRestrictedRoute = !currentRoute && location.pathname !== "/employee/dashboard";

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-gray-800 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h2 className="text-xl font-bold">Employee Portal</h2>
              {isIntern && (
                <p className="text-xs text-yellow-300 mt-1">Intern Mode</p>
              )}
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-xl"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center p-4 hover:bg-gray-700 transition-colors ${location.pathname === item.path ? "bg-gray-900 border-r-4 border-purple-500" : ""
                }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {sidebarOpen && <span className="text-base">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {sidebarOpen && employee && (
          <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold truncate">{employee.name}</p>
                <p className="text-gray-400 text-xs truncate">{employee.position}</p>
                <p className="text-gray-400 text-xs">
                  {employee.department === 1 ? "Sales" :
                    employee.department === 2 ? "Marketing" :
                      employee.department === 3 ? "Development" : "Other"}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs ${employee.status === "Active" ? "text-green-400" : "text-red-400"}`}>
                  ● {employee.status}
                </p>
                <p className={`text-xs mt-1 ${employee.employeeType === "Intern" ? "text-yellow-400" : "text-blue-400"}`}>
                  {employee.employeeType}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {currentRoute?.label || "Employee Dashboard"}
              </h1>
              {isIntern && (
                <p className="text-sm text-gray-500">Intern Access Mode</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {employee && (
                <div className="text-right">
                  <p className="text-gray-700 font-medium">{employee.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-500 text-sm">{employee.position}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.employeeType === "Intern" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>
                      {employee.employeeType}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {isRestrictedRoute ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
              <p className="text-gray-600 mb-6">
                As an intern, you don't have permission to access this page.
              </p>
              <Link
                to="/employee/dashboard"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-medium inline-block"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <Routes>
              <Route index element={<EmployeeData />} />

              {/* Only render these routes if employee is not an intern or if route is allowed */}
              {!isIntern && (
                <>
                  <Route path="students" element={<StudentAttendance />} />
                  {/* <Route path="courses" element={<CourseManagement />} /> */}
                  <Route path="QRstudentattendance" element={<QRStudentAttendance />} />
                </>
              )}

              {/* Always render these routes (allowed for interns) */}
              <Route path="attendance" element={<EmployeeAttendance />} />
              <Route path="leaverequest" element={<LeaveApplicationForm />} />
              <Route path="leadmanagement" element={<LeadManagement />} />
              <Route path="task" element={<TaskTracker />} />
              <Route path="expense" element={<Expense />} />
              <Route path="settings" element={<EmployeeSettings />} />

              {/* Redirect any unauthorized routes */}
              <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardEmployee;