import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

const api = axios.create({
  baseURL: "https://ssinternsbackend-ltfn.onrender.com/api",
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
      toast.error("Session expired!");
      setTimeout(() => (window.location.href = "/admin"), 1500);
    }
    return Promise.reject(err);
  }
);

// Icons
const ProjectIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const EditIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CalendarIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TaskIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const PriorityIcon = ({ priority, className = "w-4 h-4" }) => {
  const colors = {
    Urgent: "text-red-600",
    High: "text-orange-500",
    Medium: "text-yellow-500",
    Low: "text-green-500"
  };

  return (
    <svg className={`${className} ${colors[priority] || 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );
};

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client: "",
    startDate: "",
    endDate: "",
    budget: "",
    status: "Planning",
    priority: "Medium",
    teamMembers: [],
    progress: 0,
    tasksCompleted: 0,
    totalTasks: 0,
  });

  // Load all data
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "/admin";
      return;
    }

    const loadData = async () => {
      try {
        const [projRes, clientRes, empRes] = await Promise.all([
          api.get("/projects"),
          api.get("/clients"),
          api.get("/employee/get/employee"),
        ]);

        setProjects(projRes.data.projects || []);
        setClients(clientRes.data.clients || []);
        setEmployees(empRes.data.employees || []);
      } catch (err) {
        console.error("Load data error:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget),
        progress: Number(formData.progress),
        tasksCompleted: Number(formData.tasksCompleted),
        totalTasks: Number(formData.totalTasks),
      };

      if (isEditOpen && editingProject) {
        const res = await api.put(`/projects/${editingProject._id}`, payload);
        setProjects((prev) =>
          prev.map((p) => (p._id === res.data.project._id ? res.data.project : p))
        );
        toast.success("Project updated!");
      } else {
        const res = await api.post("/projects", payload);
        setProjects((prev) => [...prev, res.data.project]);
        toast.success("Project created!");
      }

      setIsAddOpen(false);
      setIsEditOpen(false);
      setFormData({
        name: "", description: "", client: "", startDate: "", endDate: "",
        budget: "", status: "Planning", priority: "Medium", teamMembers: [],
        progress: 0, tasksCompleted: 0, totalTasks: 0
      });
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success("Project deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Delete failed");
    }
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      client: project.client?._id || "",
      startDate: project.startDate?.slice(0, 10) || "",
      endDate: project.endDate?.slice(0, 10) || "",
      budget: project.budget,
      status: project.status,
      priority: project.priority || "Medium",
      teamMembers: project.teamMembers?.map((m) => m._id || m) || [],
      progress: project.progress || 0,
      tasksCompleted: project.tasksCompleted || 0,
      totalTasks: project.totalTasks || 0,
    });
    setIsEditOpen(true);
  };

  const stats = projects.reduce(
    (acc, p) => {
      acc.total++;
      if (p.status === "In Progress") acc.inProgress++;
      if (p.status === "Completed") acc.completed++;
      if (p.status === "On Hold") acc.onHold++;
      acc.totalBudget += Number(p.budget || 0);
      acc.totalTasks += Number(p.totalTasks || 0);
      acc.completedTasks += Number(p.tasksCompleted || 0);
      return acc;
    },
    { total: 0, inProgress: 0, completed: 0, onHold: 0, totalBudget: 0, totalTasks: 0, completedTasks: 0 }
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent": return "bg-red-100 text-red-800 border border-red-200";
      case "High": return "bg-orange-100 text-orange-800 border border-orange-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Low": return "bg-green-100 text-green-800 border border-green-200";
      default: return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border border-green-200";
      case "In Progress": return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Planning": return "bg-purple-100 text-purple-800 border border-purple-200";
      case "On Hold": return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Cancelled": return "bg-red-100 text-red-800 border border-red-200";
      default: return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const calculateDaysLeft = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDaysLeftColor = (days) => {
    if (days <= 0) return "text-red-600 font-semibold";
    if (days <= 7) return "text-orange-500";
    return "text-green-600";
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Project Management</h1>
                <p className="text-gray-600 mt-2">Manage all projects, assign teams, and track progress</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Total Projects</div>
              <div className="text-xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 border border-green-200">
              <div className="text-xs text-gray-500 mb-1">In Progress</div>
              <div className="text-xl font-bold text-green-600">{stats.inProgress}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-200">
              <div className="text-xs text-gray-500 mb-1">Completed</div>
              <div className="text-xl font-bold text-blue-600">{stats.completed}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 border border-yellow-200">
              <div className="text-xs text-gray-500 mb-1">On Hold</div>
              <div className="text-xl font-bold text-yellow-600">{stats.onHold}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 border border-purple-200">
              <div className="text-xs text-gray-500 mb-1">Total Budget</div>
              <div className="text-xl font-bold text-purple-600">₹{stats.totalBudget.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 border border-indigo-200 col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Task Completion</div>
                  <div className="text-xl font-bold text-indigo-600">
                    {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Tasks</div>
                  <div className="font-medium text-sm">{stats.completedTasks}/{stats.totalTasks}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Button and Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                All Projects
              </button>
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Active
              </button>
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Completed
              </button>
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                On Hold
              </button>
            </div>
            <button
              onClick={() => {
                setFormData({
                  name: "", description: "", client: "", startDate: "", endDate: "",
                  budget: "", status: "Planning", priority: "Medium", teamMembers: [],
                  progress: 0, tasksCompleted: 0, totalTasks: 0
                });
                setIsAddOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
            >
              <ProjectIcon className="w-4 h-4" /> New Project
            </button>
          </div>

          {/* Compact Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-3 border-indigo-600 rounded-full border-t-transparent mx-auto"></div>
                <p className="mt-3 text-gray-500 text-sm">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-3">No projects found</div>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                      <th className="px-4 py-3">Project Name</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Timeline</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">Tasks</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map((p) => {
                      const daysLeft = calculateDaysLeft(p.endDate);
                      const progressWidth = Math.min(100, Math.max(0, p.progress || 0));

                      return (
                        <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                          {/* Project Name */}
                          <td className="px-4 py-3">
                            <div className="min-w-[180px]">
                              <div className="font-semibold text-gray-800 text-sm">{p.name}</div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <UsersIcon className="w-3 h-3" />
                                {p.teamMembers?.length || 0} team members
                              </div>
                            </div>
                          </td>

                          {/* Client */}
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700 truncate max-w-[120px]" title={p.client?.name || "N/A"}>
                              {p.client?.name || "N/A"}
                            </div>
                          </td>

                          {/* Timeline */}
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <div className="flex items-center gap-1 text-gray-700">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              <div className={`text-xs mt-1 ${getDaysLeftColor(daysLeft)}`}>
                                {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)} days overdue`}
                              </div>
                            </div>
                          </td>

                          {/* Progress */}
                          <td className="px-4 py-3">
                            <div className="w-24">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${progressWidth}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1 text-right">{p.progress || 0}%</div>
                            </div>
                          </td>

                          {/* Tasks */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <TaskIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">
                                {p.tasksCompleted || 0}/{p.totalTasks || 0}
                              </span>
                              {p.totalTasks > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({Math.round(((p.tasksCompleted || 0) / (p.totalTasks || 1)) * 100)}%)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Budget */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-green-600 text-sm">₹{Number(p.budget || 0).toLocaleString()}</div>
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <PriorityIcon priority={p.priority} className="w-3 h-3" />
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(p.priority)}`}>
                                {p.priority || "Medium"}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(p.status)}`}>
                              {p.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit Project"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDelete(p._id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Project"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Project Count */}
          {projects.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
            </div>
          )}

          {/* ADD / EDIT MODAL */}
          {(isAddOpen || isEditOpen) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {isEditOpen ? "Edit Project" : "Add New Project"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {isEditOpen ? "Update project details" : "Fill in project information"}
                    </p>
                  </div>
                  <button
                    onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Project Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="Enter project name"
                      />
                    </div>

                    {/* Client */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      >
                        <option value="">Select Client</option>
                        {clients.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="Enter budget"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      >
                        {["Planning", "In Progress", "On Hold", "Completed", "Cancelled"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        min={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      >
                        {["Low", "Medium", "High", "Urgent"].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Progress */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">0%</span>
                        <span className="text-sm font-medium">{formData.progress}%</span>
                        <span className="text-xs text-gray-500">100%</span>
                      </div>
                    </div>

                    {/* Total Tasks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Tasks</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.totalTasks}
                        onChange={(e) => setFormData({ ...formData, totalTasks: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="Total tasks"
                      />
                    </div>

                    {/* Tasks Completed */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tasks Completed</label>
                      <input
                        type="number"
                        min="0"
                        max={formData.totalTasks}
                        value={formData.tasksCompleted}
                        onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="Completed tasks"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      placeholder="Project description..."
                    />
                  </div>

                  {/* TEAM MEMBERS */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" /> Assign Team Members
                      </label>
                      <span className="text-sm text-gray-500">
                        {formData.teamMembers.length} selected
                      </span>
                    </div>
                    <div className="border border-gray-300 rounded-xl p-4 bg-gray-50">
                      {employees.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No employees available</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {employees.map((emp) => (
                            <label
                              key={emp._id}
                              className={`flex items-center space-x-3 p-3 bg-white rounded-lg border transition-all cursor-pointer ${formData.teamMembers.includes(emp._id)
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200 hover:border-indigo-300"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.teamMembers.includes(emp._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      teamMembers: [...prev.teamMembers, emp._id],
                                    }));
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      teamMembers: prev.teamMembers.filter((id) => id !== emp._id),
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {emp.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{emp.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{emp.position || "Employee"}</div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                      className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      {isEditOpen ? "Update Project" : "Create Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectManagement;