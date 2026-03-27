import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle, Clock, IndianRupee, XCircle, Download, RefreshCw, Search,
  AlertCircle, FileText, User, Calendar, Trash2, X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const API_URL = 'https://ssinternsbackend.onrender.com/api/expenses';

export default function AdminExpenseDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rejectDialog, setRejectDialog] = useState({ open: false, expense: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const token = localStorage.getItem('adminToken');
  const rowsPerPage = 10;

  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  };

  const fetchExpenses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const { data } = await res.json();
      const list = Array.isArray(data) ? data : [];
      setExpenses(list);
      applyFilters(list, searchTerm, selectedTab);
    } catch {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (list, search = searchTerm, tab = selectedTab) => {
    let filtered = [...list];
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.employeeName?.toLowerCase().includes(term) ||
        e.category?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term)
      );
    }
    const tabs = ['all', 'pending', 'approved', 'paid', 'rejected'];
    const status = tabs[tab];
    if (status !== 'all') filtered = filtered.filter(e => e.status === status);
    setFiltered(filtered);
  };

  const updateStatus = async (id, status, reason = '') => {
    try {
      const body = { status };
      if (status === 'rejected' && reason) body.rejectionReason = reason;
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed');
      const { data } = await res.json();
      setExpenses(prev => prev.map(e => e._id === id ? { ...e, ...data } : e));
      showToast(`Expense ${status}!`);
    } catch {
      showToast('Action failed', 'error');
    }
  };

  useEffect(() => {
    if (token) fetchExpenses();
    const interval = setInterval(fetchExpenses, 15000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    applyFilters(expenses);
  }, [expenses, searchTerm, selectedTab]);

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return `px-3 py-1 text-xs font-medium rounded-full ${map[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const tabs = [
    { label: 'All', count: expenses.length },
    { label: 'Pending', count: expenses.filter(e => e.status === 'pending').length },
    { label: 'Approved', count: expenses.filter(e => e.status === 'approved').length },
    { label: 'Paid', count: expenses.filter(e => e.status === 'paid').length },
    { label: 'Rejected', count: expenses.filter(e => e.status === 'rejected').length },
  ];

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="text-gray-600">Admin login required</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Admin Expense Dashboard</h1>
            <p className="text-gray-600 mt-1">Review, approve, pay or reject employee expense claims</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
            {tabs.map((tab, i) => (
              <div key={i} className="bg-white border p-6">
                <p className="text-sm text-gray-600">{tab.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{tab.count}</p>
              </div>
            ))}
          </div>

          {/* Filters & Actions */}
          <div className="bg-white border mb-6 p-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employee, category, description..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                    className="pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
              </div>
              <button
                onClick={fetchExpenses}
                className="px-6 py-3 border hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border mb-6">
            <div className="flex overflow-x-auto">
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedTab(i); setPage(0); }}
                  className={`px-8 py-4 font-medium border-b-2 transition ${selectedTab === i
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border">
            {loading && expenses.length === 0 ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Loading expenses...</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-xl">No expenses found</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-700">Employee</th>
                      <th className="text-left p-4 font-medium text-gray-700">Category</th>
                      <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left p-4 font-medium text-gray-700">Date</th>
                      <th className="text-left p-4 font-medium text-gray-700">Status</th>
                      <th className="text-left p-4 font-medium text-gray-700">Receipt</th>
                      <th className="text-center p-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginated.map(exp => (
                      <tr key={exp._id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{exp.employeeName}</div>
                              <div className="text-sm text-gray-500">{exp.department || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">{exp.category}</td>
                        <td className="p-4 font-medium text-purple-700">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-gray-700">
                          {format(new Date(exp.date), 'dd MMM yyyy')}
                        </td>
                        <td className="p-4">
                          <span className={getStatusBadge(exp.status)}>
                            {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          {exp.receipt ? (
                            <a href={exp.receipt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              <Download className="w-5 h-5" />
                            </a>
                          ) : '—'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-4">
                            {exp.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(exp._id, 'approved')}
                                  className="text-green-600 hover:bg-green-50 p-2 rounded"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-6 h-6" />
                                </button>
                                <button
                                  onClick={() => setRejectDialog({ open: true, expense: exp })}
                                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                                  title="Reject"
                                >
                                  <XCircle className="w-6 h-6" />
                                </button>
                              </>
                            )}
                            {exp.status === 'approved' && (
                              <button
                                onClick={() => updateStatus(exp._id, 'paid')}
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                                title="Mark as Paid"
                              >
                                <IndianRupee className="w-6 h-6" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="border-t p-4 flex justify-between items-center text-sm text-gray-600">
                  <div>
                    Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filtered.length)} of {filtered.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 border hover:bg-gray-100 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(filtered.length / rowsPerPage) - 1}
                      className="px-4 py-2 border hover:bg-gray-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reject Dialog */}
          {rejectDialog.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
              <div className="bg-white border max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Reject Expense</h3>
                  <button onClick={() => { setRejectDialog({ open: false, expense: null }); setRejectionReason(''); }}>
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <p><strong>Employee:</strong> {rejectDialog.expense?.employeeName}</p>
                  <p><strong>Amount:</strong> ₹{rejectDialog.expense?.amount.toLocaleString('en-IN')}</p>
                  <p><strong>Category:</strong> {rejectDialog.expense?.category}</p>
                </div>
                <textarea
                  placeholder="Reason for rejection (required)"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => { setRejectDialog({ open: false, expense: null }); setRejectionReason(''); }}
                    className="px-6 py-3 border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateStatus(rejectDialog.expense._id, 'rejected', rejectionReason || 'No reason provided');
                      setRejectDialog({ open: false, expense: null });
                      setRejectionReason('');
                    }}
                    disabled={!rejectionReason.trim()}
                    className="px-8 py-3 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject Expense
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}