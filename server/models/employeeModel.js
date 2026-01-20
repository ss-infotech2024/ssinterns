import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    department: { type: Number, required: true },
    position: { type: String, required: true },
    salary: { type: Number, required: true },
    joiningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },
    employeeType: {
      type: String,
      enum: ["Employee", "Intern"],
      default: "Employee"
    },
    loginId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    performance: { type: Number, min: 0, max: 100, default: 0 },
    attendance: { type: Number, min: 0, max: 100, default: 0 },
    pendingSalary: { type: Number, default: 0 },
    paidSalary: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ===============================
   VIRTUALS
================================ */

// Total salary
employeeSchema.virtual("totalSalary").get(function () {
  return (this.paidSalary || 0) + (this.pendingSalary || 0);
});

// 🔗 REFER TASKS (ONE → MANY)
employeeSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "employeeId"
});

// ✅ SAFE EXPORT (prevents overwrite error)
export default mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);