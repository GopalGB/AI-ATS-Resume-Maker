// components/ProgressTracker.tsx
import React from 'react';

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const PendingIcon = () => (
    <div className="h-5 w-5 rounded-full border-2 border-base-300"></div>
);


const ProgressStep: React.FC<{
  title: string;
  status: 'pending' | 'loading' | 'done';
}> = ({ title, status }) => {

  const getIcon = () => {
    switch (status) {
      case 'loading': return <SpinnerIcon />;
      case 'done': return <CheckIcon />;
      case 'pending':
      default:
        return <PendingIcon />;
    }
  };

  const textColor = status === 'pending' ? 'text-text-secondary' : 'text-text-primary';
  const animationClass = status === 'loading' ? 'animate-pulse' : status === 'done' ? 'animate-bounce-in' : '';

  return (
    <div className={`flex items-center gap-3 transition-all duration-300 ${animationClass}`}>
        {getIcon()}
        <span className={`font-medium ${textColor} transition-colors duration-300`}>{title}</span>
    </div>
  );
};


interface ProgressTrackerProps {
  loadingStatus: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ loadingStatus }) => {
    const steps = [
        { id: 'ats', title: 'ATS Analysis', trigger: 'Analyzing' },
        { id: 'research', title: 'Company Research', trigger: 'Researching' },
        { id: 'tailoring', title: 'Resume Tailoring', trigger: 'Tailoring' }
    ];

    let currentStepIndex = steps.findIndex(step => loadingStatus.includes(step.trigger));
    if (currentStepIndex === -1) currentStepIndex = 0; // Default to first step if status is generic

    return (
        <div className="p-4 bg-base-100 border border-base-300 rounded-lg space-y-3 animate-slide-down">
            <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                <span>Optimization in Progress</span>
                <span className="animate-pulse">...</span>
            </h3>
            {steps.map((step, index) => {
                let status: 'pending' | 'loading' | 'done' = 'pending';
                if (index < currentStepIndex) {
                    status = 'done';
                } else if (index === currentStepIndex) {
                    status = 'loading';
                }
                return <ProgressStep key={step.id} title={step.title} status={status} />;
            })}
        </div>
    );
};

export default ProgressTracker;