
import React from 'react';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isDarkMode, toggleTheme }) => {
  return (
    <aside className="w-64 bg-white dark:bg-[#252520] border-r border-slate-100 dark:border-[#353530] flex flex-col h-screen sticky top-0 font-sans shadow-sm transition-colors duration-300">
      <div className="p-8 border-b border-slate-50 dark:border-[#353530] flex justify-between items-center">
        <div>
          <div className="text-2xl font-bold text-brand font-serif italic">Deutsch.OS</div>
          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-bold">Learning Platform</div>
        </div>
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-slate-50 dark:bg-[#2a2a25] flex items-center justify-center text-xl hover:bg-brand/10 transition-all"
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
      </div>
      
      <nav className="flex-1 py-8">
        <ul className="space-y-2 px-4">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl transition-all text-sm font-medium ${
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

      <div className="p-6 mt-auto border-t border-slate-50">
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest font-bold">Your Streak</p>
          <div className="flex gap-1.5 mb-3">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className={`flex-1 h-1.5 rounded-full ${day < 5 ? 'bg-brand shadow-sm shadow-brand/20' : 'bg-slate-200'}`}></div>
            ))}
          </div>
          <p className="text-sm font-bold text-slate-700">🔥 4 Days Active!</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
