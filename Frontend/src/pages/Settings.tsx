import React from 'react';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-4 pt-24 pb-24 relative z-10">
        <div className="bg-slate-800/40 rounded-3xl p-8 backdrop-blur-lg border border-blue-500/20">
          <h1 className="text-3xl font-bold text-white mb-4">Settings Page</h1>
          <p className="text-blue-200">User settings will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
