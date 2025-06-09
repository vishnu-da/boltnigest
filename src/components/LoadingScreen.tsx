import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-700 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-medium text-slate-900">Loading Nigest...</h2>
        <p className="text-slate-600 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
};

export default LoadingScreen;