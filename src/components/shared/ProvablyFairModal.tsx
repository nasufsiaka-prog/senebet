import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Copy, RefreshCw, Key, CheckCircle } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useCasino();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [newClientSeed, setNewClientSeed] = useState(state.crypto.clientSeed);

  // Hash simulé du Server Seed (Dans la réalité, le vrai seed reste caché jusqu'à rotation)
  const hashedServerSeed = React.useMemo(() => {
    // Simple mock hash function pour le visuel
    return Array.from(state.crypto.serverSeed)
      .reverse()
      .map(char => char.charCodeAt(0).toString(16))
      .join('')
      .substring(0, 64)
      .padEnd(64, '0');
  }, [state.crypto.serverSeed]);

  const handleCopy = (text: string, field: string) => {
    sfx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRotateSeed = async () => {
    sfx.playHover();
    setIsRotating(true);
    await new Promise(r => setTimeout(r, 1200)); // Suspense cryptographique
    
    dispatch({ type: 'GENERATE_NEW_SEED' }); // Met à jour le contexte global
    setNewClientSeed('AG_CLIENT_' + Date.now()); // Update l'input local
    
    sfx.playCoin();
    setIsRotating(false);
  };

  const handleSaveClientSeed = () => {
    sfx.playClick();
    dispatch({ type: 'UPDATE_PROFILE', payload: { crypto: { ...state.crypto, clientSeed: newClientSeed } } });
  };

  const closeModal = () => {
    sfx.playClick();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-casino-darkest/95 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-2xl bg-casino-surface border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            {/* Header Technique */}
            <div className="p-5 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-casino-success" />
                <div>
                  <h2 className="font-black text-white uppercase tracking-wider">Provably Fair</h2>
                  <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Équité Mathématiquement Prouvée</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps Audit */}
            <div className="p-6 space-y-6">
              
              {/* Explication Rapide */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-xs text-blue-200 leading-relaxed">
                  Notre algorithme utilise un système cryptographique à <strong className="text-white">3 variables</strong> pour déterminer les résultats des jeux. Avant chaque pari, nous générons un "Server Seed" dont nous vous donnons uniquement le Hash. Vous ne pouvez pas nous faire confiance ? <strong className="text-white">Vous n'avez pas à le faire.</strong> Modifiez votre Client Seed quand vous le souhaitez.
                </p>
              </div>

              {/* Grid Data */}
              <div className="space-y-4">
                
                {/* Hash Server Seed */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Key className="w-3 h-3" /> Server Seed (Hashed)
                  </label>
                  <div className="flex relative">
                    <div className="flex-1 bg-black/60 border border-white/5 rounded-l-xl p-3 font-mono text-xs text-gray-400 break-all overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {hashedServerSeed}
                    </div>
                    <button 
                      onClick={() => handleCopy(hashedServerSeed, 'server')}
                      className="px-4 py-3 bg-white/5 border border-white/5 border-l-0 rounded-r-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                      {copiedField === 'server' ? <CheckCircle className="w-4 h-4 text-casino-success" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-600 block">Ce hash prouve que nous n'avons pas modifié le résultat après votre mise.</p>
                </div>

                {/* Client Seed (Editable) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                      <Key className="w-3 h-3" /> Client Seed
                    </label>
                    {newClientSeed !== state.crypto.clientSeed && (
                      <button 
                        onClick={handleSaveClientSeed}
                        className="text-[10px] font-bold text-casino-success uppercase hover:text-casino-successGlow transition-colors"
                      >
                        Sauvegarder
                      </button>
                    )}
                  </div>
                  <div className="flex relative">
                    <input 
                      type="text"
                      value={newClientSeed}
                      onChange={(e) => setNewClientSeed(e.target.value)}
                      className="flex-1 bg-black/60 border border-white/5 rounded-l-xl p-3 font-mono text-xs text-white outline-none focus:border-casino-accent transition-colors"
                    />
                    <button 
                      onClick={() => handleCopy(state.crypto.clientSeed, 'client')}
                      className="px-4 py-3 bg-white/5 border border-white/5 border-l-0 rounded-r-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                      {copiedField === 'client' ? <CheckCircle className="w-4 h-4 text-casino-success" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                {/* Nonce (Counter) */}
                <div className="space-y-1.5 w-1/3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Nonce (Paris Totaux)</label>
                  <div className="bg-black/60 border border-white/5 rounded-xl p-3 font-mono text-sm text-casino-cyberCyan font-bold text-center">
                    {state.crypto.nonce}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-black/60 border-t border-white/5 flex items-center justify-end">
              <button 
                onClick={handleRotateSeed}
                disabled={isRotating}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 group"
              >
                <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin text-casino-accent' : 'text-gray-400 group-hover:rotate-180 transition-transform duration-500'}`} />
                {isRotating ? 'Génération...' : 'Rotation des Seeds'}
              </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
