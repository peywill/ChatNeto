// Original design but BIGGER white elements, smaller blue background - MIRRORED
export function ChatNetoLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Network nodes (internet) - BIGGER - MIRRORED - ALWAYS WHITE */}
      <circle cx="85" cy="15" r="6" fill="#ffffff" opacity="0.9" />
      <circle cx="15" cy="15" r="6" fill="#ffffff" opacity="0.9" />
      <circle cx="85" cy="85" r="6" fill="#ffffff" opacity="0.9" />
      
      {/* Network connections - THICKER - MIRRORED - ALWAYS WHITE */}
      <line x1="85" y1="15" x2="55" y2="40" stroke="#ffffff" strokeWidth="3" opacity="0.7" />
      <line x1="15" y1="15" x2="45" y2="40" stroke="#ffffff" strokeWidth="3" opacity="0.7" />
      <line x1="85" y1="85" x2="55" y2="60" stroke="#ffffff" strokeWidth="3" opacity="0.7" />
      
      {/* Chat bubble (main) - MUCH BIGGER - MIRRORED - ALWAYS WHITE */}
      <path
        d="M 75 30 Q 75 25 70 25 L 30 25 Q 25 25 25 30 L 25 60 Q 25 65 30 65 L 45 65 L 55 75 L 55 65 L 70 65 Q 75 65 75 60 Z"
        fill="#ffffff"
      />
      
      {/* Chat dots - BIGGER - SAME POSITIONS - BLUE to contrast with white bubble */}
      <circle cx="40" cy="45" r="4" fill="#3b82f6" />
      <circle cx="50" cy="45" r="4" fill="#3b82f6" />
      <circle cx="60" cy="45" r="4" fill="#3b82f6" />
    </svg>
  );
}