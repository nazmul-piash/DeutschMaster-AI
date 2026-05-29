import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  Key, 
  Sparkles, 
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Globe,
  Lock,
  PhoneCall
} from 'lucide-react';
import Assistant from './Assistant';

interface AuthPageProps {
  onBack: () => void;
}

// --- Dynamic Configurable Values ---
// Replace these with your actual contact coordinates when ready!
const WHATSAPP_NUMBER = "+49 178 9330074"; 
const WHATSAPP_LINK = "https://wa.me/491789330074?text=Hallo!%20I%20would%20like%20to%20request%20an%20Invitation%20Code%20for%20DeutschMaster%20AI.";
const SUPPORT_EMAIL = "knhp2111@gmail.com";

// Predefined fallbacks for immediate out-of-the-box system authorization
const PREDEFINED_CODES = [
  'DEUTSCH2026',
  'BERLIN99',
  'GOETHE_A1',
  'TELC_A2',
  'VIP_GERMAN',
  'ADMIN_PORTAL',
  'AI_STUDIO'
];

const FLOATING_WORDS = [
  { text: "Hallo 🇩🇪", x: "8%", y: "15%", delay: 0 },
  { text: "Lernen", x: "82%", y: "12%", delay: 2 },
  { text: "Erfolg", x: "78%", y: "78%", delay: 4 },
  { text: "Sprechen", x: "12%", y: "72%", delay: 1.5 },
  { text: "Uhrzeit", x: "85%", y: "45%", delay: 3 },
  { text: "Zukunft", x: "6%", y: "42%", delay: 5 },
];

const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'request'>('login');
  const [email, setEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const checkInvitationCode = async (code: string): Promise<boolean> => {
    const formattedCode = code.trim().toUpperCase();
    if (PREDEFINED_CODES.includes(formattedCode)) {
      return true;
    }
    
    // Check Firestore dynamically
    try {
      const codeDocRef = doc(db, 'invitation_codes', formattedCode);
      const docSnap = await getDoc(codeDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.active !== false;
      }
    } catch (err) {
      console.warn("Firestore dynamic verification fallback executed:", err);
    }
    return false;
  };

  const generateSecretPassword = (emailVal: string, codeVal: string) => {
    const cleanEmail = emailVal.trim().toLowerCase();
    const cleanCode = codeVal.trim().toUpperCase();
    return `dm_secure_auth_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}_${cleanCode}`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Verify invitation code
      const isCodeValid = await checkInvitationCode(invitationCode);
      if (!isCodeValid) {
        throw new Error("Ungültiger Einladungscode. Bitte überprüfe den Code oder klicke auf 'Request Code' unten. (Invalid invitation code)");
      }

      // 2. Generate secure derived password
      const password = generateSecretPassword(email, invitationCode);

      try {
        // 3. Attempt dynamic Sign In
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Erfolgreich angemeldet! Willkommen.");
      } catch (signInErr: any) {
        // 4. If account doesn't exist, automatically sign them up! (Unified frictionless entry)
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            setSuccess("Konto erfolgreich erstellt! Willkommen bei DeutschMaster AI.");
          } catch (signUpErr: any) {
            // Handle cases where email already has a different derived password (meaning a different invitation code)
            if (signUpErr.code === 'auth/email-already-in-use') {
              throw new Error("Dieses Konto ist bereits mit einem anderen Einladungscode verknüpft. Bitte kontaktiere den Admin.");
            }
            throw signUpErr;
          }
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentifizierungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (providerName: 'google' | 'apple' | 'azure') => {
    setError(null);
    setSuccess(null);
    
    // Check if code has been entered
    if (!invitationCode.trim()) {
      setError("Bitte gib zuerst deines Administrators Einladungscode ein! (Please enter your invitation code first)");
      return;
    }
    
    setLoading(true);
    const isValid = await checkInvitationCode(invitationCode);
    if (!isValid) {
      setError("Ungültiger Einladungscode. Bitte überprüfe den Code oder frage deinen Admin. (Invalid invitation code)");
      setLoading(false);
      return;
    }
    
    let provider;
    if (providerName === 'google') {
      provider = new GoogleAuthProvider();
    } else if (providerName === 'apple') {
      provider = new OAuthProvider('apple.com');
    } else {
      provider = new OAuthProvider('microsoft.com');
    }

    try {
      await signInWithPopup(auth, provider);
      setSuccess("Erfolgreich eingeloggt!");
    } catch (err: any) {
      setError(err.message || "Social Sign-in Fehler.");
    } finally {
      setLoading(false);
    }
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      
      {/* Decorative Floating Words */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {FLOATING_WORDS.map((w, idx) => (
          <motion.div
            key={idx}
            className="absolute font-sans font-bold text-slate-200 dark:text-slate-800/40 text-sm md:text-base tracking-wider"
            style={{ left: w.x, top: w.y }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.15, 0.4, 0.15]
            }}
            transition={{
              duration: 6 + idx * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: w.delay
            }}
          >
            {w.text}
          </motion.div>
        ))}
      </div>

      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl pointer-events-none"></div>

      <button 
        onClick={onBack}
        className="absolute top-8 left-8 text-slate-400 hover:text-brand transition-all flex items-center gap-2 font-medium z-30 group"
      >
        <span className="transition-transform group-hover:-translate-x-1">←</span> Zurück / Back
      </button>

      <div className="w-full max-w-lg relative z-10 my-12">
        <div className="mb-8 flex justify-center">
          <Assistant 
            message={
              activeTab === 'login' 
                ? "Willkommen! Please enter your email and invitation code to start studying German."
                : "No invitation code? Kein Problem! Request your access code instantly form our admin team."
            } 
            mood="happy" 
          />
        </div>

        <div className="card shadow-2xl relative overflow-hidden border-brand/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          {/* Top aesthetic color ribbon */}
          <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-black via-red-600 to-yellow-500"></div>
          
          {/* Inner aesthetic brand label */}
          <div className="text-center pt-2 pb-6">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand bg-brand/5 px-3 py-1 rounded-full">
              ✨ SecuriPass Smart Access System
            </span>
          </div>

          {/* Unified Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-center rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'login' ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              🔑 Einloggen / Entry
            </button>
            <button
              onClick={() => {
                setActiveTab('request');
                setError(null);
              }}
              className={`flex-1 py-3 text-center rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'request' ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              📢 Code Anfordern
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleAuth} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-brand" /> Email Address
                    </label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field py-3.5 px-4 rounded-xl focus:ring-brand/20 dark:focus:ring-brand/40"
                      placeholder="you@example.com"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Compatible with Google, Microsoft, Apple, or custom domains.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-brand" /> Einladungscode (Invitation Code)
                      </span>
                    </label>
                    <input 
                      type="text" 
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      className="input-field py-3.5 px-4 tracking-wider text-center font-mono font-bold uppercase rounded-xl border-dashed border-slate-300 dark:border-slate-600 focus:border-brand"
                      placeholder="e.g. DEUTSCH2026"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block text-center">Passwordless system. Validate with your unique code given by admin.</span>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Fehler / Access Denied</p>
                        <p className="mt-0.5 leading-relaxed">{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Erfolgreich / Access Granted</p>
                        <p className="mt-0.5">{success}</p>
                      </div>
                    </motion.div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full py-4 text-base shadow-xl shadow-brand/10 font-bold tracking-wide rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        Secure Sign In <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-10">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                    </div>
                    <span className="relative px-4 bg-white dark:bg-slate-900 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      Or Dynamic Social Login
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => handleSocialAuth('google')}
                      disabled={loading}
                      className="py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-brand/30 dark:hover:border-brand/40 transition-all cursor-pointer"
                      title="Google OAuth"
                    >
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleSocialAuth('apple')}
                      disabled={loading}
                      className="py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-brand/30 dark:hover:border-brand/40 transition-all cursor-pointer"
                      title="Apple OAuth"
                    >
                      <img src="https://www.apple.com/favicon.ico" alt="Apple" className="w-5 h-5 dark:invert" />
                    </button>
                    <button 
                      onClick={() => handleSocialAuth('azure')}
                      disabled={loading}
                      className="py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-brand/30 dark:hover:border-brand/40 transition-all cursor-pointer"
                      title="Microsoft OAuth"
                    >
                      <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 mt-3 italic">
                    Note: An invitation code in the form field is required first to authorize social OAuth providers.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="request-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl text-center">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand" /> Need an Invitation Code?
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    DeutschMaster AI utilizes secure personalized invitation codes distributed by administrators to prevent unauthorized access. Get yours below:
                  </p>
                </div>

                <div className="space-y-4">
                  {/* WhatsApp Support Option */}
                  <a 
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl transition-all group scale-100 hover:scale-[1.01]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 fill-current" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Request via WhatsApp</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">Chat Directly with Admin</p>
                      <p className="text-[10px] text-slate-500 mt-1">Get immediate authorization on {WHATSAPP_NUMBER}</p>
                    </div>
                    <PhoneCall className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </a>

                  {/* Email Support Option */}
                  <div className="flex items-center gap-4 p-5 bg-brand/5 hover:bg-brand/10 border border-brand/10 rounded-2xl transition-all group relative">
                    <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand">Request via Email</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{SUPPORT_EMAIL}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Receive invitation materials and guides in your inbox.</p>
                    </div>
                    <button 
                      onClick={copyEmailToClipboard}
                      className="px-3 py-1.5 bg-brand hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-transform focus:scale-95"
                    >
                      {copiedEmail ? 'Copied! ✅' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    💡 <span className="font-semibold">Quick Sandbox Access:</span> Log in with predefined trial codes like <code className="font-mono bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded font-bold text-slate-600 dark:text-slate-300">DEUTSCH2026</code> or <code className="font-mono bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded font-bold text-slate-600 dark:text-slate-300">AI_STUDIO</code> to explore the applet immediately!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer branding */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              DeutschMaster AI • Learning & Goethe/Telc Preparation Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
