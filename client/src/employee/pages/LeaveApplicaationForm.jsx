import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Calendar, FileText, Clock, CheckCircle, XCircle, Trash2, AlertCircle, Send
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const API_BASE = 'https://ssinternsbackend.onrender.com/api/leaves';

export default function LeaveApplicationForm() {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('employeeToken') || localStorage.getItem('token');

  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  };

  const fetchMyLeaves = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/my-leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          showToast('Session expired. Please login again.', 'error');
          setTimeout(() => window.location.href = '/employee/login', 2000);
          return;
        }
        throw new Error('Failed to load');
      }
      const { data } = await res.json();
      setMyLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Failed to load leave history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyLeaves();
      const interval = setInterval(fetchMyLeaves, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return showToast('Not logged in', 'error');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Submission failed');
      }
      showToast('Leave request submitted successfully!');
      setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
      fetchMyLeaves();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leave request?')) return;
    try {
      const res = await fetch(`${API_BASE}/my/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Delete failed');
      }
      setMyLeaves(prev => prev.filter(l => l._id !== id));
      showToast('Leave request deleted');
    } catch (err) {
      showToast(err.message || 'Cannot delete this leave', 'error');
    }
  };

  const getStatusInfo = (status) => {
    const map = {
      pending: { label: 'Pending', icon: Clock, color: 'text-yellow-700 bg-yellow-100' },
      approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-700 bg-red-100' }
    };
    return map[status] || map.pending;
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="text-gray-600">Employee login required</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
            <p className="text-gray-600 mt-1">Submit and track your leave requests</p>
          </div>

          {/* Form */}
          <div className="bg-white p-6 border mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type *</label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  <option>Sick Leave</option>
                  <option>Annual Leave</option>
                  <option>Casual Leave</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={5}
                  required
                  placeholder="Explain your reason for leave..."
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-800 text-white py-4 font-medium hover:bg-gray-900 transition flex items-center justify-center gap-3"
              >
                {submitting ? 'Submitting...' : 'Submit Leave Request'}
                {!submitting && <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>

          {/* Leave History */}
          <div className="bg-white border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                My Leave Requests ({myLeaves.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Loading your leaves...</p>
              </div>
            ) : myLeaves.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-xl">No leave requests yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {myLeaves.map(leave => {
                  const status = getStatusInfo(leave.status);
                  const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <div key={leave._id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-lg font-semibold">{leave.leaveType} Leave</h3>
                            <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-medium ${status.color}`}>
                              <status.icon className="w-4 h-4" />
                              {status.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <strong>From:</strong> {format(new Date(leave.startDate), 'dd MMM yyyy')}
                            </div>
                            <div>
                              <strong>To:</strong> {format(new Date(leave.endDate), 'dd MMM yyyy')}
                            </div>
                            <div>
                              <strong>Duration:</strong> {days} day{days > 1 ? 's' : ''}
                            </div>
                          </div>

                          <div className="text-sm">
                            <p className="font-medium text-gray-700 mb-1">Reason:</p>
                            <p className="text-gray-600">{leave.reason}</p>
                          </div>

                          <p className="text-xs text-gray-500 mt-3">
                            Applied on: {format(new Date(leave.createdAt || leave.appliedAt), 'dd MMM yyyy, hh:mm a')}
                          </p>
                          {leave.reviewedAt && (
                            <p className="text-xs text-gray-500">
                              Reviewed on: {format(new Date(leave.reviewedAt), 'dd MMM yyyy, hh:mm a')}
                            </p>
                          )}
                        </div>

                        {leave.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(leave._id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                            title="Delete pending request"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}