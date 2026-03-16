
import React from 'react';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-56 bg-surface border-r border-border flex flex-col h-screen sticky top-0 font-mono">
      <div className="p-6 border-b border-border">
        <div className="text-xs font-bold text-white tracking-[0.2em] uppercase">Deutsch.OS</div>
        <div className="text-[9px] text-neon/60 mt-1 uppercase tracking-widest">v2.5.0-stable</div>
      </div>
      
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-2 transition-all text-[11px] uppercase tracking-wider ${
                  activeTab === item.id 
                    ? 'bg-neon/10 text-neon border-r-2 border-neon' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="opacity-70">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 mt-auto border-t border-border">
        <div className="p-3 bg-dark/50 border border-border">
          <p className="text-[9px] text-slate-500 mb-2 uppercase tracking-widest">Streak_Counter</p>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className={`w-4 h-1 ${day < 5 ? 'bg-neon shadow-[0_0_5px_rgba(0,255,102,0.5)]' : 'bg-border'}`}></div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-white uppercase">04_DAYS_ACTIVE</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
