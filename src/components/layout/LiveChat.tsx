import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Trophy, Flame, Zap } from 'lucide-react';
import { sfx } from '../../utils/AudioEngine';
import { useCasino } from '../../store/CasinoContext';

type ChatMessageType = 'normal' | 'win' | 'mega_win';

interface ChatMessage {
  id: string;
  user: string;
  vipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  text: string;
  type: ChatMessageType;
  timestamp: Date;
}

// Data simulée pour les bots FOMO
const fomoUsernames = ['GhostRider', 'LuckyStrike', 'PapaWemba99', 'CryptoWhale', 'DakarBoss', 'Momo_Gamer', 'SniperX', 'El_Chapo', 'DopamineJunkie', 'Zenith'];
const fomoTextBase = ['Lets gooo!', 'Encore ?!', 'Crash est truqué en bien mdr', 'Qui suit sur Mines ?', 'Je viens de cashout 50k', 'gg', 'wow', 'J\'ai tout perdu...', 'Mega win incoming !!!', 'C\'est chaud !!'];
const fomoGames = ['Crash', 'Mines', 'Roulette Russe', 'Chicken Cross'];

export const LiveChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state } = useCasino();

  // Scroll Automatique
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // -- Moteur de Simulation des Bots --
  useEffect(() => {
    const generateBotMessage = () => {
      const isWin = Math.random() > 0.7; // 30% de chance d'être un message de gain
      const isMegaWin = isWin && Math.random() > 0.8; // Très rare
      
      const user = fomoUsernames[Math.floor(Math.random() * fomoUsernames.length)];
      const levels: ChatMessage['vipLevel'][] = ['Bronze', 'Silver', 'Gold', 'Diamond'];
      const vipLevel = levels[Math.floor(Math.random() * levels.length)];
      
      let text = '';
      let type: ChatMessageType = 'normal';

      if (isMegaWin) {
        text = `🎯 MEGA WIN! +${Math.floor(Math.random() * 500) + 100}k FCFA sur ${fomoGames[Math.floor(Math.random() * fomoGames.length)]} (x${(Math.random() * 40 + 10).toFixed(2)})!!!`;
        type = 'mega_win';
        // Subtilement jouer le son de coin si le panel est ouvert (psychologie passive)
        if (isOpen && state.soundEnabled) sfx.playCoin(); 
      } else if (isWin) {
        text = `vient d'encaisser ${Math.floor(Math.random() * 40) + 5}k FCFA sur ${fomoGames[Math.floor(Math.random() * fomoGames.length)]}`;
        type = 'win';
      } else {
        text = fomoTextBase[Math.floor(Math.random() * fomoTextBase.length)];
      }

      const newMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        user,
        vipLevel,
        text,
        type,
        timestamp: new Date()
      };

      setMessages(prev => [...prev.slice(-49), newMessage]); // Keep last 50 messages
    };

    // Premier message instantané
    generateBotMessage();

    // Timer chaotique pour envoyer des messages (entre 2 et 8 secondes)
    const setupNextBot = () => {
      const delay = Math.random() * 6000 + 2000;
      return setTimeout(() => {
        generateBotMessage();
        setupNextBot();
      }, delay);
    };

    const timer = setupNextBot();
    return () => clearTimeout(timer);
  }, [isOpen, state.soundEnabled]);

  // -- Rendu du niveau VIP --
  const renderVipBadge = (level: string) => {
    switch (level) {
      case 'Diamond': return <Zap className="w-3 h-3 text-casino-cyberCyan" />;
      case 'Gold': return <Trophy className="w-3 h-3 text-casino-gold" />;
      case 'Silver': return <Flame className="w-3 h-3 text-gray-400" />;
      default: return null;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      user: state.username,
      vipLevel: state.vipLevel as any,
      text: inputText,
      type: 'normal',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev.slice(-49), newMessage]);
    setInputText('');
    sfx.playClick();
  };

  return (
    <>
      {/* Floating Action Button (Toggle) */}
      <button 
        onClick={() => { sfx.playClick(); setIsOpen(!isOpen); }}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-casino-accent text-white shadow-neon-cyberCyan hover:scale-110 active:scale-95 transition-transform"
      >
        <MessageSquare className="w-6 h-6" />
        {/* Pastille de notification "fake" d'activité incessante */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-casino-darkest animate-ping" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-casino-darkest" />
      </button>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[350px] max-w-[85vw] h-full bg-casino-dark/95 backdrop-blur-3xl border-l border-white/5 shadow-[-20px_0_40px_-5px_rgba(0,0,0,0.5)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-green-500 blur-[4px] animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-wide">Live Global</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{Math.floor(Math.random() * 500) + 1200} en ligne</p>
                </div>
              </div>
              <button 
                onClick={() => { sfx.playClick(); setIsOpen(false); }}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar relative shadow-inner">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className={`p-3 rounded-xl text-sm leading-relaxed border ${
                      msg.type === 'mega_win' ? 'bg-casino-gold/10 border-casino-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.15)]' :
                      msg.type === 'win' ? 'bg-casino-success/5 border-casino-success/20' :
                      msg.user === state.username ? 'bg-casino-accent/10 border-casino-accent/20' :
                      'bg-white/5 border-white/5 hover:bg-white/10'
                    } transition-colors`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      {renderVipBadge(msg.vipLevel)}
                      <span className={`font-bold ${
                        msg.vipLevel === 'Diamond' ? 'text-casino-cyberCyan' :
                        msg.vipLevel === 'Gold' ? 'text-casino-gold' :
                        'text-gray-300'
                      }`}>
                        {msg.user}
                      </span>
                      <span className="text-[10px] text-gray-600 ml-auto font-mono">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className={`font-medium ${
                      msg.type === 'mega_win' ? 'text-casino-gold text-glow-gold' :
                      msg.type === 'win' ? 'text-casino-success' :
                      'text-gray-400'
                    }`}>
                      {msg.text}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-casino-darker">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Rejoignez la hype..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-600 outline-none focus:border-casino-accent focus:bg-white/10 transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="absolute right-2 p-2 rounded-lg text-casino-accent disabled:opacity-30 hover:bg-casino-accent/10 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
