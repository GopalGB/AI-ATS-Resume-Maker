// components/ResultSection.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ScoreCircle from './ScoreCircle';
import AtsResultDisplay from './AtsResultDisplay';
import ResumeTextDisplay from './ResumeTextDisplay';
import ProgressTracker from './ProgressTracker';
import { TailoredResumeResponse, AtsCheckResponse } from '../types';
import { generatePdf } from '../utils/pdfGenerator';

// PDF Viewer Component, now co-located for simplicity
const PdfViewer: React.FC<{ pdfUrl: string | null; title: string }> = ({ pdfUrl, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pdfUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);

    const renderPdf = async () => {
      try {
        if (!window.pdfjsLib) {
          console.error("pdf.js is not loaded.");
          return;
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

        const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const container = canvas.parentElement;
        if (!container) return;
        
        const scale = container.clientWidth / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

      } catch (error) {
        console.error(`Error rendering PDF for ${title}:`, error);
      }
    };
    renderPdf();
  }, [pdfUrl, title]);

  return <canvas ref={canvasRef} title={title} className="max-w-full max-h-full object-contain" />;
};

const TailoredResultSkeleton = () => (
    <div className="space-y-8 mt-8 border-t border-base-300/50 pt-8 animate-pulse">
        <div className="flex justify-center gap-8 md:gap-12">
            <div className="flex flex-col items-center gap-2">
                <div className="w-40 h-40 bg-base-300 rounded-full"></div>
                <div className="h-4 bg-base-300 rounded-md w-24"></div>
            </div>
            <div className="w-12 h-12 bg-base-300 rounded-full self-center hidden sm:block"></div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-40 h-40 bg-base-300 rounded-full"></div>
                <div className="h-4 bg-base-300 rounded-md w-24"></div>
            </div>
        </div>
        <div className="space-y-4">
            <div className="h-8 bg-base-300 rounded-md w-1/3"></div>
            <div className="h-96 bg-base-300 rounded-lg"></div>
        </div>
        <div className="space-y-4">
            <div className="h-8 bg-base-300 rounded-md w-1/3"></div>
            <div className="h-48 bg-base-300 rounded-lg"></div>
        </div>
    </div>
);


const STOP_WORDS = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']);

const extractKeywords = (text: string): string[] => {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);
  
  const uniqueWords = new Set(words);
  
  return Array.from(uniqueWords).filter(word => word.length > 3 && !STOP_WORDS.has(word));
};

interface ResultSectionProps {
  isLoading: boolean;
  loadingStatus: string;
  error: string | null;
  result: TailoredResumeResponse | null;
  atsResult: AtsCheckResponse | null;
  jobDescriptionText: string;
}

const ResultSection: React.FC<ResultSectionProps> = ({ 
  isLoading, 
  loadingStatus,
  error, 
  result, 
  atsResult,
  jobDescriptionText
}) => {
  const keywords = useMemo(() => extractKeywords(jobDescriptionText), [jobDescriptionText]);
  const [tailoredPdfUrl, setTailoredPdfUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (!result?.tailored_resume_structured) {
        setTailoredPdfUrl(null);
        return;
    }

    setIsPreviewLoading(true);
    let objectUrl: string | null = null;

    const timer = setTimeout(() => {
        try {
            const tailoredBlob = generatePdf(result.tailored_resume_structured, 'blob') as Blob;
            objectUrl = URL.createObjectURL(tailoredBlob);
            setTailoredPdfUrl(objectUrl);
        } catch (e) {
            console.error("Error generating PDF preview", e);
            setTailoredPdfUrl(null);
        } finally {
            setIsPreviewLoading(false);
        }
    }, 100);

    return () => {
        clearTimeout(timer);
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [result]);

  const feedbackParts = useMemo(() => {
    if (!result?.feedback) return { researchContent: '', strategicContent: '' };
    
    const feedbackText = result.feedback;
    const strategicChoicesMarker = '### Strategic Choices';
    const researchInsightsMarker = '### Research Insights';

    let researchContent = '';
    let strategicContent = '';

    const strategicChoicesIndex = feedbackText.indexOf(strategicChoicesMarker);
    const researchStartIndex = feedbackText.indexOf(researchInsightsMarker);
    
    if (strategicChoicesIndex > -1 && researchStartIndex > -1) {
        if (researchStartIndex < strategicChoicesIndex) {
            researchContent = feedbackText.substring(researchStartIndex + researchInsightsMarker.length, strategicChoicesIndex).trim();
            strategicContent = feedbackText.substring(strategicChoicesIndex + strategicChoicesMarker.length).trim();
        } else {
            strategicContent = feedbackText.substring(strategicChoicesIndex + strategicChoicesMarker.length, researchStartIndex).trim();
            researchContent = feedbackText.substring(researchStartIndex + researchInsightsMarker.length).trim();
        }
    } else if (strategicChoicesIndex > -1) {
        researchContent = feedbackText.substring(0, strategicChoicesIndex).trim();
        if (researchContent.startsWith(researchInsightsMarker)) {
             researchContent = researchContent.substring(researchInsightsMarker.length).trim();
        }
        strategicContent = feedbackText.substring(strategicChoicesIndex + strategicChoicesMarker.length).trim();
    } else if (researchStartIndex > -1) {
        researchContent = feedbackText.substring(researchStartIndex + researchInsightsMarker.length).trim();
    } else {
        strategicContent = feedbackText.trim();
    }

    return { researchContent, strategicContent };

  }, [result?.feedback]);


  const handleDownload = () => {
    if (result) {
        generatePdf(result.tailored_resume_structured, 'download');
    }
  };


  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-center animate-shake">
        <h3 className="font-bold text-lg">An Error Occurred</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!isLoading && !atsResult) {
    return (
      <div className="text-center text-text-secondary py-12 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-lg">Your tailored resume will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-base-200/50 border border-base-300/50 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8 animate-slide-left hover:shadow-2xl hover:shadow-brand-secondary/20 transition-all duration-300">
        {isLoading && <ProgressTracker loadingStatus={loadingStatus} />}
        
        {atsResult && (
            <AtsResultDisplay 
              isLoading={false}
              result={atsResult}
              error={null}
            />
        )}
        
        {isLoading && atsResult && !result && <TailoredResultSkeleton />}
        
        {result && (
          <div className="space-y-8 mt-8 border-t border-base-300/50 pt-8 animate-slide-up">
              <div className="flex flex-col items-center">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 animate-bounce-in">Your Tailored Resume</h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-12">
                  <div className="flex flex-col items-center gap-2 animate-stagger-1 opacity-0">
                      <ScoreCircle score={result.original_score} />
                      <span className="font-semibold text-text-secondary">Original Match</span>
                  </div>
                  <div className="text-brand-primary hidden sm:block animate-stagger-2 opacity-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 animate-pulse">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                      </svg>
                  </div>
                  <div className="flex flex-col items-center gap-2 animate-stagger-3 opacity-0">
                      <ScoreCircle score={result.tailored_score} />
                      <span className="font-semibold text-text-primary">Tailored Match</span>
                  </div>
                  </div>
              </div>

              <div className="space-y-8">
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h3 className="text-2xl font-semibold text-text-primary">Resume Preview</h3>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-secondary text-white font-semibold rounded-md hover:bg-brand-secondary/80 hover:scale-105 hover:shadow-lg hover:shadow-brand-secondary/50 active:scale-95 transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Download PDF
                        </button>
                    </div>
                    <div className="w-full h-[700px] bg-base-100 border border-base-300 rounded-lg shadow-inner flex items-center justify-center p-2 hover:border-brand-primary/50 transition-colors duration-300">
                        {isPreviewLoading ? (
                            <div className="text-center">
                                <svg className="animate-spin mx-auto h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2 text-text-secondary">Generating Preview...</p>
                            </div>
                        ) : (
                            <PdfViewer pdfUrl={tailoredPdfUrl} title="Tailored Resume Preview" />
                        )}
                    </div>
                  </div>

                  <div className="animate-fade-in">
                  <h3 className="text-2xl font-semibold text-text-primary mb-4">Tailored Resume Text</h3>
                  <div className="max-w-none p-4 bg-base-100 border border-base-300 rounded-lg shadow-inner text-text-secondary hover:border-brand-primary/30 transition-colors duration-300">
                      <ResumeTextDisplay text={result.tailored_resume_text} keywords={keywords} />
                  </div>
                  </div>

                  <div className="animate-fade-in">
                    <h3 className="text-2xl font-semibold text-text-primary mb-4">Feedback & Insights</h3>
                    <div className="p-4 bg-base-100 border border-base-300 rounded-lg shadow-inner text-text-secondary space-y-6 hover:border-brand-secondary/30 transition-colors duration-300">
                        
                        {feedbackParts?.researchContent && (
                            <div>
                                <h4 className="text-lg font-bold text-brand-primary mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                    Research Insights
                                </h4>
                                <div className="p-4 bg-base-200/50 rounded-md text-text-secondary/90 border border-base-300/50">
                                    <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{feedbackParts.researchContent}</p>
                                </div>
                            </div>
                        )}

                        {feedbackParts?.strategicContent && (
                            <div>
                                <h4 className="text-lg font-bold text-brand-secondary mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    Strategic Choices
                                </h4>
                                <div className="text-text-secondary">
                                    <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{feedbackParts.strategicContent}</p>
                                </div>
                            </div>
                        )}

                    </div>
                  </div>

                  <div className="animate-fade-in">
                  <h3 className="text-2xl font-semibold text-text-primary mb-4">Suggested Improvements</h3>
                  <ul className="list-disc list-inside space-y-2 p-4 bg-base-100 border border-base-300 rounded-lg shadow-inner text-text-secondary hover:border-green-400/30 transition-colors duration-300">
                      {result.suggested_improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                      ))}
                  </ul>
                  </div>
              </div>
          </div>
        )}
      </div>
  );
};

export default ResultSection;