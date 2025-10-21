// components/ResultSection.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ScoreCircle from './ScoreCircle';
import AtsResultDisplay from './AtsResultDisplay';
import KeywordHighlighter from './KeywordHighlighter';
import { TailoredResumeResponse, AtsCheckResponse, StructuredResume } from '../types';
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
  error: string | null;
  result: TailoredResumeResponse | null;
  atsResult: AtsCheckResponse | null;
  jobDescriptionText: string;
}

const ResultSection: React.FC<ResultSectionProps> = ({ 
  isLoading, 
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

    // Generate PDF in a non-blocking way to prevent UI freeze
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

  const handleDownload = () => {
    if (result) {
        generatePdf(result.tailored_resume_structured, 'download');
    }
  };


  if (isLoading && !atsResult) {
    return (
      <div className="animate-pulse space-y-8">
         <div className="space-y-4 p-4 border border-base-300/50 rounded-lg">
            <div className="h-8 bg-base-300 rounded-md w-1/3"></div>
            <div className="h-4 bg-base-300 rounded-md w-full"></div>
            <div className="h-4 bg-base-300 rounded-md w-2/3"></div>
        </div>
        <div className="flex justify-center gap-8">
          <div className="w-40 h-40 bg-base-300 rounded-full"></div>
          <div className="w-40 h-40 bg-base-300 rounded-full"></div>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-base-300 rounded-md w-1/3 mx-auto"></div>
          <div className="h-48 bg-base-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-center">
        <h3 className="font-bold text-lg">An Error Occurred</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!result && !atsResult) {
    return (
      <div className="text-center text-text-secondary py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-lg">Your tailored resume will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-base-200/50 border border-base-300/50 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8 animate-fade-in">
        
        <AtsResultDisplay 
          isLoading={isLoading && !atsResult}
          result={atsResult}
          error={null} // Global error is handled above
        />

        {result && (
          <div className="space-y-8 mt-8 border-t border-base-300/50 pt-8">
              <div className="flex flex-col items-center">
                  <h2 className="text-3xl font-bold text-text-primary mb-6">Your Tailored Resume</h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-12">
                  <div className="flex flex-col items-center gap-2">
                      <ScoreCircle score={result.original_score} />
                      <span className="font-semibold text-text-secondary">Original Match</span>
                  </div>
                  <div className="text-brand-primary hidden sm:block">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                      </svg>
                  </div>
                  <div className="flex flex-col items-center gap-2">
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
                            className="flex items-center gap-2 px-4 py-2 bg-brand-secondary text-white font-semibold rounded-md hover:bg-brand-secondary/80 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Download PDF
                        </button>
                    </div>
                    <div className="w-full h-[700px] bg-base-100 border border-base-300 rounded-lg shadow-inner flex items-center justify-center p-2">
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

                  <div>
                  <h3 className="text-2xl font-semibold text-text-primary mb-4">Tailored Resume Text</h3>
                  <div className="max-w-none p-4 bg-base-100 border border-base-300 rounded-lg shadow-inner text-text-secondary">
                      <KeywordHighlighter text={result.tailored_resume_text} keywords={keywords} />
                  </div>
                  </div>

                  <div>
                  <h3 className="text-2xl font-semibold text-text-primary mb-4">Feedback & Insights</h3>
                  <div className="p-4 bg-base-100 border border-base-300 rounded-lg shadow-inner text-text-secondary">
                      {/* Using KeywordHighlighter to format the headings inside the feedback */}
                       <KeywordHighlighter text={result.feedback} keywords={['### Research Insights', '### Strategic Choices']} />
                  </div>
                  </div>

                  <div>
                  <h3 className="text-2xl font-semibold text-text-primary mb-4">Suggested Improvements</h3>
                  <ul className="list-disc list-inside space-y-2 p-4 bg-base-100 border border-base-300 rounded-lg shadow-inner text-text-secondary">
                      {result.suggested_improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                      ))}
                  </ul>
                  </div>
              </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ResultSection;