
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
    <div className="relative w-8 h-8 bg-white rounded-full flex items-center justify-center border-[2px] border-slate-900 shadow-inner overflow-hidden">
      <div 
        className="w-3.5 h-3.5 bg-slate-900 rounded-full flex items-center justify-center transition-transform duration-75"
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
      >
        <div className="w-1 h-1 bg-white rounded-full translate-x-0.5 translate-y-[-0.5px]"></div>
      </div>
      <div className="absolute inset-0 bg-indigo-500 origin-top scale-y-0 animate-blink"></div>
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6 p-4 perspective-1000">
      <div className="relative group">
        <div className="absolute -inset-1 bg-indigo-400 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-indigo-100/50 max-w-[200px] transform hover:rotate-1 transition-all">
          <p className="text-sm font-marker text-indigo-900 leading-tight">
            {displayText}
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 border-b border-r border-indigo-100/50 rotate-45"></div>
        </div>
      </div>

      <div className="relative w-28 h-28 preserve-3d animate-float">
        {/* Glow Orbs */}
        <div className="absolute -left-12 top-1/2 w-2 h-2 bg-amber-400 rounded-full blur-[1px] animate-pulse"></div>
        <div className="absolute -right-12 top-1/2 w-2 h-2 bg-emerald-400 rounded-full blur-[1px] animate-pulse delay-500"></div>

        <div className={`w-full h-full preserve-3d flex items-center justify-center transition-transform duration-500 ${mood === 'thinking' ? 'rotate-y-12' : ''}`}>
           <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 clip-octahedron shadow-2xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                 <div className="flex gap-2">
                    <Eye />
                    <Eye />
                 </div>
                 <div className={`
                    w-4 h-1 bg-slate-900 rounded-full transition-all duration-200
                    ${isTalking ? 'h-3 w-3 rounded-full' : ''}
                    ${mood === 'happy' ? 'w-6 h-2 rounded-b-full rounded-t-none' : ''}
                 `}></div>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10"></div>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .clip-octahedron { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotateZ(-2deg); }
          50% { transform: translateY(-12px) rotateZ(2deg); }
        }
        @keyframes blink {
          0%, 94%, 100% { transform: scaleY(0); }
          97% { transform: scaleY(1); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-blink { animation: blink 4s linear infinite; }
      `}} />
    </div>
  );
};

export default Assistant;
