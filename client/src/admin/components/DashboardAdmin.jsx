import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import ClientManagement from "../pages/ClientManagement";
import { PiCoins, PiChartLine, PiGear, PiBell, PiUser, PiSignOut } from "react-icons/pi";
import { IoLocationSharp, IoCalendar, IoGrid, IoPeople } from "react-icons/io5";
import {
  GiExitDoor,
  GiGraduateCap,
  GiTeacher,
  GiMoneyStack,
  GiProgression
} from "react-icons/gi";
import {
  MdDashboard,
  MdWork,
  MdAttachMoney,
  MdSchool,
  MdAssignment,
  MdSettings
} from "react-icons/md";
import {
  FaUsers,
  FaProjectDiagram,
  FaChartBar,
  FaCalendarCheck,
  FaTasks
} from "react-icons/fa";
import { TbReportAnalytics } from "react-icons/tb";

// Import your components
import StudentManagement from "../pages/StudentManagement";
import EmployeeManagement from "../pages/EmployeeManagement";
import CourseManagement from "../pages/CourseManagement";
import AttendanceManagement from "../pages/AttendanceManagement";
import ProjectManagement from "../pages/ProjectManagement";
import LeadInsensitiveManagement from "../pages/LeadInsensitiveManagement";
import Dashboard from "../pages/Dashboard ";
import ExpenseManagement from "../pages/ExpenseManagement";
import EmployeeLiveStatus from "../pages/EmployeeLiveStatus";
import AdminLeaveDashboard from "../pages/AdminLeaveDashboard";
import TaskAdmin from "../pages/TaskAdmin";

/* ----------  MAIN DASHBOARD LAYOUT  ---------- */
const DashboardAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [userData, setUserData] = useState({
    name: "Admin User",
    role: "Administrator",
    avatar: "A"
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Check screen width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update active menu based on location
  useEffect(() => {
    const path = location.pathname;
    const menuItem = menuItems.find(item =>
      path.includes(item.path) ||
      (item.path === "." && path === "/admin/dashboard")
    );
    if (menuItem) {
      setActiveMenu(menuItem.label);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userRole");
    navigate("/admin");
  };

  const menuItems = [
    {
      path: ".",
      label: "Dashboard",
      icon: MdDashboard,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      path: "employees",
      label: "Interns",
      icon: FaUsers,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    // {
    //   path: "student-management",
    //   label: "Students",
    //   icon: GiGraduateCap,
    //   color: "text-green-500",
    //   bgColor: "bg-green-500/10"
    // },
    {
      path: "monitoring-task",
      label: "Tasks",
      icon: FaTasks,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      path: "employeeLiveStatus",
      label: "Live Status",
      icon: IoLocationSharp,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    {
      path: "employeeLeaveStatus",
      label: "Leave Requests",
      icon: GiExitDoor,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
    {
      path: "project-management",
      label: "Projects",
      icon: FaProjectDiagram,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      path: "client-management",
      label: "Clients",
      icon: IoPeople,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10"
    },
    {
      path: "expense-management",
      label: "Expenses",
      icon: GiMoneyStack,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      path: "leadinsensitivemanagement",
      label: "Leads",
      icon: GiProgression,
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      path: "courses",
      label: "Courses",
      icon: MdSchool,
      color: "text-lime-500",
      bgColor: "bg-lime-500/10"
    },
    {
      path: "attendance",
      label: "Attendance",
      icon: FaCalendarCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      path: "reports",
      label: "Analytics",
      icon: TbReportAnalytics,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10"
    },
    {
      path: "settings",
      label: "Settings",
      icon: MdSettings,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10"
    },
  ];

  // Protected route check
  const token = localStorage.getItem("adminToken");
  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  const isActive = (item) => {
    const path = location.pathname;
    if (item.path === ".") {
      return path === "/admin/dashboard" || path === "/admin/dashboard/";
    }
    return path.includes(item.path);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ----------  SIDEBAR ---------- */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 
          ${sidebarOpen ? "w-64" : "w-20"} 
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
          text-white shadow-2xl
          transition-all duration-300 flex flex-col transform`}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-700/50">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src="/logo.jpg"
                  alt="SS Group"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-gray-700 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">SS Group</h2>
                <p className="text-xs text-gray-400">Admin Portal</p>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="flex justify-center w-full">
              <img
                src="/logo.jpg"
                alt="SS Group"
                className="w-10 h-10 rounded-lg object-cover border border-gray-700"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 hidden lg:flex items-center justify-center"
          >
            <div className={`w-6 h-6 relative ${!sidebarOpen && 'rotate-180'}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.path}
                to={item.path === "." ? "/admin/dashboard" : `/admin/dashboard/${item.path}`}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 group relative
                  ${active
                    ? `${item.bgColor} ${item.color} shadow-lg border-l-4 ${item.color.replace('text', 'border')}`
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white border-l-4 border-transparent"
                  }`}
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setActiveMenu(item.label);
                }}
              >
                <div className={`p-2 rounded-lg ${active ? item.bgColor : 'bg-gray-800/50 group-hover:bg-gray-700/50'}`}>
                  <IconComponent className={`w-5 h-5 ${active ? item.color : 'text-gray-400 group-hover:text-white'}`} />
                </div>
                {sidebarOpen && (
                  <span className={`ml-3 font-medium transition-colors
                    ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                    {item.label}
                  </span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 whitespace-nowrap">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
                {active && !sidebarOpen && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/30">
          <div className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {userData.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{userData.name}</p>
                  <p className="text-xs text-gray-400 truncate">{userData.role}</p>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {userData.avatar}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 group
                ${sidebarOpen ? "text-gray-400 hover:text-red-400" : "text-gray-400"}`}
              title="Logout"
            >
              <PiSignOut className="w-5 h-5" />
              {!sidebarOpen && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 whitespace-nowrap">
                  Logout
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ----------  MAIN CONTENT ---------- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between p-4 lg:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {activeMenu}
                  </span>
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Manage your {activeMenu.toLowerCase()} with ease
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 lg:space-x-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-48 lg:w-64 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
                <PiBell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <span className="text-xs text-blue-600">3 new</span>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <PiBell className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">New notification</p>
                          <p className="text-xs text-gray-500">Just now</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </button>

              {/* Quick Actions */}
              <div className="hidden lg:flex items-center space-x-2">
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200">
                  Quick Action
                </button>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-3 p-1 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-800">{userData.name}</p>
                    <p className="text-xs text-gray-500">{userData.role}</p>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                      {userData.avatar}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {userData.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{userData.name}</p>
                        <p className="text-sm text-gray-500">{userData.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <PiUser className="w-4 h-4" />
                      <span>My Profile</span>
                    </a>
                    <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <PiGear className="w-4 h-4" />
                      <span>Account Settings</span>
                    </a>
                    <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <PiChartLine className="w-4 h-4" />
                      <span>Activity Log</span>
                    </a>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 w-full"
                    >
                      <PiSignOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50/50 via-white to-blue-50/50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* REMOVED THE STATS SECTION HERE */}

            {/* Page Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="student-management" element={<StudentManagement />} />
                <Route path="employees" element={<EmployeeManagement />} />
                <Route path="monitoring-task" element={<TaskAdmin />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="attendance" element={<AttendanceManagement />} />
                <Route path="project-management" element={<ProjectManagement />} />
                <Route path="client-management" element={<ClientManagement />} />
                <Route path="expense-management" element={<ExpenseManagement />} />
                <Route path="employeeLiveStatus" element={<EmployeeLiveStatus />} />
                <Route path="employeeLeaveStatus" element={<AdminLeaveDashboard />} />
                <Route path="leadinsensitivemanagement" element={<LeadInsensitiveManagement />} />
                <Route path="reports" element={
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics Dashboard</h2>
                    <p className="text-gray-600">Advanced analytics and reports coming soon...</p>
                  </div>
                } />
                <Route path="settings" element={
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">System Settings</h2>
                    <p className="text-gray-600">Configure your system settings here...</p>
                  </div>
                } />
                <Route path="*" element={<Navigate to="." replace />} />
              </Routes>
            </div>

            {/* Footer */}
            <footer className="mt-8 text-center text-sm text-gray-500 py-4">
              <p>© {new Date().getFullYear()} SS Group Admin Portal. All rights reserved.</p>
              <p className="mt-1">v2.0.0 • Last updated: {new Date().toLocaleDateString()}</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;