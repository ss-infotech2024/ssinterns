import Lead from "../models/leadModel.js";
import Employee from "../models/employeeModel.js";

// Helper: Catch Async Errors
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

// =============== EMPLOYEE CONTROLLERS ===============

// 1. Create New Lead
export const createLead = catchAsync(async (req, res) => {
  const { broughtBy, name, email, phone, leadType, courseName, companyName, jobRole, message, source } = req.body;

  const employee = await Employee.findById(broughtBy);
  if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });
  if (employee.status !== "Active") return res.status(400).json({ success: false, message: "Employee is inactive" });

  const lead = await Lead.create({
    broughtBy,
    name,
    email,
    phone,
    leadType,
    courseName: leadType === "Course" ? courseName : undefined,
    companyName: leadType === "Hiring" ? companyName : undefined,
    jobRole: leadType === "Hiring" ? jobRole : undefined,
    message,
    source: source || "Website",
  });

  res.status(201).json({
    success: true,
    message: "Lead created successfully",
    data: lead,
  });
});

// 2. Get My Leads (Employee) - With Payment Status & Stats
export const getAllLeads = catchAsync(async (req, res) => {
  const employeeId = req.employee._id;

  const { page = 1, limit = 10, status, paymentStatus } = req.query;

  const filter = { broughtBy: employeeId };
  if (status && status !== "all") filter.status = status;
  if (paymentStatus && paymentStatus !== "all") filter.paymentStatus = paymentStatus;

  const total = await Lead.countDocuments(filter);
  const leads = await Lead.find(filter)
    .select("name phone leadType status paymentStatus incentive createdAt courseName companyName jobRole")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const stats = await Lead.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        converted: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] } },
        paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Pay Done"] }, 1, 0] } },
        pendingPayment: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "Converted"] }, { $eq: ["$paymentStatus", "Pending"] }] },
              1,
              0
            ]
          }
        },
        totalEarned: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, "$incentive", 0] } },
        totalPaid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Pay Done"] }, "$incentive", 0] } },
      },
    },
  ]);

  const s = stats[0] || {
    total: 0,
    converted: 0,
    paid: 0,
    pendingPayment: 0,
    totalEarned: 0,
    totalPaid: 0,
  };

  res.status(200).json({
    success: true,
    stats: {
      totalLeads: s.total,
      convertedLeads: s.converted,
      paidLeads: s.paid,
      pendingPaymentLeads: s.pendingPayment,
      totalIncentiveEarned: s.totalEarned,
      totalIncentivePaid: s.totalPaid,
      pendingIncentiveAmount: s.totalEarned - s.totalPaid,
    },
    data: leads,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  });
});

// 3. Update Lead Status (Employee)
export const updateLeadStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, lostReason } = req.body;

  if (!["Converted", "Lost"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const lead = await Lead.findById(id);
  if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
  if (lead.broughtBy.toString() !== req.employee._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  lead.status = status;
  if (status === "Lost") lead.lostReason = lostReason || "No Response";

  await lead.save();

  res.status(200).json({
    success: true,
    message: `Lead marked as ${status}`,
    data: lead,
  });
});

// 4. Delete Lead (Employee)
export const deleteLead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const lead = await Lead.findById(id);

  if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
  if (lead.broughtBy.toString() !== req.employee._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  await Lead.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Lead deleted successfully" });
});

// 5. Get My Stats (Employee + Admin Global)
export const getLeadStats = catchAsync(async (req, res) => {
  const isEmployee = !!req.employee;
  const employeeId = isEmployee ? req.employee._id : null;
  const matchFilter = employeeId ? { broughtBy: employeeId } : {};

  const stats = await Lead.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        pendingLeads: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        convertedLeads: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] } },
        lostLeads: { $sum: { $cond: [{ $eq: ["$status", "Lost"] }, 1, 0] } },
        totalIncentiveEarned: {
          $sum: { $cond: [{ $eq: ["$status", "Converted"] }, "$incentive", 0] },
        },
        totalIncentivePaid: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "Converted"] }, { $eq: ["$paymentStatus", "Pay Done"] }] },
              "$incentive",
              0,
            ],
          },
        },
        paidConvertedLeads: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "Converted"] }, { $eq: ["$paymentStatus", "Pay Done"] }] },
              1,
              0,
            ],
          },
        },
        pendingPaymentLeads: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "Converted"] }, { $eq: ["$paymentStatus", "Pending"] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalLeads: 1,
        pendingLeads: 1,
        convertedLeads: 1,
        lostLeads: 1,
        totalIncentiveEarned: 1,
        totalIncentivePaid: 1,
        pendingIncentiveAmount: { $subtract: ["$totalIncentiveEarned", "$totalIncentivePaid"] },
        paidConvertedLeads: 1,
        pendingPaymentLeads: 1,
        conversionRate: {
          $cond: [{ $eq: ["$totalLeads", 0] }, 0, { $multiply: [{ $divide: ["$convertedLeads", "$totalLeads"] }, 100] }],
        },
        paymentRate: {
          $cond: [{ $eq: ["$convertedLeads", 0] }, 0, { $multiply: [{ $divide: ["$paidConvertedLeads", "$convertedLeads"] }, 100] }],
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalLeads: 0,
    pendingLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    totalIncentiveEarned: 0,
    totalIncentivePaid: 0,
    pendingIncentiveAmount: 0,
    paidConvertedLeads: 0,
    pendingPaymentLeads: 0,
    conversionRate: 0,
    paymentRate: 0,
  };

  res.status(200).json({
    success: true,
    scope: isEmployee ? "employee" : "global",
    data: result,
  });
});

// =============== ADMIN CONTROLLERS ===============

// 6. Get All Leads (Admin Dashboard)
export const getAllLeadsAdmin = catchAsync(async (req, res) => {
  const { page = 1, limit = 15, status, leadType, employee, search, startDate, endDate } = req.query;

  let query = {};

  if (status && status !== "All") query.status = status;
  if (leadType && leadType !== "All") query.leadType = leadType;
  if (employee) query.broughtBy = employee;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const total = await Lead.countDocuments(query);
  const leads = await Lead.find(query)
    .populate("broughtBy", "name email loginId department position")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: leads,
  });
});

// 7. Get Specific Employee's Leads (Admin)
export const getLeadsByEmployee = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const { page = 1, limit = 10, status, paymentStatus, leadType, startDate, endDate } = req.query;

  const employee = await Employee.findOne({
    $or: [{ _id: employeeId }, { employeeNumber: employeeId }],
  });

  if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

  const filter = { broughtBy: employee._id };
  if (status && status !== "all") filter.status = status;
  if (paymentStatus && paymentStatus !== "all") filter.paymentStatus = paymentStatus;
  if (leadType && leadType !== "all") filter.leadType = leadType;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const total = await Lead.countDocuments(filter);
  const leads = await Lead.find(filter)
    .populate("broughtBy", "name email phone department position")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const stats = await Lead.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        converted: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] } },
        paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Pay Done"] }, 1, 0] } },
        pendingPayment: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "Converted"] }, { $eq: ["$paymentStatus", "Pending"] }] },
              1,
              0,
            ],
          },
        },
        totalEarned: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, "$incentive", 0] } },
        totalPaid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Pay Done"] }, "$incentive", 0] } },
      },
    },
  ]);

  const s = stats[0] || {
    total: 0,
    converted: 0,
    paid: 0,
    pendingPayment: 0,
    totalEarned: 0,
    totalPaid: 0,
  };

  res.status(200).json({
    success: true,
    employee: {
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department === 1 ? "Sales" : "Marketing",
      position: employee.position,
    },
    stats: {
      totalLeads: s.total,
      convertedLeads: s.converted,
      paidLeads: s.paid,
      pendingPaymentLeads: s.pendingPayment,
      totalIncentiveEarned: s.totalEarned,
      totalIncentivePaid: s.totalPaid,
      pendingIncentiveAmount: s.totalEarned - s.totalPaid,
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    data: leads.map((lead) => ({
      ...lead.toObject(),
      canMarkPaid: lead.status === "Converted" && lead.paymentStatus === "Pending",
    })),
  });
});
// ADMIN: Global Company-Wide Stats (All Employees Combined)
export const getLeadStatsAdmin = catchAsync(async (req, res) => {
  const stats = await Lead.aggregate([
    // No filter → all leads in the system
    {
      $group: {
        _id: null,

        // Lead Counts
        totalLeads: { $sum: 1 },
        pendingLeads: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        convertedLeads: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] } },
        lostLeads: { $sum: { $cond: [{ $eq: ["$status", "Lost"] }, 1, 0] } },

        // Incentive & Payment Tracking
        totalIncentiveEarned: {
          $sum: { $cond: [{ $eq: ["$status", "Converted"] }, "$incentive", 0] }
        },
        totalIncentivePaid: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "Converted"] }, { $eq: ["$paymentStatus", "Pay Done"] }] },
              "$incentive",
              0
            ]
          }
        },
        paidConvertedLeads: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "Converted"] }, { $eq: ["$paymentStatus", "Pay Done"] }] },
              1,
              0
            ]
          }
        },
        pendingPaymentLeads: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "Converted"] }, { $eq: ["$paymentStatus", "Pending"] }] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalLeads: 1,
        pendingLeads: 1,
        convertedLeads: 1,
        lostLeads: 1,

        totalIncentiveEarned: 1,
        totalIncentivePaid: 1,
        pendingIncentiveAmount: { $subtract: ["$totalIncentiveEarned", "$totalIncentivePaid"] },

        paidConvertedLeads: 1,
        pendingPaymentLeads: 1,

        conversionRate: {
          $cond: [
            { $eq: ["$totalLeads", 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ["$convertedLeads", "$totalLeads"] }, 100] }, 1] }
          ]
        },
        paymentRate: {
          $cond: [
            { $eq: ["$convertedLeads", 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ["$paidConvertedLeads", "$convertedLeads"] }, 100] }, 1] }
          ]
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalLeads: 0,
    pendingLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    totalIncentiveEarned: 0,
    totalIncentivePaid: 0,
    pendingIncentiveAmount: 0,
    paidConvertedLeads: 0,
    pendingPaymentLeads: 0,
    conversionRate: 0,
    paymentRate: 0
  };

  res.status(200).json({
    success: true,
    scope: "global-admin",
    data: result
  });
});
// 8. Mark Lead Incentive as Paid (Admin Only)
export const markLeadPaymentDone = catchAsync(async (req, res) => {
  const { id } = req.params; // leadId

  const lead = await Lead.findById(id).populate("broughtBy", "name phone");

  if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
  if (lead.status !== "Converted")
    return res.status(400).json({ success: false, message: "Only Converted leads can be marked as paid" });
  if (lead.paymentStatus === "Pay Done")
    return res.status(400).json({ success: false, message: "Already marked as paid" });

  lead.paymentStatus = "Pay Done";
  await lead.save();

  res.status(200).json({
    success: true,
    message: "Incentive payment marked as Pay Done",
    data: {
      leadId: lead._id,
      leadName: lead.name,
      incentiveAmount: lead.incentive,
      employeeName: lead.broughtBy.name,
      employeePhone: lead.broughtBy.phone,
    },
  });
});

// 9. (Optional) Update Employee Incentive Manually
export const updateEmployeeIncentive = catchAsync(async (req, res) => {
  const { incentive } = req.body;
  const employee = await Employee.findByIdAndUpdate(req.params.id, { incentive }, { new: true });

  if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

  res.status(200).json({
    success: true,
    message: "Incentive updated",
    data: employee,
  });
});
// 10. ADMIN: Update Incentive Amount for a Lead
export const updateLeadIncentive = catchAsync(async (req, res) => {
  const { id } = req.params; // lead ID
  const { incentive } = req.body;

  // Validate incentive is a positive number
  if (!incentive || incentive < 0 || isNaN(incentive)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid incentive amount (≥ 0)"
    });
  }

  const lead = await Lead.findByIdAndUpdate(
    id,
    { 
      incentive: Number(incentive), // Force as Number
      updatedAt: Date.now()
    },
    { 
      new: true,
      runValidators: true 
    }
  ).populate("broughtBy", "name loginId");

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: "Lead not found"
    });
  }

  res.status(200).json({
    success: true,
    message: "Incentive updated successfully",
    data: lead
  });
});