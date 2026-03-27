import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Icons
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

const FileIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UploadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const DownloadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importStep, setImportStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    selectedCourse: "",
    totalFees: "",
    paidFees: ""
  });

  const [editStudent, setEditStudent] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    selectedCourse: "",
    totalFees: "",
    paidFees: "",
    status: "active"
  });

  // Static courses
  const courses = [
    { id: 1, name: "Web Development", fee: 50000, duration: "3 months" },
    { id: 2, name: "Data Science", fee: 75000, duration: "6 months" },
    { id: 3, name: "Digital Marketing", fee: 35000, duration: "2 months" },
    { id: 4, name: "Graphic Design", fee: 45000, duration: "4 months" },
  ];

  const API_URL = "https://ssinternsbackend.onrender.com/api/students";

  // Fetch all students
  const fetchStudents = async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const url = query ? `${API_URL}/search?q=${encodeURIComponent(query)}` : API_URL;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch students: ${res.status}`);
      }

      const json = await res.json();

      if (json.success) {
        setStudents(json.data || []);
      } else {
        throw new Error(json.message || "Failed to fetch students");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  // Demo data for when backend is not available
  const loadDemoData = () => {
    const demoStudents = [
      {
        _id: "1",
        name: "Priya Sharma",
        email: "priya@edu.com",
        phone: "+919876543210",
        selectedCourse: "1",
        courseName: "Web Development",
        totalFees: 50000,
        paidFees: 20000,
        pendingFees: 30000,
        enrollmentDate: "2024-01-15",
        status: "active"
      },
      {
        _id: "2",
        name: "Rahul Kumar",
        email: "rahul@edu.com",
        phone: "+919876543211",
        selectedCourse: "2",
        courseName: "Data Science",
        totalFees: 75000,
        paidFees: 50000,
        pendingFees: 25000,
        enrollmentDate: "2024-02-01",
        status: "active"
      }
    ];
    setStudents(demoStudents);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim() === "") {
        fetchStudents();
      } else {
        fetchStudents(searchTerm);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Success message timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId));
    return course ? course.name : "Unknown Course";
  };

  const getCourseFee = (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId));
    return course ? course.fee : 0;
  };

  const totalPendingFees = students.reduce((sum, student) => sum + (student.pendingFees || 0), 0);

  // EXCEL IMPORT FUNCTIONS
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      // Convert to student format
      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      const processedData = rows.map((row, index) => {
        const student = {
          _id: `import-${Date.now()}-${index}`,
          name: row[headers.indexOf("Name")] || row[0] || "",
          email: row[headers.indexOf("Email")] || row[1] || "",
          phone: row[headers.indexOf("Phone")] || row[2] || "",
          selectedCourse: findCourseId(row[headers.indexOf("Course")] || row[3] || ""),
          courseName: row[headers.indexOf("Course")] || row[3] || "Unknown Course",
          totalFees: parseInt(row[headers.indexOf("Total Fees")] || row[4] || 0),
          paidFees: parseInt(row[headers.indexOf("Paid Fees")] || row[5] || 0),
          pendingFees: parseInt(row[headers.indexOf("Total Fees")] || row[4] || 0) - parseInt(row[headers.indexOf("Paid Fees")] || row[5] || 0),
          enrollmentDate: row[headers.indexOf("Enrollment Date")] || row[6] || new Date().toISOString().split('T')[0],
          status: "active",
          isNew: true // Flag for preview
        };
        return student;
      }).filter(student => student.name); // Remove empty rows

      setImportData(processedData);
      setImportPreview(processedData.slice(0, 5)); // Show first 5 for preview
      setImportStep(2);
    };

    reader.readAsArrayBuffer(file);
  };

  const findCourseId = (courseName) => {
    const course = courses.find(c => c.name.toLowerCase() === courseName.toLowerCase());
    return course ? course.id.toString() : "1"; // Default to Web Development
  };

  const handleImportConfirm = async () => {
    try {
      setUploadProgress(0);
      setImportStep(3);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // In a real application, you would send to backend
      // For now, we'll add directly to state
      setTimeout(() => {
        const updatedStudents = [...students, ...importData.map(student => ({
          ...student,
          _id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))];

        setStudents(updatedStudents);
        setUploadProgress(100);

        setTimeout(() => {
          setShowImportModal(false);
          setImportStep(1);
          setImportData([]);
          setImportPreview([]);
          setUploadProgress(0);
          setSuccess(`Successfully imported ${importData.length} students!`);
        }, 1000);

        clearInterval(progressInterval);
      }, 2000);

    } catch (error) {
      console.error("Import error:", error);
      setError("Failed to import students: " + error.message);
      setImportStep(1);
    }
  };

  const handleExportExcel = () => {
    const exportData = students.map(student => ({
      "Name": student.name,
      "Email": student.email,
      "Phone": student.phone,
      "Course": student.courseName || getCourseName(student.selectedCourse),
      "Total Fees": student.totalFees,
      "Paid Fees": student.paidFees,
      "Pending Fees": student.pendingFees || student.totalFees - student.paidFees,
      "Enrollment Date": student.enrollmentDate,
      "Status": student.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Auto-size columns
    const maxWidth = exportData.reduce((w, r) => Math.max(w, r.Name.length), 10);
    worksheet['!cols'] = [{ wch: maxWidth }];

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(blob, `students-${new Date().toISOString().split('T')[0]}.xlsx`);
    setSuccess(`Exported ${students.length} students to Excel!`);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Name": "John Doe",
        "Email": "john@example.com",
        "Phone": "+1234567890",
        "Course": "Web Development",
        "Total Fees": 50000,
        "Paid Fees": 20000,
        "Enrollment Date": "2024-01-15"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(blob, "student-import-template.xlsx");
    setSuccess("Template downloaded successfully!");
  };

  // Add Student
  const handleAddStudent = async (e) => {
    e.preventDefault();

    const studentData = {
      ...newStudent,
      courseName: getCourseName(newStudent.selectedCourse),
      totalFees: parseInt(newStudent.totalFees),
      paidFees: parseInt(newStudent.paidFees || 0)
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudents(prev => [...prev, result.data]);
        setShowAddModal(false);
        setNewStudent({
          name: "",
          email: "",
          phone: "",
          selectedCourse: "",
          totalFees: "",
          paidFees: ""
        });
        setSuccess('Student added successfully!');
      } else {
        throw new Error(result.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Add student error:', error);
      setError(`Error: ${error.message}`);
    }
  };

  // Edit Student
  const handleEditStudent = async (e) => {
    e.preventDefault();

    const studentData = {
      ...editStudent,
      courseName: getCourseName(editStudent.selectedCourse),
      totalFees: parseInt(editStudent.totalFees),
      paidFees: parseInt(editStudent.paidFees || 0)
    };

    try {
      const response = await fetch(`${API_URL}/${editStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudents(prev =>
          prev.map(student =>
            student._id === editStudent.id ? result.data : student
          )
        );
        setShowEditModal(false);
        setEditStudent({
          id: "",
          name: "",
          email: "",
          phone: "",
          selectedCourse: "",
          totalFees: "",
          paidFees: "",
          status: "active"
        });
        setSuccess('Student updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('Update student error:', error);
      setError(`Error: ${error.message}`);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    try {
      const response = await fetch(`${API_URL}/${studentToDelete._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudents(prev => prev.filter(student => student._id !== studentToDelete._id));
        setShowDeleteModal(false);
        setStudentToDelete(null);
        setSuccess('Student deleted successfully!');
      } else {
        throw new Error(result.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Delete student error:', error);
      setError(`Error: ${error.message}`);
    }
  };

  const openEditModal = (student) => {
    setEditStudent({
      id: student._id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      selectedCourse: student.selectedCourse,
      totalFees: student.totalFees.toString(),
      paidFees: student.paidFees.toString(),
      status: student.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleInputChange = (e, isEdit = false) => {
    const { name, value } = e.target;

    if (isEdit) {
      setEditStudent(prev => ({
        ...prev,
        [name]: value
      }));

      if (name === 'selectedCourse' && value) {
        const courseFee = getCourseFee(value);
        setEditStudent(prev => ({
          ...prev,
          totalFees: courseFee.toString()
        }));
      }
    } else {
      setNewStudent(prev => ({
        ...prev,
        [name]: value
      }));

      if (name === 'selectedCourse' && value) {
        const courseFee = getCourseFee(value);
        setNewStudent(prev => ({
          ...prev,
          totalFees: courseFee.toString()
        }));
      }
    }
  };

  const resetImportProcess = () => {
    setImportStep(1);
    setImportData([]);
    setImportPreview([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading Students...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Student Management</h1>
          <p className="text-gray-600 mt-2">Manage Student Fees & Reminders</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 animate-pulse">
            <strong>Success: </strong>{success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error: </strong>{error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[
            { label: "Total Students", value: students.length, icon: UserIcon, color: "blue" },
            { label: "Active Courses", value: courses.length, icon: BookIcon, color: "green" },
            { label: "Pending Fees", value: `₹${totalPendingFees.toLocaleString()}`, icon: CurrencyIcon, color: "purple" },
            { label: "Excel Import", value: "Available", icon: FileIcon, color: "orange" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4" style={{
              borderLeftColor: i === 0 ? "#3B82F6" : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#F97316"
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-full bg-${stat.color}-100`}>
                  <stat.icon className={`w-4 h-4 md:w-6 md:h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons Bar */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6 p-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Students Directory</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <UploadIcon className="w-4 h-4" />
                Import Excel
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Student
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, phone, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
            />
            <SearchIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fees Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {student.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm md:text-base">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                          <div className="text-xs text-gray-400">{student.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium">{student.courseName || getCourseName(student.selectedCourse)}</div>
                      <div className="text-xs text-gray-500">₹{student.totalFees?.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        Paid: <span className="text-green-600 font-medium">₹{student.paidFees?.toLocaleString()}</span>
                      </div>
                      <div className={`text-xs ${student.pendingFees > 0 ? "text-red-600 font-medium" : "text-green-600"}`}>
                        Pending: ₹{student.pendingFees?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : student.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition"
                          title="Edit Student"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(student)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                          title="Delete Student"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">No students found</div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first student
                </button>
                <span className="text-gray-400">or</span>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Import from Excel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* IMPORT EXCEL MODAL */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    {importStep === 1 && "Import Students from Excel"}
                    {importStep === 2 && "Preview Import Data"}
                    {importStep === 3 && "Importing Students"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      resetImportProcess();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Step 1: Upload */}
                {importStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <UploadIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Upload Excel File</h4>
                      <p className="text-gray-600 mb-6">Upload an Excel file with student data. Download our template for the correct format.</p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-gray-700 font-medium mb-2">Click to upload or drag and drop</div>
                        <div className="text-gray-500 text-sm">Excel files only (.xlsx, .xls, .csv)</div>
                      </label>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-800 mb-2">File Format Requirements:</h5>
                      <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                        <li>Include columns: Name, Email, Phone, Course, Total Fees, Paid Fees, Enrollment Date</li>
                        <li>First row should contain column headers</li>
                        <li>Supported courses: Web Development, Data Science, Digital Marketing, Graphic Design</li>
                      </ul>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={downloadTemplate}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Download Excel Template
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Preview */}
                {importStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <EyeIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Preview Import Data</h4>
                      <p className="text-gray-600 mb-6">
                        Found <span className="font-bold text-green-600">{importData.length}</span> students to import.
                        Showing first 5 records.
                      </p>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Course</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Fees</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {importPreview.map((student, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{student.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                              <td className="px-4 py-3 text-sm">{student.courseName}</td>
                              <td className="px-4 py-3 text-sm">
                                <div>Total: ₹{student.totalFees?.toLocaleString()}</div>
                                <div className="text-green-600">Paid: ₹{student.paidFees?.toLocaleString()}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {importData.length > 5 && (
                      <div className="text-center text-sm text-gray-500">
                        + {importData.length - 5} more records...
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <button
                        onClick={resetImportProcess}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        ← Back to Upload
                      </button>
                      <button
                        onClick={handleImportConfirm}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                      >
                        Confirm Import ({importData.length} students)
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Importing */}
                {importStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <UploadIcon className="w-8 h-8 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Importing Students</h4>
                      <p className="text-gray-600 mb-6">Please wait while we import {importData.length} students...</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                      {uploadProgress < 100 ? "Processing data..." : "Import completed successfully!"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADD STUDENT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Add New Student</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newStudent.name}
                    onChange={(e) => handleInputChange(e, false)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={newStudent.email}
                    onChange={(e) => handleInputChange(e, false)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newStudent.phone}
                    onChange={(e) => handleInputChange(e, false)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Course *</label>
                  <select
                    name="selectedCourse"
                    value={newStudent.selectedCourse}
                    onChange={(e) => handleInputChange(e, false)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} - ₹{course.fee.toLocaleString()} ({course.duration})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Fees (₹) *</label>
                  <input
                    type="number"
                    name="totalFees"
                    value={newStudent.totalFees}
                    onChange={(e) => handleInputChange(e, false)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Fees (₹)</label>
                  <input
                    type="number"
                    name="paidFees"
                    value={newStudent.paidFees}
                    onChange={(e) => handleInputChange(e, false)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT STUDENT MODAL */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Edit Student</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editStudent.name}
                    onChange={(e) => handleInputChange(e, true)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={editStudent.email}
                    onChange={(e) => handleInputChange(e, true)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editStudent.phone}
                    onChange={(e) => handleInputChange(e, true)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Course *</label>
                  <select
                    name="selectedCourse"
                    value={editStudent.selectedCourse}
                    onChange={(e) => handleInputChange(e, true)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} - ₹{course.fee.toLocaleString()} ({course.duration})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Fees (₹) *</label>
                  <input
                    type="number"
                    name="totalFees"
                    value={editStudent.totalFees}
                    onChange={(e) => handleInputChange(e, true)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Fees (₹)</label>
                  <input
                    type="number"
                    name="paidFees"
                    value={editStudent.paidFees}
                    onChange={(e) => handleInputChange(e, true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editStudent.status}
                    onChange={(e) => handleInputChange(e, true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition"
                  >
                    Update Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Confirm Delete</h3>
                  <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {studentToDelete?.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{studentToDelete?.name}</div>
                    <div className="text-sm text-gray-600">{studentToDelete?.email}</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete <span className="font-semibold">{studentToDelete?.name}</span>? This action cannot be undone and all associated data will be permanently removed.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStudent}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDENT DETAILS MODAL */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Student Details</h3>
                  <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4">
                    {selectedStudent.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h4>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{selectedStudent.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium">{selectedStudent.courseName || getCourseName(selectedStudent.selectedCourse)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Fees:</span>
                    <span className="font-medium">₹{selectedStudent.totalFees?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Fees:</span>
                    <span className="font-medium text-green-600">₹{selectedStudent.paidFees?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Fees:</span>
                    <span className={`font-medium ${selectedStudent.pendingFees > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{(selectedStudent.pendingFees || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enrollment Date:</span>
                    <span className="font-medium">{selectedStudent.enrollmentDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedStudent.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : selectedStudent.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      openEditModal(selectedStudent);
                      setSelectedStudent(null);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
                  >
                    Edit Student Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;