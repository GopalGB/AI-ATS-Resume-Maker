import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center flex flex-col items-center">
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-3 rounded-full mb-4 inline-block shadow-lg animate-bounce-in hover:animate-float">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary animate-slide-down">
        AI Resume Tailoring Engine
      </h1>
      <p className="mt-2 text-text-secondary max-w-2xl animate-fade-in">
        Optimize your resume against a job description in seconds. Paste your text or upload a PDF to get started.
      </p>
    </header>
  );
};

export default Header;