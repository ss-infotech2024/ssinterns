import React, { useState, useEffect, useCallback } from "react";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  BellIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  XMarkIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Enhanced API service functions with better error handling
const courseAPI = {
  getAllCourses: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('Fetching courses from API...');
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response status:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminEmail');
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.message || `Failed to fetch courses: ${response.status}`);
      }

      const data = await response.json();
      console.log('Courses data received:', data);
      return data;
    } catch (error) {
      console.error('API getAllCourses error:', error);
      throw error;
    }
  },

  createCourse: async (courseData) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });

        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userRole');
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Invalid course data. Please check all fields.');
        } else if (response.status === 409) {
          throw new Error(data.message || 'Course with this title already exists.');
        } else {
          throw new Error(data.message || `Server error: ${response.status}`);
        }
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  },

  updateCourse: async (courseId, courseData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(courseData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update course');
    }

    return response.json();
  },

  deleteCourse: async (courseId) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete course');
    }

    return response.json();
  },

  addStudent: async (courseId, studentData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`http://localhost:5000/api/courses/${courseId}/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add student');
    }

    return response.json();
  },

  updateStudent: async (courseId, studentId, studentData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`http://localhost:5000/api/courses/${courseId}/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update student');
    }

    return response.json();
  },

  deleteStudent: async (courseId, studentId) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`http://localhost:5000/api/courses/${courseId}/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete student');
    }

    return response.json();
  },

  updateReminder: async (courseId, studentId, reminderMessage) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`http://localhost:5000/api/courses/${courseId}/students/${studentId}/reminder`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reminderMessage })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update reminder');
    }

    return response.json();
  }
};

// Custom Hook
const useCourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading courses...');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Please login to access courses');
        setLoading(false);
        return;
      }

      const response = await courseAPI.getAllCourses();
      console.log('Courses response:', response);

      if (response.success) {
        setCourses(response.courses || []);
      } else {
        setError(response.message || 'Failed to load courses');
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      setError(err.message || 'Failed to load courses. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return { courses, loading, error, loadCourses, setCourses };
};

// Utility Functions
const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;

const calculateDuration = (start, end) => {
  if (!start || !end) return 'N/A';
  try {
    const days = differenceInDays(new Date(end), new Date(start));
    return `${days} days`;
  } catch {
    return 'N/A';
  }
};

const getCourseStatus = (startDate, endDate) => {
  if (!startDate || !endDate) return 'upcoming';

  try {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isBefore(now, start)) return 'upcoming';
    if (isAfter(now, end)) return 'completed';
    return 'ongoing';
  } catch {
    return 'upcoming';
  }
};

const getStatusBadge = (status) => {
  const statusConfig = {
    upcoming: { color: 'bg-blue-100 text-blue-800', label: 'Upcoming' },
    ongoing: { color: 'bg-green-100 text-green-800', label: 'Ongoing' },
    completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' }
  };

  const config = statusConfig[status] || statusConfig.upcoming;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const getFeeStatusBadge = (student) => {
  const totalFee = student?.totalFee || 0;
  const paidAmount = student?.paidAmount || 0;
  const isPaid = paidAmount >= totalFee;
  const isPartial = paidAmount > 0 && paidAmount < totalFee;

  if (isPaid) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Paid
      </span>
    );
  } else if (isPartial) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
        Partial
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="w-4 h-4 mr-1" />
        Pending
      </span>
    );
  }
};

// Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading courses...</p>
    </div>
  </div>
);

const ErrorDisplay = ({ error, onRetry, onLogin }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Courses</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          {(error.includes('login') || error.includes('Authentication') || error.includes('Please login') || error.includes('Session')) ? (
            <button
              onClick={onLogin}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Go to Login
            </button>
          ) : (
            <>
              <button
                onClick={onRetry}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </>
          )}
        </div>
        {error.includes('server') && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <p><strong>Server Connection Issue:</strong></p>
            <p>• Check if backend server is running on port 5000</p>
            <p>• Verify API endpoint: http://localhost:5000/api/courses</p>
            <p>• Check console for detailed error messages</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const EmptyState = ({ onCreateCourse }) => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="text-center">
      <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <p className="text-xl text-gray-500 mb-4">No courses available</p>
      <button
        onClick={onCreateCourse}
        className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 flex items-center mx-auto"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        Create First Course
      </button>
    </div>
  </div>
);

const AnalyticsDashboard = ({ analytics }) => (
  <div className="mb-8">
    <div className="text-center mb-6">
      <h2 className="text-lg font-semibold text-gray-700">Fees, Attendance & Reminders</h2>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-blue-500">
        <div>
          <p className="text-3xl font-bold text-blue-600">{analytics.totalStudents}</p>
          <p className="text-sm text-gray-600 mt-1">Students</p>
        </div>
        <div className="bg-blue-100 p-3 rounded-full">
          <UsersIcon className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-green-500">
        <div>
          <p className="text-3xl font-bold text-green-600">{analytics.totalCourses}</p>
          <p className="text-sm text-gray-600 mt-1">Courses</p>
        </div>
        <div className="bg-green-100 p-3 rounded-full">
          <AcademicCapIcon className="w-6 h-6 text-green-600" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-purple-500">
        <div>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(analytics.totalPendingFees)}</p>
          <p className="text-sm text-gray-600 mt-1">Pending Fees</p>
        </div>
        <div className="bg-purple-100 p-3 rounded-full">
          <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-orange-500">
        <div>
          <p className="text-3xl font-bold text-orange-600">{analytics.reminders}</p>
          <p className="text-sm text-gray-600 mt-1">Reminders</p>
        </div>
        <div className="bg-orange-100 p-3 rounded-full">
          <BellIcon className="w-6 h-6 text-orange-600" />
        </div>
      </div>
    </div>
  </div>
);

const CourseSelector = ({ courses, selectedCourse, onSelectCourse }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
      <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
      Courses ({courses.length})
    </h3>
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {courses.map((course) => {
        const status = getCourseStatus(course.startDate, course.endDate);
        return (
          <div
            key={course._id}
            onClick={() => onSelectCourse(course)}
            className={`p-3 rounded cursor-pointer transition-colors border ${selectedCourse?._id === course._id
              ? "bg-indigo-50 border-l-4 border-indigo-600"
              : "hover:bg-gray-50 border-gray-200"
              }`}
          >
            <div className="flex justify-between items-start">
              <p className="font-medium text-sm">{course.title}</p>
              {getStatusBadge(status)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(course.startDate), "MMM d")} - {format(new Date(course.endDate), "MMM d, yyyy")}
            </p>
            <p className="text-xs text-gray-600 mt-1">{course.students?.length || 0} students</p>
          </div>
        );
      })}
    </div>
  </div>
);

const CourseDetails = ({ course, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-gray-800">{course.title}</h2>
          {getStatusBadge(getCourseStatus(course.startDate, course.endDate))}
        </div>
        <p className="text-sm text-gray-600 mb-3">{course.description}</p>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-1 text-indigo-600" />
            <span><strong>Start:</strong> {format(new Date(course.startDate), "dd MMM yyyy")}</span>
          </div>
          <div className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-1 text-red-600" />
            <span><strong>End:</strong> {format(new Date(course.endDate), "dd MMM yyyy")}</span>
          </div>
          <div className="flex items-center">
            <UsersIcon className="w-5 h-5 mr-1 text-green-600" />
            <span><strong>Students:</strong> {course.students?.length || 0}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          title="Edit Course"
        >
          <PencilIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete Course"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>

    {course.whatYouLearn && (
      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
          <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-600" />
          What You'll Learn
        </h4>
        <p className="text-sm text-gray-600">{course.whatYouLearn}</p>
      </div>
    )}
  </div>
);

const StudentsTable = ({ students, onAddStudent, onEditStudent, onDeleteStudent, onViewStudent, onSendReminder }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-4 border-b flex justify-between items-center">
      <h3 className="font-semibold text-gray-700 flex items-center">
        <UsersIcon className="w-5 h-5 mr-2 text-indigo-600" />
        Enrolled Students ({students.length})
      </h3>
      <button
        onClick={onAddStudent}
        className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 flex items-center transition-colors"
      >
        <UserPlusIcon className="w-4 h-4 mr-1" />
        Add Student
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Details</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No students enrolled yet.</p>
                <button
                  onClick={onAddStudent}
                  className="text-indigo-600 hover:text-indigo-800 text-sm mt-2"
                >
                  Add your first student
                </button>
              </td>
            </tr>
          ) : (
            students.map((student) => {
              const pending = (student.totalFee || 0) - (student.paidAmount || 0);
              return (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onViewStudent(student)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:underline text-left"
                    >
                      {student.name}
                    </button>
                    <div className="text-xs text-gray-500 mt-1">
                      Joined: {format(new Date(student.joinDate), "dd MMM yyyy")}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <EnvelopeIcon className="w-4 h-4 mr-1" />
                      {student.email}
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <PhoneIcon className="w-4 h-4 mr-1" />
                      {student.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">{formatCurrency(student.totalFee)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-600">Paid:</span>
                        <span className="text-blue-600">{formatCurrency(student.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-600">Pending:</span>
                        <span className="text-red-600 font-medium">{formatCurrency(pending)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getFeeStatusBadge(student)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {pending > 0 && (
                        <button
                          onClick={() => onSendReminder(student)}
                          className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                          title="Send WhatsApp Reminder"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.263c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onEditStudent(student)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                        title="Edit Student"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteStudent(student._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        title="Delete Student"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const CourseModal = ({ show, onClose, course, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    whatYouLearn: '',
    startDate: '',
    endDate: '',
    category: 'General',
    maxStudents: 50
  });

  // Reset form when modal opens/closes or course changes
  useEffect(() => {
    if (show) {
      if (course) {
        // Editing existing course
        setFormData({
          title: course.title || '',
          description: course.description || '',
          whatYouLearn: course.whatYouLearn || '',
          startDate: course.startDate ? format(new Date(course.startDate), 'yyyy-MM-dd') : '',
          endDate: course.endDate ? format(new Date(course.endDate), 'yyyy-MM-dd') : '',
          category: course.category || 'General',
          maxStudents: course.maxStudents || 50
        });
      } else {
        // Creating new course - set default dates
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);

        setFormData({
          title: '',
          description: '',
          whatYouLearn: '',
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(nextMonth, 'yyyy-MM-dd'),
          category: 'General',
          maxStudents: 50
        });
      }
    }
  }, [show, course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              {course ? "Edit Course" : "Create New Course"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter course title"
              required
              minLength="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Course description"
              required
              minLength="10"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What You'll Learn *</label>
            <textarea
              name="whatYouLearn"
              value={formData.whatYouLearn}
              onChange={handleChange}
              placeholder="Key learning objectives"
              required
              minLength="10"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Course category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
              <input
                type="number"
                name="maxStudents"
                value={formData.maxStudents}
                onChange={handleChange}
                placeholder="Maximum students"
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                course ? "Update Course" : "Create Course"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentModal = ({ show, onClose, student, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: format(new Date(), 'yyyy-MM-dd'),
    totalFee: 18000,
    paidAmount: 0
  });

  useEffect(() => {
    if (show) {
      if (student) {
        setFormData({
          name: student.name || '',
          email: student.email || '',
          phone: student.phone ? student.phone.replace('+91', '') : '',
          joinDate: student.joinDate ? format(new Date(student.joinDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          totalFee: student.totalFee || 18000,
          paidAmount: student.paidAmount || 0
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          joinDate: format(new Date(), 'yyyy-MM-dd'),
          totalFee: 18000,
          paidAmount: 0
        });
      }
    }
  }, [show, student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              {student ? "Edit Student" : "Add New Student"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter student name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              required
              pattern="[0-9]{10}"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Join Date *</label>
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₹) *</label>
              <input
                type="number"
                name="totalFee"
                value={formData.totalFee}
                onChange={handleChange}
                placeholder="Total course fee"
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
              <input
                type="number"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleChange}
                placeholder="Amount paid"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                student ? "Update Student" : "Add Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentDetailModal = ({ show, student, course, onClose, onSendReminder, onUpdateReminder }) => {
  const [reminderMessage, setReminderMessage] = useState('');

  useEffect(() => {
    if (student) {
      setReminderMessage(student.reminderMessage || '');
    }
  }, [student]);

  if (!show || !student) return null;

  const pending = (student.totalFee || 0) - (student.paidAmount || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white text-blue-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mr-3">
              {student.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold">{student.name}</h3>
              <p className="text-sm opacity-90">Student Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Personal Information
              </h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="py-1 font-medium">Full Name</td><td className="py-1">{student.name}</td></tr>
                  <tr><td className="py-1 font-medium">Email</td><td className="py-1">{student.email}</td></tr>
                  <tr><td className="py-1 font-medium">Phone</td><td className="py-1">{student.phone}</td></tr>
                  <tr><td className="py-1 font-medium">Enrolled</td><td className="py-1">{format(new Date(student.joinDate), "dd MMM yyyy")}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2 text-green-600" />
                Course Details
              </h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="py-1 font-medium">Course</td><td className="py-1">{course?.title}</td></tr>
                  <tr><td className="py-1 font-medium">Duration</td><td className="py-1">{calculateDuration(course?.startDate, course?.endDate)}</td></tr>
                  <tr><td className="py-1 font-medium">Total Fee</td><td className="py-1 text-green-600 font-semibold">{formatCurrency(student.totalFee)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-5">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <CurrencyDollarIcon className="w-5 h-5 mr-2 text-blue-600" />
              Financial Overview
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(student.totalFee)}</p>
                <p className="text-xs text-gray-600">Total Fee</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(student.paidAmount)}</p>
                <p className="text-xs text-gray-600">Paid</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(pending)}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          {pending > 0 && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                <BellIcon className="w-5 h-5 mr-2 text-orange-600" />
                Custom Reminder Message
              </h4>
              <textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                onBlur={() => onUpdateReminder(reminderMessage)}
                placeholder="Enter custom reminder message for WhatsApp..."
                className="w-full p-3 border border-orange-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                rows="3"
              />
            </div>
          )}

          <div className="flex justify-center gap-3 pt-4">
            {pending > 0 && (
              <button
                onClick={() => onSendReminder(student)}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.263c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
                Send WhatsApp
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CourseManagement = () => {
  const { courses, loading, error, loadCourses, setCourses } = useCourseManagement();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalPendingFees: 0,
    reminders: 0
  });

  const handleLoginRedirect = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminEmail');
    window.location.href = '/admin/login';
  };

  // Calculate analytics from courses
  useEffect(() => {
    if (courses && courses.length > 0) {
      const totalStudents = courses.reduce((sum, course) => sum + (course.students?.length || 0), 0);
      const totalPendingFees = courses.reduce((sum, course) => {
        const coursePending = course.students?.reduce((studentSum, student) => {
          return studentSum + (Math.max(0, (student.totalFee || 0) - (student.paidAmount || 0)));
        }, 0) || 0;
        return sum + coursePending;
      }, 0);
      const reminders = courses.reduce((sum, course) => {
        return sum + (course.students?.filter(student => {
          const pending = (student.totalFee || 0) - (student.paidAmount || 0);
          return pending > 0;
        }).length || 0);
      }, 0);

      setAnalytics({
        totalStudents,
        totalCourses: courses.length,
        totalPendingFees,
        reminders
      });

      if (!selectedCourse && courses.length > 0) {
        setSelectedCourse(courses[0]);
      }
    } else {
      setAnalytics({
        totalStudents: 0,
        totalCourses: 0,
        totalPendingFees: 0,
        reminders: 0
      });
      setSelectedCourse(null);
    }
  }, [courses, selectedCourse]);

  // Course CRUD Operations
  const handleSaveCourse = async (formData) => {
    try {
      console.log('Saving course:', formData);

      // Enhanced validation and data preparation
      const courseData = {
        title: formData.title?.trim() || '',
        description: formData.description?.trim() || '',
        whatYouLearn: formData.whatYouLearn?.trim() || '',
        language: "English",
        startDate: formData.startDate,
        endDate: formData.endDate,
        category: formData.category || "General",
        maxStudents: parseInt(formData.maxStudents) || 50
      };

      // Enhanced validation
      if (!courseData.title || courseData.title.length < 3) {
        alert('Course title must be at least 3 characters long');
        return;
      }

      if (!courseData.description || courseData.description.length < 10) {
        alert('Course description must be at least 10 characters long');
        return;
      }

      if (!courseData.whatYouLearn || courseData.whatYouLearn.length < 10) {
        alert('Learning objectives must be at least 10 characters long');
        return;
      }

      if (!courseData.startDate || !courseData.endDate) {
        alert('Please select both start and end dates');
        return;
      }

      // Date validation
      const startDate = new Date(courseData.startDate);
      const endDate = new Date(courseData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        alert('Start date cannot be in the past');
        return;
      }

      if (endDate <= startDate) {
        alert('End date must be after start date');
        return;
      }

      console.log('Final course data being sent:', courseData);

      let response;
      if (editingCourse) {
        console.log('Updating course:', editingCourse._id);
        response = await courseAPI.updateCourse(editingCourse._id, courseData);
      } else {
        console.log('Creating new course');
        response = await courseAPI.createCourse(courseData);
      }

      console.log('API Response:', response);

      if (response.success) {
        await loadCourses();

        // Update selected course
        if (editingCourse) {
          setSelectedCourse(response.course);
        } else if (response.course) {
          setSelectedCourse(response.course);
        }

        setShowCourseModal(false);
        setEditingCourse(null);

        alert(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
      } else {
        throw new Error(response.message || 'Failed to save course');
      }
    } catch (err) {
      console.error('Error saving course:', err);

      // More specific error handling
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        alert('A course with this title already exists. Please use a different title.');
      } else if (err.message.includes('Authentication') || err.message.includes('Session')) {
        alert('Your session has expired. Please login again.');
        handleLoginRedirect();
      } else if (err.message.includes('Validation')) {
        alert(`Validation error: ${err.message}`);
      } else {
        alert(err.message || 'Failed to save course. Please check your data and try again.');
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course and all its students?")) {
      try {
        const response = await courseAPI.deleteCourse(courseId);
        if (response.success) {
          await loadCourses();
          if (selectedCourse?._id === courseId) {
            setSelectedCourse(courses.find(c => c._id !== courseId) || null);
          }
          alert('Course deleted successfully!');
        } else {
          alert(response.message || 'Failed to delete course');
        }
      } catch (err) {
        console.error('Error deleting course:', err);
        alert(err.message || 'Failed to delete course');
        if (err.message.includes('Authentication') || err.message.includes('Session')) {
          handleLoginRedirect();
        }
      }
    }
  };

  // Student CRUD Operations
  const handleSaveStudent = async (formData) => {
    try {
      console.log('Saving student:', formData);

      const totalFee = parseInt(formData.totalFee) || 18000;
      const paidAmount = parseInt(formData.paidAmount) || 0;

      // Validation
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const studentData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: `+91${formData.phone.trim()}`,
        joinDate: formData.joinDate,
        totalFee,
        paidAmount
      };

      let response;
      if (editingStudent) {
        console.log('Updating student:', editingStudent._id, studentData);
        response = await courseAPI.updateStudent(
          selectedCourse._id,
          editingStudent._id,
          studentData
        );
      } else {
        console.log('Adding student:', studentData);
        response = await courseAPI.addStudent(selectedCourse._id, studentData);
      }

      console.log('Save student response:', response);

      if (response.success) {
        await loadCourses();
        setShowStudentModal(false);
        setEditingStudent(null);
        alert(editingStudent ? 'Student updated successfully!' : 'Student added successfully!');
      } else {
        alert(response.message || 'Failed to save student');
      }
    } catch (err) {
      console.error('Error saving student:', err);
      alert(err.message || 'Failed to save student');
      if (err.message.includes('Authentication') || err.message.includes('Session')) {
        handleLoginRedirect();
      }
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("Are you sure you want to remove this student from the course?")) {
      try {
        const response = await courseAPI.deleteStudent(selectedCourse._id, studentId);
        if (response.success) {
          await loadCourses();
          alert('Student deleted successfully!');
        } else {
          alert(response.message || 'Failed to delete student');
        }
      } catch (err) {
        console.error('Error deleting student:', err);
        alert(err.message || 'Failed to delete student');
        if (err.message.includes('Authentication') || err.message.includes('Session')) {
          handleLoginRedirect();
        }
      }
    }
  };

  const sendWhatsAppReminder = (student) => {
    const pending = (student.totalFee || 0) - (student.paidAmount || 0);
    const message = student.reminderMessage ||
      `Dear ${student.name},\n\nYour pending fee is *${formatCurrency(pending)}*.\nPlease pay soon to continue your course.\n\nThank you!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${student.phone}?text=${encodedMessage}`;

    window.open(whatsappURL, "_blank");
  };

  const updateStudentReminder = async (message) => {
    try {
      const response = await courseAPI.updateReminder(
        selectedCourse._id,
        selectedStudent._id,
        message
      );

      if (response.success) {
        // Update local state
        setCourses(prev =>
          prev.map(c =>
            c._id === selectedCourse._id
              ? {
                ...c,
                students: c.students.map(s =>
                  s._id === selectedStudent._id
                    ? { ...s, reminderMessage: message }
                    : s
                )
              }
              : c
          )
        );
        setSelectedStudent(prev => ({ ...prev, reminderMessage: message }));
        alert('Reminder message updated successfully!');
      } else {
        alert(response.message || 'Failed to update reminder');
      }
    } catch (err) {
      console.error('Error updating reminder:', err);
      alert(err.message || 'Failed to update reminder');
      if (err.message.includes('Authentication') || err.message.includes('Session')) {
        handleLoginRedirect();
      }
    }
  };

  // Modal handlers
  const openCourseModal = (course = null) => {
    console.log('Opening course modal:', course);
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const closeCourseModal = () => {
    setShowCourseModal(false);
    setEditingCourse(null);
  };

  const openStudentModal = (student = null) => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }
    setEditingStudent(student);
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setEditingStudent(null);
  };

  const openStudentDetail = (student) => {
    setSelectedStudent(student);
    setShowStudentDetailModal(true);
  };

  const closeStudentDetailModal = () => {
    setShowStudentDetailModal(false);
    setSelectedStudent(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={loadCourses} onLogin={handleLoginRedirect} />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Show empty state when no courses */}
        {(!courses || courses.length === 0) ? (
          <EmptyState onCreateCourse={() => openCourseModal()} />
        ) : (
          <>
            {/* Analytics Dashboard */}
            <AnalyticsDashboard analytics={analytics} />

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Course Management</h1>
                <p className="text-gray-600 mt-1">Manage your courses and student enrollments</p>
              </div>
              <button
                onClick={() => openCourseModal()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Course
              </button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Course Selector */}
              <div className="lg:col-span-1">
                <CourseSelector
                  courses={courses}
                  selectedCourse={selectedCourse}
                  onSelectCourse={setSelectedCourse}
                />
              </div>

              {/* Course Details & Students */}
              {selectedCourse && (
                <div className="lg:col-span-3 space-y-6">
                  <CourseDetails
                    course={selectedCourse}
                    onEdit={() => openCourseModal(selectedCourse)}
                    onDelete={() => handleDeleteCourse(selectedCourse._id)}
                  />

                  <StudentsTable
                    students={selectedCourse.students || []}
                    onAddStudent={() => openStudentModal()}
                    onEditStudent={openStudentModal}
                    onDeleteStudent={handleDeleteStudent}
                    onViewStudent={openStudentDetail}
                    onSendReminder={sendWhatsAppReminder}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CourseModal
        show={showCourseModal}
        onClose={closeCourseModal}
        course={editingCourse}
        onSave={handleSaveCourse}
      />

      <StudentModal
        show={showStudentModal}
        onClose={closeStudentModal}
        student={editingStudent}
        onSave={handleSaveStudent}
      />

      <StudentDetailModal
        show={showStudentDetailModal}
        student={selectedStudent}
        course={selectedCourse}
        onClose={closeStudentDetailModal}
        onSendReminder={sendWhatsAppReminder}
        onUpdateReminder={updateStudentReminder}
      />
    </div>
  );
};

export default CourseManagement;