import React from 'react';
import { AnalysisResult } from '../types';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface AnalysisDisplayProps {
  result: AnalysisResult;
  imagePreview: string;
  onReset: () => void;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, imagePreview, onReset }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Column: Image */}
        <div className="relative group overflow-hidden rounded-2xl shadow-xl border-4 border-white bg-gray-100">
          <img 
            src={imagePreview} 
            alt="Analyzed Art" 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md">
            Subject
          </div>
        </div>

        {/* Right Column: Visual Evidence */}
        <div className="flex flex-col justify-center">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3">
              <CheckCircle size={18} />
            </span>
            Visual Evidence
          </h3>
          <ul className="space-y-3">
            {result.visualEvidence.map((evidence, index) => (
              <li key={index} className="flex items-start bg-white p-3 rounded-lg shadow-sm border border-indigo-50">
                <span className="w-2 h-2 mt-2 mr-3 bg-indigo-400 rounded-full flex-shrink-0" />
                <span className="text-gray-600 text-sm leading-relaxed">{evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Personality Snapshot */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
        <h3 className="relative text-2xl font-bold mb-4 font-serif">The Personality Snapshot</h3>
        <p className="relative text-lg leading-relaxed text-indigo-50 italic">
          "{result.personalitySnapshot}"
        </p>
      </div>

      {/* Disclaimer & Reset */}
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-start max-w-2xl bg-orange-50 p-4 rounded-xl border border-orange-100">
            <AlertTriangle className="text-orange-400 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-xs text-orange-800 leading-normal">
              {result.disclaimer}
            </p>
        </div>

        <button
          onClick={onReset}
          className="px-8 py-3 bg-white text-gray-700 font-medium rounded-full border border-gray-300 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200"
        >
          Analyze Another Image
        </button>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
