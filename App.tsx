import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import TextAreaInput from './components/TextAreaInput';
import ResumeInput from './components/ResumeInput';
import ResultSection from './components/ResultSection';
import { tailorResumeAndScore, checkAtsFriendliness } from './services/geminiService';
import { TailoredResumeResponse, AtsCheckResponse } from './types';

const App: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [result, setResult] = useState<TailoredResumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [atsResult, setAtsResult] = useState<AtsCheckResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('');


  const handleTailorResume = useCallback(async () => {
    if (!resumeText.trim() || !jobDescriptionText.trim()) {
      setError('Please provide both your resume and the job description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setAtsResult(null);

    try {
      setLoadingStatus('Analyzing for ATS Friendliness...');
      const atsCheckResult = await checkAtsFriendliness(resumeText, jobDescriptionText);
      setAtsResult(atsCheckResult);

      setLoadingStatus('Tailoring with ATS Feedback...');
      const tailoredResult = await tailorResumeAndScore(
        resumeText, 
        jobDescriptionText, 
        atsCheckResult.improvements
      );
      setResult(tailoredResult);

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  }, [resumeText, jobDescriptionText]);

  const getButtonText = () => {
    if (isLoading) {
        return loadingStatus || 'Optimizing...';
    }
    return 'Tailor My Resume';
  }

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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`}>
                    {isLoading ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v3.192m16.023 0-3.181-3.182a8.25 8.25 0 0 0-11.667 0L2.985 16.65z" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                    )}
                </svg>
                {getButtonText()}
              </button>
            </div>
          </div>

          {/* --- Right Column: Results --- */}
          <div className="lg:sticky lg:top-8 self-start">
            <ResultSection 
              isLoading={isLoading} 
              error={error} 
              result={result}
              atsResult={atsResult}
            />
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