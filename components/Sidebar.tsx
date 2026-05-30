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
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleTheme,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const menuItems = [...NAV_ITEMS];

  const renderSidebarContents = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-white dark:bg-[#252520] text-slate-800 dark:text-white transition-colors duration-300">
      <div className="p-6 border-b border-slate-50 dark:border-[#353530] flex justify-between items-center">
        <div>
          <div className="text-2xl font-bold text-brand font-serif italic">Deutsch.OS</div>
          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-bold">Learning Platform</div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-[#2a2a25] flex items-center justify-center text-xl hover:bg-brand/10 transition-all font-sans cursor-pointer"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="w-10 h-10 rounded-full bg-slate-50 dark:bg-[#2a2a25] flex items-center justify-center text-sm hover:bg-brand/10 transition-all cursor-pointer font-bold text-slate-500"
              title="Close menu"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl transition-all text-sm font-semibold cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-brand/10 text-brand shadow-sm shadow-brand/5' 
                    : 'text-slate-500 hover:text-brand hover:bg-brand/5'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-5 mt-auto border-t border-slate-50 dark:border-[#353530]">
        <div className="p-4 bg-slate-50 dark:bg-[#2c2c26] rounded-2xl border border-slate-100 dark:border-[#3a3a34]">
          <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-bold">Your Streak</p>
          <div className="flex gap-1.5 mb-2.5">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div 
                key={day} 
                className={`flex-1 h-1.5 rounded-full ${
                  day < 5 ? 'bg-brand shadow-sm shadow-brand/20' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              ></div>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">🔥 4 Days Active!</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#252520] border-r border-slate-100 dark:border-[#353530] flex-col h-screen sticky top-0 font-sans shadow-sm transition-colors duration-300 shrink-0">
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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Sliding Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-[80vw] bg-white dark:bg-[#252520] h-screen flex flex-col shadow-2xl z-10 border-r border-slate-100 dark:border-[#353530]"
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
