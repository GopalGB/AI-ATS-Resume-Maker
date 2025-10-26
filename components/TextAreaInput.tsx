
import React from 'react';

interface TextAreaInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows?: number;
  disabled?: boolean;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ id, label, value, onChange, placeholder, rows = 15, disabled=false }) => {
  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor={id} className="text-lg font-semibold text-text-primary">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="p-4 bg-base-200 border border-base-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-shadow duration-200 text-text-secondary placeholder-text-secondary/50 disabled:opacity-50 focus:outline-none"
      />
    </div>
  );
};

export default TextAreaInput;
