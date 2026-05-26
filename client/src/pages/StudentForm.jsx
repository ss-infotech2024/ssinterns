import React, { useState } from "react";

const StudentForm = () => {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [msg, setMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !course.trim()) {
      setMsg("Fill both fields");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const WEB_APP_URL =
      "https://script.google.com/macros/s/AKfycbyJIf0XyOxDkJV8loq5MNae7unSc9xwRfEDJ5kWZmt-GTUgfCdEEWVCxsiMpCt59hv4/exec";

    const body = new URLSearchParams();
    body.append("name", name.trim());
    body.append("course", course.trim());

    try {
      const res = await fetch(WEB_APP_URL, { method: "POST", body });
      const text = await res.text();
      setMsg(text);

      if (text === "SUCCESS") {
        setName("");
        setCourse("");
      }
    } catch {
      setMsg("No internet");
    } finally {
      setIsSubmitting(false);
    }

    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-purple-700 mb-4">
          Student Attendance for SS Infotech
        </h1>

        <p className="text-center text-gray-600 mb-6">
          Today: <strong>{new Date().toLocaleDateString("en-IN")}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />

          {/* Course Dropdown */}
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="">Select Course</option>
            <option value="ServiceNow">ServiceNow</option>
            <option value="Databricks">Databricks</option>
            <option value="Full Stack">Full Stack</option>
            <option value="Data Analyst">Data Analyst</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-bold transition ${
              isSubmitting
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Mark Present"}
          </button>
        </form>

        {msg && (
          <p
            className={`mt-4 text-center font-medium ${
              msg === "SUCCESS" ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentForm;