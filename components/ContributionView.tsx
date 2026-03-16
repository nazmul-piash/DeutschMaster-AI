
import React from 'react';

const ContributionView: React.FC = () => {
  return (
    <div className="p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="tech-card p-0 overflow-hidden">
          <div className="h-48 bg-surface border-b border-border flex flex-col items-center justify-center text-white p-8 text-center relative">
             <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--neon)_0%,_transparent_70%)]"></div>
             <h1 className="text-sm font-bold mb-2 relative z-10 uppercase tracking-[0.4em] font-mono">System_Support</h1>
             <p className="text-slate-500 text-[10px] max-w-md relative z-10 font-mono uppercase">
               A passion project built for the love of language, innovation, and shared growth.
             </p>
          </div>

          <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest font-mono">Developer_Log</h3>
                <div className="text-slate-500 leading-relaxed italic text-[10px] font-mono uppercase space-y-4">
                  <p>
                    "This application began as a simple fan learning project. I created it because I love the German language and the way technology can make complex learning feel like a joy."
                  </p>
                  <p>
                    "Every line of code and every interaction was built for fun and innovation. Seeing it help others is the greatest reward. If this tool has made your German journey even a little bit easier, and you'd like to support its growth, it would be deeply appreciated."
                  </p>
                  <p>
                    "Thank you for being part of this community. Keep learning, keep growing!"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-neon/5 p-4 border border-neon/10">
                 <div className="w-10 h-10 bg-dark border border-neon/20 flex items-center justify-center text-xl">❤️</div>
                 <div>
                    <p className="font-bold text-white text-[10px] font-mono uppercase tracking-widest">Humanistic_Innovation</p>
                    <p className="text-[9px] text-neon font-mono uppercase">100% Student & Maker Supported</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-surface/30 border border-dashed border-border text-center relative group">
              <h4 className="text-neon text-[10px] font-bold uppercase tracking-widest mb-8 font-mono">Direct_Gateway</h4>
              
              {/* QR Code Container */}
              <div className="relative w-48 h-48 bg-white p-4 mb-10 transition-transform group-hover:scale-105 duration-500 border border-neon/20">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://www.paypal.me/nazmul93" 
                  alt="PayPal QR Code"
                  className="w-full h-full object-contain grayscale"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-neon flex items-center justify-center shadow-lg">
                   <span className="text-dark text-[8px] font-bold font-mono">SCAN</span>
                </div>
              </div>

              <a 
                href="https://www.paypal.me/nazmul93" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-tech w-full py-3 flex items-center justify-center gap-3"
              >
                <span className="font-mono text-[10px]">EXECUTE_PAYPAL_TRANSFER</span>
                <span className="text-sm">↗</span>
              </a>

              <div className="mt-8 space-y-2">
                <p className="text-[8px] text-slate-600 font-mono uppercase tracking-widest">
                  Contributions maintain AI credits & server hosting.
                </p>
                <div className="flex justify-center gap-2">
                  <div className="w-1 h-1 bg-neon animate-pulse"></div>
                  <div className="w-1 h-1 bg-neon animate-pulse delay-100"></div>
                  <div className="w-1 h-1 bg-neon animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionView;
