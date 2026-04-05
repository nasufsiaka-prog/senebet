import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bird, Skull, ChevronUp, DollarSign, History } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

// --- Mathématiques & Constantes ---
const ROWS = 10;
const COLS = 5;

// Multiplicateur qui augmente à chaque ligne franchie avec succès
// Les probabilités : 4 chances sur 5 de passer par ligne
const calculateMultiplier = (step: number): number => {
  if (step === 0) return 1.00;
  
  let probability = 1;
  const safeSpots = 4; // 1 bombe par ligne
  
  for (let i = 0; i < step; i++) {
    probability *= (safeSpots / COLS);
  }
  
  const houseEdge = 0.01;
  const mult = (1 - houseEdge) / probability;
  return parseFloat(mult.toFixed(2));
};

type GameState = 'idle' | 'playing' | 'cashed_out' | 'dead';
type RowState = 'locked' | 'active' | 'passed';

interface TileData {
    isMine: boolean;
    isRevealed: boolean;
    isPath: boolean; // Le choix du joueur
}

export const ChickenGame: React.FC = () => {
    const { state, dispatch } = useCasino();

    const [betAmount, setBetAmount] = useState<number>(1000);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [currentStep, setCurrentStep] = useState(0); // 0 to ROWS
    const [profit, setProfit] = useState(0);

    // Structure de la Grille : Array de ROWS, contenant chacune COLS tuiles
    const [grid, setGrid] = useState<TileData[][]>([]);
    const activeRowRef = useRef<HTMLDivElement>(null);

    const currentMultiplier = currentStep > 0 ? calculateMultiplier(currentStep) : 1.00;
    const nextMultiplier = calculateMultiplier(currentStep + 1);

    useEffect(() => {
        if (gameState === 'idle') {
            const initialGrid: TileData[][] = Array(ROWS).fill(null).map(() => 
                Array(COLS).fill(null).map(() => ({
                    isMine: false,
                    isRevealed: false,
                    isPath: false
                }))
            );
            setGrid(initialGrid);
            setCurrentStep(0);
            setProfit(0);
        }
    }, [gameState]);

    // Auto-scroll camera
    useEffect(() => {
        if (activeRowRef.current) {
            activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentStep, gameState]);

    const startGame = () => {
        if (state.balance < betAmount || betAmount < 200) {
            sfx.playClick();
            return;
        }

        sfx.playCoin();
        dispatch({ type: 'BET', payload: { amount: betAmount, game: 'Chicken Cross' } });

        // Génération de la "Mine" pour chaque ligne
        const newGrid: TileData[][] = Array(ROWS).fill(null).map(() => {
            const row = Array(COLS).fill(null).map(() => ({ isMine: false, isRevealed: false, isPath: false }));
            // Place 1 mine per row
            const mineIndex = Math.floor(Math.random() * COLS);
            row[mineIndex].isMine = true;
            return row;
        });

        setGrid(newGrid);
        setGameState('playing');
        setCurrentStep(0);
        setProfit(betAmount);
    };

    const handleTileClick = (rowIndex: number, colIndex: number) => {
        // Le joueur ne peut cliquer que sur la ligne active actuelle
        if (gameState !== 'playing' || rowIndex !== currentStep) return;

        const newGrid = [...grid];
        const tile = newGrid[rowIndex][colIndex];

        tile.isRevealed = true;
        tile.isPath = true; // C'est le chemin choisi par le joueur

        if (tile.isMine) {
            // PERDU - SQUASHED
            sfx.playExplosion('light');
            setGameState('dead');
            
            // Révéler le reste du plateau pour frustration
            newGrid.forEach(row => {
                row.forEach(t => { t.isRevealed = true; });
            });
            setGrid(newGrid);

            const container = document.getElementById('chicken-container');
            if (container) {
                container.classList.add('animate-shake');
                setTimeout(() => container.classList.remove('animate-shake'), 400);
            }

        } else {
            // SAFE
            const step = currentStep + 1;
            setCurrentStep(step);
            setGrid(newGrid);
            setProfit(betAmount * calculateMultiplier(step));
            
            sfx.playTension(step, step === ROWS);

            if (step >= ROWS) {
                // VICTOIRE TOTALE
                setTimeout(cashOut, 300);
            }
        }
    };

    const cashOut = () => {
        if (gameState !== 'playing' || currentStep === 0) return;
        
        sfx.playVictoryArpeggio(currentMultiplier);
        
        // Révéler les mines par transparence
        setGrid(prev => prev.map(row => row.map(t => ({ ...t, isRevealed: true })))); 
        
        const finalProfit = betAmount * currentMultiplier;
        dispatch({ type: 'WIN', payload: { amount: finalProfit, game: 'Chicken Cross', multiplier: currentMultiplier } });
        
        setProfit(finalProfit);
        setGameState('cashed_out');
    };


    return (
        <div id="chicken-container" className="w-full h-full flex flex-col md:flex-row gap-4 p-2 relative">
            
            {/* Visual Flashes */}
            <div id="chicken-flash-overlay" className={`absolute inset-0 pointer-events-none z-[100] rounded-3xl transition-all duration-300 ${gameState === 'dead' ? 'bg-red-900/40 mix-blend-color-burn' : gameState === 'cashed_out' ? 'bg-casino-success/20 animate-cashout-flash' : 'bg-transparent'}`} />

            {/* --- PANEL LATERAL --- */}
            <div className="w-full justify-between pb-8 md:w-80 flex flex-col gap-4 z-10 shrink-0">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
                    
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-700 mb-2">
                         <Bird className="w-5 h-5 text-yellow-400" />
                         <h3 className="text-slate-300 font-bold tracking-widest uppercase text-xs">Chicken</h3>
                    </div>

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

                    <button
                        onClick={() => {
                            if (gameState === 'idle' || gameState === 'cashed_out' || gameState === 'dead') startGame();
                            else if (gameState === 'playing' && currentStep > 0) cashOut();
                        }}
                        disabled={gameState === 'playing' && currentStep === 0}
                        className={`
                            mt-2 w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-300 relative overflow-hidden flex flex-col items-center group
                            ${
                                gameState === 'playing' && currentStep > 0
                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 border-2 border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-105'
                                    : gameState === 'playing' && currentStep === 0
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]'
                            }
                        `}
                    >   
                        {gameState === 'idle' && 'Commencer'}
                        {(gameState === 'cashed_out' || gameState === 'dead') && 'Rejouer'}
                        {gameState === 'playing' && currentStep === 0 && 'Traversez...'}
                        
                        {gameState === 'playing' && currentStep > 0 && (
                            <>
                                <span className="text-[10px] opacity-80 mb-1 leading-none">Prendre les gains</span>
                                <span className="text-2xl drop-shadow-md leading-none">
                                    {new Intl.NumberFormat('fr-FR').format(profit)} F
                                </span>
                            </>
                        )}
                        {(gameState === 'playing' && currentStep > 0) && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-sweep pointer-events-none" />}
                    </button>
                </div>

                {/* HUD Data */}
                <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-inner mt-4">
                     <div className="flex justify-between items-center bg-white/5 rounded-lg py-2 px-3">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mult. Actuel</span>
                        <span className="text-sm font-black text-white">{currentMultiplier.toFixed(2)}x</span>
                     </div>
                     <div className="flex justify-between items-center bg-white/5 rounded-lg py-2 px-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-casino-gold/0 via-casino-gold/10 to-casino-gold/0 animate-sweep" />
                        <span className="text-xs text-casino-gold/80 font-bold uppercase tracking-wider">Prochain Mult.</span>
                        <span className="text-sm font-black text-casino-gold text-glow-gold">{nextMultiplier.toFixed(2)}x</span>
                     </div>
                </div>

            </div>

            {/* --- GRILLE D'AVANCEMENT --- */}
            <div className="flex-1 bg-slate-800/60 rounded-2xl border border-slate-700 relative flex flex-col items-center overflow-y-auto no-scrollbar py-4 px-2 sm:px-4 min-h-0">
                
                {/* Lignes d'arrivée (Visuel) */}
                <div className="w-full max-w-lg mb-4 flex items-center justify-between text-casino-gold opacity-50 px-4">
                    <History className="w-5 h-5"/>
                    <span className="text-xs font-black tracking-widest uppercase text-glow-gold">Ligne d'arrivée (x{calculateMultiplier(ROWS).toFixed(2)})</span>
                    <History className="w-5 h-5"/>
                </div>

                {/* La Route / Grille (Rendu à l'envers pour que le joueur monte) */}
                <div className="w-full max-w-sm flex flex-col-reverse gap-1 sm:gap-1.5">
                     {grid.map((row, rowIndex) => {
                         const isRowActive = gameState === 'playing' && rowIndex === currentStep;
                         const isRowPassed = rowIndex < currentStep;

                         return (
                            <div 
                                key={rowIndex} 
                                ref={isRowActive ? activeRowRef : null}
                                className={`grid grid-cols-5 gap-1 sm:gap-1.5 transition-opacity duration-300 ${isRowPassed ? 'opacity-50' : rowIndex > currentStep && gameState === 'playing' ? 'opacity-30' : 'opacity-100'}`}
                            >
                                {row.map((tile, colIndex) => {

                                    const isHoverable = isRowActive && !tile.isRevealed;
                                    const isSafePath = isRowPassed && tile.isPath && !tile.isMine;
                                    const isDeathPath = gameState === 'dead' && tile.isPath && tile.isMine;
                                    const isNearMissMine = (gameState === 'dead' || gameState === 'cashed_out') && tile.isRevealed && tile.isMine && !tile.isPath;
                                    const isNearMissSafe = (gameState === 'dead' || gameState === 'cashed_out') && tile.isRevealed && !tile.isMine && !tile.isPath;

                                    return (
                                        <motion.button
                                            key={colIndex}
                                            disabled={!isHoverable}
                                            onClick={() => handleTileClick(rowIndex, colIndex)}
                                            whileHover={isHoverable ? { y: -4, scale: 1.05 } : {}}
                                            whileTap={isHoverable ? { scale: 0.95 } : {}}
                                            className={`
                                                relative aspect-square rounded-[20%] border-b-4 flex items-center justify-center transform-style-3d transition-all duration-300
                                                ${isHoverable ? 'bg-[#222736] border-[#181c28] cursor-pointer hover:bg-[#2a2f42] hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 
                                                  !tile.isRevealed ? 'bg-[#181c28] border-[#131620] opacity-50' : 'border-transparent'} // Base logic
                                            `}
                                        >
                                            
                                            {/* Actif Arrow Indicator */}
                                            {isHoverable && (
                                                <div className="absolute -bottom-4 animate-bounce text-casino-gold/50">
                                                    <ChevronUp className="w-4 h-4" />
                                                </div>
                                            )}

                                            {/* Révélation du tile */}
                                            <AnimatePresence>
                                                {tile.isRevealed && (
                                                    <motion.div
                                                        initial={{ rotateX: 90, opacity: 0 }}
                                                        animate={{ rotateX: 0, opacity: 1 }}
                                                        className={`absolute inset-0 rounded-[20%] flex items-center justify-center shadow-inner
                                                            ${isDeathPath ? 'bg-red-500 border-2 border-red-900 shadow-[0_0_20px_rgba(239,68,68,0.8)]' :
                                                              isNearMissMine ? 'bg-red-900/50 border border-red-500/30 opacity-70' :
                                                              isSafePath ? 'bg-casino-gold border-2 border-yellow-700 shadow-[0_0_20px_rgba(255,215,0,0.5)] z-10' :
                                                              isNearMissSafe ? 'bg-green-900/20 border border-green-500/20 opacity-30 shadow-none' :
                                                              'bg-transparent'
                                                            }
                                                        `}
                                                    >
                                                        {isDeathPath || isNearMissMine ? (
                                                            <Skull className={`w-8 h-8 md:w-10 md:h-10 ${isDeathPath ? 'text-black drop-shadow-md' : 'text-red-500/50'}`} />
                                                        ) : isSafePath || isNearMissSafe ? (
                                                            <Bird className={`w-8 h-8 md:w-10 md:h-10 ${isSafePath ? 'text-black drop-shadow-md animate-bounce' : 'text-green-500/50'}`} />
                                                        ) : null}

                                                        {/* Ligne tracée pour montrer le chemin du poulet */}
                                                        {isSafePath && rowIndex > 0 && (
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-[150%] bg-casino-gold/50 blur-[1px] -z-10" />
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    );
                                })}
                            </div>
                         );
                     })}
                </div>
            </div>
        </div>
    );
};
