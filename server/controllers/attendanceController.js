import Attendance from "../models/attendenceModel.js";
import Employee from "../models/employeeModel.js";
import { startOfDay, endOfDay, format } from "date-fns";

import { isWithinAllowedRadius } from "../utils/isWithinAllowedRadius.js";
const getDayRange = (dateStr) => {
  const d = new Date(dateStr);
  return { start: startOfDay(d), end: endOfDay(d) };
};

/* ----------------------- CLOCK-IN ----------------------- */
export const clockIn = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    const { latitude, longitude, locationName } = req.body;

    /* 1️⃣ Validate GPS Access */
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Location access required. Please enable GPS.",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    /* 2️⃣ Validate Coordinates */
    if (
      isNaN(lat) || isNaN(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid location coordinates",
      });
    }

    /* 3️⃣ Verify Distance to Office */
    const { isAllowed, distance } = isWithinAllowedRadius(lat, lng);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Clock-in denied. You are ${distance}m away from office (max: ${process.env.ALLOWED_DISTANCE_METERS}m)`,
        distanceFromOffice: distance,
      });
    }

    /* 4️⃣ Find Employee */
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const today = getDayRange(new Date());

    /* 5️⃣ Check if attendance record already exists */
    const existing = await Attendance.findOne({
      employeeId,
      date: { $gte: today.start, $lte: today.end }
    });

    /* Prevent double clock-in without clock-out */
    if (existing?.clockIn && !existing.clockOut) {
      return res.status(400).json({
        success: false,
        message: "Already clocked in. Please clock out first.",
      });
    }

    /* 6️⃣ Prepare Location Object */
    const locationData = {
      name: locationName?.trim() || "Office",
      coordinates: [lng, lat], // GeoJSON format
      distanceFromOffice: distance,
    };

    let record;

    /* Update or create */
    if (existing) {
      existing.clockIn = new Date();
      existing.clockOut = null;
      existing.hoursWorked = 0;
      existing.status = "Present";
      existing.location = locationData;
      existing.isManual = false;

      await existing.save();
      record = existing;
    } else {
      record = await Attendance.create({
        employeeId,
        employeeName: employee.name,
        date: today.start,
        clockIn: new Date(),
        status: "Present",
        location: locationData,
        isManual: false,
      });
    }

    await record.populate("employeeId", "name email position department");

    return res.status(existing ? 200 : 201).json({
      success: true,
      message: "Clocked in successfully",
      attendance: record.toObject({ getters: true }),
      locationVerified: true,
      distance,
    });

  } catch (err) {
    console.error("Clock-in error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during clock-in",
      error: err.message,
    });
  }
};


/* ----------------------- CLOCK-OUT ----------------------- */
export const clockOut = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    const today = getDayRange(new Date());

    /* Find active record */
    const record = await Attendance.findOne({
      employeeId,
      date: { $gte: today.start, $lte: today.end },
      clockIn: { $exists: true },
      clockOut: { $exists: false }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No active clock-in found.",
      });
    }

    /* Clock-out */
    record.clockOut = new Date();
    record.hoursWorked = record.calculateHours();

    /* Update status based on hours */
    if (record.hoursWorked < 4) record.status = "Half Day";
    else if (record.hoursWorked < 8) record.status = "Late";
    else record.status = "Present";

    await record.save();
    await record.populate("employeeId", "name email position department");

    return res.json({
      success: true,
      message: "Clocked out successfully",
      attendance: record.toObject({ getters: true }),
    });

  } catch (err) {
    console.error("Clock-out error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during clock-out",
      error: err.message,
    });
  }
};
/* ------------------- DAILY ATTENDANCE ------------------- */
export const getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const target = date ? new Date(date) : new Date();
    const day = getDayRange(target);

    const isAdmin = req.employee?.role === "admin"; // admin field in Employee model
    const filter = isAdmin ? {} : { employeeId: req.employee._id };
    filter.date = { $gte: day.start, $lte: day.end };

    const records = await Attendance.find(filter)
      .populate("employeeId", "name email position department")
      .sort({ "employeeId.name": 1 });

    const total = records.length;
    const present = records.filter(r => r.status === "Present").length;
    const absent = records.filter(r => r.status === "Absent").length;
    const late = records.filter(r => r.clockIn && new Date(r.clockIn).getHours() >= 10).length;

    res.json({
      success: true,
      date: format(target, "yyyy-MM-dd"),
      summary: { total, present, absent, late },
      data: records.map(r => r.toObject({ getters: true })),
    });
  } catch (err) {
    console.error("Daily attendance error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/* ------------------- HISTORY ------------------- */
export const getAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, status, employeeId: qId, page = 1, limit = 30 } = req.query;
    const isAdmin = req.employee?.role === "admin";

    const filter = isAdmin ? {} : { employeeId: req.employee._id };
    if (isAdmin && qId) filter.employeeId = qId;
    if (startDate && endDate) {
      filter.date = {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate)),
      };
    }
    if (status) filter.status = status;

    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("employeeId", "name email position department");

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: records.map(r => r.toObject({ getters: true })),
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/* ------------------- MANUAL (Admin) ------------------- */
export const addManualAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, clockIn, clockOut, location } = req.body;
    if (!employeeId || !date || !status) {
      return res.status(400).json({ success: false, message: "employeeId, date, status required" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    const day = getDayRange(date);
    const existing = await Attendance.findOne({
      employeeId,
      date: { $gte: day.start, $lte: day.end },
    });
    if (existing) return res.status(400).json({ success: false, message: "Record already exists" });

    const base = date.split("T")[0];
    const inTime = clockIn ? new Date(`${base}T${clockIn}`) : null;
    const outTime = clockOut ? new Date(`${base}T${clockOut}`) : null;
    let hours = 0;
    if (inTime && outTime) hours = parseFloat(((outTime - inTime) / 3600000).toFixed(2));

    const rec = await Attendance.create({
      employeeId,
      employeeName: employee.name,
      date: day.start,
      clockIn: inTime || new Date(),
      clockOut: outTime,
      hoursWorked: hours,
      status,
      location: location?.trim() || "",
      isManual: true,
    });

    await rec.populate("employeeId", "name email position department");
    res.status(201).json({ success: true, message: "Manual entry added", attendance: rec.toObject({ getters: true }) });
  } catch (err) {
    console.error("Manual entry error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
// controllers/attendanceController.js

export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    
    console.log('Request params:', req.params);
    console.log('Request employee:', req.employee);
    console.log('Request user:', req.user);
    
    // Check authentication - try different possible locations for user data
    let authenticatedUser = req.employee || req.user;
    
    if (!authenticatedUser) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated" 
      });
    }

    // Check if user is admin or requesting their own data
    const isAdmin = authenticatedUser.role === "admin";
    const isOwnData = employeeId === authenticatedUser._id?.toString();
    
    if (!isAdmin && !isOwnData) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. You can only view your own attendance." 
      });
    }

    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Build filter
    const filter = { employeeId };
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate)),
      };
    } else {
      // Default to last 30 days using plain JavaScript (no subDays needed)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      filter.date = {
        $gte: startOfDay(thirtyDaysAgo),
        $lte: endOfDay(new Date()),
      };
    }

    // Get total count and paginated records
    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("employeeId", "name email position department");

    // Calculate statistics
    const presentDays = records.filter(record => 
      record.status === 'Present' || record.status === 'present'
    ).length;
    
    const totalDays = records.length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Calculate average hours worked
    const totalHours = records.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);
    const avgHoursWorked = records.length > 0 ? parseFloat((totalHours / records.length).toFixed(2)) : 0;

    res.json({
      success: true,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        position: employee.position,
        department: employee.department
      },
      statistics: {
        totalRecords: total,
        presentDays,
        totalDays,
        attendanceRate,
        avgHoursWorked,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit)
      },
      attendance: records.map(record => ({
        _id: record._id,
        date: record.date,
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        hoursWorked: record.hoursWorked,
        status: record.status,
        location: record.location,
        isManual: record.isManual,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }))
    });
  } catch (err) {
    console.error("Get employee attendance error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
// controllers/employeeStatusController.js


/**
 * Get real-time active status for all employees (for Admin Employee Management page)
 * Returns: isActive (true/false), lastClockIn, lastClockOut
 */
export const getEmployeesActiveStatus = async (req, res) => {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Find all attendance records for today where clockIn exists and clockOut is missing
    const activeRecords = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd },
      clockIn: { $exists: true },
      clockOut: { $exists: false }
    }).select("employeeId");

    // Extract active employee IDs
    const activeEmployeeIds = activeRecords.map(record => record.employeeId.toString());

    // Fetch all employees with minimal fields
    const employees = await Employee.find({})
      .select("name email position department status _id")
      .lean();

    // Enrich with active status
    const employeesWithStatus = employees.map(emp => {
      const isActive = activeEmployeeIds.includes(emp._id.toString());
      return {
        ...emp,
        isActive,
        statusDisplay: isActive ? "Active" : "Deactive"
      };
    });

    res.json({
      success: true,
      count: employeesWithStatus.length,
      employees: employeesWithStatus
    });

  } catch (err) {
    console.error("Get employees active status error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};



// export const getEmployeeActiveStatus = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Validate ID
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Employee ID is required",
//       });
//     }

//     // Define today in IST (MongoDB stores in UTC, but date range is safe)
//     const todayStart = startOfDay(new Date());
//     const todayEnd = endOfDay(new Date());

//     // Find active session: clocked in, not clocked out
//     const activeRecord = await Attendance.findOne({
//       employeeId: id,
//       date: { $gte: todayStart, $lte: todayEnd },
//       clockIn: { $exists: true },
//       clockOut: { $exists: false },
//     }).lean();

//     const isActive = !!activeRecord;

//     // Fetch employee details
//     const employee = await Employee.findById(id)
//       .select("name email position department")
//       .lean();

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     // Build response
//     res.json({
//       success: true,
//       employee: {
//         _id: employee._id,
//         name: employee.name,
//         email: employee.email,
//         position: employee.position,
//         department: employee.department,
//         isActive,
//         statusDisplay: isActive ? "Active" : "Deactive",
//         currentSession: isActive
//           ? {
//               clockIn: activeRecord.clockIn,
//               location: activeRecord.location || "Not specified",
//               duration: activeRecord.hoursWorked || null, // if you calculate live
//             }
//           : null,
//       },
//     });
//   } catch (err) {
//     console.error("Get employee active status error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };



// export const getEmployeesActiveStatus = async (req, res) => {
//   try {
//     const todayStart = startOfDay(new Date());
//     const todayEnd = endOfDay(new Date());

//     // Find all employees who are CURRENTLY CLOCKED IN (clockIn exists, clockOut missing)
//     const activeSessions = await Attendance.find({
//       date: { $gte: todayStart, $lte: todayEnd },
//       clockIn: { $exists: true },
//       clockOut: { $exists: false }
//     }).select("employeeId clockIn location");

//     const activeIds = new Set(activeSessions.map(s => s.employeeId.toString()));

//     // Fetch all employees
//     const employees = await Employee.find({})
//       .select("name email position department status _id")
//       .lean();

//     const employeesWithStatus = employees.map(emp => {
//       const isOnline = activeIds.has(emp._id.toString());
//       const session = activeSessions.find(s => s.employeeId.toString() === emp._id.toString());

//       return {
//         ...emp,
//         isOnline,
//         isActive: isOnline, // for backward compatibility
//         statusDisplay: isOnline ? "Online" : "Offline",
//         currentSession: isOnline ? {
//           clockIn: session.clockIn,
//           location: session.location || "Unknown"
//         } : null
//       };
//     });

//     res.json({
//       success: true,
//       count: employeesWithStatus.length,
//       employees: employeesWithStatus
//     });

//   } catch (err) {
//     console.error("getEmployeesActiveStatus error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

/**
 * Get single employee live status (optional)
 */
export const getEmployeeActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "ID required" });

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const activeRecord = await Attendance.findOne({
      employeeId: id,
      date: { $gte: todayStart, $lte: todayEnd },
      clockIn: { $exists: true },
      clockOut: { $exists: false }
    }).lean();

    const employee = await Employee.findById(id)
      .select("name email position department")
      .lean();

    if (!employee) return res.status(404).json({ success: false, message: "Not found" });

    res.json({
      success: true,
      employee: {
        ...employee,
        isOnline: !!activeRecord,
        statusDisplay: activeRecord ? "Online" : "Offline",
        currentSession: activeRecord ? {
          clockIn: activeRecord.clockIn,
          location: activeRecord.location
        } : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// routes/attendanceRoutes.js
// controllers/attendanceController.js  (add this function)

export  const getTodayClockStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = getDayRange(new Date());

    const record = await Attendance.findOne({
      employeeId,
      date: { $gte: today.start, $lte: today.end }
    });

    const isClockedIn = !!(record?.clockIn && !record.clockOut);

    res.json({
      success: true,
      isClockedIn,
      clockIn: record?.clockIn || null,
      clockOut: record?.clockOut || null
    });
  } catch (err) {
    console.error("Today status error:", err);
    res.status(500).json({ success: false, isClockedIn: false });
  }
};