
import React from 'react';

interface ScoreCircleProps {
  score: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const scoreColor = score > 80 ? 'text-green-400' : score > 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="relative flex items-center justify-center w-40 h-40 animate-scale-in">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          className="text-base-300"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={`${scoreColor}`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          style={{
            transition: 'stroke-dashoffset 1s ease-out, color 0.3s ease'
          }}
        />
      </svg>
      <span className={`absolute text-4xl font-bold ${scoreColor}`}>
        {score}%
      </span>
    </div>
  );
};

export default ScoreCircle;
