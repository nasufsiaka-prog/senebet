import React, { useState, useEffect } from 'react';
import { CasinoProvider, useCasino } from './store/CasinoContext';
import { sfx } from './utils/AudioEngine';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Games imports
import { CrashGame } from './components/games/CrashGame';
import { MinesGame } from './components/games/MinesGame';
import { RouletteGame } from './components/games/RouletteGame';
import { ChickenGame } from './components/games/ChickenGame';
import { ThimblesGame } from './components/games/ThimblesGame';

// Modals
import { WalletModal } from './components/wallet/WalletModal';
import { DailyFaucet } from './components/wallet/DailyFaucet';
import { ProvablyFairModal } from './components/shared/ProvablyFairModal';
import { BigWinParticles } from './components/shared/BigWinParticles';
import { AuthScreen } from './components/auth/AuthScreen';

import { Gem, Wallet, Volume2, VolumeX, ShieldCheck, 
  Home, User, ArrowLeft, Rocket, Bomb, Crosshair, 
  Box, Gift, Settings, LogOut, ShieldAlert
} from 'lucide-react';
import { AdminDashboard } from './components/admin/AdminDashboard';

// ============================================================
// GAME HUB  — Premium Cyberpunk & Glassmorphism
// ============================================================
const GameHub: React.FC<{ onSelectGame: (id: string) => void }> = ({ onSelectGame }) => {
  const games = [
    { id: 'crash',    name: 'Crash',    color: 'from-blue-600 to-indigo-900',    border: 'border-blue-500', icon: <Rocket className="w-12 h-12" />, desc: "Multiplier exponentiel" },
    { id: 'mines',    name: 'Mines',    color: 'from-emerald-600 to-green-900',  border: 'border-emerald-500', icon: <Gem className="w-12 h-12" />, desc: "Désamorce le plateau" },
    { id: 'roulette', name: 'Roulette', color: 'from-red-600 to-rose-900',        border: 'border-red-500', icon: <Crosshair className="w-12 h-12" />, desc: "La roue tourne" },
    { id: 'chicken',  name: 'Chicken',  color: 'from-amber-500 to-orange-800',   border: 'border-amber-500', icon: <span className="text-5xl drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">🐔</span>, desc: "Traverse sans mourir" },
    { id: 'thimbles', name: 'Thimbles', color: 'from-purple-600 to-fuchsia-900',  border: 'border-purple-500', icon: <Box className="w-12 h-12" />, desc: "Trouve la balle" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 animate-[popIn_0.3s_ease-out] relative">
      {/* Background Matrix/Nebula effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_3s_ease-in-out_infinite]"></div>
      </div>

      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)] z-10 border border-emerald-400/50">
        <Gem className="w-12 h-12 text-slate-900 drop-shadow-md" />
      </div>
      <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-yellow-400 mb-2 text-center tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10">
        SENEBET
      </h1>
      <p className="text-emerald-500/80 text-sm font-bold tracking-widest uppercase mb-12 text-center z-10 bg-slate-900/50 px-4 py-1 rounded-full border border-emerald-500/20">
        ENTER THE MATRIX
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl z-10">
        {games.map(g => (
          <button
            key={g.id}
            onClick={() => { sfx.playClick(); onSelectGame(g.id); }}
            className={`relative bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 border border-slate-700/50 hover:${g.border} transition-all duration-500 group hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-2 overflow-hidden`}
          >
            {/* Glow sweep layer */}
            <div className={`absolute inset-0 bg-gradient-to-b ${g.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
            
            <div className={`text-slate-400 group-hover:text-white transition-colors duration-300 z-10 group-hover:scale-110 transform`}>
               {g.icon}
            </div>
            
            <div className="z-10 text-center">
                <span className="block text-xl font-black uppercase tracking-widest text-slate-200 group-hover:text-white mb-1 drop-shadow-lg">{g.name}</span>
                <span className="block text-xs font-bold text-slate-500 group-hover:text-amber-400/80 transition-colors uppercase tracking-wider">{g.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// HEADER — Style SENEBET (Logo + Solde + Actions)
// ============================================================
const Header: React.FC<{
  onOpenWallet: () => void;
  onOpenFair: () => void;
  onOpenFaucet: () => void;
  onOpenAdmin: () => void;
}> = ({ onOpenWallet, onOpenFair, onOpenFaucet, onOpenAdmin }) => {
  const { state, dispatch } = useCasino();

  const toggleSound = () => {
    sfx.playClick();
    dispatch({ type: 'TOGGLE_SOUND' });
  };

  // Init audio on first click
  useEffect(() => {
    const init = () => {
      sfx.startAmbient();
      document.removeEventListener('click', init);
    };
    document.addEventListener('click', init);
    return () => document.removeEventListener('click', init);
  }, []);

  return (
    <header className="w-full flex justify-between items-center bg-slate-800/80 backdrop-blur-lg p-3 sm:p-4 border-b border-slate-700 z-30 sticky top-0">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.4)]">
          <Gem className="text-amber-900 w-6 h-6" />
        </div>
        <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-emerald-400 hidden sm:block">SENEBET</h1>
        {state.username?.toLowerCase() === 'admin' && (
          <button onClick={onOpenAdmin} className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/50 rounded-lg text-xs font-black tracking-widest uppercase flex items-center gap-1 hover:bg-amber-500 hover:text-slate-900 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-4 h-4" /> Securité B2B
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button onClick={onOpenFaucet} className="text-yellow-400 p-2 bg-slate-900/80 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors relative">
          <Gift className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
          </span>
        </button>
        <button onClick={onOpenFair} className="text-slate-400 hover:text-emerald-400 p-2 bg-slate-900/80 rounded-xl border border-slate-700 transition-colors">
          <ShieldCheck className="w-5 h-5" />
        </button>
        <button onClick={toggleSound} className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors">
          {state.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
        </button>
        <div onClick={onOpenWallet} className="cursor-pointer bg-slate-900/90 px-3 sm:px-4 py-2 rounded-xl border border-emerald-500/50 flex items-center shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-slate-800 transition-colors">
          <Wallet className="w-5 h-5 text-emerald-400 mr-2" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-0.5 hidden sm:block">Mon Solde</span>
            <span className="font-black text-emerald-400 text-sm sm:text-lg leading-none">
              {(state.balance || 0).toLocaleString('fr-FR')} <span className="text-[10px] text-emerald-600">FCFA</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================================
// BOTTOM NAV  — Navigation mobile style SENEBET
// ============================================================
const BottomNav: React.FC<{
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onOpenWallet: () => void;
}> = ({ currentTab, onChangeTab, onOpenWallet }) => (
  <nav className="fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-6 py-3 flex justify-around items-center z-50">
    <button onClick={() => { sfx.playClick(); onChangeTab('game'); }}
      className={`flex flex-col items-center transition-colors ${currentTab === 'game' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
      <Home className="w-6 h-6 mb-1" />
      <span className="text-[10px] font-bold">Jouer</span>
    </button>
    <div className="relative -top-6">
      <button onClick={() => { sfx.playClick(); onOpenWallet(); }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-emerald-500 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-110 transition-transform active:scale-95">
        <Wallet className="w-6 h-6" />
      </button>
    </div>
    <button onClick={() => { sfx.playClick(); onChangeTab('profile'); }}
      className={`flex flex-col items-center transition-colors ${currentTab === 'profile' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
      <User className="w-6 h-6 mb-1" />
      <span className="text-[10px] font-bold">Compte</span>
    </button>
  </nav>
);

// ============================================================
// GAME WRAPPER — Ajoute le bouton RETOUR au-dessus de chaque jeu
// ============================================================
const GameWrapper: React.FC<{ gameName: string; onBack: () => void; children: React.ReactNode }> = ({ gameName, onBack, children }) => (
  <div className="flex-1 flex flex-col overflow-hidden animate-[popIn_0.3s_ease-out]">
    {/* Back bar */}
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/60 border-b border-slate-700">
      <button onClick={() => { sfx.playClick(); onBack(); }}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-500">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
      </button>
      <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-300">{gameName}</h2>
    </div>
    {/* Game content */}
    <div className="flex-1 overflow-y-auto no-scrollbar p-2 sm:p-4">
      {children}
    </div>
  </div>
);

// ============================================================
// PROFILE VIEW — Style SENEBET
// ============================================================
const ProfileView: React.FC = () => {
  const { state, dispatch } = useCasino();
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 animate-[popIn_0.3s_ease-out]">
      <div className="max-w-lg mx-auto bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 shadow-2xl">
        <h2 className="text-2xl font-black mb-6 flex items-center"><Settings className="mr-3 text-slate-400 w-6 h-6" /> Mon Compte</h2>
        <div className="space-y-4 mb-6">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Pseudo</p>
            <p className="text-white font-bold">{state.username}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Niveau VIP</p>
            <p className="text-emerald-400 font-black text-lg">{state.vipLevel}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">XP Total</p>
            <p className="text-white font-bold">{Math.floor(state.xp).toLocaleString('fr-FR')} pts</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Solde</p>
            <p className="text-emerald-400 font-black text-xl">{state.balance.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
        <button onClick={() => sfx.playClick()} className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/30 transition-colors flex justify-center items-center">
          <LogOut className="w-5 h-5 mr-2" /> Se déconnecter
        </button>
      </div>
    </div>
  );
};

// ============================================================
// APP CONTENT — Orchestrateur principal
// ============================================================
const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('game');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Modals
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isFairOpen, setIsFairOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const gameNames: Record<string, string> = {
    crash: 'Crash', mines: 'Mines', roulette: 'Roulette',
    chicken: 'Chicken', thimbles: 'Thimbles'
  };

  const handleSelectGame = (id: string) => {
    setActiveGame(id);
  };

  const handleBack = () => {
    setActiveGame(null);
  };

  const renderGame = () => {
    if (!activeGame) return null;
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <GameWrapper gameName={gameNames[activeGame] || activeGame} onBack={handleBack}>
        {children}
      </GameWrapper>
    );
    switch (activeGame) {
      case 'crash': return <Wrapper><CrashGame /></Wrapper>;
      case 'mines': return <Wrapper><MinesGame /></Wrapper>;
      case 'roulette': return <Wrapper><RouletteGame /></Wrapper>;
      case 'chicken': return <Wrapper><ChickenGame /></Wrapper>;
      case 'thimbles': return <Wrapper><ThimblesGame /></Wrapper>;
      default: return null;
    }
  };

  return (
    <div className="h-screen bg-[#0a0f1a] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <Header
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenFair={() => setIsFairOpen(true)}
        onOpenFaucet={() => setIsFaucetOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {currentTab === 'game' && (
          activeGame ? renderGame() : <GameHub onSelectGame={handleSelectGame} />
        )}
        {currentTab === 'profile' && <ProfileView />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => { setCurrentTab(tab); setActiveGame(null); }}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      {/* Global Modals */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <DailyFaucet isOpen={isFaucetOpen} onClose={() => setIsFaucetOpen(false)} />
      <ProvablyFairModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}

      {/* Particles */}
      <BigWinParticles />

      {/* Global animations */}
      <style>{`
        @keyframes popIn { 0% { transform: scale(0.95) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};




export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <CasinoProvider>
      {!isAuthenticated ? (
        <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />
      ) : (
        <AppContent />
      )}
    </CasinoProvider>
  );
}
