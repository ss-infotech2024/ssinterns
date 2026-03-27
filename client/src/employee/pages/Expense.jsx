import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  Plus, Upload, Trash2, Receipt, Clock, CheckCircle, XCircle, IndianRupee,
  Search, RefreshCw, FileText, AlertCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const API_URL = 'https://ssinternsbackend.onrender.com/api/expenses';

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, paid: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [fileName, setFileName] = useState('');

  const token = localStorage.getItem('employeeToken');

  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  };

  const fetchExpenses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { data } = await res.json();
        setExpenses(data || []);
      }
    } catch {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/my/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { data } = await res.json();
        setStats(data || { pending: 0, approved: 0, paid: 0, rejected: 0, total: 0 });
      }
    } catch { }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.description || !formData.date) {
      return showToast('Please fill all required fields', 'error');
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('category', formData.category);
    data.append('amount', formData.amount);
    data.append('description', formData.description);
    data.append('date', formData.date);
    if (fileInputRef.current?.files[0]) {
      data.append('receipt', fileInputRef.current.files[0]);
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed');

      setExpenses(prev => [result.data, ...prev]);
      showToast('Expense submitted successfully!');
      setFormData({ category: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_URL}/my/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Delete failed');
      }
      setExpenses(prev => prev.filter(e => e._id !== deleteId));
      showToast('Expense deleted');
      fetchStats();
    } catch (err) {
      showToast(err.message.includes('cannot') ? 'Cannot delete approved expenses' : err.message, 'error');
    } finally {
      setDeleteId(null);
    }
  };

  useEffect(() => {
    if (token) {
      fetchExpenses();
      fetchStats();
    }
  }, [token]);

  const filtered = expenses.filter(e => {
    const search = searchTerm.toLowerCase();
    return (
      (!search || e.category.toLowerCase().includes(search) || e.description.toLowerCase().includes(search)) &&
      (statusFilter === 'all' || e.status === statusFilter)
    );
  });

  const getStatusInfo = (status) => {
    const map = {
      pending: { label: 'Pending', color: 'yellow', icon: Clock },
      approved: { label: 'Approved', color: 'blue', icon: CheckCircle },
      paid: { label: 'Paid', color: 'green', icon: IndianRupee },
      rejected: { label: 'Rejected', color: 'red', icon: XCircle }
    };
    return map[status] || map.pending;
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-3xl shadow-2xl text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-xl text-gray-600 mt-4">Please log in</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Expense Claims</h1>
            <p className="text-gray-600 mt-3 text-lg">Submit and track your expense reimbursements</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
            {[
              { label: "Total", value: expenses.length, icon: FileText, color: "gray" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "yellow" },
              { label: "Approved", value: stats.approved, icon: CheckCircle, color: "blue" },
              { label: "Paid", value: stats.paid, icon: IndianRupee, color: "green" },
              { label: "Rejected", value: stats.rejected, icon: XCircle, color: "red" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl p-6 text-center border">
                <div className={`inline-flex p-4 rounded-full mb-3 ${i === 0 ? 'bg-gray-100' : i === 1 ? 'bg-yellow-100' : i === 2 ? 'bg-blue-100' : i === 3 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                  <s.icon className={`w-8 h-8 ${i === 0 ? 'text-gray-600' : i === 1 ? 'text-yellow-600' : i === 2 ? 'text-blue-600' : i === 3 ? 'text-green-600' : 'text-red-600'
                    }`} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{s.value}</p>
                <p className="text-gray-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Form */}
            <div ref={formRef} className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Plus className="w-8 h-8 text-purple-600" />
                  Submit New Expense
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500"
                    required
                  >
                    <option value="">Select Category *</option>
                    {["Travel", "Food", "Accommodation", "Office Supplies", "Training", "Miscellaneous"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="pl-12 w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500"
                      required
                    />
                  </div>

                  <textarea
                    placeholder="Description * (min 10 chars)"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 resize-none"
                    required
                  />

                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500"
                    required
                  />

                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 transition">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">{fileName || 'Upload Receipt (Optional)'}</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => setFileName(e.target.files[0]?.name || '')}
                        className="hidden"
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg flex items-center justify-center gap-3"
                  >
                    {submitting ? 'Submitting...' : 'Submit Expense'}
                    {!submitting && <Plus className="w-6 h-6" />}
                  </button>
                </form>
              </div>
            </div>

            {/* Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">My Expenses ({filtered.length})</h2>
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="paid">Paid</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button
                        onClick={fetchExpenses}
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition flex items-center gap-2"
                      >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="p-16 text-center">
                    <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-16 text-center text-gray-500">
                    <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl">No expenses found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Receipt</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filtered.map(exp => {
                          const status = getStatusInfo(exp.status);
                          return (
                            <tr key={exp._id} className="hover:bg-gray-50">
                              <td className="px-6 py-5">
                                <div className="font-medium">{exp.category}</div>
                                <div className="text-sm text-gray-500">{exp.description}</div>
                              </td>
                              <td className="px-6 py-5 font-bold text-purple-600">
                                ₹{exp.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-5 text-gray-700">
                                {format(new Date(exp.date), 'dd MMM yyyy')}
                              </td>
                              <td className="px-6 py-5">
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                      status.color === 'green' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                  }`}>
                                  <status.icon className="w-4 h-4" />
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                {exp.receipt ? (
                                  <a href={exp.receipt} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">
                                    <Receipt className="w-6 h-6" />
                                  </a>
                                ) : '—'}
                              </td>
                              <td className="px-6 py-5 text-center">
                                {['pending', 'paid', 'rejected'].includes(exp.status) && (
                                  <button
                                    onClick={() => setDeleteId(exp._id)}
                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating Button */}
          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 transition z-50"
          >
            <Plus className="w-8 h-8" />
          </button>

          {/* Delete Confirmation Modal */}
          {deleteId && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Delete Expense?</h3>
                <p className="text-gray-600 mb-6">This action cannot be undone.</p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteExpense}
                    className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold"
                  >
                    Delete Permanently
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