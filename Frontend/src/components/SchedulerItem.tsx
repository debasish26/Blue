import React from 'react';

interface SchedulerItemProps {
  time: string;
  task: string;
  onDelete: () => void;
}

export function SchedulerItem({ time, task, onDelete }: SchedulerItemProps) {
  // Convert 24h time to 12h format with AM/PM
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4 shadow-md flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md font-medium">
          {formatTime(time)}
        </div>
        <div className="text-gray-700">{task}</div>
      </div>
      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        ×
      </button>
    </div>
  );
}