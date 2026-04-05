import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

interface LayoutProps {
  children: React.ReactNode;
  activeGame: string | null;
  onNavigate: (view: string) => void;
  openWalletModal: () => void;
  openFaucetModal: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeGame, 
  onNavigate, 
  openWalletModal, 
  openFaucetModal 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const { state } = useCasino();

  // Initialisation paresseuse de l'AudioEngine pour bypasser le blocage des navigateurs.
  // Au tout premier clic N'IMPORTE OÙ sur le body, on lance le Drone Ambiant.
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isAudioInitialized && state.soundEnabled) {
        sfx.startAmbient();
        setIsAudioInitialized(true);
        // Supprime les event listeners une fois initialisé
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isAudioInitialized, state.soundEnabled]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-casino-darkest">
      
      {/* Arrière-plan Dynamique Neo-Cyberpunk (Optimisé FPS) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-mesh-pattern opacity-5 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-casino-cyber/5 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-casino-success/5 blur-[80px] rounded-full -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* SIDEBAR Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activeGame={activeGame}
        onNavigate={onNavigate} 
      />

      {/* Main Content Area */}
      <main className="relative flex flex-col flex-1 h-full z-10 min-w-0">
        {/* TOPBAR Component */}
        <Topbar 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          openWalletModal={openWalletModal}
          openFaucetModal={openFaucetModal}
        />

        {/* Dynamic Inner Scene (Les Jeux ou le Dashboard viennent se plugger ici) */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative p-4 md:p-6 lg:p-8">
          
          {/* Transition Animée entre les Vues */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGame || 'dashboard'} // Clé dynamique pour forcer le remount/animation
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 1.02, filter: 'blur(5px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full max-w-[1600px] mx-auto flex flex-col items-center justify-center"
            >
              <div className="w-full h-full bg-casino-surface/60 rounded-3xl p-2 sm:p-4 shadow-glass border border-white/5 relative overflow-hidden backdrop-blur-md">
                {/* Reflet sur la vitre de la Single Page Application */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                {/* Le contenu enfant (Jeu) injecté ici */}
                {children}

              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </main>

    </div>
  );
};
