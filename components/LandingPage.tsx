import React from 'react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-neon rounded-full blur-[120px]"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-neon rounded-full blur-[120px]"
        />
        <div className="absolute top-1/4 right-1/4 text-[120px] opacity-5 select-none font-mono font-bold uppercase tracking-tighter">DEUTSCH</div>
        <div className="absolute bottom-1/4 left-1/4 text-[120px] opacity-5 select-none font-mono font-bold uppercase tracking-tighter">SYSTEM</div>
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-3 py-1 bg-neon/10 border border-neon/20 text-neon text-[9px] font-mono uppercase tracking-[0.3em] mb-6">
            Language_Acquisition_Protocol_v2.5
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight uppercase tracking-tighter">
            Master German with <span className="text-neon">Precision</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed font-mono uppercase">
            High-frequency neural training for A1/A2 proficiency. 
            AI-powered syntax analysis and real-time phonetic calibration.
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <button
            onClick={onStart}
            className="btn-tech px-12 py-4 text-xs tracking-[0.2em]"
          >
            INITIALIZE_SYSTEM_CORE
          </button>
        </motion.div>

        <div className="mt-20 grid grid-cols-3 gap-8 opacity-40">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Neural_Lessons</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Voice_Sync</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Simulation_Exams</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
