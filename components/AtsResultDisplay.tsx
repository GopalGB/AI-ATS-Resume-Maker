// components/AtsResultDisplay.tsx
import React from 'react';
import { AtsCheckResponse } from '../types';
import ScoreCircle from './ScoreCircle';

interface AtsResultDisplayProps {
  isLoading: boolean;
  result: AtsCheckResponse | null;
  error: string | null;
}

const AtsResultDisplay: React.FC<AtsResultDisplayProps> = ({ isLoading, result, error }) => {
  if (isLoading) {
    return (
        <div className="animate-pulse space-y-4 p-4 border border-base-300/50 rounded-lg">
            <div className="h-8 bg-base-300 rounded-md w-1/3"></div>
            <div className="h-4 bg-base-300 rounded-md w-full"></div>
            <div className="h-4 bg-base-300 rounded-md w-2/3"></div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg animate-shake">
        <h3 className="font-bold text-lg">ATS Check Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!result) {
    return null; // Don't render anything if there's no result yet
  }

  return (
    <div className="space-y-6 p-6 bg-base-100 border border-base-300 rounded-lg animate-scale-in hover:shadow-lg hover:shadow-brand-primary/20 transition-all duration-300">
        <h3 className="text-2xl font-semibold text-text-primary text-center animate-slide-down">ATS Friendliness Report</h3>
        <div className="flex flex-col items-center gap-4">
            <ScoreCircle score={result.ats_score} />
            <p className="text-text-secondary text-center max-w-xl animate-fade-in">{result.summary}</p>
        </div>

        <div className="text-center p-4 bg-base-200 rounded-md hover:bg-base-200/70 transition-colors duration-200 animate-slide-up">
            <p className="text-sm font-semibold text-text-secondary">PARSER SUMMARY</p>
            <p className="text-text-primary mt-1">{result.parsed_data_summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="animate-slide-right hover:scale-105 transition-transform duration-300">
                <h4 className="flex items-center gap-2 text-lg font-semibold text-green-400 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    Strengths
                </h4>
                <ul className="list-inside space-y-2 text-text-secondary">
                   {result.strengths.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 hover:text-text-primary transition-colors duration-200">
                       <span className="text-green-400 mt-1">✓</span> <span>{item}</span>
                    </li>
                   ))}
                </ul>
            </div>
             <div className="animate-slide-left hover:scale-105 transition-transform duration-300">
                <h4 className="flex items-center gap-2 text-lg font-semibold text-yellow-400 mb-3">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    Improvements
                </h4>
                <ul className="list-inside space-y-2 text-text-secondary">
                   {result.improvements.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 hover:text-text-primary transition-colors duration-200">
                       <span className="text-yellow-400 mt-1">!</span> <span>{item}</span>
                    </li>
                   ))}
                </ul>
            </div>
        </div>
    </div>
  );
};

export default AtsResultDisplay;
