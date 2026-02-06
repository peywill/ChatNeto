import React from 'react';

export const ChatLogo = ({ className = "w-16 h-16" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-blue-500"
      >
        <path
          d="M22 2L11 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 2L15 22L11 13L2 9L22 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
