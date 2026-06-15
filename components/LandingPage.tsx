import React from 'react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--bg-app)] font-sans transition-colors duration-300">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 text-[180px] font-serif italic select-none text-brand/10">Hallo</div>
        <div className="absolute bottom-10 right-10 text-[180px] font-serif italic select-none text-brand/10">Deutsch</div>
        
        {/* Soft floating circles */}
        <motion.div 
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand/5 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-1.5 bg-[#4a4a32]/10 dark:bg-white/10 text-[#4a4a32] dark:text-white text-xs font-extrabold rounded-full mb-8 uppercase tracking-widest border border-[#4a4a32]/10 dark:border-white/5 backdrop-blur-md">
            Your Journey to German Fluency
          </div>
          <h1 className="text-5xl md:text-7xl mb-8 leading-tight text-[var(--text-main)] font-black tracking-tight font-sans">
            Learn German with <span className="italic text-[#4a4a32] dark:text-white underline decoration-2 decoration-emerald-500/50 underline-offset-8">Joy</span> and <span className="font-extrabold text-[#4a4a32] dark:text-white">Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-semibold">
            Discover a friendly and effective way to master the German language. 
            From your first "Hallo" to full conversations, we're here to guide you every step of the way.
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <button
            onClick={onStart}
            className="btn-primary px-12 py-5 text-lg shadow-xl shadow-brand/20 cursor-pointer font-bold uppercase tracking-widest hover:scale-105 active:scale-95 duration-200"
          >
            Start Your Adventure
          </button>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="card p-5 flex flex-col items-center gap-3 bg-[var(--card-bg)] hover:-translate-y-1 transition-all">
            <span className="text-3xl">📚</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#4a4a32] dark:text-slate-300">Interactive Lessons</span>
          </div>
          <div className="card p-5 flex flex-col items-center gap-3 bg-[var(--card-bg)] hover:-translate-y-1 transition-all">
            <span className="text-3xl">🗣️</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#4a4a32] dark:text-slate-300">Speaking Practice</span>
          </div>
          <div className="card p-5 flex flex-col items-center gap-3 bg-[var(--card-bg)] hover:-translate-y-1 transition-all">
            <span className="text-3xl">🎯</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#4a4a32] dark:text-slate-300">Exam Preparation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
