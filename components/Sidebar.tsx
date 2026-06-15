import React from 'react';
import { NAV_ITEMS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  streak?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleTheme,
  isOpenMobile = false,
  onCloseMobile,
  streak = 0
}) => {
  const menuItems = [...NAV_ITEMS];

  const renderSidebarContents = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-transparent text-slate-800 dark:text-white transition-colors duration-300">
      <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
        <div>
          <div className="text-xl font-extrabold tracking-tight text-[#4a4a32] dark:text-[#f5f5f0] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Deutsch.OS
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em] font-black">Learning Space</div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center justify-center text-lg hover:bg-black/10 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all font-sans cursor-pointer"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-sm hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer font-bold text-slate-500"
              title="Close menu"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-1.5 px-3">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile && onCloseMobile) {
                      onCloseMobile();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
                    isActive 
                      ? 'bg-[#4a4a32]/10 text-[#4a4a32] dark:bg-white/10 dark:text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg transition-transform group-hover:scale-110">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 mt-auto border-t border-black/5 dark:border-white/5">
        <div className="p-4 bg-white/20 dark:bg-black/10 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5">
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.15em] font-black">Your Streak</p>
          <div className="flex gap-1.5 mb-2.5">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const activeCount = streak === 0 ? 0 : streak % 7 === 0 ? 7 : streak % 7;
              return (
                <div 
                  key={day} 
                  className={`flex-1 h-1.5 rounded-full ${
                    day <= activeCount ? 'bg-[#4a4a32] dark:bg-[#f5f5f0] shadow-sm' : 'bg-black/10 dark:bg-white/10'
                  }`}
                ></div>
              );
            })}
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {streak > 0 ? `🔥 ${streak} ${streak === 1 ? 'Day' : 'Days'} Active!` : '💤 No active streak'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 glass-blur border-r border-[#e5e5e0]/30 dark:border-white/5 flex-col h-screen sticky top-0 font-sans shadow-sm transition-colors duration-300 shrink-0">
        {renderSidebarContents(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            {/* Sliding Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-[80vw] glass-blur h-screen flex flex-col shadow-2xl z-10 border-r border-black/10 dark:border-white/5"
            >
              {renderSidebarContents(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
