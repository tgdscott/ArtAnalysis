import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
        <div className="relative bg-white p-4 rounded-full shadow-lg border border-indigo-100">
           <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Analyzing Vectors</h2>
      <p className="text-gray-500 max-w-md">
        Reviewing boundary adherence, color palette energy, and space utilization...
      </p>
    </div>
  );
};

export default LoadingOverlay;
