import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, Clock, Lock } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

interface DailyFaucetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyFaucet: React.FC<DailyFaucetProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useCasino();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);

  // Constants
  const COOLDOWN_HOURS = 24;
  const MS_PER_HOUR = 3600000;

  useEffect(() => {
    if (!isOpen) return; // Only process timer when modal is open

    const calculateTimeLeft = () => {
      if (!state.lastFaucetClaim) {
        setIsReady(true);
        setTimeLeft('Prêt !');
        return;
      }

      const lastClaim = new Date(state.lastFaucetClaim).getTime();
      const now = new Date().getTime();
      const diff = now - lastClaim;
      const cooldownMs = COOLDOWN_HOURS * MS_PER_HOUR;

      if (diff >= cooldownMs) {
        setIsReady(true);
        setTimeLeft('Prêt !');
      } else {
        setIsReady(false);
        const remainingMs = cooldownMs - diff;
        const h = Math.floor(remainingMs / 3600000);
        const m = Math.floor((remainingMs % 3600000) / 60000);
        const s = Math.floor((remainingMs % 60000) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [state.lastFaucetClaim, isOpen]);

  const handleClaim = async () => {
    if (!isReady || isClaiming) return;
    
    setIsClaiming(true);
    sfx.playTension(3, true); // Son d'attente stressant

    // Animation de calcul ("Roue qui tourne" simulée)
    await new Promise(r => setTimeout(r, 2000));
    
    // Gain aléatoire basé sur le grade VIP
    let baseGain = 0;
    if (Math.random() > 0.95) baseGain = 10000; // 5% chance d'avoir le gros lot
    else if (Math.random() > 0.8) baseGain = 5000; // 15% chance
    else baseGain = parseFloat((Math.random() * 2000 + 500).toFixed(0)); // Standard

    // Multiplicateur VIP
    const vipMultiplier = 
      state.vipLevel === 'Whale' ? 5 :
      state.vipLevel === 'Diamond' ? 3 :
      state.vipLevel === 'Gold' ? 2 :
      state.vipLevel === 'Silver' ? 1.5 : 1;

    const finalGain = Math.floor(baseGain * vipMultiplier);

    setClaimedAmount(finalGain);
    sfx.playVictoryArpeggio(3);
    
    dispatch({ type: 'CLAIM_FAUCET', payload: finalGain });

    // Auto-close après avoir admiré le gain
    setTimeout(() => {
      onClose();
      // Reset pour la prochaine ouverture
      setTimeout(() => {
        setClaimedAmount(null);
        setIsClaiming(false);
      }, 500);
    }, 4000);
  };

  const closeModal = () => {
    if (isClaiming) return; // Unclickable during roll
    sfx.playClick();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-casino-gold/30 bg-casino-dark shadow-[0_0_50px_rgba(255,215,0,0.15)] flex flex-col items-center p-8 text-center"
          >
            {/* Decors Lumineux (Beams) */}
            <div className={`absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-casino-gold/20 to-transparent blur-3xl pointer-events-none transition-opacity duration-1000 ${isClaiming ? 'opacity-100 animate-pulse' : 'opacity-40'}`} />

            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icone / Animation d'Ouverture */}
            <div className="relative mb-6">
              <motion.div 
                animate={isClaiming ? { rotate: [0, 15, -15, 10, -10, 5, -5, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isClaiming ? Infinity : 0 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                  isReady ? 'border-casino-gold bg-casino-gold/10' : 'border-gray-600 bg-gray-800'
                } relative z-10`}
              >
                {claimedAmount ? (
                  <Sparkles className="w-12 h-12 text-casino-gold animate-spin-slow" />
                ) : isReady ? (
                  <Gift className="w-12 h-12 text-casino-gold drop-shadow-glow-gold" />
                ) : (
                  <Lock className="w-10 h-10 text-gray-500" />
                )}
              </motion.div>
              
              {isReady && !claimedAmount && (
                <div className="absolute inset-0 rounded-full bg-casino-gold blur-2xl opacity-30 animate-pulse-ring" />
              )}
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Bonus Quotidien</h2>
            
            <AnimatePresence mode="wait">
              {!claimedAmount ? (
                <motion.div key="pre-claim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                  <p className="text-gray-400 text-sm mb-8">
                    {isReady 
                      ? `En tant que VIP ${state.vipLevel}, vos gains sont boostés !` 
                      : 'Revenez plus tard pour récupérer votre prochaine récompense.'}
                  </p>

                  <button
                    onClick={handleClaim}
                    disabled={!isReady || isClaiming}
                    className={`relative w-full py-4 rounded-xl font-black uppercase tracking-widest text-lg overflow-hidden transition-all duration-300 ${
                      isReady 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    }`}
                  >
                    {isClaiming ? (
                      <span className="flex items-center justify-center gap-2 animate-pulse">
                        Génération...
                      </span>
                    ) : isReady ? (
                      <span>Ouvrir le Coffre</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 font-mono">
                        <Clock className="w-5 h-5" /> 
                        {timeLeft}
                      </span>
                    )}

                    {/* Shine effect sur le bouton prêt */}
                    {isReady && !isClaiming && (
                      <div className="absolute inset-0 -translate-x-full animate-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="post-claim" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center">
                  <p className="text-gray-400 font-bold mb-2 uppercase">Vous avez gagné</p>
                  <motion.div 
                    initial={{ y: 20 }} animate={{ y: 0 }}
                    className="text-4xl font-black text-casino-gold text-glow-gold font-display mb-4 tracking-tighter"
                  >
                    + {new Intl.NumberFormat('fr-FR').format(claimedAmount)} <span className="text-lg">FCFA</span>
                  </motion.div>
                  <p className="text-xs font-bold text-casino-success uppercase tracking-widest bg-casino-success/10 px-3 py-1 rounded-full border border-casino-success/20">
                    Crédité sur le solde
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
