import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  Plus, Search, Phone, Mail, CheckCircle, XCircle, Trash2,
  RefreshCw, Users, IndianRupee, AlertCircle, Clock   // Clock added here
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const API_URL = 'https://ssinternsbackend.onrender.com/api/lead';

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', leadType: '', courseName: '', companyName: '', jobRole: '', message: ''
  });

  const formRef = useRef(null);
  const employeeData = JSON.parse(localStorage.getItem('currentEmployee') || '{}');
  const token = localStorage.getItem('employeeToken');

  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  };

  const getToken = () => {
    if (!token) {
      showToast('Session expired. Redirecting to login...', 'error');
      setTimeout(() => window.location.href = '/employee/login', 1500);
      return null;
    }
    return token;
  };

  const fetchLeads = async () => {
    const authToken = getToken();
    if (!authToken) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/my-leads`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLeads();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const authToken = getToken();
    if (!authToken) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.leadType || !formData.message.trim()) {
      return showToast('Please fill all required fields', 'error');
    }

    if (formData.leadType === 'Course' && !formData.courseName.trim()) {
      return showToast('Course name is required', 'error');
    }
    if (formData.leadType === 'Hiring' && (!formData.companyName.trim() || !formData.jobRole.trim())) {
      return showToast('Company & Job Role required', 'error');
    }

    try {
      const payload = {
        ...formData,
        broughtBy: employeeData._id || localStorage.getItem('employeeId')
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to add lead');

      setLeads(prev => [result.data, ...prev]);
      setFormData({
        name: '', email: '', phone: '', leadType: '', courseName: '', companyName: '', jobRole: '', message: ''
      });
      showToast('Lead added successfully!');
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Update failed');

      setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
      showToast(`Lead marked as ${status}!`);
    } catch (err) {
      showToast('Update failed', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Delete this lead permanently?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Delete failed');

      setLeads(prev => prev.filter(l => l._id !== id));
      showToast('Lead deleted');
    } catch (err) {
      showToast('Delete failed', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const search = searchTerm.toLowerCase();
    return (
      (!search ||
        lead.name?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.phone?.includes(search)
      ) &&
      (statusFilter === 'all' || lead.status === statusFilter) &&
      (typeFilter === 'all' || lead.leadType === typeFilter)
    );
  });

  const totalEarned = leads
    .filter(l => l.status === 'Converted' && l.paymentStatus === 'Pay Done')
    .reduce((sum, l) => sum + (l.incentive || 0), 0);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-xl text-gray-600 mt-4">Please log in to continue</p>
          <button onClick={() => window.location.href = '/employee/login'} className="mt-6 bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 transition">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Lead Management</h1>
            <p className="text-gray-600 mt-2">Add leads • Track conversions • Earn incentives</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Total Leads", value: leads.length, icon: Users, color: "blue" },
              { label: "Pending", value: leads.filter(l => l.status === 'Pending').length, icon: Clock, color: "yellow" },
              { label: "Converted", value: leads.filter(l => l.status === 'Converted').length, icon: CheckCircle, color: "green" },
              { label: "Total Earned", value: `₹${totalEarned.toLocaleString('en-IN')}`, icon: IndianRupee, color: "purple" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 border-l-4" style={{
                borderLeftColor: i === 0 ? "#3B82F6" : i === 1 ? "#F59E0B" : i === 2 ? "#10B981" : "#8B5CF6"
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-full ${i === 0 ? 'bg-blue-100' : i === 1 ? 'bg-yellow-100' : i === 2 ? 'bg-green-100' : 'bg-purple-100'}`}>
                    <stat.icon className={`w-8 h-8 ${i === 0 ? 'text-blue-600' : i === 1 ? 'text-yellow-600' : i === 2 ? 'text-green-600' : 'text-purple-600'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rest of your component remains exactly the same */}
          {/* ... (Add Lead Form, Table, Floating Button, etc.) ... */}

          {/* I'll keep the rest unchanged — just replace the file with this one */}
          {/* Everything below is identical to the previous version you had */}

          {/* Add Lead Form */}
          <div ref={formRef} className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Plus className="w-8 h-8 text-purple-600" />
              Add New Lead
            </h2>
            <p className="text-gray-600 mb-6">Brought by: <strong>{employeeData.name || 'Loading...'}</strong></p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ... all your form fields ... */}
              <input type="text" placeholder="Full Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition" required />
              <input type="email" placeholder="Email Address *" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition" required />
              <div className="relative">
                <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Phone Number *" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+\-\s]/g, '') })} className="pl-12 p-4 w-full border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition" required />
              </div>
              <select value={formData.leadType} onChange={e => setFormData({ ...formData, leadType: e.target.value, courseName: '', companyName: '', jobRole: '' })} className="p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition" required>
                <option value="">Select Lead Type *</option>
                <option value="Course">Course Inquiry</option>
                <option value="Hiring">Hiring / Placement</option>
              </select>

              {formData.leadType === 'Course' && (
                <input type="text" placeholder="Course Name *" value={formData.courseName} onChange={e => setFormData({ ...formData, courseName: e.target.value })} className="p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition md:col-span-2" required />
              )}

              {formData.leadType === 'Hiring' && (
                <>
                  <input type="text" placeholder="Company Name *" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition" required />
                  <input type="text" placeholder="Job Role *" value={formData.jobRole} onChange={e => setFormData({ ...formData, jobRole: e.target.value })} className="p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition" required />
                </>
              )}

              <textarea placeholder="Message / Notes *" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} rows={4} className="p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition md:col-span-2 resize-none" required />

              <button type="submit" className="md:col-span-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg flex items-center justify-center gap-3">
                <Plus className="w-6 h-6" />
                Add Lead
              </button>
            </form>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">My Leads ({filteredLeads.length})</h2>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search name, email, phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 pr-4 py-3 w-full md:w-80 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition" />
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200">
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200">
                    <option value="all">All Types</option>
                    <option value="Course">Course</option>
                    <option value="Hiring">Hiring</option>
                  </select>
                  <button onClick={fetchLeads} className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition flex items-center gap-2">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center">
                <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                <Users className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-medium">No leads found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Lead</th>
                      <th className="px-6 py-4 text-left">Contact</th>
                      <th className="px-6 py-4 text-left">Type</th>
                      <th className="px-6 py-4 text-left">Details</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Incentive</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredLeads.map(lead => (
                      <tr key={lead._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {lead.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{lead.name}</div>
                              <div className="text-xs text-gray-500">{format(new Date(lead.createdAt), 'dd MMM yyyy')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" /> {lead.email}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 mt-1">
                            <Phone className="w-4 h-4" /> {lead.phone}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${lead.leadType === 'Course' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                            {lead.leadType}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-gray-700">
                          {lead.leadType === 'Course' ? lead.courseName : `${lead.companyName} - ${lead.jobRole}`}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold ${lead.status === 'Converted' ? 'bg-green-100 text-green-800' :
                              lead.status === 'Lost' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {lead.status === 'Converted' && <CheckCircle className="w-4 h-4" />}
                            {lead.status === 'Lost' && <XCircle className="w-4 h-4" />}
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {lead.status === 'Converted' ? (
                            <span className={`font-bold ${lead.paymentStatus === 'Pay Done' ? 'text-green-600' : 'text-orange-600'}`}>
                              ₹{lead.incentive || 0} {lead.paymentStatus === 'Pay Done' ? 'Paid' : 'Pending'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {lead.status === 'Pending' && (
                              <>
                                <button onClick={() => updateStatus(lead._id, 'Converted')} disabled={actionLoading === lead._id} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50" title="Mark Converted">
                                  <CheckCircle className="w-6 h-6" />
                                </button>
                                <button onClick={() => updateStatus(lead._id, 'Lost')} disabled={actionLoading === lead._id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50" title="Mark Lost">
                                  <XCircle className="w-6 h-6" />
                                </button>
                              </>
                            )}
                            <button onClick={() => deleteLead(lead._id)} disabled={actionLoading === lead._id} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50" title="Delete">
                              <Trash2 className="w-6 h-6" />
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

          {/* Floating Add Button */}
          <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 transition z-50">
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </div>
    </>
  );
};

export default LeadManagement;