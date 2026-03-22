
import React from 'react';

const ContributionView: React.FC = () => {
  return (
    <div className="p-6 font-sans animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto">
        <div className="card p-0 overflow-hidden bg-white shadow-xl shadow-slate-200/50 border-white">
          <div className="h-64 bg-brand/5 border-b border-slate-50 flex flex-col items-center justify-center text-slate-800 p-12 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-brand/10"></div>
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl"></div>
             
             <h1 className="text-4xl font-bold mb-4 relative z-10 text-slate-800">Support Our Journey</h1>
             <p className="text-slate-500 text-lg max-w-lg relative z-10 leading-relaxed">
               A passion project built for the love of language, innovation, and shared growth.
             </p>
          </div>

          <div className="p-8 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-10">
              <div>
                <h3 className="text-xs font-bold text-brand mb-6 uppercase tracking-widest">A Message from the Maker</h3>
                <div className="text-slate-600 leading-relaxed italic text-sm space-y-6">
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

              <div className="flex items-center gap-6 bg-brand/5 p-6 rounded-[32px] border border-brand/10">
                 <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl">❤️</div>
                 <div>
                    <p className="font-bold text-slate-800 text-sm">Made with Love</p>
                    <p className="text-xs text-brand font-medium">100% Student & Maker Supported</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-center relative group">
              <h4 className="text-brand text-xs font-bold uppercase tracking-widest mb-10">Support via PayPal</h4>
              
              {/* QR Code Container */}
              <div className="relative w-56 h-56 bg-white p-6 mb-12 rounded-3xl shadow-xl shadow-slate-200/50 transition-transform group-hover:scale-105 duration-500 border border-white">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://www.paypal.me/nazmul93" 
                  alt="PayPal QR Code"
                  className="w-full h-full object-contain"
                />
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 rotate-12">
                   <span className="text-white text-[10px] font-bold">SCAN</span>
                </div>
              </div>

              <a 
                href="https://www.paypal.me/nazmul93" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl shadow-brand/20"
              >
                <span className="font-bold">Support on PayPal</span>
                <span className="text-xl">↗</span>
              </a>

              <div className="mt-10 space-y-4">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
                  Contributions help keep the AI running and the servers hosted.
                </p>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-brand/20 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand/20 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-brand/20 rounded-full animate-bounce delay-200"></div>
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
