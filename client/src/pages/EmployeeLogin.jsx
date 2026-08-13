import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const EmployeeLogin = () => {
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Fix: Run auth check only once on component mount
  useEffect(() => {
    setIsCheckingAuth(false);
  }, []);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const identifier = loginMethod === "email" ? email : loginId;
    if (!identifier || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // Store employee data consistently
      localStorage.setItem("employeeToken", data.token);
      localStorage.setItem("employeeData", JSON.stringify(data.employee));
      localStorage.setItem("userRole", "employee");
      localStorage.setItem("employeeId", data.employee?._id || "");
      localStorage.setItem("employeeEmail", data.employee?.email || "");

      // Use window.location.replace to avoid React navigation issues
      window.location.href = "/employee/dashboard";
    } catch (err) {
      setError(err.message || "Network error");
      console.error("Employee login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (creds) => {
    setEmail(creds.email);
    setLoginId(creds.loginId);
    setPassword(creds.password);
    setError(`Loaded credentials for: ${creds.name}`);
  };

  const quickLoginUsers = [
    { name: "Min Sales", email: "min.sales@company.com", loginId: "minsales" },
    { name: "Scan Dev", email: "scan.dev@company.com", loginId: "scandev" },
    { name: "Max Home", email: "max.home@company.com", loginId: "maxhome" },
    { name: "Bores User", email: "bores.user@company.com", loginId: "boresuser" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="ssgroup" className="w-20 h-20 bg-gradient-to-br  rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" />
          <h2 className="text-3xl font-bold text-gray-800">Employee Login</h2>
          <p className="text-gray-600 mt-2">Access your dashboard</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          {["email", "loginId"].map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setLoginMethod(method)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMethod === method
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                }`}
            >
              {method === "email" ? "Email Login" : "Login ID"}
            </button>
          ))}
        </div>

        {/* Error/Success Message */}
        {error && (
          <div className={`px-4 py-3 rounded-lg mb-6 flex items-center ${error.includes("Loaded")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
            }`}>
            <svg
              className={`w-4 h-4 mr-2 flex-shrink-0 ${error.includes("Loaded") ? "text-green-600" : "text-red-600"
                }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {error.includes("Loaded") ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type={loginMethod === "email" ? "email" : "text"}
              value={loginMethod === "email" ? email : loginId}
              onChange={e => loginMethod === "email" ? setEmail(e.target.value) : setLoginId(e.target.value)}
              placeholder={loginMethod === "email" ? "Enter email" : "Enter login ID"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-lg font-semibold text-white shadow-md transition-all duration-200 flex items-center justify-center ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Quick Login Buttons */}
        {/* <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Quick Login</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickLoginUsers.map((user, index) => (
              <button 
                key={index}
                onClick={() => handleQuickLogin({ ...user, password: "123456" })}
                className="text-xs py-2 px-3 rounded-lg border border-gray-300 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm"
              >
                {user.name}
              </button>
            ))}
          </div>
        </div> */}

        {/* Admin Login Link */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <Link
            to="/admin"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors inline-flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              />
            </svg>
            Admin Login
          </Link>
        </div>

        {/* Security Note */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <svg
              className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Secure Access:</span> Your credentials are encrypted and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;