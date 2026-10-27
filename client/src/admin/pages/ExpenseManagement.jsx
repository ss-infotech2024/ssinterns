import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle, Clock, IndianRupee, XCircle, Download, RefreshCw, Search,
  AlertCircle, FileText, User, Calendar, Trash2, X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const API_URL = 'https://ssinternsbacknedv2.onrender.com/api/expenses';

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold">Access Denied</h1>
          <p className="text-gray-600">Admin login required</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="w-full">
        <div className="w-full">

          {/* Header */}
          <div className="mb-5">
            <h1 className="admin-page-title">Admin Expense Dashboard</h1>
            <p className="admin-page-subtitle">Review, approve, pay or reject employee expense claims</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
            {tabs.map((tab, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-medium text-gray-500">{tab.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{tab.count}</p>
              </div>
            ))}
          </div>

          {/* Filters & Actions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 p-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employee, category, description..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                    className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
                  />
                </div>
              </div>
              <button
                onClick={fetchExpenses}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="flex overflow-x-auto">
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedTab(i); setPage(0); }}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${selectedTab === i
                      ? 'border-violet-600 text-violet-700 bg-violet-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {loading && expenses.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Loading expenses...</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">No expenses found</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">Employee</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Category</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Amount</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Receipt</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {paginated.map(exp => (
                      <tr key={exp._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{exp.employeeName}</div>
                              <div className="text-xs text-gray-500">{exp.department || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{exp.category}</td>
                        <td className="px-4 py-3 font-medium text-purple-700">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {format(new Date(exp.date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={getStatusBadge(exp.status)}>
                            {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {exp.receipt ? (
                            <a href={exp.receipt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              <Download className="w-5 h-5" />
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            {exp.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(exp._id, 'approved')}
                                  className="text-green-600 hover:bg-green-50 p-1.5 rounded-md"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setRejectDialog({ open: true, expense: exp })}
                                  className="text-red-600 hover:bg-red-50 p-1.5 rounded-md"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {exp.status === 'approved' && (
                              <button
                                onClick={() => updateStatus(exp._id, 'paid')}
                                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md"
                                title="Mark as Paid"
                              >
                                <IndianRupee className="w-5 h-5" />
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
                      className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(filtered.length / rowsPerPage) - 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Reject Expense</h3>
                  <button onClick={() => { setRejectDialog({ open: false, expense: null }); setRejectionReason(''); }}>
                    <X className="w-5 h-5" />
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
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => { setRejectDialog({ open: false, expense: null }); setRejectionReason(''); }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
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
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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