import React, { useState } from "react";
import { CheckCircle, Edit, Trash, ChevronDown } from "lucide-react";

const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };

const TaskCard = ({ task, onUpdate, onDelete, isManager = false }) => {
  const [showProgress, setShowProgress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState({ ...task });

  const getColor = (p) => p >= 100 ? "bg-green-500" : p > 50 ? "bg-yellow-500" : "bg-red-500";
  const progressOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const handleProgressUpdate = (val) => {
    onUpdate({ ...task, progress: val, status: val >= 100 ? "Completed" : "In Progress" });
    setShowProgress(false);
  };

  const handleSaveEdit = () => {
    onUpdate({ ...edited });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEdited(task);
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        {isEditing ? (
          <input
            type="text"
            value={edited.title}
            onChange={(e) => setEdited({ ...edited, title: e.target.value })}
            className="text-lg font-semibold text-gray-800 border border-gray-300 rounded px-2 py-1 w-full"
            autoFocus
          />
        ) : (
          <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
        )}

        {!isManager && (
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button onClick={() => setShowProgress(!showProgress)} className="text-green-500 hover:text-green-700">
                  <ChevronDown className="w-5 h-5" />
                </button>
                <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(task)} className="text-red-500 hover:text-red-700">
                  <Trash className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-700">
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <select
            value={edited.type}
            onChange={(e) => setEdited({ ...edited, type: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Project">Project</option>
          </select>
          <select
            value={edited.priority}
            onChange={(e) => setEdited({ ...edited, priority: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <textarea
            value={edited.notes || ""}
            onChange={(e) => setEdited({ ...edited, notes: e.target.value })}
            className="w-full text-xs bg-gray-50 p-2 rounded border border-gray-300"
            rows="3"
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">Type: <span className="font-medium">{task.type}</span></p>
          <p className="text-sm text-gray-600">Priority: <span className="font-medium">{PRIORITY_LABELS[task.priority] || task.priority}</span></p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
            <div className={`h-2.5 rounded-full transition-all ${getColor(task.progress)}`} style={{ width: `${task.progress}%` }} />
          </div>
          <p className="text-sm text-gray-600">Progress: {task.progress}%</p>
          <p className="text-xs text-gray-500">Last Updated: {task.lastUpdated ? new Date(task.lastUpdated).toLocaleString() : "N/A"}</p>
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700">Notes:</h4>
            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">{task.notes || "No notes"}</p>
          </div>
        </>
      )}

      {showProgress && !isEditing && !isManager && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Update Progress:</h4>
          <div className="grid grid-cols-5 gap-1.5">
            {progressOptions.map(p => (
              <button
                key={p}
                onClick={() => handleProgressUpdate(p)}
                className={`px-2 py-1 text-xs rounded ${task.progress === p ? "bg-purple-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-purple-50"}`}
              >
                {p}%
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => handleProgressUpdate(Math.max(0, task.progress - 10))} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">-10%</button>
            <button onClick={() => handleProgressUpdate(Math.min(100, task.progress + 10))} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">+10%</button>
            <button onClick={() => handleProgressUpdate(100)} className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Complete</button>
          </div>
        </div>
      )}

      {task.progress >= 100 && (
        <div className="mt-3 flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">Completed</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;