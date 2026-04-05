import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useSpring, useTransform } from 'framer-motion';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';
import { 
  Menu, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  Gift, 
  BellRing
} from 'lucide-react';

interface TopbarProps {
  toggleSidebar: () => void;
  openWalletModal: () => void;
  openFaucetModal: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ toggleSidebar, openWalletModal, openFaucetModal }) => {
  const { state, dispatch } = useCasino();
  const [faucetReady, setFaucetReady] = useState(false);
  const controls = useAnimation();
  
  // -- Rolling Number Logic for High-Dopamine Balance Update --
  const prevBalanceRef = useRef(state.balance);
  const springValue = useSpring(state.balance, { stiffness: 50, damping: 15, mass: 1 });
  const displayBalance = useTransform(springValue, (latest) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Math.floor(latest))
  );

  useEffect(() => {
    // When balance changes, trigger a bump animation and update the spring for the rolling effect
    if (state.balance !== prevBalanceRef.current) {
      springValue.set(state.balance);
      
      const isWin = state.balance > prevBalanceRef.current;
      controls.start({
        scale: [1, isWin ? 1.15 : 0.9, 1],
        color: isWin ? ['#ffffff', '#10b981', '#ffffff'] : ['#ffffff', '#ef4444', '#ffffff'],
        textShadow: isWin ? ['0 0 0px #000', '0 0 20px #10b981', '0 0 0px #000'] : ['0 0 0px #000', '0 0 20px #ef4444', '0 0 0px #000'],
        transition: { duration: 0.6, ease: "easeOut" }
      });

      prevBalanceRef.current = state.balance;
    }
  }, [state.balance, springValue, controls]);

  // -- Faucet Countdown Simulation Logic --
  useEffect(() => {
    const checkFaucet = () => {
      if (!state.lastFaucetClaim) {
        setFaucetReady(true);
        return;
      }
      const now = new Date();
      const lastClaim = new Date(state.lastFaucetClaim);
      const diffHours = Math.abs(now.getTime() - lastClaim.getTime()) / 36e5;
      
      setFaucetReady(diffHours >= 24);
    };

    checkFaucet();
    const interval = setInterval(checkFaucet, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.lastFaucetClaim]);

  // -- Event Handlers --
  const handleToggleSound = () => {
    sfx.playClick();
    dispatch({ type: 'TOGGLE_SOUND' });
  };

  const handleDepositClick = () => {
    sfx.playClick();
    openWalletModal();
  };

  return (
    <header className="h-20 w-full flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-casino-dark/80 backdrop-blur-2xl shadow-glass z-30 sticky top-0">
      
      {/* Left Section: Mobile Menu & Subtle Brand (if needed) */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => { sfx.playClick(); toggleSidebar(); }}
          className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Center Section: Rolling Balance Display */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">
            Solde Courant
          </span>
          <div className="relative group cursor-pointer" onClick={handleDepositClick}>
            {/* Glow arrière */}
            <div className="absolute -inset-2 bg-gradient-to-r from-casino-success/0 via-casino-success/20 to-casino-success/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <motion.div 
              animate={controls}
              className="px-6 py-2 rounded-2xl bg-black/40 border border-white/10 shadow-inner flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 border-t border-white/5 rounded-2xl pointer-events-none" />
              <motion.h2 className="text-xl md:text-3xl font-display font-black text-white tracking-widest">
                {displayBalance}
              </motion.h2>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Section: Core Actions (Deposit, Faucet, Settings) */}
      <div className="flex items-center gap-3 md:gap-5">
        
        {/* Faucet Button (Glows if ready) */}
        <button 
          onClick={() => { sfx.playHover(); openFaucetModal(); }}
          className={`relative p-2.5 rounded-xl border transition-all duration-300 group
            ${faucetReady 
              ? 'bg-casino-gold/10 border-casino-gold/50 text-casino-gold hover:bg-casino-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.3)] animate-pulse-ring' 
              : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-gray-300'
            }`}
        >
          {faucetReady && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-casino-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-casino-gold"></span>
            </span>
          )}
          <Gift className={`w-5 h-5 ${faucetReady ? 'animate-bounce' : ''}`} />
        </button>

        {/* Sound Toggle */}
        <button 
          onClick={handleToggleSound}
          className="hidden md:flex p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
        >
          {state.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-50" />}
        </button>

        {/* Massive Wave Deposit Button */}
        <button 
          onClick={handleDepositClick}
          onMouseEnter={() => sfx.playHover()}
          className="relative overflow-hidden px-4 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] text-white font-black tracking-widest text-sm uppercase flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 group"
        >
          {/* Animated Wave sweep effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] animate-sweep" />
          
          <PlusCircle className="w-5 h-5 hidden md:block" />
          <span>Dépôt</span>
        </button>

      </div>
    </header>
  );
};
