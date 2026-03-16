import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  reload
} from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Check if user is already logged in but not verified
  useEffect(() => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      setNeedsVerification(true);
      setEmail(user.email || '');
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setNeedsVerification(true);
          await signOut(auth);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
        setNeedsVerification(true);
        await signOut(auth);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show a scary error
        setError('Sign-in was cancelled. Please try again if you wish to continue.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore this one as it usually means another popup was opened
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      // We need to be logged in to reload the user
      // But if we signed out, we can't reload.
      // So the best way is to just ask them to sign in again.
      setNeedsVerification(false);
      setVerificationSent(false);
      setIsLogin(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent || needsVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark px-4 font-sans">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full tech-card text-center"
        >
          <div className="w-12 h-12 bg-neon/10 border border-neon/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-xl">✉️</span>
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Verification_Required</h2>
          <p className="text-slate-500 text-[11px] mb-8 leading-relaxed font-mono uppercase">
            A confirmation link has been dispatched to: <br/>
            <span className="text-neon">{email}</span>
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleCheckVerification}
              className="btn-tech w-full"
            >
              Confirm_Verification
            </button>
            <button 
              onClick={() => {
                setNeedsVerification(false);
                setVerificationSent(false);
                setIsLogin(true);
              }}
              className="btn-outline w-full"
            >
              Return_To_Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4 py-12 font-sans">
      <div className="max-w-4xl w-full grid md:grid-cols-2 tech-card p-0 overflow-hidden">
        {/* Left Side: Visual/Info */}
        <div className="hidden md:flex flex-col justify-center p-10 bg-surface border-r border-border relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white mb-6">Deutsch.OS_Interface</h2>
            <p className="text-slate-500 text-[11px] mb-8 leading-relaxed font-mono uppercase">
              Access the high-frequency language acquisition protocol. 
              Integrated AI modules and real-time phonetic calibration.
            </p>
            <div className="space-y-3">
              {['Adaptive_Learning_Engine', 'Neural_Phonetic_Lab', 'A1/A2_Simulation_Core'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px] font-mono text-neon/80 uppercase tracking-widest">
                  <span className="text-neon">{'>>'}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <div className="text-[60px] font-bold font-mono">DE</div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-dark">
          <div className="mb-8">
            <h1 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
              {isLogin ? 'Auth_Required' : 'New_User_Registration'}
            </h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase">
              {isLogin ? 'Initialize secure session protocol.' : 'Establish new user credentials in the database.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest font-mono">User_Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface px-4 py-2 border border-border text-white text-xs focus:border-neon transition-all outline-none font-mono"
                placeholder="USER@DOMAIN.COM"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest font-mono">Access_Key</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface px-4 py-2 border border-border text-white text-xs focus:border-neon transition-all outline-none font-mono"
                placeholder="********"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 text-red-500 text-[10px] font-mono border border-red-500/20 uppercase"
              >
                Error: {error}
              </motion.div>
            )}

            <button 
              disabled={loading}
              className="btn-tech w-full"
            >
              {loading ? 'Processing...' : (isLogin ? 'Execute_Login' : 'Register_User')}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-slate-600 text-[9px] uppercase tracking-widest font-mono">External_Auth</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button 
            onClick={handleGoogleAuth}
            className="btn-outline w-full flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3 h-3 grayscale invert" alt="Google" />
            Google_Gateway
          </button>

          <p className="mt-8 text-center text-[10px] text-slate-500 font-mono uppercase">
            {isLogin ? "No_Credentials?" : "Existing_User?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-neon font-bold hover:underline"
            >
              {isLogin ? 'Register_Now' : 'Login_Now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
