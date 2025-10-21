// components/KeywordHighlighter.tsx
import React from 'react';

interface KeywordHighlighterProps {
  text: string;
  keywords: string[];
}

const KeywordHighlighter: React.FC<KeywordHighlighterProps> = ({ text, keywords }) => {
  if (!keywords || keywords.length === 0 || !text) {
    return <p className="whitespace-pre-wrap font-mono text-sm">{text}</p>;
  }

  // Escape special characters for regex and create a single regex for all keywords
  // Modified to not treat '#' as a word boundary, allowing "### Research" to be a keyword
  const escapedKeywords = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  
  const parts = text.split(regex);
  
  const keywordSet = new Set(keywords.map(k => k.toLowerCase()));

  return (
    <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
      {parts.map((part, i) =>
        keywordSet.has(part.toLowerCase()) ? (
          <span key={i} className="text-brand-primary font-bold block mt-4 mb-2">
            {part.replace(/#/g, '').trim()}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
};

export default React.memo(KeywordHighlighter);