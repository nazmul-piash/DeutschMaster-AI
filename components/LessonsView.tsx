
import React from 'react';
import { Lesson } from '../types';

interface LessonsViewProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
}

const LessonsView: React.FC<LessonsViewProps> = ({ lessons, onSelectLesson }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-xs font-bold uppercase tracking-[0.3em] text-white">Curriculum_Database</h1>
          <p className="text-[10px] text-slate-500 uppercase mt-1 font-mono">Sequential_Learning_Modules // A1-A2</p>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-1 bg-neon/10 text-neon border border-neon/30 text-[9px] font-bold uppercase tracking-widest">A1_Modules</button>
           <button className="px-3 py-1 text-slate-500 border border-border text-[9px] font-bold uppercase tracking-widest hover:text-white">A2_Modules</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map((lesson) => (
          <div 
            key={lesson.id}
            onClick={() => lesson.status !== 'locked' && onSelectLesson(lesson)}
            className={`group relative tech-card ${
              lesson.status === 'locked' 
                ? 'opacity-40 cursor-not-allowed' 
                : 'cursor-pointer'
            }`}
          >
            {lesson.status === 'locked' && (
              <div className="absolute top-3 right-3 text-[9px] text-slate-600 font-mono uppercase tracking-widest">Locked_Access</div>
            )}
            {lesson.status === 'completed' && (
              <div className="absolute top-3 right-3 text-neon font-bold text-[9px] font-mono uppercase tracking-widest">Task_Complete</div>
            )}
            
            <div className="mb-4">
              <span className="inline-block text-[9px] font-mono text-neon/60 uppercase tracking-widest mb-2">
                {lesson.level} // {lesson.topic}
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-neon transition-colors">{lesson.title}</h3>
            </div>
            
            <p className="text-slate-500 text-[11px] mb-6 leading-relaxed font-mono">
              {lesson.description}
            </p>

            <div className="mt-auto">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-slate-600 uppercase font-mono tracking-widest">Progress_Status</span>
                <span className="text-[9px] font-mono text-neon">{lesson.progress}%</span>
              </div>
              <div className="h-0.5 w-full bg-border overflow-hidden">
                 <div 
                  className={`h-full transition-all duration-500 ${lesson.status === 'completed' ? 'bg-neon shadow-[0_0_5px_rgba(0,255,102,0.5)]' : 'bg-white/40'}`}
                  style={{ width: `${lesson.progress}%` }}
                 ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonsView;
