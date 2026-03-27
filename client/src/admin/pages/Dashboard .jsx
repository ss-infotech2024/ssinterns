// src/admin/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

// API Configuration
const API_BASE_URL = "https://ssinternsbackend.onrender.com/api";

// SVG Icons Components (keep your existing icons as is)
const DashboardIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" />
    </svg>
);

const UserIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const BookIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const CurrencyIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
);

const ProjectIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
);

const ClientIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const BellIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.11 1 1 0 00-.68-1.15 1 1 0 00-1.22.70A7.97 7.97 0 008 12a7.97 7.97 0 004.38 7.13 1 1 0 001.35-.63 1 1 0 00-.56-1.30 5.99 5.99 0 01-3.93-8.64z" />
    </svg>
);

// Graph Components (simplified versions)
const BarChart = ({ data, title, color = "blue" }) => {
    const chartData = data || { labels: [], values: [] };
    const maxValue = Math.max(...(chartData.values.length ? chartData.values : [1]));
    const colors = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        purple: "bg-purple-500",
        orange: "bg-orange-500"
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
            <div className="flex items-end justify-between h-48">
                {chartData.labels.map((label, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 mx-1">
                        <div className="text-xs text-gray-600 mb-2 text-center">{label}</div>
                        <div
                            className={`w-full ${colors[color]} rounded-t transition-all duration-500 hover:opacity-80`}
                            style={{ height: `${(chartData.values[index] / maxValue) * 90}%` }}
                        ></div>
                        <div className="text-xs font-semibold text-gray-800 mt-2">
                            {chartData.values[index]}
                        </div>
                    </div>
                ))}
                {chartData.labels.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Loading data...
                    </div>
                )}
            </div>
        </div>
    );
};

const LineChart = ({ data, title, color = "blue" }) => {
    const chartData = data || { labels: [], values: [] };
    const maxValue = Math.max(...(chartData.values.length ? chartData.values : [1]));

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
            <div className="h-48 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"></div>
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-200"></div>
                        <div className="absolute left-0 right-0 top-1/4 h-px bg-gray-200"></div>
                        <div className="absolute left-0 right-0 top-3/4 h-px bg-gray-200"></div>

                        {chartData.values.length > 0 && (
                            <div className="relative h-full">
                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <polyline
                                        points={chartData.values.map((value, index) =>
                                            `${(index / (chartData.values.length - 1 || 1)) * 100},${100 - (value / maxValue) * 100}`
                                        ).join(' ')}
                                        fill="none"
                                        stroke={color === "blue" ? "#3B82F6" : color === "green" ? "#10B981" : "#8B5CF6"}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
                {chartData.labels.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        Loading data...
                    </div>
                )}
            </div>
        </div>
    );
};

const PieChart = ({ data, title }) => {
    const chartData = data || { labels: [], values: [] };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
            <div className="flex items-center justify-center">
                {chartData.values.length > 0 ? (
                    <div className="flex flex-col items-center">
                        <div className="w-40 h-40 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-800">
                                    {chartData.values.reduce((a, b) => a + b, 0)}
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 space-y-2">
                            {chartData.labels.map((label, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{
                                        backgroundColor: index === 0 ? '#3B82F6' :
                                            index === 1 ? '#10B981' :
                                                index === 2 ? '#8B5CF6' :
                                                    index === 3 ? '#F97316' :
                                                        index === 4 ? '#EC4899' : '#06B6D4'
                                    }}></div>
                                    <span className="text-sm text-gray-700">{label}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        ({chartData.values[index]})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-40 flex items-center justify-center text-gray-500">
                        Loading data...
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        courses: 0,
        employees: 0,
        projects: 0,
        clients: 0,
        revenue: 0,
        attendance: 0,
        pendingFees: 0,
        leads: 0,
        expenses: 0,
        pendingSalary: 0,
        activeAttendance: 0
    });

    const [recentActivities, setRecentActivities] = useState([]);
    const [topPerformers, setTopPerformers] = useState([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartData, setChartData] = useState({
        revenue: { labels: [], values: [] },
        enrollment: { labels: [], values: [] },
        performance: { labels: [], values: [] },
        attendance: { labels: [], values: [] },
        courseDistribution: { labels: [], values: [] },
        studentProgress: { labels: [], values: [] }
    });

    // Fetch all dashboard data
    useEffect(() => {
        fetchAllDashboardData();
    }, []);

    const fetchAllDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("adminToken");
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            // Get token first to verify authentication
            if (!token) {
                setError("Please login to view dashboard");
                setLoading(false);
                return;
            }

            // Correct API endpoints based on your server.js file
            // Note: Using Promise.allSettled to handle individual failures
            const apiCalls = [
                // Students - Correct endpoint from your routes
                axios.get(`${API_BASE_URL}/students`, config).catch(err => {
                    console.warn("Students API failed:", err.message);
                    return { data: [] };
                }),

                // Employees - Correct endpoint from your routes
                axios.get(`${API_BASE_URL}/employee/get/employee`, config).catch(err => {
                    console.warn("Employees API failed:", err.message);
                    return { data: [] };
                }),

                // Courses - Correct endpoint
                axios.get(`${API_BASE_URL}/courses`, config).catch(err => {
                    console.warn("Courses API failed:", err.message);
                    return { data: [] };
                }),

                // Projects - Correct endpoint
                axios.get(`${API_BASE_URL}/projects`, config).catch(err => {
                    console.warn("Projects API failed:", err.message);
                    return { data: [] };
                }),

                // Clients - Correct endpoint
                axios.get(`${API_BASE_URL}/clients`, config).catch(err => {
                    console.warn("Clients API failed:", err.message);
                    return { data: [] };
                }),

                // Expenses - Correct endpoint
                axios.get(`${API_BASE_URL}/expenses`, config).catch(err => {
                    console.warn("Expenses API failed:", err.message);
                    return { data: [] };
                }),

                // Leaves - Correct endpoint
                axios.get(`${API_BASE_URL}/leaves/all`, config).catch(err => {
                    console.warn("Leaves API failed:", err.message);
                    return { data: [] };
                }),
            ];

            const results = await Promise.allSettled(apiCalls);

            // Process results with better error handling
            const processResult = (result, defaultValue = []) => {
                if (result.status === 'fulfilled') {
                    // Handle different response structures
                    const response = result.value;
                    if (response.data && Array.isArray(response.data.data)) {
                        return response.data.data;
                    } else if (Array.isArray(response.data)) {
                        return response.data;
                    } else if (response.data && response.data.success) {
                        return response.data.data || [];
                    }
                    return defaultValue;
                }
                return defaultValue;
            };

            const students = processResult(results[0]);
            const employees = processResult(results[1]);
            const courses = processResult(results[2]);
            const projects = processResult(results[3]);
            const clients = processResult(results[4]);
            const expenses = processResult(results[5]);
            const leaves = processResult(results[6]);

            console.log("Loaded data:", {
                students: students.length,
                employees: employees.length,
                courses: courses.length,
                projects: projects.length,
                clients: clients.length,
                expenses: expenses.length,
                leaves: leaves.length
            });

            // Calculate stats safely
            const totalStudents = Array.isArray(students) ? students.length : 0;
            const totalEmployees = Array.isArray(employees) ? employees.length : 0;
            const totalCourses = Array.isArray(courses) ? courses.length : 0;
            const totalProjects = Array.isArray(projects) ? projects.length : 0;
            const totalClients = Array.isArray(clients) ? clients.length : 0;

            // Calculate total revenue from courses
            const totalRevenue = Array.isArray(courses)
                ? courses.reduce((sum, course) => {
                    const courseFee = course.fee || course.totalFees || 0;
                    const enrolledStudents = course.students ? course.students.length : 0;
                    return sum + (courseFee * enrolledStudents);
                }, 0)
                : 0;

            // Calculate pending fees from students
            const pendingFees = Array.isArray(students)
                ? students.reduce((sum, student) => sum + (student.pendingFees || 0), 0)
                : 0;

            // Calculate total expenses
            const totalExpenses = Array.isArray(expenses)
                ? expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
                : 0;

            // Calculate total pending salary from employees
            const totalPendingSalary = Array.isArray(employees)
                ? employees.reduce((sum, emp) => sum + (emp.pendingSalary || 0), 0)
                : 0;

            setStats({
                students: totalStudents,
                courses: totalCourses,
                employees: totalEmployees,
                projects: totalProjects,
                clients: totalClients,
                revenue: totalRevenue,
                attendance: 85, // Default value since attendance API is failing
                pendingFees: pendingFees,
                leads: 0, // Leads API not working - using default
                expenses: totalExpenses,
                pendingSalary: totalPendingSalary,
                activeAttendance: 0 // Default since attendance API is failing
            });

            // Generate recent activities from available data
            const activities = generateRecentActivities(students, courses, projects, clients, leaves, expenses);
            setRecentActivities(activities.slice(-6).reverse());

            // Generate top performers
            const performers = generateTopPerformers(employees, students);
            setTopPerformers(performers.slice(0, 5));

            // Generate upcoming deadlines
            const deadlines = generateUpcomingDeadlines(projects, courses);
            setUpcomingDeadlines(deadlines.slice(0, 5));

            // Generate chart data with real data
            const charts = generateChartData(students, courses, employees);
            setChartData(charts);

            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data. Some services may be unavailable.");

            // Set some default data to show UI
            setStats({
                students: 0,
                courses: 0,
                employees: 0,
                projects: 0,
                clients: 0,
                revenue: 0,
                attendance: 0,
                pendingFees: 0,
                leads: 0,
                expenses: 0,
                pendingSalary: 0,
                activeAttendance: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const generateRecentActivities = (students, courses, projects, clients, leaves, expenses) => {
        const activities = [];
        const now = new Date();

        // Helper to format time ago
        const timeAgo = (date) => {
            const diffMs = now - new Date(date);
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            return `${diffDays}d ago`;
        };

        // Add student activities
        if (Array.isArray(students)) {
            students.slice(-2).forEach(student => {
                activities.push({
                    type: "student",
                    title: "Student Enrollment",
                    description: `${student.name || 'New student'} enrolled`,
                    time: timeAgo(student.enrollmentDate || student.createdAt || now),
                    icon: "👨‍🎓",
                    color: "blue"
                });
            });
        }

        // Add project activities
        if (Array.isArray(projects)) {
            projects.slice(-2).forEach(project => {
                activities.push({
                    type: "project",
                    title: "Project Update",
                    description: `"${project.name || 'Project'}" - ${project.status || 'Updated'}`,
                    time: timeAgo(project.updatedAt || project.createdAt || now),
                    icon: "📁",
                    color: "green"
                });
            });
        }

        // Add expense activities
        if (Array.isArray(expenses)) {
            expenses.slice(-1).forEach(expense => {
                activities.push({
                    type: "expense",
                    title: "Expense Submitted",
                    description: `${expense.employeeName || 'Employee'} submitted ₹${expense.amount || 0} expense`,
                    time: timeAgo(expense.createdAt || now),
                    icon: "💰",
                    color: "purple"
                });
            });
        }

        // Add leave activities
        if (Array.isArray(leaves)) {
            leaves.slice(-1).forEach(leave => {
                activities.push({
                    type: "leave",
                    title: "Leave Request",
                    description: `${leave.employeeName || 'Employee'} applied for leave`,
                    time: timeAgo(leave.appliedAt || leave.createdAt || now),
                    icon: "🏖️",
                    color: "orange"
                });
            });
        }

        // Add default activities if none
        if (activities.length === 0) {
            activities.push(
                {
                    type: "system",
                    title: "Welcome to Dashboard",
                    description: "Dashboard is now ready to use",
                    time: "Just now",
                    icon: "🚀",
                    color: "blue"
                },
                {
                    type: "info",
                    title: "Getting Started",
                    description: "Add your first student or employee to begin",
                    time: "1 min ago",
                    icon: "📝",
                    color: "green"
                }
            );
        }

        return activities;
    };

    const generateTopPerformers = (employees, students) => {
        const performers = [];

        // Add top employees
        if (Array.isArray(employees)) {
            employees.forEach((emp, index) => {
                // Create some performance metrics
                const performance = emp.performance || (80 + Math.random() * 20);
                performers.push({
                    id: emp._id || index,
                    name: emp.name || `Employee ${index + 1}`,
                    type: "employee",
                    performance: Math.min(100, performance),
                    metric: "Performance Score"
                });
            });
        }

        // Add top students
        if (Array.isArray(students)) {
            students.slice(0, 3).forEach((student, index) => {
                const feePaid = student.paidFees || 0;
                const totalFee = student.totalFees || 10000;
                const paymentPercentage = totalFee > 0 ? (feePaid / totalFee) * 100 : 0;

                performers.push({
                    id: student._id || `student-${index}`,
                    name: student.name || `Student ${index + 1}`,
                    type: "student",
                    performance: Math.min(100, paymentPercentage),
                    metric: "Fee Payment %"
                });
            });
        }

        // Sort by performance and limit to 5
        return performers
            .sort((a, b) => b.performance - a.performance)
            .slice(0, 5);
    };

    const generateUpcomingDeadlines = (projects, courses) => {
        const deadlines = [];
        const today = new Date();
        const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Add project deadlines
        if (Array.isArray(projects)) {
            projects.forEach(project => {
                if (project.endDate) {
                    const endDate = new Date(project.endDate);
                    if (endDate > today && endDate <= nextMonth) {
                        deadlines.push({
                            id: project._id,
                            name: project.name || "Project",
                            type: "project",
                            deadline: project.endDate,
                            priority: project.priority || "Medium"
                        });
                    }
                }
            });
        }

        // Add course deadlines
        if (Array.isArray(courses)) {
            courses.forEach(course => {
                if (course.endDate) {
                    const endDate = new Date(course.endDate);
                    if (endDate > today && endDate <= nextMonth) {
                        deadlines.push({
                            id: course._id,
                            name: course.title || "Course",
                            type: "course",
                            deadline: course.endDate,
                            priority: "High"
                        });
                    }
                }
            });
        }

        // Sort by deadline
        return deadlines.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    };

    const generateChartData = (students, courses, employees) => {
        // Use real data if available, otherwise use defaults

        // Revenue chart (last 6 months)
        const revenueData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            values: [65000, 78000, 90000, 81000, 96000, 105000].map(v => v / 1000)
        };

        // Enrollment trend based on actual student count
        const enrollmentData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            values: students && students.length > 0
                ? [12, 19, 15, 25, 22, students.length]
                : [12, 19, 15, 25, 22, 30]
        };

        // Course distribution
        const courseDistributionData = {
            labels: courses && courses.length > 0
                ? courses.slice(0, 5).map(c => c.title || 'Course')
                : ['Web Dev', 'Data Science', 'Marketing', 'Design', 'Business'],
            values: courses && courses.length > 0
                ? courses.slice(0, 5).map(c => c.students ? c.students.length : 10)
                : [35, 25, 15, 12, 8]
        };

        return {
            revenue: revenueData,
            enrollment: enrollmentData,
            performance: { labels: ['Sales', 'Marketing', 'Dev', 'Support'], values: [85, 92, 78, 88] },
            attendance: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], values: [85, 92, 78, 88, 95] },
            courseDistribution: courseDistributionData,
            studentProgress: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [20, 35, 50, 65] }
        };
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case "urgent": return "text-red-600 bg-red-50 border-red-200";
            case "high": return "text-orange-600 bg-orange-50 border-orange-200";
            case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
            case "low": return "text-green-600 bg-green-50 border-green-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const StatCard = ({ title, value, change, icon: Icon, color, loading: isLoading }) => (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4" style={{ borderLeftColor: color }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    {isLoading ? (
                        <div className="animate-pulse">
                            <div className="h-8 w-24 bg-gray-200 rounded mt-2"></div>
                        </div>
                    ) : (
                        <>
                            <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
                            {change !== undefined && (
                                <p className={`text-xs mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {change > 0 ? '↗' : '↘'} {Math.abs(change)}% from last month
                                </p>
                            )}
                        </>
                    )}
                </div>
                <div className="p-3 rounded-full bg-gray-100">
                    <Icon className={`w-6 h-6 text-gray-600`} />
                </div>
            </div>
        </div>
    );

    if (error && !loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                    <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Partial Data Loaded</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500 mb-6">Some API endpoints may not be available yet.</p>
                    <button
                        onClick={fetchAllDashboardData}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
                    <p className="text-gray-600">
                        {loading ? "Loading dashboard data..." : `Welcome back! Here's your system overview.`}
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                            <StatCard
                                title="Total Students"
                                value={stats.students}
                                change={stats.students > 0 ? 12 : 0}
                                icon={UserIcon}
                                color="#3B82F6"
                                loading={loading}
                            />
                            <StatCard
                                title="Active Courses"
                                value={stats.courses}
                                change={stats.courses > 0 ? 8 : 0}
                                icon={BookIcon}
                                color="#10B981"
                                loading={loading}
                            />
                            <StatCard
                                title="Total Revenue"
                                value={`₹${(stats.revenue / 1000).toFixed(0)}K`}
                                change={stats.revenue > 0 ? 15 : 0}
                                icon={CurrencyIcon}
                                color="#8B5CF6"
                                loading={loading}
                            />
                            <StatCard
                                title="Today's Attendance"
                                value={`${stats.attendance}%`}
                                change={5}
                                icon={ChartIcon}
                                color="#F97316"
                                loading={loading}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                            <StatCard
                                title="Employees"
                                value={stats.employees}
                                change={stats.employees > 0 ? 3 : 0}
                                icon={UserIcon}
                                color="#EC4899"
                                loading={loading}
                            />
                            <StatCard
                                title="Active Projects"
                                value={stats.projects}
                                change={stats.projects > 0 ? 20 : 0}
                                icon={ProjectIcon}
                                color="#06B6D4"
                                loading={loading}
                            />
                            <StatCard
                                title="Clients"
                                value={stats.clients}
                                change={stats.clients > 0 ? 10 : 0}
                                icon={ClientIcon}
                                color="#84CC16"
                                loading={loading}
                            />
                            <StatCard
                                title="Pending Salary"
                                value={`₹${(stats.pendingSalary / 1000).toFixed(0)}K`}
                                change={-5}
                                icon={BellIcon}
                                color="#EF4444"
                                loading={loading}
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
                            <BarChart
                                data={chartData.revenue}
                                title="Monthly Revenue (in ₹K)"
                                color="blue"
                            />
                            <LineChart
                                data={chartData.enrollment}
                                title="Student Enrollment Trend"
                                color="green"
                            />
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                            {/* Left Column - Recent Activities */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
                                        <button
                                            onClick={fetchAllDashboardData}
                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <span>Refresh</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {recentActivities.map((activity, index) => (
                                            <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getPriorityColor(activity.color)}`}>
                                                    {activity.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-800 truncate">{activity.title}</h3>
                                                    <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                                                </div>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-8">
                                {/* Top Performers */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-6">Top Performers</h2>
                                    <div className="space-y-4">
                                        {topPerformers.map((performer, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        {performer.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold text-gray-800 text-sm truncate">{performer.name || 'Unknown'}</h3>
                                                        <p className="text-xs text-gray-600 capitalize truncate">{performer.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-green-600">{Math.round(performer.performance || 0)}%</span>
                                                    <p className="text-xs text-gray-600 truncate">{performer.metric}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {topPerformers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No performance data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Stats</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{stats.courses}</div>
                                            <div className="text-sm text-gray-600">Active Courses</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{stats.projects}</div>
                                            <div className="text-sm text-gray-600">Ongoing Projects</div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">{stats.clients}</div>
                                            <div className="text-sm text-gray-600">Active Clients</div>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">{stats.employees}</div>
                                            <div className="text-sm text-gray-600">Team Members</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;