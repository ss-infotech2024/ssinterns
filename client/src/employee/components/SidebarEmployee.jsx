import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  RiDashboardFill,
  RiTaskLine,
  RiCalendarScheduleLine,
  RiLogoutBoxLine,
  RiUser3Line,
} from "react-icons/ri";
import { FaTasks } from "react-icons/fa";

const SidebarEmployee = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/employee/dashboard", label: "Dashboard", icon: <RiDashboardFill /> },
    { path: "/employee/dashboard/task", label: "Tasks", icon: <RiTaskLine /> },
    { path: "/employee/dashboard/attendance", label: "Attendance", icon: <RiCalendarScheduleLine /> },
    { path: "/employee/dashboard/profile", label: "Profile", icon: <RiUser3Line /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("currentEmployee");
    window.location.href = "/employee/login";
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-purple-700 to-purple-900 text-white flex flex-col shadow-xl fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-purple-800">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <FaTasks className="text-yellow-300" />
          <span>EmpTrack</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-purple-800 shadow-md font-semibold"
                  : "hover:bg-purple-800"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-purple-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-purple-800 transition-all w-full"
        >
          <RiLogoutBoxLine className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarEmployee;