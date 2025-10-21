// components/ResumeTextDisplay.tsx
import React from 'react';

interface ResumeTextDisplayProps {
  text: string;
  keywords: string[];
}

const ResumeTextDisplay: React.FC<ResumeTextDisplayProps> = ({ text, keywords }) => {
  if (!keywords || keywords.length === 0 || !text) {
    return <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{text}</p>;
  }

  // Escape special characters for regex and create a single regex for all keywords.
  // Using word boundaries `\b` to ensure we match whole words only.
  const escapedKeywords = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
  
  const parts = text.split(regex);
  
  const keywordSet = new Set(keywords.map(k => k.toLowerCase()));

  return (
    <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
      {parts.map((part, i) =>
        keywordSet.has(part.toLowerCase()) ? (
          <mark key={i} className="bg-brand-primary/20 text-brand-primary font-semibold rounded px-1 py-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
};

export default React.memo(ResumeTextDisplay);