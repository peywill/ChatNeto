export function ChatnetoLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Network nodes (internet) */}
      <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="80" cy="20" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="20" cy="80" r="4" fill="currentColor" opacity="0.8" />
      
      {/* Network connections */}
      <line x1="20" y1="20" x2="50" y2="45" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <line x1="80" y1="20" x2="50" y2="45" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <line x1="20" y1="80" x2="50" y2="55" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      
      {/* Chat bubble (main) */}
      <path
        d="M 30 35 Q 30 30 35 30 L 65 30 Q 70 30 70 35 L 70 55 Q 70 60 65 60 L 50 60 L 42 68 L 42 60 L 35 60 Q 30 60 30 55 Z"
        fill="currentColor"
      />
      
      {/* Chat dots */}
      <circle cx="43" cy="45" r="3" fill="white" />
      <circle cx="50" cy="45" r="3" fill="white" />
      <circle cx="57" cy="45" r="3" fill="white" />
    </svg>
  );
}
