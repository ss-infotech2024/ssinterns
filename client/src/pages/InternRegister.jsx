import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { DEPARTMENTS } from "../constants/departments";

// Public page opened from the admin's Intern QR. It only submits the form —
// it never stores a token or reaches any other part of the portal.
const REGISTER_URL = "https://ssinternsbacknedv2.onrender.com/api/employee/register/intern";

const today = () => new Date().toISOString().split("T")[0];

const INPUT_CLS =
  "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500";

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const Shell = ({ children }) => (
  <div className="min-h-screen bg-slate-50 flex items-start sm:items-center justify-center px-4 py-8">
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-center gap-2.5 mb-5">
        <img src="/logo.jpg" alt="SS Group" className="h-9 w-9 rounded-md object-cover" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">SS Group</p>
          <p className="text-xs text-slate-500">Intern Registration</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">{children}</div>
    </div>
  </div>
);

const InternRegister = () => {
  const [params] = useSearchParams();
  const invite = params.get("invite");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", department: "", position: "",
    joiningDate: today(), loginId: "", password: "", confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(null);
  const [linkExpired, setLinkExpired] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const { confirmPassword, ...details } = form;
      const res = await axios.post(REGISTER_URL, { ...details, invite }, { timeout: 30000 });
      setRegistered(res.data.employee);
    } catch (err) {
      if (err.response?.status === 401) setLinkExpired(true);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!invite || linkExpired) {
    return (
      <Shell>
        <div className="p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Link not valid</h1>
          <p className="text-sm text-slate-500 mt-1">
            {linkExpired
              ? "This registration QR has expired or was replaced. Please ask the admin for a new QR code."
              : "Please scan the registration QR code shared by the admin."}
          </p>
        </div>
      </Shell>
    );
  }

  if (registered) {
    return (
      <Shell>
        <div className="p-6 text-center">
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Registration complete</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome, {registered.name}! You can now log in with:</p>
          <div className="bg-slate-50 rounded-lg px-4 py-3 mt-4 text-sm text-left space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Login ID</span>
              <span className="font-mono text-slate-800 break-all">{registered.loginId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Password</span>
              <span className="text-slate-800">the one you just set</span>
            </div>
          </div>
          <Link
            to="/employee/login"
            className="inline-block mt-5 px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="px-5 py-4 border-b border-slate-100">
        <h1 className="text-lg font-semibold text-slate-900">Register as an Intern</h1>
        <p className="text-sm text-slate-500 mt-0.5">Fill in your details to create your intern account.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input required type="text" value={form.name} onChange={set("name")} placeholder="Your full name" className={INPUT_CLS} />
          </Field>
          <Field label="Email" required>
            <input required type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={INPUT_CLS} />
          </Field>
          <Field label="Phone">
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={INPUT_CLS} />
          </Field>
          <Field label="Department" required>
            <select required value={form.department} onChange={set("department")} className={INPUT_CLS}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Role / Position">
            <input type="text" value={form.position} onChange={set("position")} placeholder="e.g. Web Developer Intern" className={INPUT_CLS} />
          </Field>
          <Field label="Joining Date" required>
            <input required type="date" value={form.joiningDate} onChange={set("joiningDate")} className={INPUT_CLS} />
          </Field>
        </div>

        <div className="pt-1 border-t border-slate-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Login ID" required>
              <input required type="text" value={form.loginId} onChange={set("loginId")} placeholder="Choose a login ID" autoComplete="username" className={INPUT_CLS} />
            </Field>
          </div>
          <Field label="Password" required>
            <input required minLength={6} type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min 6 characters" autoComplete="new-password" className={INPUT_CLS} />
          </Field>
          <Field label="Confirm Password" required>
            <input required minLength={6} type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter password" autoComplete="new-password" className={INPUT_CLS} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="rounded border-slate-300" />
          Show password
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-60"
        >
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>
    </Shell>
  );
};

export default InternRegister;
