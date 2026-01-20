// // Updated AppRoutes.jsx (simplified version)
// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import AdminLogin from "../pages/AdminLogin";
// import EmployeeLogin from "../pages/EmployeeLogin";
// import StudentForm from "../pages/StudentForm";
// import DashboardAdmin from "../admin/components/DashboardAdmin";
// import DashboardEmployee from "../employee/components/DashboardEmployee";

// const ProtectedRoute = ({ children, role }) => {
//   const token = localStorage.getItem("adminToken");
//   const userRole = localStorage.getItem("userRole");

//   if (!token || (role && userRole !== role)) {
//     return <Navigate to={role === "admin" ? "/admin" : "/employee/login"} replace />;
//   }
//   return children;
// };

// const AppRoutes = () => (
//   <Routes>
//     <Route path="/" element={<Navigate to="/employee/login" replace />} />
//     <Route path="/student-form" element={<StudentForm />} />
//     <Route path="/admin" element={<AdminLogin />} />
//     <Route path="/employee/login" element={<EmployeeLogin />} />
//     <Route path="/admin/dashboard/*" element={<ProtectedRoute role="admin"><DashboardAdmin /></ProtectedRoute>} />
//     <Route path="/employee/dashboard/*" element={<ProtectedRoute role="employee"><DashboardEmployee /></ProtectedRoute>} />
//     <Route path="*" element={<Navigate to="/" replace />} />
//   </Routes>
// );

// export default AppRoutes;
// src/AppRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/AdminLogin";
import EmployeeLogin from "../pages/EmployeeLogin";
import StudentForm from "../pages/StudentForm";
import DashboardAdmin from "../admin/components/DashboardAdmin";
import DashboardEmployee from "../employee/components/DashboardEmployee";
import EmployeeTasks from "../employee/pages/EmployeeTasks";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  // Check for appropriate token based on role
  const adminToken = localStorage.getItem("adminToken");
  const employeeToken = localStorage.getItem("employeeToken");
  const userRole = localStorage.getItem("userRole");

  if (requiredRole === "admin") {
    if (!adminToken || userRole !== "admin") {
      return <Navigate to="/admin" replace />;
    }
  } else if (requiredRole === "employee") {
    if (!employeeToken || userRole !== "employee") {
      return <Navigate to="/employee/login" replace />;
    }
  } else {
    // Generic protection - require any valid token
    if (!adminToken && !employeeToken) {
      return <Navigate to="/employee/login" replace />;
    }
  }

  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children, restrictedFor }) => {
  const adminToken = localStorage.getItem("adminToken");
  const employeeToken = localStorage.getItem("employeeToken");
  const userRole = localStorage.getItem("userRole");

  if (restrictedFor === "admin" && adminToken && userRole === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  if (restrictedFor === "employee" && employeeToken && userRole === "employee") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  // If no specific restriction but user is authenticated, redirect to appropriate dashboard
  if (!restrictedFor && (adminToken || employeeToken)) {
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "employee") {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route 
      path="/" 
      element={
        <PublicRoute>
          <Navigate to="/employee/login" replace />
        </PublicRoute>
      } 
    />
    
    <Route path="/student-form" element={<StudentForm />} />
    
    {/* Admin routes */}
    <Route 
      path="/admin" 
      element={
        <PublicRoute restrictedFor="admin">
          <AdminLogin />
        </PublicRoute>
      } 
    />
    
    {/* Employee routes */}
    <Route 
      path="/employee/login" 
      element={
        <PublicRoute restrictedFor="employee">
          <EmployeeLogin />
        </PublicRoute>
      } 
    />
    
    {/* Protected admin routes */}
    <Route 
      path="/admin/dashboard/*" 
      element={
        <ProtectedRoute requiredRole="admin">
          <DashboardAdmin />
        </ProtectedRoute>
      } 
    />
    
    {/* Protected employee routes */}
    <Route 
      path="/employee/dashboard/*" 
      element={
        <ProtectedRoute requiredRole="employee">
          <DashboardEmployee />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/my/tasks" 
      element={
        <ProtectedRoute requiredRole="employee">
          <EmployeeTasks />
        </ProtectedRoute>
      } 
    />
    {/* Catch all route */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;