import React, { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

const QRStudentAttendance = () => {
  const [date, setDate] = useState("");
  const [qrValue, setQrValue] = useState("");
  const qrRef = useRef();

  // Function to format today's date as DD-MM-YYYY
  const getFormattedDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-GB").split("/").join("-");
  };

  useEffect(() => {
    const formattedDate = getFormattedDate();
    setDate(formattedDate);

    const formURL = `https://host-crm-gamma.vercel.app/student-form?date=${encodeURIComponent(
      formattedDate
    )}`;
    setQrValue(formURL);

    // ✅ Auto refresh QR at midnight (for next day)
    const now = new Date();
    const midnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();

    const timer = setTimeout(() => {
      window.location.reload();
    }, midnight);

    return () => clearTimeout(timer);
  }, []);

  // ✅ Download QR as PNG
  const downloadQR = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `Attendance-${date}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold mb-4 text-purple-700">
          📅 Attendance QR Generator
        </h1>

        <p className="text-lg mb-6">
          Date: <strong>{date}</strong>
        </p>

        {qrValue && (
          <div
            ref={qrRef}
            className="bg-gray-50 p-6 rounded-xl shadow-inner flex flex-col items-center"
          >
            <QRCodeCanvas value={qrValue} size={220} />
            <button
              onClick={downloadQR}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              ⬇️ Download QR
            </button>
          </div>
        )}

        <p className="mt-6 text-gray-600">
          Share this QR in class — students can scan to mark attendance for{" "}
          <strong>{date}</strong>.
        </p>
      </div>
    </div>
  );
};

export default QRStudentAttendance;