
import React, { useState, useEffect, useRef } from 'react';

interface AssistantProps {
  message: string;
  isTalking?: boolean;
  mood?: 'happy' | 'thinking' | 'neutral' | 'excited';
}

const Assistant: React.FC<AssistantProps> = ({ message, isTalking = false, mood = 'neutral' }) => {
  const [displayText, setDisplayText] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const distance = Math.min(5, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 25);
        setMousePos({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayText((prev) => prev + message.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [message]);

  const Eye = () => (
    <div className="relative w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-brand/20 shadow-inner overflow-hidden">
      <div 
        className="w-2.5 h-2.5 bg-brand rounded-full flex items-center justify-center transition-transform duration-75"
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
      >
        <div className="w-1 h-1 bg-white rounded-full translate-x-0.5 translate-y-[-0.5px]"></div>
      </div>
      <div className="absolute inset-0 bg-brand/10 origin-top scale-y-0 animate-blink"></div>
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 p-4">
      <div className="relative">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-border max-w-[200px] relative">
          <p className="text-sm text-ink leading-tight font-medium">
            {displayText}
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-border rotate-45"></div>
        </div>
      </div>

      <div className="relative w-24 h-24 animate-float">
        <div className="absolute inset-0 bg-brand rounded-full shadow-lg flex flex-col items-center justify-center gap-2">
          <div className="flex gap-3">
            <Eye />
            <Eye />
          </div>
          <div className={`
            w-6 h-1 bg-white/40 rounded-full transition-all duration-200
            ${isTalking ? 'h-4 w-4 rounded-full' : ''}
            ${mood === 'happy' ? 'h-3 w-8 rounded-b-full rounded-t-none bg-white' : ''}
            ${mood === 'excited' ? 'h-4 w-10 rounded-b-full rounded-t-none bg-white' : ''}
          `}></div>
        </div>
        
        {/* Rosy cheeks */}
        <div className="absolute left-2 top-1/2 w-4 h-2 bg-white/20 rounded-full blur-[2px]"></div>
        <div className="absolute right-2 top-1/2 w-4 h-2 bg-white/20 rounded-full blur-[2px]"></div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes blink {
          0%, 94%, 100% { transform: scaleY(0); }
          97% { transform: scaleY(1); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-blink { animation: blink 4s linear infinite; }
      `}} />
    </div>
  );
};

export default Assistant;
