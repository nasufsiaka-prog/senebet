import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, History, CheckCircle2, Loader2, ArrowRightLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'deposit' | 'withdraw' | 'history';
type TransactionState = 'idle' | 'processing' | 'waiting_ussd' | 'success' | 'error';

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useCasino();
  const [activeTab, setActiveTab] = useState<TabType>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [txState, setTxState] = useState<TransactionState>('idle');

  const presetAmounts = [1000, 5000, 10000, 50000];

  // Helper formats
  const formatMoney = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(amount);
    if (!val || val < 500 || !phone) return;

    if (activeTab === 'withdraw' && val > state.balance) {
      // Pas assez d'argent
      sfx.playClick();
      return;
    }

    sfx.playClick();
    setTxState('processing');

    // Simulation Asynchrone de la Gateway WAVE
    await new Promise(r => setTimeout(r, 1500)); // Connexion API simulée
    setTxState('waiting_ussd');
    
    // Attente de confirmation PUSH sur le tel de l'utilisateur
    await new Promise(r => setTimeout(r, Math.random() * 2000 + 2000));
    
    sfx.playCoin(); // Bruit de caisse clair
    setTxState('success');

    // Mise à jour du State global Anti-Gravity
    if (activeTab === 'deposit') {
      dispatch({ type: 'DEPOSIT', payload: val });
    } else if (activeTab === 'withdraw') {
      dispatch({ type: 'WITHDRAW', payload: val });
    }

    // Réinitialisation après succès
    setTimeout(() => {
      setTxState('idle');
      setAmount('');
      onClose(); // Auto-close après succès
    }, 2500);
  };

  const setPreset = (val: number) => {
    sfx.playHover();
    setAmount(val.toString());
  };

  const closeMod = () => {
    if (txState !== 'processing' && txState !== 'waiting_ussd') {
      sfx.playClick();
      onClose();
      // Reset after animation
      setTimeout(() => setTxState('idle'), 300);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Overlay flouté Sombre */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMod}
            className="absolute inset-0 bg-casino-darkest/90 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-casino-darker border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header (Solde Actuel & Fermeture) */}
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Caisse Securisée</p>
                <div className="text-2xl font-black text-white">{formatMoney(state.balance)}</div>
              </div>
              <button 
                onClick={closeMod}
                disabled={txState !== 'idle' && txState !== 'success'}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex px-6 pt-4 gap-4 border-b border-white/5">
              {[
                { id: 'deposit', label: 'Dépôt', icon: <ArrowRightLeft className="w-4 h-4 rotate-90" /> },
                { id: 'withdraw', label: 'Retrait', icon: <ArrowRightLeft className="w-4 h-4 -rotate-90" /> },
                { id: 'history', label: 'Historique', icon: <History className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { sfx.playHover(); setActiveTab(tab.id as TabType); }}
                  className={`pb-4 flex items-center gap-2 text-sm font-bold relative transition-colors ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="walletTabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-6 relative min-h-[350px]">
              <AnimatePresence mode="wait">
                
                {/* DEPOSIT / WITHDRAW TAB CONTENT */}
                {(activeTab === 'deposit' || activeTab === 'withdraw') && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex flex-col h-full"
                  >
                    
                    {/* View : Formulaire (Idle) */}
                    {txState === 'idle' && (
                      <form onSubmit={handleTransaction} className="flex flex-col gap-6 flex-1">
                        
                        {/* Wave Branding Card */}
                        <div className="w-full bg-gradient-to-r from-[#1c75ff] to-[#0a5cf0] rounded-2xl p-4 shadow-lg flex items-center justify-between border border-blue-400">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-black text-xl">W</div>
                            <div>
                              <p className="text-white font-bold text-sm">Transfert via Wave</p>
                              <p className="text-blue-100 text-[10px] uppercase tracking-wider font-semibold">Instantané / 0 Frais</p>
                            </div>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-blue-200 opacity-50" />
                        </div>

                        {/* Montant Input */}
                        <div className="space-y-3">
                          <div className="relative">
                            <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="Montant (FCFA)"
                              className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-4 pr-16 text-lg text-white font-bold placeholder-gray-600 focus:border-blue-500 transition-colors shadow-inner outline-none"
                              min="500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">XOF</span>
                          </div>
                          
                          {/* Quick Chips */}
                          <div className="flex justify-between gap-2">
                            {presetAmounts.map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setPreset(val)}
                                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-gray-300 transition-colors"
                              >
                                {val / 1000}k
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Téléphone Input */}
                        <div className="relative">
                          <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Numéro Wave (Ex: 77 000...)"
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-blue-500 transition-colors shadow-inner outline-none"
                          />
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>

                        <button 
                          type="submit"
                          disabled={!amount || !phone || (activeTab === 'withdraw' && parseInt(amount) > state.balance)}
                          className="mt-auto w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          {activeTab === 'deposit' ? 'Déposer maintenant' : 'Retirer les gains'}
                          <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </form>
                    )}

                    {/* View : Loading / Success States */}
                    {(txState !== 'idle') && (
                      <div className="flex-1 flex flex-col items-center justify-center relative">
                        <AnimatePresence mode="wait">
                          
                          {(txState === 'processing' || txState === 'waiting_ussd') && (
                            <motion.div key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center">
                              <div className="relative mb-6">
                                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                                <div className="absolute inset-0 w-16 h-16 bg-blue-500 blur-xl opacity-30 rounded-full" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">
                                {txState === 'processing' ? 'Connexion à Wave...' : 'Approuvez sur votre téléphone'}
                              </h3>
                              <p className="text-sm text-gray-400 text-center max-w-[250px]">
                                {txState === 'waiting_ussd' ? 'Un message a été envoyé sur votre téléphone. Entrez votre code PIN Wave.' : 'Initialisation sécurisée'}
                              </p>
                            </motion.div>
                          )}

                          {txState === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                              <motion.div 
                                initial={{ rotate: -90 }} animate={{ rotate: 0 }} transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                                className="relative mb-6"
                              >
                                <CheckCircle2 className="w-20 h-20 text-casino-success drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                                <div className="absolute inset-0 bg-casino-success blur-2xl opacity-40 rounded-full animate-pulse" />
                              </motion.div>
                              <h3 className="text-2xl font-black text-white text-glow-success mb-2">Transfert Réussi</h3>
                              <p className="text-gray-400 font-medium">+{formatMoney(parseInt(amount))}</p>
                            </motion.div>
                          )}

                        </AnimatePresence>
                      </div>
                    )}

                  </motion.div>
                )}

                {/* HISTORY TAB CONTENT */}
                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex flex-col h-full max-h-[350px] overflow-y-auto no-scrollbar"
                  >
                    {state.transactions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
                        <History className="w-10 h-10 opacity-30" />
                        <p className="text-sm">Aucune transaction trouvée.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 pb-8">
                        {state.transactions.slice(0, 20).map(tx => (
                          <div key={tx.id} className="flex flex-col bg-white/5 rounded-xl p-3 border border-white/5 text-sm hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                                tx.type === 'deposit' ? 'bg-blue-500/20 text-blue-400' :
                                tx.type === 'withdraw' ? 'bg-purple-500/20 text-purple-400' :
                                tx.type === 'win' ? 'bg-emerald-500/20 text-emerald-400' :
                                tx.type === 'faucet' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {tx.type} {tx.game ? `• ${tx.game}` : ''}
                              </span>
                              <span className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-gray-300'}`}>
                                {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                              <span>{tx.id}</span>
                              <span>{tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
