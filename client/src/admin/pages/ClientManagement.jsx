import React, { useState, useEffect } from "react";

// === ALL SVG ICONS ===
const ClientIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const EmailIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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

const ChartIcon = ({ className = "w-8 h-8" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ClientManagement = () => {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-xl">Admin login required</p>
        </div>
      </div>
    );
  }

  const API_BASE = "https://ssinternsbacknedv2.onrender.com/api/clients";

  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, vip: 0, totalValue: 0, totalProjects: 0, avgProjects: 0 });
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newClient, setNewClient] = useState({
    name: "", email: "", phone: "", company: "", industry: "", status: "Active",
    value: "", projects: "", lastContact: "", notes: ""
  });

  const statuses = ["Active", "Inactive", "Prospect", "VIP"];
  const industries = ["Technology", "Healthcare", "Finance", "Education", "Retail", "E-commerce", "Manufacturing", "Real Estate", "Hospitality", "Consulting", "Media & Entertainment", "Logistics", "Government", "Non-Profit", "Other"];

  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search: searchTerm, status: statusFilter, industry: industryFilter });
      const res = await fetch(`${API_BASE}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "No data");

      const list = data.clients || [];
      const totalProjects = list.reduce((sum, c) => sum + (c.projects || 0), 0);
      const avg = list.length ? (totalProjects / list.length).toFixed(1) : 0;

      setClients(list);
      setStats({
        total: list.length,
        active: list.filter(c => c.status === "Active").length,
        vip: list.filter(c => c.status === "VIP").length,
        totalValue: list.reduce((sum, c) => sum + (c.value || 0), 0),
        totalProjects,
        avgProjects: avg
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchTerm, statusFilter, industryFilter]);

  // ADD CLIENT
  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newClient,
          value: parseInt(newClient.value) || 0,
          projects: parseInt(newClient.projects) || 0
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add");
      setClients(prev => [...prev, data.client]);
      setIsAddModalOpen(false);
      setNewClient({ name: "", email: "", phone: "", company: "", industry: "", status: "Active", value: "", projects: "", lastContact: "", notes: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  // EDIT CLIENT
  const handleEditClient = async (e) => {
    e.preventDefault();
    if (!selectedClient?._id) return;
    try {
      const res = await fetch(`${API_BASE}/${selectedClient._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          company: selectedClient.company,
          industry: selectedClient.industry,
          status: selectedClient.status,
          value: parseInt(selectedClient.value) || 0,
          projects: parseInt(selectedClient.projects) || 0,
          lastContact: selectedClient.lastContact,
          notes: selectedClient.notes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      setClients(prev => prev.map(c => c._id === selectedClient._id ? data.client : c));
      setIsEditModalOpen(false);
      setSelectedClient(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm("Delete this client permanently?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
      setClients(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      Active: "text-green-600 bg-green-50 border-green-200",
      VIP: "text-purple-600 bg-purple-50 border-purple-200",
      Prospect: "text-blue-600 bg-blue-50 border-blue-200",
      Inactive: "text-red-600 bg-red-50 border-red-200"
    };
    return map[status] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Not set";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header & Stats */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Client Management</h1>
          <p className="text-gray-600 text-lg">Manage all clients, projects & revenue</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {[
            { label: "Total Clients", value: stats.total, color: "blue" },
            { label: "Active", value: stats.active, color: "green" },
            { label: "VIP", value: stats.vip, color: "purple" },
            { label: "Total Value", value: `₹${stats.totalValue.toLocaleString()}`, color: "orange" },
            { label: "Total Projects", value: stats.totalProjects, color: "teal" },
            { label: "Avg Projects", value: stats.avgProjects, color: "pink" },
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 border-${stat.color}-500`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600 text-xs font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <ChartIcon className={`text-${stat.color}-600`} />
              </div>
            </div>
          ))}
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b flex flex-col lg:flex-row justify-between gap-4">
            <h2 className="text-2xl font-bold">All Clients</h2>
            <div className="flex flex-wrap gap-3">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-4 py-2 border rounded-lg" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
                <option value="all">All Status</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
                <option value="all">All Industries</option>
                {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
              <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition">
                <ClientIcon /> Add Client
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">Loading clients...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map(client => (
                    <tr key={client._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.industry}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{client.company}</td>
                      <td className="px-6 py-4 text-center font-semibold text-teal-600">{client.projects || 0}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">₹{client.value?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setSelectedClient(client); setIsViewModalOpen(true); }} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition" title="View">
                            <EyeIcon />
                          </button>
                          <button onClick={() => { setSelectedClient(client); setIsEditModalOpen(true); }} className="text-yellow-600 hover:bg-yellow-100 p-2 rounded-lg transition" title="Edit">
                            <EditIcon />
                          </button>
                          <button onClick={() => handleDeleteClient(client._id)} className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition" title="Delete">
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clients.length === 0 && <div className="text-center py-12 text-gray-500">No clients found</div>}
            </div>
          )}
        </div>
      </div>

      {/* ADD CLIENT MODAL - NOW FULLY WORKING WITH ALL FIELDS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3"><ClientIcon /> Add New Client</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input required type="text" placeholder="Full Name" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required type="email" placeholder="Email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required type="text" placeholder="Phone" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required type="text" placeholder="Company" value={newClient.company} onChange={e => setNewClient({ ...newClient, company: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

                <select value={newClient.industry} onChange={e => setNewClient({ ...newClient, industry: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Industry</option>
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>

                <select value={newClient.status} onChange={e => setNewClient({ ...newClient, status: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <input type="number" placeholder="Project Value (₹)" value={newClient.value} onChange={e => setNewClient({ ...newClient, value: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Total Projects" value={newClient.projects} onChange={e => setNewClient({ ...newClient, projects: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input type="date" value={newClient.lastContact} onChange={e => setNewClient({ ...newClient, lastContact: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div></div>
              </div>

              <textarea rows="4" placeholder="Notes (optional)" value={newClient.notes} onChange={e => setNewClient({ ...newClient, notes: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & View Modals already perfect — kept same as before */}
      {/* (Edit modal code remains unchanged - already working) */}
      {/* (View modal code remains unchanged - already working) */}

      {/* EDIT MODAL (same as before) */}
      {isEditModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3"><EditIcon /> Edit Client</h2>
              <button onClick={() => { setIsEditModalOpen(false); setSelectedClient(null); }}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleEditClient} className="space-y-5">
              {/* Same form as Add modal but with selectedClient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input required type="text" placeholder="Full Name" value={selectedClient.name || ""} onChange={e => setSelectedClient({ ...selectedClient, name: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <input required type="email" placeholder="Email" value={selectedClient.email || ""} onChange={e => setSelectedClient({ ...selectedClient, email: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <input required type="text" placeholder="Phone" value={selectedClient.phone || ""} onChange={e => setSelectedClient({ ...selectedClient, phone: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <input required type="text" placeholder="Company" value={selectedClient.company || ""} onChange={e => setSelectedClient({ ...selectedClient, company: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <select value={selectedClient.industry || ""} onChange={e => setSelectedClient({ ...selectedClient, industry: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  <option value="">Select Industry</option>
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
                <select value={selectedClient.status || "Active"} onChange={e => setSelectedClient({ ...selectedClient, status: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" placeholder="Project Value (₹)" value={selectedClient.value || ""} onChange={e => setSelectedClient({ ...selectedClient, value: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <input type="number" placeholder="Total Projects" value={selectedClient.projects || ""} onChange={e => setSelectedClient({ ...selectedClient, projects: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input type="date" value={selectedClient.lastContact?.split("T")[0] || ""} onChange={e => setSelectedClient({ ...selectedClient, lastContact: e.target.value })} className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <div></div>
              </div>
              <textarea rows="4" placeholder="Notes (optional)" value={selectedClient.notes || ""} onChange={e => setSelectedClient({ ...selectedClient, notes: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"></textarea>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedClient(null); }} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium">
                  Update Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL (same as before) */}
      {isViewModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-8 py-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">Client Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <CloseIcon />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {selectedClient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedClient.name}</h3>
                  <p className="text-xl text-gray-600">{selectedClient.company}</p>
                  <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedClient.status)}`}>
                    {selectedClient.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium flex items-center gap-2"><EmailIcon /> {selectedClient.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium flex items-center gap-2"><PhoneIcon /> {selectedClient.phone}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium">{selectedClient.industry}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Last Contact</p>
                  <p className="font-medium">{formatDate(selectedClient.lastContact)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Total Project Value</p>
                  <p className="text-2xl font-bold text-green-600">₹{selectedClient.value?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-teal-600">{selectedClient.projects || 0}</p>
                </div>
              </div>
              {selectedClient.notes && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-gray-800">{selectedClient.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => { setIsViewModalOpen(false); setIsEditModalOpen(true); }} className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  Edit Client
                </button>
                <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;