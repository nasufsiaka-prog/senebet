import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, Bomb, Navigation } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

// --- Constantes & Mathématiques ---
const GRID_SIZE = 25;

// Fonction de calcul de probabilité combinatoire pour le multiplicateur
const calculateMultiplier = (mines: number, diamondsFound: number): number => {
  const houseEdge = 0.01; // 1%
  let probability = 1;
  const safeSpots = GRID_SIZE - mines;
  
  for (let i = 0; i < diamondsFound; i++) {
    probability *= (safeSpots - i) / (GRID_SIZE - i);
  }
  
  const mult = (1 - houseEdge) / probability;
  return Math.max(0, parseFloat(mult.toFixed(2)));
};

type GameState = 'idle' | 'playing' | 'cashed_out' | 'exploded';

interface TileData {
  index: number;
  isMine: boolean;
  isRevealed: boolean;
}

export const MinesGame: React.FC = () => {
  const { state, dispatch } = useCasino();

  // --- States d'Interface ---
  const [betAmount, setBetAmount] = useState<number>(1000);
  const [mineCount, setMineCount] = useState<number>(3);
  const [isAutoBet, setIsAutoBet] = useState(false);
  
  // --- States de Jeu ---
  const [gameState, setGameState] = useState<GameState>('idle');
  const [grid, setGrid] = useState<TileData[]>([]);
  const [diamondsFound, setDiamondsFound] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  
  // Calcul dynamique du multiplicateur actuel et du prochain
  const currentMultiplier = diamondsFound > 0 ? calculateMultiplier(mineCount, diamondsFound) : 1.00;
  const nextMultiplier = calculateMultiplier(mineCount, diamondsFound + 1);

  // Initialisation de la grille vide
  useEffect(() => {
    if (gameState === 'idle') {
      const initialGrid = Array.from({ length: GRID_SIZE }, (_, i) => ({
        index: i,
        isMine: false,
        isRevealed: false
      }));
      setGrid(initialGrid);
      setDiamondsFound(0);
      setProfit(0);
    }
  }, [gameState]);

  // --- LOGIQUE METIER ---

  const startGame = () => {
    if (state.balance < betAmount || betAmount < 200) {
      sfx.playClick();
      return;
    }
    sfx.playCoin();
    dispatch({ type: 'BET', payload: { amount: betAmount, game: 'Mines' } });

    // Génération cryptographique des mines (simulée)
    const newGrid = Array.from({ length: GRID_SIZE }, (_, i) => ({
      index: i,
      isMine: false,
      isRevealed: false
    }));

    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[r].isMine) {
        newGrid[r].isMine = true;
        minesPlaced++;
      }
    }

    setGrid(newGrid);
    setGameState('playing');
    setDiamondsFound(0);
    setProfit(betAmount); // Profit de départ visuel (pour faire reculer psychologiquement le joueur)
  };

  const cashOut = () => {
    if (gameState !== 'playing' || diamondsFound === 0) return;
    
    sfx.playVictoryArpeggio(currentMultiplier);
    
    // Near Miss inversé : on montre où étaient les mines par transparence pour rassurer le joueur qu'il a bien fait
    setGrid(prev => prev.map(t => ({ ...t, isRevealed: true }))); 
    
    const finalProfit = betAmount * currentMultiplier;
    dispatch({ type: 'WIN', payload: { amount: finalProfit, game: 'Mines', multiplier: currentMultiplier } });
    
    setProfit(finalProfit);
    setGameState('cashed_out');

    // Auto Restart Logic si AutoBet
    if (isAutoBet) {
      setTimeout(() => setGameState('idle'), 2000);
      setTimeout(() => { if(state.balance >= betAmount) startGame() }, 2500);
    }
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;
    if (grid[index].isRevealed) return; // Déjà cliqué

    const newGrid = [...grid];
    const tile = newGrid[index];
    
    tile.isRevealed = true;

    if (tile.isMine) {
      // BOUM
      sfx.playExplosion('light');
      setGameState('exploded');
      
      // NEAR-MISS PSYCHOLOGIQUE : Révèle TOUT le plateau
      // Les diamants non trouvés apparaissent avec une opacité à 50% pour générer la frustration "J'y étais presque"
      setGrid(newGrid.map(t => ({ ...t, isRevealed: true })));
      
      const container = document.getElementById('mines-grid-container');
      if (container) {
        container.classList.add('animate-shake');
        setTimeout(() => container.classList.remove('animate-shake'), 400);
      }

      if (isAutoBet) {
        setTimeout(() => setGameState('idle'), 2000);
        setTimeout(() => { if(state.balance >= betAmount) startGame() }, 2500);
      }

    } else {
      // DIAMANT
      const newCount = diamondsFound + 1;
      setDiamondsFound(newCount);
      setGrid(newGrid);
      
      // Pitch-Rising Audio : La tension monte à chaque diamant
      sfx.playTension(newCount, newCount === (GRID_SIZE - mineCount));
      
      setProfit(betAmount * calculateMultiplier(mineCount, newCount));

      // Auto Cashout si on trouve TOUT
      if (newCount === (GRID_SIZE - mineCount)) {
        setTimeout(cashOut, 200);
      }
    }
  };


  // --- RENDU UI ---
  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 p-2 relative">
      
      <div id="cashout-mine-flash" className="absolute inset-0 pointer-events-none z-[100] rounded-3xl" />
      {gameState === 'cashed_out' && (
        <style dangerouslySetInnerHTML={{__html: `#cashout-mine-flash { animation: cashout-flash 0.5s ease-out forwards; }`}} />
      )}

      {/* --- PANEL DE CONTROLES --- */}
      <div className="w-full md:w-80 flex flex-col gap-4 z-10 shrink-0">
        
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
            {/* Boutons Auto/Manuel */}
            <div className="flex bg-slate-900/50 rounded-xl p-1 mb-2">
                <button onClick={() => { sfx.playClick(); setIsAutoBet(false); }} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${!isAutoBet ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                Manuel
                </button>
                <button onClick={() => { sfx.playClick(); setIsAutoBet(true); }} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${isAutoBet ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                Auto
                </button>
            </div>

            {/* Input Montant */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                <label className="flex justify-between text-sm font-bold text-slate-300 mb-3">
                  <span>Mise (Min 200)</span><span className="text-emerald-500">FCFA</span>
                </label>
                <div className="flex items-center bg-slate-800 rounded-xl overflow-hidden border border-slate-600 focus-within:border-emerald-500">
                <input 
                    type="number" min="200" value={betAmount || ''} onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="flex-1 bg-transparent border-none text-white font-black text-lg px-4 py-3 focus:outline-none w-full"
                />
                <div className="flex border-l border-slate-600">
                    <button onClick={() => { sfx.playHover(); setBetAmount(Math.max(200, Math.floor(betAmount / 2))); }} className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-sm font-bold text-slate-300 transition-colors border-r border-slate-600">/2</button>
                    <button onClick={() => { sfx.playHover(); setBetAmount(betAmount * 2); }} className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-sm font-bold text-slate-300 transition-colors">x2</button>
                </div>
                </div>
            </div>

            {/* Selecteur de Mines */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Nombre de Mines</label>
                <select 
                    value={mineCount} 
                    onChange={(e) => { sfx.playHover(); setMineCount(Number(e.target.value)); }}
                    disabled={gameState !== 'idle'}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-casino-danger shadow-inner appearance-none cursor-pointer"
                >
                    {[1, 2, 3, 4, 5, 10, 15, 20, 24].map(n => (
                        <option key={n} value={n}>{n} Mine{n > 1 ? 's' : ''}</option>
                    ))}
                </select>
            </div>

            {/* BOUTON D'ACTION PRINCIPAL */}
            <button
                onClick={gameState === 'idle' || gameState === 'cashed_out' || gameState === 'exploded' ? startGame : cashOut}
                disabled={gameState === 'playing' && diamondsFound === 0}
                className={`
                    mt-2 w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-300 relative overflow-hidden group
                    ${
                    gameState === 'playing' && diamondsFound > 0
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 shadow-[0_0_30px_rgba(250,204,21,0.6)] border-2 border-yellow-300 scale-105'
                        : gameState === 'playing' && diamondsFound === 0
                        ? 'bg-slate-700 text-slate-500 border border-slate-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]'
                    }
                `}
            >
                {gameState === 'playing' && diamondsFound > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sweep pointer-events-none" />
                )}

                {gameState === 'idle' && 'Parier'}
                {(gameState === 'cashed_out' || gameState === 'exploded') && 'Rejouer'}
                
                {gameState === 'playing' && diamondsFound === 0 && 'Choisissez une case'}
                {gameState === 'playing' && diamondsFound > 0 && (
                <div className="flex flex-col items-center leading-none">
                    <span className="text-sm">Encaisser</span>
                    <span className="text-2xl mt-1 drop-shadow-md">
                    {new Intl.NumberFormat('fr-FR').format(profit)} <span className="text-sm">F</span>
                    </span>
                </div>
                )}
            </button>
        </div>

        {/* HUD D'INFORMATION STATISTIQUE (Très tech) */}
        <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
            <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center border-b border-white/5 pb-2">Données de session</h4>
            
            <div className="flex justify-between items-center bg-white/5 rounded-lg p-2 px-3">
                <span className="text-xs text-gray-400 flex items-center gap-2"><Navigation className="w-3 h-3"/> Multiplicateur actuel</span>
                <span className="text-sm font-black text-white">{currentMultiplier.toFixed(2)}x</span>
            </div>
            
            <div className="flex justify-between items-center bg-white/5 rounded-lg p-2 px-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-casino-success/0 via-casino-success/10 to-casino-success/0 -translate-x-full group-hover:animate-sweep" />
                <span className="text-xs text-gray-400 flex items-center gap-2"><Gem className="w-3 h-3 text-casino-cyberCyan"/> Prochain Case Sûre</span>
                <span className="text-sm font-black text-casino-success">{nextMultiplier.toFixed(2)}x</span>
            </div>

            <div className="flex justify-between items-center mt-auto">
                <div className="flex items-center gap-1.5"><Bomb className="w-4 h-4 text-red-500 opacity-50"/> <span className="text-xs font-mono text-gray-500">{mineCount}</span></div>
                <div className="flex items-center gap-1.5"><Gem className="w-4 h-4 text-cyan-400 opacity-50"/> <span className="text-xs font-mono text-gray-500">{GRID_SIZE - mineCount}</span></div>
            </div>
        </div>

      </div>

      {/* --- GRILLE DE JEU (PLATEAU 5x5) --- */}
      <div className="flex-1 bg-slate-800/60 rounded-2xl border border-slate-700 relative flex items-center justify-center overflow-auto min-h-0 touch-pan-x touch-pan-y no-scrollbar" style={{ overscrollBehavior: 'contain' }}>

        <div id="mines-grid-container" className="grid grid-cols-5 gap-1.5 sm:gap-2 p-3 sm:p-4 w-full min-w-[300px] max-w-xs sm:max-w-sm relative z-10 my-auto mx-auto scale-95 sm:scale-100">
            {grid.map((tile, i) => {
              
              // Détermination du style de la case
              const isHoverable = gameState === 'playing' && !tile.isRevealed;
              
              // --- NEAR MISS LOGIC ---
              // Si la case contient un diamant, qu'on a explosé, et qu'on ne l'avait pas découvert, on l'affiche avec opacité
              const isMissedDiamond = gameState === 'exploded' && !tile.isMine && tile.index >= diamondsFound; // Logique visuelle
              
              const isExplodedMine = gameState === 'exploded' && tile.isMine && tile.isRevealed; 
              const isSafeMineReveal = (gameState === 'exploded' || gameState === 'cashed_out') && tile.isMine && !isExplodedMine;

              return (
                <motion.button
                  key={i}
                  disabled={!isHoverable}
                  onClick={() => handleTileClick(i)}
                  whileHover={isHoverable ? { scale: 1.05, y: -2, rotateX: 10 } : {}}
                  whileTap={isHoverable ? { scale: 0.95 } : {}}
                  className={`
                    relative aspect-square rounded-xl md:rounded-2xl flex items-center justify-center transform-style-3d transition-all duration-[400ms] border shadow-glass
                    ${
                        !tile.isRevealed 
                            ? 'bg-[linear-gradient(135deg,rgba(40,45,65,0.9),rgba(20,25,40,0.9))] border-white/5 hover:border-white/20 hover:shadow-neon-cyberCyan cursor-pointer' 
                            : 'border-transparent' // Fond géré par le contenu
                    }
                  `}
                >
                  
                  {/* FACE CACHEE (Défaut) */}
                  <AnimatePresence>
                    {!tile.isRevealed && (
                       <motion.div 
                          exit={{ opacity: 0, rotateY: 90 }}
                          className="absolute inset-0 rounded-xl bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)] pointer-events-none" 
                       />
                    )}
                  </AnimatePresence>

                  {/* FACE REVELEE */}
                  <AnimatePresence>
                    {tile.isRevealed && (
                      <motion.div
                        initial={{ opacity: 0, rotateY: -90, scale: 0.5 }}
                        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className={`absolute inset-0 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner
                          ${
                              isExplodedMine ? 'bg-red-500/20 border-2 border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)] animate-pulse' :
                              isSafeMineReveal ? 'bg-black/50 border border-white/5 opacity-50' : // C'était une mine, mais on montre où elle était
                              (gameState === 'exploded' && !tile.isMine) ? 'bg-casino-cyberCyan/5 border border-casino-cyberCyan/20 opacity-40' : // Near Miss Diamond
                              'bg-green-500/10 border-2 border-green-500/50 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]' // Normal Diamond found
                          }
                        `}
                      >
                         {tile.isMine ? (
                             <Bomb className={`w-8 h-8 md:w-12 md:h-12 ${isExplodedMine ? 'text-red-500 drop-shadow-glow-danger' : 'text-gray-500'}`} />
                         ) : (
                             <Gem className={`w-8 h-8 md:w-12 md:h-12 ${gameState === 'exploded' ? 'text-cyan-600/50' : 'text-casino-cyberCyan drop-shadow-glow-cyber'}`} />
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.button>
              );
            })}
        </div>

      </div>

    </div>
  );
};
