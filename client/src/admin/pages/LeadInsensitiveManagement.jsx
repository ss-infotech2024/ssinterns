import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  Users, CheckCircle, IndianRupee, Clock, RefreshCw, Search,
  Phone, Mail, Edit2, Save, X, MessageCircle, DollarSign, AlertCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const API_URL = 'https://ssinternsbackend-ltfn.onrender.com/api/lead';

export default function AdminLeadIncentiveDashboard() {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    total: 0, converted: 0, earned: 0, paid: 0, pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [confirmPay, setConfirmPay] = useState(null);

  const token = localStorage.getItem('adminToken');
  const inputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  };

  const calculateStats = (data) => {
    const converted = data.filter(l => l.status === 'Converted');
    const earned = converted.reduce((sum, l) => sum + (Number(l.incentive) || 0), 0);
    const paid = converted.filter(l => l.paymentStatus === 'Pay Done')
      .reduce((sum, l) => sum + (Number(l.incentive) || 0), 0);
    setStats({
      total: data.length,
      converted: converted.length,
      earned,
      paid,
      pending: earned - paid
    });
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [leadsRes, empRes] = await Promise.all([
        fetch(`${API_URL}/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://ssinternsbackend-ltfn.onrender.com/api/employee/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (leadsRes.ok) {
        const { data } = await leadsRes.json();
        const list = (data || []).map(l => ({
          ...l,
          broughtBy: l.broughtBy || { name: 'Unknown', loginId: '-' }
        }));
        setLeads(list);
        calculateStats(list);
      }
      if (empRes.ok) {
        const { data } = await empRes.json();
        setEmployees(data || []);
      }
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);
  useEffect(() => { if (editingId && inputRef.current) inputRef.current.focus(); }, [editingId]);

  const saveIncentive = async (id) => {
    const amount = parseInt(editValue) || 0;
    if (amount < 0) return showToast('Invalid amount', 'error');

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ incentive: amount })
      });
      if (!res.ok) throw new Error();

      setLeads(prev => {
        const updated = prev.map(l => l._id === id ? { ...l, incentive: amount } : l);
        calculateStats(updated);
        return updated;
      });
      setEditingId(null);
      setEditValue('');
      showToast(`Incentive updated to ₹${amount}`);
    } catch {
      showToast('Update failed', 'error');
    }
  };

  const markAsPaid = async () => {
    if (!confirmPay) return;
    try {
      const res = await fetch(`${API_URL}/lead/${confirmPay._id}/mark-paid`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();

      setLeads(prev => {
        const updated = prev.map(l => l._id === confirmPay._id ? { ...l, paymentStatus: 'Pay Done' } : l);
        calculateStats(updated);
        return updated;
      });
      showToast(`₹${confirmPay.incentive} paid to ${confirmPay.broughtBy.name}`);
    } catch {
      showToast('Payment failed', 'error');
    } finally {
      setConfirmPay(null);
    }
  };

  const openWhatsApp = (phone) => {
    const num = phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${num}`, '_blank');
  };

  const filtered = leads.filter(l => {
    const s = searchTerm.toLowerCase();
    return (
      (!searchTerm ||
        l.name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.includes(s) ||
        l.broughtBy?.name?.toLowerCase().includes(s)
      ) &&
      (statusFilter === 'all' || l.status === statusFilter) &&
      (employeeFilter === 'all' || l.broughtBy?._id === employeeFilter)
    );
  });

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
            <h1 className="text-2xl font-bold text-gray-900">Lead & Incentive Management</h1>
            <p className="text-gray-600 mt-1">View all leads • Edit incentives • Mark payments</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-5 border">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 border">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Converted</p>
                  <p className="text-2xl font-bold">{stats.converted}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 border">
              <div className="flex items-center gap-3">
                <IndianRupee className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold">₹{stats.earned.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 border">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Paid Out</p>
                  <p className="text-2xl font-bold">₹{stats.paid.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 border">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">₹{stats.pending.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-5 border mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-3 border rounded-md">
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
              <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} className="px-4 py-3 border rounded-md">
                <option value="all">All Employees</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <button onClick={fetchData} className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center gap-2">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No leads found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Lead</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-center p-4 font-medium">Incentive</th>
                    <th className="text-center p-4 font-medium">Status</th>
                    <th className="text-center p-4 font-medium">Payment</th>
                    <th className="text-center p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr key={lead._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-gray-500">{format(new Date(lead.createdAt), 'dd MMM yyyy')}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {lead.email || '-'}</div>
                          <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {lead.phone || '-'}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{lead.leadType || '-'}</td>
                      <td className="p-4 text-sm">
                        <div>{lead.broughtBy?.name || '-'}</div>
                        <div className="text-gray-500 text-xs">{lead.broughtBy?.loginId || '-'}</div>
                      </td>
                      <td className="p-4 text-center">
                        {editingId === lead._id ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                              onKeyDown={e => e.key === 'Enter' && saveIncentive(lead._id)}
                              className="w-20 px-2 py-1 border text-center"
                            />
                            <button onClick={() => saveIncentive(lead._id)} className="text-green-600"><Save className="w-5 h-5" /></button>
                            <button onClick={() => setEditingId(null)} className="text-red-600"><X className="w-5 h-5" /></button>
                          </div>
                        ) : (
                          <span
                            onClick={() => { setEditingId(lead._id); setEditValue(lead.incentive || '0'); }}
                            className="font-medium text-purple-700 cursor-pointer hover:underline inline-flex items-center gap-1"
                          >
                            ₹{lead.incentive || 0} <Edit2 className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${lead.status === 'Converted' ? 'bg-green-100 text-green-800' :
                            lead.status === 'Lost' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${lead.paymentStatus === 'Pay Done' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                          {lead.paymentStatus === 'Pay Done' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-3">
                          {lead.status === 'Converted' && lead.paymentStatus !== 'Pay Done' && (
                            <button onClick={() => setConfirmPay(lead)} className="text-green-600 hover:bg-green-50 p-2 rounded">
                              <DollarSign className="w-6 h-6" />
                            </button>
                          )}
                          {lead.phone && (
                            <button onClick={() => openWhatsApp(lead.phone)} className="text-green-600 hover:bg-green-50 p-2 rounded">
                              <MessageCircle className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payment Confirmation */}
          {confirmPay && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 border max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Confirm Payment</h3>
                <p className="mb-6">
                  Pay <strong>₹{confirmPay.incentive || 0}</strong> to <strong>{confirmPay.broughtBy?.name}</strong><br />
                  for lead: <strong>{confirmPay.name}</strong>
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setConfirmPay(null)} className="px-4 py-2 border rounded">Cancel</button>
                  <button onClick={markAsPaid} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Pay Now
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