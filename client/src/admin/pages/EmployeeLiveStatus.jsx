import React, { useState, useEffect } from "react";

// === SVG ICONS ===
const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LiveStatusIcon = ({ isActive, className = "w-4 h-4" }) => (
  <div className={`relative ${className}`}>
    <div className={`absolute inset-0 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'} opacity-30`}></div>
    {isActive && <div className="absolute inset-0 rounded-full bg-green-400 animate-ping"></div>}
    <div className={`relative w-full h-full rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
  </div>
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

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusSort, setStatusSort] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState(null);

  const token = localStorage.getItem("adminToken");
  const API_URL = "https://ssinternsbackend.onrender.com/api";

  const departments = [
    { id: 1, name: "Sales" },
    { id: 2, name: "Marketing" },
    { id: 3, name: "Development" },
    { id: 4, name: "HR" },
    { id: 5, name: "Finance" },
    { id: 6, name: "Operations" }
  ];

  const statusSortOptions = [
    { value: "all", label: "All Status" },
    { value: "online", label: "Online Only" },
    { value: "offline", label: "Offline Only" },
    { value: "online-first", label: "Online First" },
    { value: "offline-first", label: "Offline First" }
  ];

  // === LIVE STATUS CHECK ===
  const checkLiveStatus = async (employeeId) => {
    if (!employeeId) return false;
    try {
      const res = await fetch(`${API_URL}/status/${employeeId}/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.isActive === true || data.isClockedIn === true;
      }
    } catch (err) { }
    try {
      const res = await fetch(`${API_URL}/attendance/${employeeId}/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.isClockedIn === true || (data.attendanceRecord?.clockIn && !data.attendanceRecord?.clockOut);
      }
    } catch (err) { }
    return false;
  };

  const fetchAllLiveStatus = async (list) => {
    const results = await Promise.all(
      list.map(emp => checkLiveStatus(emp._id).then(status => ({ id: emp._id, isOnline: status })))
    );
    return Object.fromEntries(results.map(r => [r.id, r.isOnline]));
  };

  // === FETCH EMPLOYEES WITH LIVE STATUS ===
  const fetchEmployees = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/employee/get/employee`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.employees || data.data || [];

      const statusMap = await fetchAllLiveStatus(list);
      const final = list.map(emp => ({
        ...emp,
        isOnline: statusMap[emp._id] || false
      }));

      setEmployees(final);
    } catch (err) {
      console.error("Fetch employees error:", err);
      alert("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  // === MODAL STATES ===
  const [newEmployee, setNewEmployee] = useState({
    name: "", email: "", phone: "", department: "", position: "", joiningDate: "",
    loginId: "", password: ""
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    employeeId: "", employeeName: "", newPassword: "", confirmPassword: ""
  });

  // === HANDLERS ===
  const handleAdd = async (e) => {
    e.preventDefault();
    const required = ["name", "email", "department", "position", "joiningDate", "loginId", "password"];
    if (required.some(f => !newEmployee[f])) return alert("Please fill all required fields");
    if (newEmployee.password.length < 6) return alert("Password must be at least 6 characters");

    try {
      const res = await fetch(`${API_URL}/employee/create/employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newEmployee, department: +newEmployee.department })
      });
      if (res.ok) {
        setNewEmployeeCredentials({
          name: newEmployee.name,
          email: newEmployee.email,
          loginId: newEmployee.loginId,
          password: newEmployee.password
        });
        setIsCredentialsModalOpen(true);
        setIsAddModalOpen(false);
        fetchEmployees();
        setSuccess("Employee added successfully!");
        setNewEmployee({
          name: "", email: "", phone: "", department: "", position: "", joiningDate: "",
          loginId: "", password: ""
        });
      } else {
        alert("Failed to create employee");
      }
    } catch (err) {
      console.error("Add employee error:", err);
      alert("Error creating employee");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/employee/update/${selectedEmployee._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...selectedEmployee, department: +selectedEmployee.department })
      });
      if (res.ok) {
        fetchEmployees();
        setIsEditModalOpen(false);
        setSuccess("Employee updated successfully!");
      } else {
        alert("Failed to update employee");
      }
    } catch (err) {
      console.error("Edit employee error:", err);
      alert("Error updating employee");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) return alert("Passwords don't match");
    if (resetPasswordData.newPassword.length < 6) return alert("Password must be at least 6 characters");

    try {
      const res = await fetch(`${API_URL}/employee/${resetPasswordData.employeeId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: resetPasswordData.newPassword })
      });
      if (res.ok) {
        setNewEmployeeCredentials({
          name: resetPasswordData.employeeName,
          loginId: employees.find(e => e._id === resetPasswordData.employeeId)?.loginId,
          password: resetPasswordData.newPassword
        });
        setIsResetPasswordModalOpen(false);
        setIsCredentialsModalOpen(true);
        setSuccess("Password reset successfully!");
      } else {
        alert("Failed to reset password");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      alert("Error resetting password");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`${API_URL}/employee/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEmployees();
        setSuccess("Employee deleted successfully!");
      } else {
        alert("Failed to delete employee");
      }
    } catch (err) {
      console.error("Delete employee error:", err);
      alert("Error deleting employee");
    }
  };

  const copyCredentialsToClipboard = () => {
    const text = `Name: ${newEmployeeCredentials.name}\nEmail: ${newEmployeeCredentials.email}\nLogin ID: ${newEmployeeCredentials.loginId}\nPassword: ${newEmployeeCredentials.password}`;
    navigator.clipboard.writeText(text);
    alert("Credentials copied to clipboard!");
  };

  // === FILTERED & SORTED EMPLOYEES ===
  const filtered = employees
    .filter(emp => {
      const search = searchTerm.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(search) ||
        emp.email?.toLowerCase().includes(search) ||
        emp.position?.toLowerCase().includes(search)
      ) && (departmentFilter === "all" || emp.department === +departmentFilter);
    })
    .filter(emp => {
      switch (statusSort) {
        case "online":
          return emp.isOnline === true;
        case "offline":
          return emp.isOnline === false;
        case "all":
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (statusSort) {
        case "online-first":
          return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
        case "offline-first":
          return (a.isOnline ? 1 : 0) - (b.isOnline ? 1 : 0);
        default:
          return 0;
      }
    });

  const onlineCount = employees.filter(e => e.isOnline).length;

  useEffect(() => {
    if (success) setTimeout(() => setSuccess(""), 5000);
  }, [success]);

  if (!token) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">Redirecting...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Employee Management</h1>
        <p className="text-center text-gray-600 mb-6">Real-time Live Status Tracking</p>

        {success && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4 text-center">
            {success}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow text-center">
            <p className="text-gray-600">Total Employees</p>
            <p className="text-3xl font-bold">{employees.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow text-center">
            <p className="text-gray-600">Online Now</p>
            <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow text-center">
            <p className="text-gray-600">Offline</p>
            <p className="text-3xl font-bold text-red-600">{employees.length - onlineCount}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow text-center">
            <button
              onClick={fetchEmployees}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Controls and Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b flex flex-col md:flex-row justify-between gap-4">
            <h2 className="text-2xl font-bold">All Employees</h2>
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select
                value={statusSort}
                onChange={e => setStatusSort(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusSortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <UserIcon /> Add Employee
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading live status...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Department</th>
                    <th className="px-6 py-4 text-left">Position</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.length > 0 ? (
                    filtered.map(emp => (
                      <tr key={emp._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <LiveStatusIcon isActive={emp.isOnline} />
                            <span className={emp.isOnline ? "text-green-600 font-medium" : "text-red-600"}>
                              {emp.isOnline ? "Online" : "Offline"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{emp.name}</td>
                        <td className="px-6 py-4">{emp.email}</td>
                        <td className="px-6 py-4">
                          {departments.find(d => d.id === emp.department)?.name || "—"}
                        </td>
                        <td className="px-6 py-4">{emp.position}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => { setSelectedEmployee(emp); setIsViewModalOpen(true); }}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                              title="View Details"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => { setSelectedEmployee(emp); setIsEditModalOpen(true); }}
                              className="text-yellow-600 hover:bg-yellow-50 p-2 rounded transition-colors"
                              title="Edit"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => {
                                setResetPasswordData({
                                  employeeId: emp._id,
                                  employeeName: emp.name,
                                  newPassword: "",
                                  confirmPassword: ""
                                });
                                setIsResetPasswordModalOpen(true);
                              }}
                              className="text-green-600 hover:bg-green-50 p-2 rounded transition-colors"
                              title="Reset Password"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => handleDelete(emp._id)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                              title="Delete"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No employees found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ADD EMPLOYEE MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-2xl font-bold">Add New Employee</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={newEmployee.name}
                      onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter email"
                      value={newEmployee.email}
                      onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={newEmployee.phone}
                      onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <select
                      required
                      value={newEmployee.department}
                      onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter position"
                      value={newEmployee.position}
                      onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date *</label>
                    <input
                      type="date"
                      required
                      value={newEmployee.joiningDate}
                      onChange={e => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Login ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter login ID"
                      value={newEmployee.loginId}
                      onChange={e => setNewEmployee({ ...newEmployee, loginId: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password (min 6) *</label>
                    <input
                      type="text"
                      required
                      minLength="6"
                      placeholder="Enter password"
                      value={newEmployee.password}
                      onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW EMPLOYEE MODAL */}
        {isViewModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-2xl font-bold">Employee Details</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">
                    {selectedEmployee.name?.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{selectedEmployee.name}</h4>
                    <p className="text-gray-600">{selectedEmployee.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Department:</span>
                    <p>{departments.find(d => d.id === selectedEmployee.department)?.name || "—"}</p>
                  </div>
                  <div>
                    <span className="font-medium">Position:</span>
                    <p>{selectedEmployee.position}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{selectedEmployee.phone || "—"}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className={selectedEmployee.isOnline ? "text-green-600" : "text-red-600"}>
                      {selectedEmployee.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Joining Date:</span>
                    <p>{selectedEmployee.joiningDate || "—"}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-6 border-t">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT EMPLOYEE MODAL */}
        {isEditModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-2xl font-bold">Edit Employee</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={handleEdit} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={selectedEmployee.name}
                      onChange={e => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={selectedEmployee.email}
                      onChange={e => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={selectedEmployee.phone}
                      onChange={e => setSelectedEmployee({ ...selectedEmployee, phone: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={selectedEmployee.department}
                      onChange={e => setSelectedEmployee({ ...selectedEmployee, department: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <input
                      type="text"
                      required
                      value={selectedEmployee.position}
                      onChange={e => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                    <input
                      type="date"
                      value={selectedEmployee.joiningDate}
                      onChange={e => setSelectedEmployee({ ...selectedEmployee, joiningDate: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESET PASSWORD MODAL */}
        {isResetPasswordModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-2xl font-bold">Reset Password</h3>
                <button
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                  <p className="font-medium">{resetPasswordData.employeeName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
                  <input
                    type="text"
                    required
                    minLength="6"
                    placeholder="Enter new password"
                    value={resetPasswordData.newPassword}
                    onChange={e => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Confirm new password"
                    value={resetPasswordData.confirmPassword}
                    onChange={e => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsResetPasswordModalOpen(false)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREDENTIALS MODAL */}
        {isCredentialsModalOpen && newEmployeeCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-2xl font-bold">Employee Credentials</h3>
                <button
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Important:</strong> Save these credentials securely. They will not be shown again.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="mt-1">{newEmployeeCredentials.name}</p>
                  </div>
                  {newEmployeeCredentials.email && (
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p className="mt-1">{newEmployeeCredentials.email}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Login ID:</span>
                    <p className="mt-1">{newEmployeeCredentials.loginId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Password:</span>
                    <p className="mt-1 font-mono">{newEmployeeCredentials.password}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 p-6 border-t">
                <button
                  onClick={copyCredentialsToClipboard}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;