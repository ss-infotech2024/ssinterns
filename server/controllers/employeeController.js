// src/controllers/employeeController.js
import Employee from "../models/employeeModel.js";
import Attendance from "../models/attendenceModel.js";
import Task from "../models/taskModel.js";
import jwt from "jsonwebtoken";

// Password encryption utilities
const encryptPassword = (password) => {
  return Buffer.from(password).toString('base64');
};

const decryptPassword = (encryptedPassword) => {
  try {
    return Buffer.from(encryptedPassword, 'base64').toString('ascii');
  } catch (error) {
    return "Decryption Error";
  }
};

// ---------------------------------------------------------------------
// Helper: Recalculate performance & attendance
// ---------------------------------------------------------------------
const recalculateMetrics = async (employeeId) => {
  try {
    const totalDaysAttended = await Attendance.countDocuments({
      employee: employeeId,
      clockIn: { $exists: true },
      clockOut: { $exists: true }
    });

    const totalTasks = await Task.countDocuments({ assignedTo: employeeId });
    const completedTasks = await Task.countDocuments({
      assignedTo: employeeId,
      status: "Completed"
    });
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await Employee.findByIdAndUpdate(employeeId, {
      attendance: totalDaysAttended,
      performance: taskCompletionRate
    });
  } catch (error) {
    console.error("Error recalculating metrics:", error);
  }
};

// ---------------------------------------------------------------------
// EMPLOYEE: Login
// ---------------------------------------------------------------------
export const login = async (req, res) => {
  try {
    const { identifier, password, email, loginId } = req.body;
    const userIdentifier = identifier || email || loginId;

    if (!userIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password required"
      });
    }

    const employee = await Employee.findOne({
      $or: [
        { email: userIdentifier },
        { loginId: userIdentifier }
      ]
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Verify password
    const decryptedPassword = decryptPassword(employee.password);
    const isPasswordValid = password === decryptedPassword;

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Create JWT token (optional now)
    const token = jwt.sign(
      {
        id: employee._id,
        role: "employee",
        email: employee.email
      },
      process.env.JWT_SECRET || "employee_secret_key_2024",
      { expiresIn: "7d" }
    );

    await recalculateMetrics(employee._id);
    const updatedEmployee = await Employee.findById(employee._id).select('-password');

    res.json({
      success: true,
      message: "Login successful",
      token,
      employee: {
        _id: updatedEmployee._id,
        id: updatedEmployee._id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        loginId: updatedEmployee.loginId,
        position: updatedEmployee.position,
        department: updatedEmployee.department,
        employeeType: updatedEmployee.employeeType,
        performance: updatedEmployee.performance,
        attendance: updatedEmployee.attendance,
        status: updatedEmployee.status,
        salary: updatedEmployee.salary,
        pendingSalary: updatedEmployee.pendingSalary,
        paidSalary: updatedEmployee.paidSalary
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// GET ALL EMPLOYEES
// ---------------------------------------------------------------------
export const getAll = async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select('-password')
      .lean();

    const employeesWithDetails = await Promise.all(
      employees.map(async (emp) => {
        const tasks = await Task.find({ assignedTo: emp._id });
        const attendance = await Attendance.find({ employee: emp._id })
          .sort({ date: -1 })
          .limit(30);

        const completedTasks = tasks.filter(task => task.status === "Completed").length;
        const taskCompletion = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyAttendance = await Attendance.find({
          employee: emp._id,
          date: { $gte: startOfMonth },
          status: "Present"
        });
        const workingDays = 22;
        const attendancePercentage = monthlyAttendance.length > 0 ?
          Math.round((monthlyAttendance.length / workingDays) * 100) : 0;

        return {
          ...emp,
          tasks,
          attendance,
          performance: taskCompletion,
          attendancePercentage,
          taskCompletion
        };
      })
    );

    res.json({
      success: true,
      employees: employeesWithDetails,
      count: employeesWithDetails.length
    });
  } catch (err) {
    console.error("Get all employees error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// CREATE EMPLOYEE
// ---------------------------------------------------------------------
export const createEmployee = async (req, res) => {
  const {
    name, email, phone, department, position, salary, joiningDate,
    status = "Active", employeeType = "Employee", loginId, password,
  } = req.body;

  if (!name || !email || !department || !position || !salary || !joiningDate || !loginId || !password) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided"
    });
  }

  try {
    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { loginId }]
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Email or Login ID already exists"
      });
    }

    const encryptedPassword = encryptPassword(password);

    const employee = await Employee.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      department: Number(department),
      position: position.trim(),
      salary: Number(salary),
      joiningDate: new Date(joiningDate),
      status,
      employeeType,
      loginId: loginId.trim(),
      password: encryptedPassword,
      pendingSalary: Number(salary),
      paidSalary: 0,
    });

    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: employeeResponse,
      credentials: {
        name,
        email,
        loginId,
        password
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or Login ID already exists"
      });
    }
    console.error("Create employee error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};


// ---------------------------------------------------------------------
// BATCH CREATE EMPLOYEES (Multiple at once)
// ---------------------------------------------------------------------
export const batchCreateEmployees = async (req, res) => {
  try {
    const employeesData = req.body;

    // Check if input is an array
    if (!Array.isArray(employeesData)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an array of employees"
      });
    }

    // Validate each employee
    const errors = [];
    const validEmployees = [];

    for (let i = 0; i < employeesData.length; i++) {
      const emp = employeesData[i];
      const {
        name, email, phone, department, position, salary, joiningDate,
        status = "Active", employeeType = "Employee", loginId, password,
      } = emp;

      // Check required fields
      if (!name || !email || !department || !position || !salary || !joiningDate || !loginId || !password) {
        errors.push(`Employee ${i + 1} (${name || 'No Name'}): Missing required fields`);
        continue;
      }

      // Check for duplicates in batch
      const duplicateInBatch = validEmployees.some(e =>
        e.email === email.trim().toLowerCase() || e.loginId === loginId.trim()
      );

      if (duplicateInBatch) {
        errors.push(`Employee ${i + 1} (${name}): Email or Login ID duplicate in this batch`);
        continue;
      }

      validEmployees.push({
        ...emp,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "0000000000",
        department: Number(department),
        position: position.trim(),
        salary: Number(salary),
        joiningDate: new Date(joiningDate),
        status,
        employeeType,
        loginId: loginId.trim(),
        password: encryptPassword(password),
        pendingSalary: Number(salary),
        paidSalary: 0,
      });
    }

    if (errors.length > 0 && validEmployees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All employees have validation errors",
        errors
      });
    }

    // Check for existing employees in database
    const existingEmails = await Employee.find({
      email: { $in: validEmployees.map(e => e.email) }
    }).select('email loginId');

    const existingLoginIds = await Employee.find({
      loginId: { $in: validEmployees.map(e => e.loginId) }
    }).select('email loginId');

    const existingEmailSet = new Set(existingEmails.map(e => e.email));
    const existingLoginIdSet = new Set(existingLoginIds.map(e => e.loginId));

    const finalEmployees = [];
    const duplicateErrors = [];

    for (const emp of validEmployees) {
      if (existingEmailSet.has(emp.email)) {
        duplicateErrors.push(`Email ${emp.email} already exists`);
        continue;
      }
      if (existingLoginIdSet.has(emp.loginId)) {
        duplicateErrors.push(`Login ID ${emp.loginId} already exists`);
        continue;
      }
      finalEmployees.push(emp);
    }

    if (finalEmployees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All employees already exist in database",
        errors: duplicateErrors
      });
    }

    // Create employees in database
    const createdEmployees = await Employee.insertMany(finalEmployees, {
      ordered: false // Continue even if some fail
    });

    // Remove passwords from response
    const employeesResponse = createdEmployees.map(emp => {
      const empObj = emp.toObject();
      delete empObj.password;
      return empObj;
    });

    const successCount = createdEmployees.length;
    const failedCount = employeesData.length - successCount;

    res.status(201).json({
      success: true,
      message: `Successfully created ${successCount} employees. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
      count: successCount,
      employees: employeesResponse,
      summary: {
        total: employeesData.length,
        success: successCount,
        failed: failedCount,
        errors: errors.concat(duplicateErrors).slice(0, 10) // Limit errors in response
      }
    });

  } catch (err) {
    console.error("Batch create employees error:", err);

    if (err.code === 11000) {
      // Handle duplicate key error
      const duplicates = err.writeErrors?.map(error => error.errmsg) || [];
      return res.status(400).json({
        success: false,
        message: "Some employees have duplicate emails or login IDs",
        duplicates
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// GET EMPLOYEE BY ID
// ---------------------------------------------------------------------
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    const employee = await Employee.findById(id).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const tasks = await Task.find({ employeeId: id });
    const attendanceRecords = await Attendance.find({ employee: id });

    const completedTasks = tasks.filter(task => task.status === "Completed").length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const totalDaysAttended = await Attendance.countDocuments({
      employee: id,
      clockIn: { $exists: true },
      clockOut: { $exists: true }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthAttendance = await Attendance.countDocuments({
      employee: id,
      date: { $gte: startOfMonth },
      status: "Present"
    });

    const recentTasks = await Task.find({ employeeId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status priority dueDate');

    const recentAttendance = await Attendance.find({ employee: id })
      .sort({ date: -1 })
      .limit(7)
      .select('date clockIn clockOut status workingHours');

    const employeeData = {
      _id: employee._id,
      id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      loginId: employee.loginId,
      position: employee.position,
      department: employee.department,
      employeeType: employee.employeeType,
      status: employee.status,
      salary: employee.salary,
      pendingSalary: employee.pendingSalary,
      paidSalary: employee.paidSalary,
      joiningDate: employee.joiningDate,
      performance: employee.performance,
      attendance: employee.attendance,
      stats: {
        taskCompletionRate,
        totalTasks: tasks.length,
        completedTasks,
        totalDaysAttended,
        currentMonthAttendance,
        attendancePercentage: Math.round((currentMonthAttendance / 22) * 100)
      },
      recentActivity: {
        tasks: recentTasks,
        attendance: recentAttendance
      }
    };

    res.json({
      success: true,
      employee: employeeData
    });

  } catch (err) {
    console.error("Get employee by ID error:", err);

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// UPDATE EMPLOYEE
// ---------------------------------------------------------------------
export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  try {
    if (updates.salary) {
      const current = await Employee.findById(id);
      if (!current) {
        return res.status(404).json({
          success: false,
          message: "Employee not found"
        });
      }

      const newSalary = Number(updates.salary);
      const diff = newSalary - current.salary;

      updates.pendingSalary = Math.max(0, current.pendingSalary + diff);
      updates.salary = newSalary;
    }

    if (updates.department) updates.department = Number(updates.department);

    const employee = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee updated successfully",
      employee
    });
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// DELETE EMPLOYEE
// ---------------------------------------------------------------------
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await Attendance.deleteMany({ employee: id });
    await Task.deleteMany({ assignedTo: id });

    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// RESET PASSWORD
// ---------------------------------------------------------------------
export const resetPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters"
    });
  }

  try {
    const encryptedPassword = encryptPassword(newPassword.trim());
    const employee = await Employee.findByIdAndUpdate(
      id,
      { password: encryptedPassword },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Password reset successfully",
      credentials: {
        name: employee.name,
        email: employee.email,
        loginId: employee.loginId,
        password: newPassword.trim(),
      },
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------


export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const employeeId = req.user?.id; // employee logged in from token

    // ---------------------- VALIDATION ----------------------
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match."
      });
    }

    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request. Token missing."
      });
    }

    // ---------------------- FIND EMPLOYEE ----------------------
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    // ---------------------- CHECK CURRENT PASSWORD ----------------------
    const isMatched = await bcrypt.compare(currentPassword, employee.password);

    if (!isMatched) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect."
      });
    }

    // ---------------------- UPDATE PASSWORD ----------------------
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    employee.password = hashedPassword;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully."
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
    });
  }
};


// ---------------------------------------------------------------------
// GET EMPLOYEE PASSWORD
// ---------------------------------------------------------------------
export const getEmployeePassword = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const decryptedPassword = decryptPassword(employee.password);

    res.json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        loginId: employee.loginId,
      },
      password: decryptedPassword
    });
  } catch (err) {
    console.error("Get employee password error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// TASK MANAGEMENT - ADD TASK FUNCTION
// ---------------------------------------------------------------------
export const addTask = async (req, res) => {
  try {
    // Assuming your protectEmployee middleware sets req.employee
    const employeeId = req.employee?._id;   // or req.user._id — check your middleware!

    if (!employeeId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const { title, description, type, priority, dueDate, progress, status, notes } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const task = await Task.create({
      employeeId,           // from token, not body
      title,
      description: description || "",
      type: type || "Daily",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      progress: Number(progress) || 0,
      status: status || "Pending",
      notes: notes || "",
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required"
      });
    }

    const updateData = {
      ...updates,
      lastUpdated: new Date()
    };

    if (updates.progress !== undefined) {
      updateData.status = updates.progress === 100 ? "Completed" : "In Progress";
      if (updates.progress === 100) {
        updateData.completedAt = new Date();
      }
    }

    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      task
    });

  } catch (err) {
    console.error("Update task error:", err);

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required",
      });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
      deletedTask: {
        id: task._id,
        title: task.title,
      },
    });
  } catch (err) {
    console.error("Delete task error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// ---------------------------------------------------------------------
// GET TASKS
// ---------------------------------------------------------------------
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({})
      .sort({ createdAt: -1 })
      .populate('employeeId', 'name email');

    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// ---------------------------------------------------------------------
// GET EMPLOYEE TASKS
// ---------------------------------------------------------------------
export const getEmployeeTasks = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const employee = await Employee.findById(id).select("name email position department");
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const tasks = await Task.find({ employeeId: id })
      .sort({ createdAt: -1 })
      .populate("employeeId", "name email position department");

    res.json({
      success: true,
      tasks,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        position: employee.position,
        department: employee.department,
      },
      count: tasks.length,
    });
  } catch (err) {
    console.error("Get employee tasks error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// ---------------------------------------------------------------------
// GET EMPLOYEE ATTENDANCE
// ---------------------------------------------------------------------
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let query = { employee: id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('employee', 'name email position department')
      .limit(100);

    const totalDaysAttended = await Attendance.countDocuments({
      employee: id,
      clockIn: { $exists: true },
      clockOut: { $exists: true }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthDaysAttended = await Attendance.countDocuments({
      employee: id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      clockIn: { $exists: true },
      clockOut: { $exists: true }
    });

    res.json({
      success: true,
      attendance,
      count: attendance.length,
      stats: {
        totalDaysAttended,
        currentMonthDaysAttended
      }
    });
  } catch (err) {
    console.error("Get employee attendance error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ---------------------------------------------------------------------
// GET EMPLOYEE PERFORMANCE
// ---------------------------------------------------------------------
export const getEmployeePerformance = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await Task.find({
      employeeId: employeeId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task =>
      task.status === 'Completed' || task.status === 'completed'
    ).length;

    const taskCompletionRate = totalTasks > 0 ?
      Math.round((completedTasks / totalTasks) * 100) : 0;

    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $gte: thirtyDaysAgo }
    });

    const totalAttendanceDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record =>
      record.status === 'Present' || record.status === 'present'
    ).length;

    const attendanceRate = totalAttendanceDays > 0 ?
      Math.round((presentDays / totalAttendanceDays) * 100) : 0;

    const performanceScore = Math.round(
      (taskCompletionRate * 0.6) +
      (attendanceRate * 0.4)
    );

    const finalPerformanceScore = Math.min(100, Math.max(0, performanceScore));

    let performanceLevel;
    if (finalPerformanceScore >= 90) {
      performanceLevel = 'Excellent';
    } else if (finalPerformanceScore >= 80) {
      performanceLevel = 'Very Good';
    } else if (finalPerformanceScore >= 70) {
      performanceLevel = 'Good';
    } else if (finalPerformanceScore >= 60) {
      performanceLevel = 'Satisfactory';
    } else {
      performanceLevel = 'Needs Improvement';
    }

    const performanceData = {
      success: true,
      performance: finalPerformanceScore,
      performanceLevel: performanceLevel,
      breakdown: {
        taskCompletion: {
          rate: taskCompletionRate,
          completed: completedTasks,
          total: totalTasks
        },
        attendance: {
          rate: attendanceRate,
          present: presentDays,
          total: totalAttendanceDays,
          period: 'last 30 days'
        }
      },
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position
      }
    };

    res.status(200).json(performanceData);

  } catch (error) {
    console.error('Get employee performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating performance',
      error: error.message
    });
  }
};

// ---------------------------------------------------------------------
// GET CURRENT EMPLOYEE
// ---------------------------------------------------------------------
export const getCurrentEmployee = async (req, res) => {
  try {
    // Ensure authenticated user exists in request
    const employeeId = req.employee?.id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Employee ID missing from token"
      });
    }

    // Fetch employee excluding password
    const employee = await Employee.findById(employeeId).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Fetch tasks & attendance for this employee only
    const tasks = await Task.find({ employeeId: employee._id });
    const attendanceRecords = await Attendance.find({ employee: employee._id });

    // Task analytics
    const completedTasks = tasks.filter(task =>
      ["Completed", "completed"].includes(task.status)
    ).length;

    const taskCompletionRate =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Attendance analytics
    const totalDaysAttended = await Attendance.countDocuments({
      employee: employee._id,
      clockIn: { $exists: true },
      clockOut: { $exists: true }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthAttendance = await Attendance.countDocuments({
      employee: employee._id,
      date: { $gte: startOfMonth },
      status: "Present"
    });

    // Fetch recent tasks and attendance
    const recentTasks = await Task.find({ employeeId: employee._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status priority dueDate createdAt");

    const recentAttendance = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(7)
      .select("date clockIn clockOut status workingHours");

    // Preparing response payload
    const employeeData = {
      _id: employee._id,
      id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      loginId: employee.loginId,
      position: employee.position,
      department: employee.department,
      employeeType: employee.employeeType,
      status: employee.status,
      salary: employee.salary,
      pendingSalary: employee.pendingSalary,
      paidSalary: employee.paidSalary,
      joiningDate: employee.joiningDate,
      performance: employee.performance,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,

      stats: {
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks: tasks.length - completedTasks,
        taskCompletionRate,
        totalDaysAttended,
        currentMonthAttendance,
        attendancePercentage: Math.round((currentMonthAttendance / 22) * 100),
        overallPerformance: employee.performance || taskCompletionRate
      },

      recentActivity: {
        tasks: recentTasks,
        attendance: recentAttendance
      }
    };

    return res.status(200).json({
      success: true,
      message: "Employee data retrieved successfully",
      employee: employeeData
    });

  } catch (error) {
    console.error("Get current employee error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching employee data",
      error: error.message
    });
  }
};


// ---------------------------------------------------------------------
// UPDATE PROFILE
// ---------------------------------------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, department, position } = req.body;
    const employeeId = req.user?.id;

    // ----------- AUTH CHECK -----------
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request"
      });
    }

    // ----------- REQUIRED FIELDS VALIDATION -----------
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const formattedEmail = email.trim().toLowerCase();

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(formattedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // ----------- FIND EMPLOYEE -----------
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // ----------- UNIQUE EMAIL CHECK -----------
    if (formattedEmail !== employee.email.toLowerCase()) {
      const exists = await Employee.findOne({
        email: formattedEmail,
        _id: { $ne: employeeId }
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    // ----------- UPDATE DATA -----------
    const updatedData = {
      name: name.trim(),
      email: formattedEmail,
      updatedAt: new Date()
    };

    if (phone?.trim()) updatedData.phone = phone.trim();
    if (department?.trim()) updatedData.department = department.trim();
    if (position?.trim()) updatedData.position = position.trim();

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: updatedData },
      { new: true, runValidators: true }
    ).select("-password");

    // ----------- STATS REBUILDING -----------
    const tasks = await Task.find({ employeeId });
    const completedTasks = tasks.filter(t => ["Completed", "completed"].includes(t.status)).length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const totalDaysAttended = await Attendance.countDocuments({
      employee: employeeId,
      clockIn: { $exists: true },
      clockOut: { $exists: true }
    });

    // ----------- SUCCESS RESPONSE -----------
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      employee: {
        _id: updatedEmployee._id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone || "",
        loginId: updatedEmployee.loginId,
        department: updatedEmployee.department,
        position: updatedEmployee.position,
        stats: {
          totalTasks: tasks.length,
          completedTasks,
          taskCompletionRate,
          totalDaysAttended
        }
      }
    });

  } catch (error) {
    console.error("UpdateProfile Error:", error);

    // Duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages
      });
    }

    // Fallback
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: error.message
    });
  }
};

export const updateTaskByEmployee = async (req, res) => {
  const { employeeId, taskId } = req.params;
  const updates = req.body;

  try {
    if (!employeeId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and Task ID are required"
      });
    }

    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    // Auto-update status based on progress
    if (updates.progress !== undefined) {
      if (updates.progress === 100) {
        updateData.status = "Completed";
        updateData.completedAt = new Date();
      } else if (updates.progress > 0) {
        updateData.status = "In Progress";
      } else {
        updateData.status = "Pending";
      }
    }

    // Find task by employeeId + taskId
    const task = await Task.findOneAndUpdate(
      { _id: taskId, employeeId },
      updateData,
      { new: true, runValidators: true }
    ).populate("employeeId", "name email");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found for this employee"
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        employee: {
          _id: task.employeeId._id,
          name: task.employeeId.name,
          email: task.employeeId.email
        }
      }
    });

  } catch (err) {
    console.error("Update Task Error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};
export const getEmployeeWithTasks = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .select("name email") // ✅ only name & email
      .populate({
        path: "tasks",
        select: "title description status priority progress createdAt updatedAt",
        options: { sort: { createdAt: -1 } }
      });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        tasks: employee.tasks
      }
    });
  } catch (error) {
    console.error("Get Employee With Tasks Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getMyTasks = async (req, res) => {
  try {
    // req.employee comes from protectEmployee middleware
    const employeeId = req.employee._id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed - employee ID not found',
      });
    }

    const tasks = await Task.find({ employeeId })
      .sort({ createdAt: -1 })          // newest tasks first
      .select('-__v')                   // remove mongoose version key
      .lean();                          // faster plain JS objects

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching employee tasks:', error);

    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};