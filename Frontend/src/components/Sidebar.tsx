import React from 'react';
import { X } from 'lucide-react';
import WeatherAlert from './WeatherAlert';

interface SidebarProps {
  show: boolean;
  onClose: () => void;
}

function Sidebar({ show, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay with fade transition */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar with slide transition */}
      <div
        className={`fixed inset-y-0 right-0 w-[90%] max-w-md bg-gray-800/95 backdrop-blur-sm transform transition-all duration-300 ease-in-out z-50 overflow-y-auto ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Disaster Alerts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <WeatherAlert />
        </div>
      </div>
    </>
  );
}

export default Sidebar;
