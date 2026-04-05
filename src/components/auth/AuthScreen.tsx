import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';
import { Gem, Lock, Mail, User, Phone, Loader2 } from 'lucide-react';

export const AuthScreen: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { dispatch } = useCasino();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    if (!email || !password) return setErrorMsg("Remplissez tous les champs.");

    setIsLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      sfx.playVictoryArpeggio(1);
      dispatch({ type: 'UPDATE_PROFILE', payload: { username: email.split('@')[0] }});
      onAuthenticated();
    } catch (error: any) {
      console.error("Code:", error.code, "Message:", error.message, "Details:", error.details);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        setErrorMsg("Email ou mot de passe incorrect.");
      } else {
        setErrorMsg(error.message || "Erreur de connexion Firebase.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    if (!email || !password || !username || !phone) return setErrorMsg("Remplissez tous les champs.");

    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Générer le code localement
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Le sauvegarder dans Firestore
      const otpRef = doc(db, 'otp_verifications', email);
      await setDoc(otpRef, {
        code: otpCode,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // 3. Demander à Netlify d'envoyer le mail
      const response = await fetch('/.netlify/functions/sendMail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otpCode: otpCode })
      });

      if (!response.ok) {
        throw new Error("Erreur d'envoi du mail via Netlify.");
      }

      setShowOtpScreen(true);
    } catch (error: any) {
      console.error("Code:", error.code, "Message:", error.message, "Details:", error.details);
      setErrorMsg(`Erreur : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    if (otpInput.length !== 6) return setErrorMsg("Le code doit faire 6 chiffres.");

    setIsLoading(true);
    setErrorMsg('');
    try {
      // Vérification Firestore du code OTP
      const otpRef = doc(db, 'otp_verifications', email);
      const otpSnap = await getDoc(otpRef);

      if (!otpSnap.exists()) throw new Error("Aucun code trouvé pour cet email.");
      
      const otpData = otpSnap.data();
      if (Date.now() > otpData.expiresAt) throw new Error("Code expiré.");
      if (otpInput !== otpData.code) throw new Error("Le code de sécurité est incorrect.");

      // Création du Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        email,
        phone,
        balance: 100000,
        vipLevel: 'BRONZE',
        xp: 0,
        createdAt: new Date().toISOString()
      });

      sfx.playVictoryArpeggio(1);
      dispatch({ type: 'UPDATE_PROFILE', payload: { username } });
      onAuthenticated();

    } catch (error: any) {
      console.error("Code:", error.code, "Message:", error.message, "Details:", error.details);
      setErrorMsg(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] relative overflow-hidden flex items-center justify-center p-4">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-blue-500/20 blur-[120px] pointer-events-none"></div>
      
      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-2xl border border-slate-700/50 shadow-2xl rounded-3xl p-8 z-10 animate-[popIn_0.3s_ease-out]">
        
        {/* Header LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] mb-4 animate-float">
            <Gem className="text-slate-900 w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-yellow-400 text-center tracking-wider drop-shadow-sm">SENEBET</h1>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-center text-sm p-4 rounded-xl mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)] font-bold">
            {errorMsg}
          </div>
        )}

        {/* --- ECRAN 1 : FORMULAIRES LOGIN / SIGNUP --- */}
        {!showOtpScreen ? (
          <>
            {/* TABS */}
            <div className="flex w-full mb-8 bg-slate-900/60 rounded-xl p-1 relative border border-slate-700">
              <button 
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); sfx.playHover(); }}
                className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all z-10 ${activeTab === 'login' ? 'text-white bg-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Log In
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('signup'); setErrorMsg(''); sfx.playHover(); }}
                className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all z-10 ${activeTab === 'signup' ? 'text-white bg-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Sign Up
              </button>
            </div>

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input type="email" required placeholder="Adresse Email" 
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 px-4 pl-12 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input type="password" required placeholder="Mot de passe" 
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 px-4 pl-12 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <button type="submit" disabled={isLoading} className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1 flex justify-center items-center disabled:opacity-50 disabled:hover:translate-y-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 hover:bg-transparent transition-colors"></div>
                  {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Log In'}
                </button>
              </form>
            )}

            {/* SIGNUP FORM */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupRequest} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input type="text" required placeholder="Pseudo SENEBET" 
                    value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 px-4 pl-12 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input type="email" required placeholder="Vrai Adresse Email" 
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 px-4 pl-12 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input type="tel" required placeholder="Téléphone (ex: +22177...)" 
                    value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 px-4 pl-12 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input type="password" required placeholder="Créer mot de passe" 
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 px-4 pl-12 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                
                <button type="submit" disabled={isLoading} className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1 flex justify-center items-center disabled:opacity-50 disabled:hover:translate-y-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 hover:bg-transparent transition-colors"></div>
                  {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Créer le compte"}
                </button>
              </form>
            )}
          </>
        ) : (
          
          /* --- ECRAN 2 : OTP VERIFICATION --- */
          <form onSubmit={handleVerifyOtp} className="space-y-5 animate-[popIn_0.3s_ease-out]">
             <div className="bg-slate-900/80 p-5 rounded-xl border border-yellow-500/30 text-center mb-6 shadow-inner">
              <Mail className="w-8 h-8 text-yellow-400 mx-auto mb-3 opacity-90 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
              <p className="text-sm text-slate-300 mb-1">Un code à 6 chiffres a été envoyé à</p>
              <strong className="text-white text-lg">{email}</strong>
            </div>

            <div>
              <input 
                type="text" 
                maxLength={6} 
                required 
                value={otpInput} 
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))} 
                className="w-full text-center text-4xl tracking-[0.4em] font-black bg-slate-900/80 border border-slate-700 rounded-xl py-5 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-colors text-yellow-400 shadow-inner" 
                placeholder="000000" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading} 
              className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1 flex justify-center items-center disabled:opacity-50 disabled:hover:translate-y-0 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 hover:bg-transparent transition-colors"></div>
              {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Valider l'Inscription"}
            </button>
            <button type="button" onClick={() => setShowOtpScreen(false)} className="w-full pt-4 text-sm text-slate-500 hover:text-slate-300 font-bold uppercase transition-colors flex justify-center">
               Annuler / Revenir
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
