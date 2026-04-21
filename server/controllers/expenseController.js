import Expense from "../models/expenseModel.js";
import Employee from "../models/employeeModel.js";

// Helper: Async Wrapper
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

// ==================== EMPLOYEE CONTROLLERS ====================

// 1. Submit New Expense
export const submitExpense = catchAsync(async (req, res) => {
  const { category, amount, description, date } = req.body;

  if (!category || !amount || !description || !date) {
    return res.status(400).json({
      success: false,
      message: "Please provide category, amount, description and date",
    });
  }

  const employee = await Employee.findById(req.employee._id);
  if (!employee) {
    return res.status(404).json({ success: false, message: "Employee not found" });
  }

  if (employee.status !== "Active") {
    return res.status(400).json({ success: false, message: "Inactive employees cannot submit expenses" });
  }

  // Safe file extraction
  const receipt = req.file?.path || null;

  const expense = await Expense.create({
    employeeId: req.employee._id,
    employeeName: employee.name,
    department: employee.department,
    category,
    amount: Number(amount),
    description,
    date: new Date(date),
    receipt,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Expense submitted successfully",
    data: expense,
  });
});


// 2. Get My Expenses (Employee)
export const getMyExpenses = catchAsync(async (req, res) => {
  const employeeId = req.employee._id;

  const { page = 1, limit = 10, status } = req.query;

  const filter = { employeeId };
  if (status && status !== "all") filter.status = status;

  const total = await Expense.countDocuments(filter);

  const expenses = await Expense.find(filter)
    .select("category amount description date status receipt createdAt")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: expenses.length,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
    data: expenses,
  });
});

// 3. Delete Own Pending Expense (Employee)

// Delete Own Expense → Allow: pending, paid, rejected
export const deleteMyExpense = catchAsync(async (req, res) => {
  const { id } = req.params;

  const expense = await Expense.findById(id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found",
    });
  }

  // Must be your own expense
  if (expense.employeeId.toString() !== req.employee._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this expense",
    });
  }

  // Allow delete only if status is pending, paid, or rejected
  const allowedStatuses = ["pending", "paid", "rejected"];
  if (!allowedStatuses.includes(expense.status)) {
    return res.status(400).json({
      success: false,
      message: "Only pending, paid, or rejected expenses can be deleted",
    });
  }

  await Expense.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Expense deleted successfully",
  });
});
// ==================== ADMIN CONTROLLERS ====================

// 4. Get All Expenses (Admin Dashboard)
export const getAllExpenses = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 15,
    status,
    department,
    employee,
    search,
    startDate,
    endDate,
  } = req.query;

  let query = {};

  if (status && status !== "all") query.status = status;
  if (department && department !== "all") query.department = department;
  if (employee) query.employeeId = employee;
  if (search) {
    query.$or = [
      { employeeName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const total = await Expense.countDocuments(query);

  const expenses = await Expense.find(query)
    .populate("employeeId", "name email loginId department")
    .populate("approvedBy rejectedBy paidBy", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: expenses.length,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
    data: expenses,
  });
});

// 5. Update Expense Status (Admin Only)
// controllers/expenseController.js

// UPDATE EXPENSE STATUS (Admin Only or Employee for their own)
 export const updateExpenseStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const expenseId = req.params.id;

    // Validate status
    const validStatuses = ['pending', 'approved', 'paid', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // Optional: Only admin or owner can update
    // if (!req.user.isAdmin && expense.employeeId.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ success: false, message: "Not authorized" });
    // }

    // Update fields
    expense.status = status;

    if (status === 'approved') {
      expense.approvedAt = new Date();
      expense.approvedBy = req.user._id;
    } else if (status === 'paid') {
      expense.paidAt = new Date();
      expense.paidBy = req.user._id;
    } else if (status === 'rejected') {
      expense.rejectedAt = new Date();
      expense.rejectedBy = req.user._id;
      expense.rejectionReason = rejectionReason || "No reason provided";
    }

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Expense status updated",
      data: expense
    });
  } catch (error) {
    console.error("Error updating expense status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



// 6. Get Expense Stats (Admin Dashboard)
export const getExpenseStats = catchAsync(async (req, res) => {
  const stats = await Expense.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
        totalAmount: 1,
      },
    },
  ]);

  const result = {
    pending: { count: 0, totalAmount: 0 },
    approved: { count: 0, totalAmount: 0 },
    rejected: { count: 0, totalAmount: 0 },
    paid: { count: 0, totalAmount: 0 },
    overallTotal: 0,
    overallCount: 0,
  };

  stats.forEach((item) => {
    if (item.status in result) {
      result[item.status] = {
        count: item.count,
        totalAmount: item.totalAmount,
      };
      result.overallTotal += item.totalAmount;
      result.overallCount += item.count;
    }
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getMyExpenseStats = catchAsync(async (req, res) => {
  const employeeId = req.employee._id;

  const stats = await Expense.aggregate([
    { $match: { employeeId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const result = {
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    totalAmount: 0,
  };

  stats.forEach((s) => {
    result[s._id] += s.count;
    result.totalAmount += s.totalAmount;
  });

  res.status(200).json({
    success: true,
    data: {
      ...result,
      totalExpenses: stats.reduce((a, s) => a + s.count, 0),
    },
  });
});
