import React, { useState, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import ClientManagement from "../pages/ClientManagement";
import { PiSignOut, PiCaretDown, PiList, PiSidebarSimple, PiX } from "react-icons/pi";
import { IoLocationSharp, IoPeople } from "react-icons/io5";
import { GiExitDoor, GiMoneyStack, GiProgression } from "react-icons/gi";
import { MdDashboard, MdSchool, MdSettings } from "react-icons/md";
import { FaUsers, FaProjectDiagram, FaCalendarCheck, FaTasks } from "react-icons/fa";
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

const BASE_PATH = "/admin/dashboard";
const COLLAPSE_KEY = "adminSidebarCollapsed";

const menuItems = [
  { path: "", label: "Dashboard", icon: MdDashboard },
  { path: "employees", label: "Interns", icon: FaUsers },
  // { path: "student-management", label: "Students", icon: GiGraduateCap },
  { path: "monitoring-task", label: "Tasks", icon: FaTasks },
  { path: "employeeLiveStatus", label: "Live Status", icon: IoLocationSharp },
  { path: "employeeLeaveStatus", label: "Leave Requests", icon: GiExitDoor },
  { path: "project-management", label: "Projects", icon: FaProjectDiagram },
  { path: "client-management", label: "Clients", icon: IoPeople },
  { path: "expense-management", label: "Expenses", icon: GiMoneyStack },
  { path: "leadinsensitivemanagement", label: "Leads", icon: GiProgression },
  { path: "courses", label: "Courses", icon: MdSchool },
  { path: "attendance", label: "Attendance", icon: FaCalendarCheck },
  { path: "reports", label: "Analytics", icon: TbReportAnalytics },
  { path: "settings", label: "Settings", icon: MdSettings },
];

// Routes that exist but are not in the sidebar still deserve a proper title
const extraTitles = { "student-management": "Students" };

const getPageTitle = (pathname) => {
  const segment = pathname.replace(BASE_PATH, "").split("/").filter(Boolean)[0] || "";
  if (!segment) return "Dashboard";
  return menuItems.find((item) => item.path === segment)?.label || extraTitles[segment] || "Dashboard";
};

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

/* ----------  PLACEHOLDER PAGE (existing "coming soon" routes)  ---------- */
const PlaceholderPage = ({ icon: Icon, title, description }) => (
  <div className="admin-page">
    <div>
      <h1 className="admin-page-title">{title}</h1>
      <p className="admin-page-subtitle">{description}</p>
    </div>
    <div className="admin-card admin-empty">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-700">Coming soon</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">This section is not available yet.</p>
    </div>
  </div>
);

/* ----------  MAIN DASHBOARD LAYOUT  ---------- */
const DashboardAdmin = () => {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const userData = { name: "Admin User", role: "Administrator", avatar: "A" };
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);

  // Close the mobile drawer and the profile menu after navigating
  useEffect(() => {
    setMobileSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // storage unavailable — collapse state just won't persist
    }
  }, [collapsed]);

  // Escape closes overlays; clicking outside closes the profile menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileSidebarOpen(false);
        setProfileOpen(false);
      }
    };
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.title = `${pageTitle} · SS Group Admin`;
  }, [pageTitle]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userRole");
    navigate("/admin");
  };

  // Protected route check
  const token = localStorage.getItem("adminToken");
  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  // On mobile the drawer is always shown expanded
  const renderSidebar = (isCollapsed) => (
    <>
      {/* Brand */}
      <div className={`flex h-14 shrink-0 items-center border-b border-white/10 ${isCollapsed ? "justify-center px-2" : "gap-2.5 px-4"}`}>
        <img
          src="/logo.jpg"
          alt="SS Group"
          className="h-8 w-8 shrink-0 rounded-md object-cover ring-1 ring-white/20"
        />
        {!isCollapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">SS Group</p>
            <p className="truncate text-[11px] text-violet-200/70">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3" aria-label="Admin navigation">
        {!isCollapsed && (
          <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-violet-200/50">Menu</p>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path ? `${BASE_PATH}/${item.path}` : BASE_PATH}
              end={!item.path}
              title={isCollapsed ? item.label : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group flex items-center rounded-md text-sm transition-colors ${
                  isCollapsed ? "h-10 justify-center" : "gap-3 px-2.5 py-2"
                } ${
                  isActive
                    ? "bg-white font-medium text-violet-900 shadow-sm"
                    : "text-violet-100/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-violet-700" : "text-violet-200/70 group-hover:text-white"}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="shrink-0 border-t border-white/10 p-2.5">
        {!isCollapsed && (
          <div className="mb-1 flex items-center gap-2.5 px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-semibold text-white">
              {userData.avatar}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-white">{userData.name}</p>
              <p className="truncate text-xs text-violet-200/60">{userData.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          aria-label="Logout"
          className={`flex w-full items-center rounded-md text-sm text-violet-100/80 transition-colors hover:bg-red-500/15 hover:text-red-200 ${
            isCollapsed ? "h-10 justify-center" : "gap-3 px-2.5 py-2"
          }`}
        >
          <PiSignOut className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ----------  DESKTOP SIDEBAR ---------- */}
      <aside
        className={`hidden shrink-0 flex-col bg-violet-950 transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        {renderSidebar(collapsed)}
      </aside>

      {/* ----------  MOBILE DRAWER ---------- */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden ${
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col bg-violet-950 shadow-xl transition-transform duration-200 lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileSidebarOpen}
      >
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute right-2 top-3 rounded-md p-1.5 text-violet-200 hover:bg-white/10 hover:text-white"
          aria-label="Close menu"
        >
          <PiX className="h-5 w-5" />
        </button>
        {renderSidebar(false)}
      </aside>

      {/* ----------  MAIN CONTENT ---------- */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <PiList className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PiSidebarSimple className="h-5 w-5" />
            </button>
            <div className="hidden h-5 w-px bg-slate-200 lg:block" />
            <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
              <span className="hidden text-slate-400 sm:inline">Admin</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="truncate font-medium text-slate-800">{pageTitle}</span>
            </nav>
          </div>

          {/* Profile menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 hover:bg-slate-100"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                {userData.avatar}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-medium text-slate-800">{userData.name}</p>
                <p className="text-xs text-slate-500">{userData.role}</p>
              </div>
              <PiCaretDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              >
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{userData.name}</p>
                  <p className="text-xs text-slate-500">{userData.role}</p>
                </div>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <PiSignOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-5 lg:p-6">
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
                <PlaceholderPage
                  icon={TbReportAnalytics}
                  title="Analytics Dashboard"
                  description="Advanced analytics and reports coming soon..."
                />
              } />
              <Route path="settings" element={
                <PlaceholderPage
                  icon={MdSettings}
                  title="System Settings"
                  description="Configure your system settings here..."
                />
              } />
              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>

            {/* Footer */}
            <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} SS Group Admin Portal · v2.0.0
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;
