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
          <div className="inline-block px-4 py-1 bg-brand/10 text-brand text-xs font-medium rounded-full mb-8 uppercase tracking-widest">
            Your Journey to German Fluency
          </div>
          <h1 className="text-5xl md:text-7xl mb-8 leading-tight text-[var(--text-main)]">
            Learn German with <span className="italic font-serif text-brand">Joy</span> and <span className="italic font-serif text-brand">Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
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
            className="btn-primary px-12 py-5 text-lg shadow-xl shadow-brand/20"
          >
            Start Your Adventure
          </button>
        </motion.div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-xs font-medium uppercase tracking-widest">Interactive Lessons</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🗣️</span>
            <span className="text-xs font-medium uppercase tracking-widest">Speaking Practice</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="text-xs font-medium uppercase tracking-widest">Exam Preparation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
