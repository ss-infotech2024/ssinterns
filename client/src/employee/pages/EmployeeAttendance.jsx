import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Calendar, LogOut, RefreshCw, CheckCircle } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(""); // "in" | "out" | ""

  const navigate = useNavigate();
  const token = localStorage.getItem("employeeToken");
  const employee = JSON.parse(localStorage.getItem("employeeData") || "{}");

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/employee/login", { replace: true });
    }
  }, [token, navigate]);

  const fetchAttendance = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("https://ssinternsbacknedv2.onrender.com/api/attendance/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to load");

      const records = Array.isArray(result.data) ? result.data : [];
      setAttendance(records);

      const today = new Date().toLocaleDateString("en-CA");
      const todayRec = records.find(
        (r) => new Date(r.date).toLocaleDateString("en-CA") === today
      );
      setTodayRecord(todayRec || null);
    } catch (err) {
      toast.error(err.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchAttendance();
  }, [fetchAttendance]);

  const handleClockIn = async () => {
    setClocking("in");

    try {
      // Get browser GPS
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      const res = await fetch("https://ssinternsbacknedv2.onrender.com/api/attendance/clock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          locationName: "Current Location",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Clock-in failed");

      toast.success("Clocked in successfully");
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || "GPS access denied");
    } finally {
      setClocking("");
    }
  };


  const handleClockOut = async () => {
    setClocking("out");
    try {
      const res = await fetch("https://ssinternsbacknedv2.onrender.com/api/attendance/clock-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Clock-out failed");
      toast.success("Clocked out successfully");
      fetchAttendance();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClocking("");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out");
    navigate("/employee/login");
  };

  const formatTime = (date) => (date ? format(new Date(date), "hh:mm a") : "—");
  const formatDate = (date) => format(new Date(date), "dd MMM yyyy");

  const canClockIn = !todayRecord?.clockIn;
  const canClockOut = todayRecord?.clockIn && !todayRecord?.clockOut;
  const isCompleted = todayRecord?.clockIn && todayRecord?.clockOut;

  if (!token) return null;

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        {/* <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{employee.name || "Employee"}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div> */}

        <div className="max-w-6xl mx-auto p-6 space-y-8">

          {/* Today's Status */}
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Today - {format(new Date(), "EEEE, dd MMMM yyyy")}
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <p className="text-sm text-gray-500">Clock In</p>
                <p className="text-2xl font-medium">{formatTime(todayRecord?.clockIn)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Clock Out</p>
                <p className="text-2xl font-medium">{formatTime(todayRecord?.clockOut)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hours Worked</p>
                <p className="text-2xl font-medium text-indigo-600">
                  {(todayRecord?.hoursWorked || 0).toFixed(1)} hrs
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              {canClockIn && (
                <button
                  onClick={handleClockIn}
                  disabled={clocking === "in"}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition flex items-center gap-3"
                >
                  <Clock className="w-5 h-5" />
                  {clocking === "in" ? "Clocking In..." : "Clock In"}
                </button>
              )}

              {canClockOut && (
                <button
                  onClick={handleClockOut}
                  disabled={clocking === "out"}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition flex items-center gap-3"
                >
                  <Clock className="w-5 h-5" />
                  {clocking === "out" ? "Clocking Out..." : "Clock Out"}
                </button>
              )}

              {isCompleted && (
                <div className="px-8 py-3 bg-green-600 text-white rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  Attendance Completed
                </div>
              )}
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-8 py-5 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Attendance History
              </h2>
              <button
                onClick={fetchAttendance}
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-16 text-center text-gray-500">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <p className="mt-4">Loading records...</p>
              </div>
            ) : attendance.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No attendance records yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-8 py-4 font-medium text-gray-700">Date</th>
                      <th className="text-left px-8 py-4 font-medium text-gray-700">Clock In</th>
                      <th className="text-left px-8 py-4 font-medium text-gray-700">Clock Out</th>
                      <th className="text-left px-8 py-4 font-medium text-gray-700">Hours</th>
                      <th className="text-left px-8 py-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.map((record, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="px-8 py-4 font-medium">{formatDate(record.date)}</td>
                        <td className="px-8 py-4">{formatTime(record.clockIn)}</td>
                        <td className="px-8 py-4">{formatTime(record.clockOut)}</td>
                        <td className="px-8 py-4 font-medium text-indigo-600">
                          {(record.hoursWorked || 0).toFixed(1)}h
                        </td>
                        <td className="px-8 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${record.status === "present"
                                ? "bg-green-100 text-green-800"
                                : record.status === "absent"
                                  ? "bg-red-100 text-red-800"
                                  : record.status === "late"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                          >
                            {record.status || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeAttendance;