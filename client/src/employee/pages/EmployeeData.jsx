// src/pages/employee/DashboardEmployee.jsx
import React, { useState, useEffect } from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  Clock, CheckCircle, Target, Calendar, User, RefreshCw, AlertCircle, BarChart3, FileText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const IST = "Asia/Kolkata";
const API_BASE_URL = "https://ssinternsbackend.onrender.com";

const EmployeeData = () => {
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("employeeToken");

  useEffect(() => {
    if (!token) navigate("/employee/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatInTimeZone(new Date(), IST, "h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("employeeData");
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      try {
        const [attRes, taskRes, profileRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/attendance/history`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_BASE_URL}/api/employee/task`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_BASE_URL}/api/employee/profile`, { headers }).catch(() => ({ ok: false })),
        ]);

        if (profileRes.ok) {
          const res = await profileRes.json();
          const emp = res.data || res.employee || {};
          setProfile(emp);
          localStorage.setItem("employeeData", JSON.stringify(emp));
        }
        if (attRes.ok) {
          const res = await attRes.json();
          setAttendance(res.data || res.attendance || []);
        }
        if (taskRes.ok) {
          const res = await taskRes.json();
          setTasks(res.data || res.tasks || []);
        }
      } catch (err) {
        setError("Offline mode: Showing cached data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const today = formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
  const todayRecords = attendance.filter(r => {
    try {
      return formatInTimeZone(new Date(r.date || r.createdAt), IST, "yyyy-MM-dd") === today;
    } catch { return false; }
  });

  const totalMinsToday = todayRecords.reduce((acc, r) => {
    if (r.clockIn && r.clockOut) {
      return acc + Math.floor((new Date(r.clockOut) - new Date(r.clockIn)) / 60000);
    }
    return acc;
  }, 0);
  const hoursToday = Math.floor(totalMinsToday / 60);
  const minsToday = totalMinsToday % 60;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed" || t.progress === 100).length;
  const avgProgress = totalTasks > 0 ? Math.round(tasks.reduce((a, t) => a + (t.progress || 0), 0) / totalTasks) : 0;

  const name = profile.name || "Employee";
  const email = profile.email || "N/A";
  const employeeId = profile.employeeId || profile._id || "N/A";
  const position = profile.position || "Employee";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-lg text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Employee Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {name.split(" ")[0]}!</p>
        </div>

        {/* Offline Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-500">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
              <p className="text-gray-600">{position}</p>
              <p className="text-sm text-gray-500 mt-1">ID: {employeeId} • {email}</p>
            </div>
            <div className="bg-blue-50 px-6 py-4 rounded-xl text-center">
              <p className="text-xs text-gray-600">Current Time (IST)</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{currentTime}</p>
              <p className="text-sm text-gray-600 mt-1">
                {formatInTimeZone(new Date(), IST, "EEEE, dd MMM yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Hours Today", value: `${hoursToday}h ${minsToday}m`, icon: Clock, color: "blue" },
            { label: "Tasks Completed", value: `${completedTasks}/${totalTasks}`, icon: CheckCircle, color: "green" },
            { label: "Task Progress", value: `${avgProgress}%`, icon: Target, color: "purple" },
            { label: "Attendance Today", value: todayRecords.length > 0 ? "Present" : "Not Clocked", icon: Calendar, color: "yellow" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-5 border-l-4" style={{
              borderLeftColor: i === 0 ? "#3B82F6" : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#F59E0B"
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${i === 0 ? 'bg-blue-100' : i === 1 ? 'bg-green-100' : i === 2 ? 'bg-purple-100' : 'bg-yellow-100'}`}>
                  <stat.icon className={`w-6 h-6 ${i === 0 ? 'text-blue-600' : i === 1 ? 'text-green-600' : i === 2 ? 'text-purple-600' : 'text-yellow-600'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Attendance & Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Attendance */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Today's Attendance
              </h3>
            </div>
            <div className="p-6">
              {todayRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No clock-in recorded today</p>
                  <Link to="/employee/dashboard/attendance" className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Clock In Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayRecords.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="font-medium text-gray-800">
                          {r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          → {r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {r.clockOut ? `${Math.floor((new Date(r.clockOut) - new Date(r.clockIn)) / 60000)} mins` : "Currently clocked in"}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.clockOut ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {r.clockOut ? "Completed" : "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Task Progress */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Task Progress
              </h3>
            </div>
            <div className="p-6">
              {totalTasks === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No tasks assigned</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Overall Progress</span>
                      <span className="font-bold text-purple-600">{avgProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all" style={{ width: `${avgProgress}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-2xl font-bold text-yellow-600">{totalTasks - completedTasks}</p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>
                </>
              )}
              <Link to="/employee/dashboard/task" className="mt-6 block text-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                View All Tasks
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to: "/employee/dashboard/attendance", icon: Clock, label: "Attendance", color: "blue" },
              { to: "/employee/dashboard/task", icon: Target, label: "My Tasks", color: "purple" },
              { to: "/employee/dashboard/leaverequest", icon: FileText, label: "Leave Request", color: "yellow" },
              { to: "/employee/dashboard/settings", icon: User, label: "Profile", color: "green" },
            ].map((btn, i) => (
              <Link
                key={i}
                to={btn.to}
                className={`p-6 rounded-xl text-white font-medium text-center transition transform hover:scale-105 hover:shadow-lg ${btn.color === "blue" ? "bg-blue-600 hover:bg-blue-700" :
                    btn.color === "purple" ? "bg-purple-600 hover:bg-purple-700" :
                      btn.color === "yellow" ? "bg-yellow-600 hover:bg-yellow-700" :
                        "bg-green-600 hover:bg-green-700"
                  }`}
              >
                <btn.icon className="w-10 h-10 mx-auto mb-2" />
                {btn.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeData;