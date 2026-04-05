import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Wallet, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Trophy,
  Activity,
  Flame,
  Diamond,
  Zap,
  Bomb,
  Crosshair,
  Bird,
  Box
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeGame: string | null;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activeGame, onNavigate }) => {
  const { state } = useCasino();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // VIP Colors & Styles Logic
  const getVipStyles = (level: string) => {
    switch (level) {
      case 'Diamond':
        return { 
          gradient: 'from-casino-cyberCyan via-teal-400 to-casino-cyber', 
          shadow: 'shadow-neon-cyberCyan', 
          text: 'text-glow-cyber',
          icon: <Diamond className="w-5 h-5 text-casino-cyberCyan animate-pulse" />
        };
      case 'Gold':
        return { 
          gradient: 'from-casino-gold via-yellow-400 to-casino-goldDark', 
          shadow: 'shadow-neon-gold', 
          text: 'text-glow-gold',
          icon: <Trophy className="w-5 h-5 text-casino-gold animate-pulse" />
        };
      case 'Silver':
        return { 
          gradient: 'from-gray-300 via-gray-400 to-gray-500', 
          shadow: 'shadow-lg shadow-gray-400/50', 
          text: 'text-gray-200',
          icon: <Flame className="w-5 h-5 text-gray-300" />
        };
      case 'Bronze':
      default:
        return { 
          gradient: 'from-orange-700 via-orange-600 to-orange-800', 
          shadow: 'shadow-md shadow-orange-900/50', 
          text: 'text-orange-400',
          icon: <Activity className="w-5 h-5 text-orange-500" />
        };
    }
  };

  const vipParams = getVipStyles(state.vipLevel);

  // Calculate XP Percentage for the bar (Next level threshold logic)
  const getXpProgress = () => {
    const { xp } = state;
    let minXp = 0;
    let maxXp = 10000;
    if (xp >= 100000) { minXp = 100000; maxXp = 100000; return 100; } // Maxed
    if (xp >= 50000) { minXp = 50000; maxXp = 100000; }
    else if (xp >= 10000) { minXp = 10000; maxXp = 50000; }
    
    return ((xp - minXp) / (maxXp - minXp)) * 100;
  };

  const currentXpProgress = getXpProgress();

  const navGroups = [
    {
      title: 'Accueil',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
        { id: 'wallet', label: 'Wallet Wave', icon: <Wallet /> },
      ]
    },
    {
      title: 'Jeux d\'Élite',
      items: [
        { id: 'crash', label: 'Aero Crash', icon: <Zap className="text-casino-danger" /> },
        { id: 'mines', label: 'Mines', icon: <Bomb className="text-casino-cyber" /> },
        { id: 'roulette', label: 'Roulette Russe', icon: <Crosshair className="text-gray-400" /> },
        { id: 'chicken', label: 'Chicken Cross', icon: <Bird className="text-casino-gold" /> },
        { id: 'thimbles', label: 'Thimbles 3D', icon: <Box className="text-blue-400" /> },
      ]
    },
    {
      title: 'Système',
      items: [
        { id: 'settings', label: 'Paramètres', icon: <Settings /> },
      ]
    }
  ];

  const handleNavClick = (id: string) => {
    sfx.playClick();
    onNavigate(id);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              sfx.playClick();
              setIsOpen(false);
            }}
            className="md:hidden fixed inset-0 z-40 bg-casino-darker/90 backdrop-blur-sm"
          />

          {/* Sidebar Container */}
          <motion.aside
            initial={{ x: '-100%', borderRightColor: 'rgba(255,255,255,0)' }}
            animate={{ x: 0, borderRightColor: 'rgba(255,255,255,0.05)' }}
            exit={{ x: '-100%', transition: { duration: 0.3 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:static flex flex-col w-[280px] h-screen bg-casino-dark/80 backdrop-blur-2xl border-r z-50 overflow-hidden shadow-[20px_0_40px_-5px_rgba(0,0,0,0.5)]"
          >
            {/* Logo Area */}
            <div className="relative p-6 flex items-center justify-center border-b border-white/5">
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-casino-cyber to-transparent opacity-50" />
              <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 uppercase drop-shadow-lg">
                Anti<span className="text-casino-cyber">Gravity</span>
              </h1>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
              
              {/* Profil & VIP Widget (Dopamine Trigger) */}
              <div className="p-5 mt-2">
                <div className={`p-[1px] rounded-2xl bg-gradient-to-br ${vipParams.gradient} ${vipParams.shadow} transition-all duration-500`}>
                  <div className="bg-casino-darker/90 p-4 rounded-2xl h-full flex flex-col gap-3 relative overflow-hidden backdrop-blur-xl">
                    
                    {/* Background Glow */}
                    <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${vipParams.gradient} rounded-full blur-2xl opacity-20`} />

                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-3">
                        {/* Avatar Simulation */}
                        <div className="w-12 h-12 rounded-full border-2 border-white/10 bg-gradient-to-tr from-gray-800 to-gray-700 flex justify-center items-center overflow-hidden shadow-inner">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${state.username}&backgroundColor=transparent`} 
                            alt="Avatar" 
                            className="w-10 h-10 object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white truncate max-w-[120px]">{state.username}</p>
                          <p className={`text-xs font-black uppercase tracking-wider ${vipParams.text}`}>
                            {state.vipLevel}
                          </p>
                        </div>
                      </div>
                      {vipParams.icon}
                    </div>

                    {/* XP Logic & Progress Bar */}
                    <div className="flex flex-col gap-1.5 z-10">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                        <span>XP Actuel</span>
                        <span className="text-white">{Math.floor(state.xp)} Pts</span>
                      </div>
                      <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden shadow-inner relative">
                        <motion.div 
                          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${vipParams.gradient}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${currentXpProgress}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                        {/* Glowing tip of the progress bar */}
                        <motion.div 
                          className="absolute top-0 h-full w-2 bg-white/50 blur-[2px]"
                          initial={{ left: 0 }}
                          animate={{ left: `calc(${currentXpProgress}% - 4px)` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="px-4 space-y-6 mt-4">
                {navGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="flex flex-col gap-2">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2">
                      {group.title}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {group.items.map((item) => {
                        const isActive = activeGame === item.id;
                        const isHovered = hoveredItem === item.id;
                        
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => handleNavClick(item.id)}
                              onMouseEnter={() => {
                                setHoveredItem(item.id);
                                sfx.playHover();
                              }}
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`
                                relative w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group
                                ${isActive 
                                  ? 'bg-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] text-white' 
                                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                                }
                              `}
                            >
                              {/* Left active line indicator */}
                              {isActive && (
                                <motion.div 
                                  layoutId="activeNavLine"
                                  className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-casino-cyber rounded-r-full shadow-[0_0_10px_rgba(255,0,255,0.8)]"
                                />
                              )}
                              
                              <div className="flex items-center gap-4">
                                <motion.div
                                  animate={{
                                    scale: isHovered || isActive ? 1.1 : 1,
                                    rotate: isHovered ? [0, -10, 10, 0] : 0
                                  }}
                                  transition={{ duration: 0.2 }}
                                  className={`w-5 h-5 flex justify-center items-center ${isActive ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`}
                                >
                                  {item.icon}
                                </motion.div>
                                <span className={`text-sm font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>
                                  {item.label}
                                </span>
                              </div>

                              {/* Hover arrow animation */}
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ 
                                  opacity: isHovered || isActive ? 1 : 0, 
                                  x: isHovered || isActive ? 0 : -10 
                                }}
                              >
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-casino-cyber" />
                              </motion.div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

            </div>

            {/* Bottom Section: Logout / Connection status */}
            <div className="p-4 border-t border-white/5 bg-gradient-to-t from-casino-darker to-transparent">
              <button 
                onClick={() => {
                  sfx.playClick();
                  // Simulate Logout logic
                }}
                onMouseEnter={() => sfx.playHover()}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-500 transition-colors duration-300 group"
              >
                <div className="flex items-center gap-3 font-semibold text-sm">
                  <LogOut className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span>Déconnexion</span>
                </div>
              </button>
            </div>

          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
