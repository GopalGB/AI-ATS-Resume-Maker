import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import TextAreaInput from './components/TextAreaInput';
// Fix: Correct import for ResumeInput
import ResumeInput from './components/ResumeInput';
import ResultSection from './components/ResultSection';
// Fix: Correct import for geminiService
import { tailorResumeAndScore } from './services/geminiService';
// Fix: Correct import for types
import { TailoredResumeResponse } from './types';

const App: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [result, setResult] = useState<TailoredResumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTailorResume = useCallback(async () => {
    if (!resumeText.trim() || !jobDescriptionText.trim()) {
      setError('Please provide both your resume and the job description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const tailoredResult = await tailorResumeAndScore(resumeText, jobDescriptionText);
      setResult(tailoredResult);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jobDescriptionText]);

  return (
    <div className="min-h-screen bg-base-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* --- Left Column: Inputs --- */}
          <div className="bg-base-200/50 border border-base-300/50 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 animate-fade-in h-fit">
            <ResumeInput 
              value={resumeText}
              onChange={setResumeText}
              disabled={isLoading}
            />

            <TextAreaInput
              id="job-desc-input"
              label="2. Paste the Job Description"
              value={jobDescriptionText}
              onChange={(e) => setJobDescriptionText(e.target.value)}
              placeholder="Paste the target job description here..."
              disabled={isLoading}
              rows={10}
            />
            
            <div className="text-center pt-4">
              <button
                onClick={handleTailorResume}
                disabled={isLoading || !resumeText.trim() || !jobDescriptionText.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-brand-primary/40 hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
                {isLoading ? 'Optimizing...' : 'Tailor My Resume'}
              </button>
            </div>
          </div>

          {/* --- Right Column: Results --- */}
          <div className="lg:sticky lg:top-8 self-start">
            <ResultSection isLoading={isLoading} error={error} result={result} />
          </div>
        </main>
        
        <footer className="text-center py-8 mt-12 border-t border-base-300/50">
            <p className="text-text-secondary text-sm">Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;