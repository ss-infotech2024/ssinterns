import React, { useState, useEffect, useCallback } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import {
  CheckCircle, XCircle, Clock, Search, Users, Calendar, Trash2, AlertCircle, RefreshCw, UserCheck, UserX
} from 'lucide-react';

const API_BASE = 'https://ssinternsbacknedv2.onrender.com/api/leaves';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, 'dd MMM yyyy') : 'Invalid Date';
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, 'dd MMM yyyy, hh:mm a') : '—';
};

export default function AdminLeaveDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ totalLeaves: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Try multiple possible token locations
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('employeeToken');

  const showMessage = (msg, type = 'success') => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 5000);
  };

  // Enhanced fetch with better error handling
  const fetchData = useCallback(async () => {
    if (!token) {
      showMessage('No authentication token found', 'error');
      return;
    }

    setLoading(true);
    try {
      const [leavesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE}/stats/admin`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Handle leaves response
      if (!leavesRes.ok) {
        if (leavesRes.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        if (leavesRes.status === 404) {
          throw new Error('Leaves endpoint not found. Check API route.');
        }
        throw new Error(`Failed to load leaves: ${leavesRes.status} ${leavesRes.statusText}`);
      }

      const leavesData = await leavesRes.json();
      const processedLeaves = (leavesData.data || leavesData.leaves || leavesData || []).map(leave => ({
        ...leave,
        employeeName: leave.employeeName || leave.employee?.name || 'Unknown Employee',
        employeeId: leave.employeeId || leave.employee?.loginId || 'N/A',
        position: leave.position || leave.employee?.position || 'N/A',
        leaveType: leave.leaveType || 'Unknown',
        reason: leave.reason || 'No reason provided',
        status: (leave.status || 'pending').toLowerCase(),
      }));
      setLeaves(processedLeaves);

      // Handle stats response
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || statsData || {
          totalLeaves: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        });
      } else {
        console.warn('Stats endpoint failed, using default stats');
        setStats({
          totalLeaves: processedLeaves.length,
          pending: processedLeaves.filter(l => l.status === 'pending').length,
          approved: processedLeaves.filter(l => l.status === 'approved').length,
          rejected: processedLeaves.filter(l => l.status === 'rejected').length
        });
      }

    } catch (err) {
      console.error('Fetch error:', err);
      showMessage(err.message || 'Failed to load data', 'error');
      // Set empty state on error
      setLeaves([]);
      setStats({ totalLeaves: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update leave status
  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setLeaves(prev => prev.map(l => l._id === id ? { ...l, status } : l));
        // Update stats locally
        setStats(prev => {
          const newStats = { ...prev };
          const oldStatus = leaves.find(l => l._id === id)?.status;
          if (oldStatus && oldStatus !== status) {
            newStats[oldStatus] = Math.max(0, (newStats[oldStatus] || 0) - 1);
            newStats[status] = (newStats[status] || 0) + 1;
          }
          return newStats;
        });
        showMessage(`Leave ${status.toUpperCase()} successfully!`);
      } else {
        const errorText = await res.text();
        let errorMessage = `Update failed: ${res.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        showMessage(errorMessage, 'error');
      }
    } catch (err) {
      showMessage('Network error: ' + err.message, 'error');
    } finally {
      setActionLoading('');
    }
  };

  // Delete leave
  const deleteLeave = async (id) => {
    if (!window.confirm('Permanently delete this leave request?')) return;

    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const deletedLeave = leaves.find(l => l._id === id);
        setLeaves(prev => prev.filter(l => l._id !== id));
        // Update stats
        if (deletedLeave) {
          setStats(prev => ({
            ...prev,
            totalLeaves: Math.max(0, prev.totalLeaves - 1),
            [deletedLeave.status]: Math.max(0, (prev[deletedLeave.status] || 0) - 1)
          }));
        }
        showMessage('Leave deleted permanently');
      } else {
        const errorText = await res.text();
        showMessage(errorText || 'Delete failed', 'error');
      }
    } catch (err) {
      showMessage('Network error: ' + err.message, 'error');
    } finally {
      setActionLoading('');
    }
  };

  // Filter leaves based on search and status
  const filteredLeaves = leaves.filter(leave => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      leave.employeeName?.toLowerCase().includes(search) ||
      leave.employeeId?.toLowerCase().includes(search) ||
      leave.reason?.toLowerCase().includes(search) ||
      leave.leaveType?.toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // If no token, show access denied
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">Authentication required to access this page.</p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-600 mt-1">Approve, Reject or Delete leave requests</p>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">×</button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">×</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          {[
            { label: "Total Requests", value: stats.totalLeaves || 0, icon: Calendar, color: "blue" },
            { label: "Pending", value: stats.pending || 0, icon: Clock, color: "yellow" },
            { label: "Approved", value: stats.approved || 0, icon: CheckCircle, color: "green" },
            { label: "Rejected", value: stats.rejected || 0, icon: XCircle, color: "red" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-5 border-l-4" style={{
              borderLeftColor: i === 0 ? "#3B82F6" : i === 1 ? "#F59E0B" : i === 2 ? "#10B981" : "#EF4444"
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${i === 0 ? 'bg-blue-100' : i === 1 ? 'bg-yellow-100' : i === 2 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <stat.icon className={`w-6 h-6 ${i === 0 ? 'text-blue-600' : i === 1 ? 'text-yellow-600' : i === 2 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
          <div className="p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">All Leave Requests</h2>
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employee, ID, reason..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border rounded-md w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
              <p className="mt-4 text-gray-600">Loading leave requests...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Users className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {leaves.length === 0 ? 'No leave requests found' : 'No matching leave requests'}
              </p>
              {leaves.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">Try changing your search or filter</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">Leave Type</th>
                    <th className="px-4 py-3 text-left">Dates</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-center">Applied On</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredLeaves.map(leave => (
                    <tr key={leave._id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {leave.employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{leave.employeeName}</div>
                            <div className="text-xs text-gray-500">ID: {leave.employeeId} • {leave.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium">{leave.leaveType}</td>
                      <td className="px-4 py-4 text-sm">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </td>
                      <td className="px-4 py-4 text-gray-600 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-gray-500">
                        {formatDateTime(leave.appliedAt)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {leave.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                        {leave.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                            <CheckCircle className="w-3 h-3" /> APPROVED
                          </span>
                        )}
                        {leave.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {leave.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(leave._id, 'approved')}
                                disabled={actionLoading === leave._id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                title="Approve"
                              >
                                <UserCheck className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => updateStatus(leave._id, 'rejected')}
                                disabled={actionLoading === leave._id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                title="Reject"
                              >
                                <UserX className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteLeave(leave._id)}
                            disabled={actionLoading === leave._id}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
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
      </div>
    </div>
  );
}