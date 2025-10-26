// components/ResumeInput.tsx
import React, { useRef, useState } from 'react';

// Define window interface to avoid TypeScript errors for pdfjsLib
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

const ResumeInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setParseError('Please upload a PDF file.');
            return;
        }

        setIsParsing(true);
        setParseError(null);

        if (!window.pdfjsLib) {
            setParseError("PDF parsing library failed to load. Please refresh and try again.");
            setIsParsing(false);
            return;
        }

        // Configure the worker to avoid errors
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (!e.target?.result) {
                        setParseError('Could not read file.');
                        setIsParsing(false);
                        return;
                    }
                    const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
                    const loadingTask = window.pdfjsLib.getDocument(typedArray);

                    const pdf = await loadingTask.promise;

                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }
                    onChange(fullText.trim());
                    setIsParsing(false);
                } catch (pdfError) {
                    setParseError('Failed to parse PDF file. It might be corrupted or protected.');
                    console.error('PDF parsing error:', pdfError);
                    setIsParsing(false);
                } finally {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            };

            reader.onerror = () => {
                setParseError('Failed to read the file.');
                setIsParsing(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            };

            reader.readAsArrayBuffer(file);

        } catch (error) {
            setParseError('Failed to initialize PDF reader.');
            console.error('PDF reader initialization error:', error);
            setIsParsing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col space-y-2">
            <label htmlFor="resume-input" className="text-lg font-semibold text-text-primary">
                1. Provide Your Master Resume
            </label>
            <div className="p-4 bg-base-200 border border-base-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-brand-primary transition-shadow duration-200">
                <textarea
                    id="resume-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Paste your full master resume here, including all work experience and projects..."
                    rows={15}
                    disabled={disabled || isParsing}
                    className="w-full bg-transparent focus:outline-none text-text-secondary placeholder-text-secondary/50 disabled:opacity-50"
                />
                <div className="border-t border-base-300 mt-4 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm text-text-secondary">The AI will select the most relevant projects for the job.</span>
                    <button
                        onClick={handleButtonClick}
                        disabled={disabled || isParsing}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-primary/80 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                         {isParsing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Parsing...
                            </>
                        ) : (
                             <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                                Upload PDF
                            </>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                </div>
                 {parseError && <p className="text-red-500 text-sm mt-2 animate-shake">{parseError}</p>}
            </div>
        </div>
    );
};

export default ResumeInput;
