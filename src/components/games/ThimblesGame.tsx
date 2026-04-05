import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, CircleDot, Shuffle } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

// --- Constantes & Mathématiques ---
// 1 Balle = 1 chance sur 3 (x2.88 après house edge)
// 2 Balles = 2 chances sur 3 (x1.44 après house edge)
const HOUSE_EDGE = 0.96; // 4% de prélèvement 

const calculateMultiplier = (ballsNum: number): number => {
  const proba = ballsNum / 3;
  return parseFloat(((1 / proba) * HOUSE_EDGE).toFixed(2));
};

type GameState = 'idle' | 'showing_balls' | 'shuffling' | 'waiting_choice' | 'revealed';

interface Thimble {
  id: number;
  hasBall: boolean;
}

export const ThimblesGame: React.FC = () => {
    const { state, dispatch } = useCasino();

    const [betAmount, setBetAmount] = useState<number>(1000);
    const [numBalls, setNumBalls] = useState<number>(1); // 1 ou 2
    
    const [gameState, setGameState] = useState<GameState>('idle');
    const [thimbles, setThimbles] = useState<Thimble[]>([
        { id: 0, hasBall: false },
        { id: 1, hasBall: false },
        { id: 2, hasBall: false }
    ]);
    
    const [profit, setProfit] = useState(0);
    const [selectedThimble, setSelectedThimble] = useState<number | null>(null);

    const currentMultiplier = calculateMultiplier(numBalls);

    // Initialisation
    useEffect(() => {
        if (gameState === 'idle') {
            setThimbles([
                { id: 0, hasBall: false },
                { id: 1, hasBall: false },
                { id: 2, hasBall: false }
            ]);
            setSelectedThimble(null);
            setProfit(0);
        }
    }, [gameState]);


    // --- CYCLE DE JEU ---
    const startGame = async () => {
        if (state.balance < betAmount || betAmount < 200) {
            sfx.playClick();
            return;
        }

        sfx.playCoin();
        dispatch({ type: 'BET', payload: { amount: betAmount, game: 'Thimbles' } });
        
        // 1. Placement caché des balles
        let initialThimbles = [
            { id: 0, hasBall: false },
            { id: 1, hasBall: false },
            { id: 2, hasBall: false }
        ];

        let placed = 0;
        while(placed < numBalls) {
            const r = Math.floor(Math.random() * 3);
            if (!initialThimbles[r].hasBall) {
                initialThimbles[r].hasBall = true;
                placed++;
            }
        }
        
        setThimbles(initialThimbles);
        setGameState('showing_balls');
        sfx.playTension(1, false);

        // On montre où sont les balles pendant 0.8 seconde (rapide)
        await new Promise(r => setTimeout(r, 800));

        // 2. Début du mélange
        setGameState('shuffling');
        performShuffle(initialThimbles);
    };

    const performShuffle = async (currentArr: Thimble[]) => {
        let arr = [...currentArr];
        let shuffles = 0;
        const totalShuffles = 15 + Math.floor(Math.random() * 8); // 15 à 23 swaps (impossible à suivre)
        const speedMs = 100; // Ultra-rapide
        
        const tick = setInterval(() => {
            if (shuffles >= totalShuffles) {
                clearInterval(tick);
                setGameState('waiting_choice');
                sfx.playTension(2, true); // Son d'attente lourd
                setThimbles(arr);
                return;
            }

            // Choisir deux index aléatoires à swapper
            let idx1 = Math.floor(Math.random() * 3);
            let idx2 = Math.floor(Math.random() * 3);
            while (idx1 === idx2) idx2 = Math.floor(Math.random() * 3);

            // Swap dans le state => déclenche l'animation Framer Motion
            const temp = arr[idx1];
            arr[idx1] = arr[idx2];
            arr[idx2] = temp;
            
            // "Force" React à voir la modification de tableau pour le re-render
            setThimbles([...arr]);
            
            sfx.playHover(); // Son de glissement "Swoosh"
            shuffles++;
        }, speedMs);
    };

    const selectThimble = (id: number) => {
        if (gameState !== 'waiting_choice') return;
        
        setSelectedThimble(id);
        setGameState('revealed');

        // Trouver si on a gagné
        const chosen = thimbles.find(t => t.id === id);

        if (chosen?.hasBall) {
            // GAGNE
            const finalProfit = betAmount * currentMultiplier;
            sfx.playVictoryArpeggio(currentMultiplier);
            dispatch({ type: 'WIN', payload: { amount: finalProfit, game: 'Thimbles', multiplier: currentMultiplier } });
            setProfit(finalProfit);

            // Flash Vert
            const flash = document.getElementById('thimbles-flash');
            if (flash) {
                flash.classList.add('animate-cashout-flash');
                setTimeout(() => flash.classList.remove('animate-cashout-flash'), 500);
            }

        } else {
            // PERDU
            sfx.playExplosion('light');
            
            // Shake
            const container = document.getElementById('thimbles-container');
            if (container) {
                container.classList.add('animate-shake');
                setTimeout(() => container.classList.remove('animate-shake'), 400);
            }
        }
    };

    return (
        <div id="thimbles-container" className="w-full h-full flex flex-col md:flex-row gap-4 p-2 relative">
            <div id="thimbles-flash" className="absolute inset-0 pointer-events-none z-[100] rounded-3xl" />
            {(gameState === 'revealed' && profit === 0) && (
                 <div className="absolute inset-0 pointer-events-none z-[100] rounded-3xl bg-red-900/40 mix-blend-color-burn transition-opacity duration-300" />
            )}

            {/* --- PANEL DE PARIS --- */}
            <div className="w-full md:w-80 flex flex-col gap-4 z-10 shrink-0">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
                    
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5 mb-2">
                         <Shuffle className="w-5 h-5 text-blue-500" />
                         <h3 className="text-gray-300 font-bold tracking-widest uppercase text-xs">Le Bonneteau</h3>
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

                    {/* Sélection du nombre de balles */}
                    <div className="flex flex-col gap-1.5 mb-2">
                         <label className="text-[10px] text-gray-500 font-bold uppercase transition-colors">Nombre de Balles (Probabilité)</label>
                         <div className="flex gap-2">
                             <button
                               onClick={() => { sfx.playHover(); setNumBalls(1); }}
                               disabled={gameState !== 'idle' && gameState !== 'revealed'}
                               className={`flex-1 py-3 rounded-lg border flex flex-col items-center justify-center transition-all ${numBalls === 1 ? 'bg-blue-600/20 border-blue-500 text-blue-500 shadow-neon-cyberCyan' : 'bg-black/50 border-white/5 text-gray-500 hover:text-gray-300'}`}
                             >
                                <CircleDot className="w-5 h-5 mb-1" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Une (x2.88)</span>
                             </button>
                             <button
                               onClick={() => { sfx.playHover(); setNumBalls(2); }}
                               disabled={gameState !== 'idle' && gameState !== 'revealed'}
                               className={`flex-1 py-3 rounded-lg border flex flex-col items-center justify-center transition-all ${numBalls === 2 ? 'bg-blue-600/20 border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-black/50 border-white/5 text-gray-500 hover:text-gray-300'}`}
                             >
                                <div className="flex gap-1 mb-1">
                                    <CircleDot className="w-5 h-5" />
                                    <CircleDot className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] uppercase font-black tracking-widest">Deux (x1.44)</span>
                             </button>
                         </div>
                    </div>

                    <button
                        onClick={() => {
                            if (gameState === 'idle' || gameState === 'revealed') startGame();
                        }}
                        disabled={gameState === 'shuffling' || gameState === 'showing_balls' || gameState === 'waiting_choice'}
                        className={`
                            w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-300 relative overflow-hidden flex flex-col items-center group border
                            ${
                                gameState === 'waiting_choice'
                                    ? 'bg-blue-900 border-blue-500 text-white animate-pulse shadow-neon-cyberCyan cursor-not-allowed'
                                    : (gameState === 'shuffling' || gameState === 'showing_balls')
                                    ? 'bg-[#111] text-gray-600 border-transparent cursor-not-allowed'
                                    : gameState === 'revealed' && profit > 0
                                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 border-green-400 text-white shadow-neon-success'
                                    : 'bg-casino-accent hover:bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                            }
                        `}
                    >   
                        {gameState === 'idle' && 'Mélanger'}
                        {(gameState === 'shuffling' || gameState === 'showing_balls') && 'Pari Verrouillé...'}
                        {gameState === 'waiting_choice' && 'Choisissez !'}
                        
                        {gameState === 'revealed' && profit > 0 && (
                            <>
                                <span className="text-[10px] opacity-80 mb-1 leading-none uppercase">Gagné</span>
                                <span className="text-2xl drop-shadow-md leading-none">
                                    + {new Intl.NumberFormat('fr-FR').format(profit)} F
                                </span>
                            </>
                        )}
                        {gameState === 'revealed' && profit === 0 && 'Retenter (Perdu)'}

                        {(gameState === 'idle' || gameState === 'revealed') && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-sweep pointer-events-none" />}
                    </button>

                </div>
            </div>

            {/* --- LE PLATEAU (SCENE 3D) --- */}
            <div className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#181f3a] to-[#04060b] rounded-3xl border border-white/5 shadow-inner relative flex flex-col items-center justify-center overflow-hidden py-10 px-4">
               
               <div className="absolute inset-0 bg-transparent mix-blend-overlay opacity-5 pointer-events-none" />
               <div className="absolute bottom-0 w-full h-24 bg-black/50 blur-[20px] rounded-[50%] scale-y-50 -translate-y-8" /> {/* Table shadow allégée */}

               <div className="w-full max-w-2xl h-80 relative flex items-center justify-center">
                    
                    {/* Structure Layout Group permet de suivre les ID pendant le shuffle magiquement */}
                    <div className="flex gap-4 sm:gap-8 md:gap-16 items-end h-64 relative z-10 w-full justify-center">
                        {thimbles.map((thimble) => {
                            
                            const isRevealedPhase = gameState === 'showing_balls' || gameState === 'revealed';
                            const showBall = isRevealedPhase && thimble.hasBall; // Balle visible UNIQUEMENT pendant showing et revealed
                            const isLifted = isRevealedPhase; // Gobelets levés uniquement pendant ces phases
                            const didIChooseThis = gameState === 'revealed' && selectedThimble === thimble.id;
                            
                            return (
                                <motion.button
                                    key={thimble.id}
                                    layout // Active l'animation de translation automatique en CSS! (Crucial pour l'effet Bonneteau)
                                    onClick={() => selectThimble(thimble.id)}
                                    disabled={gameState !== 'waiting_choice'}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    className="relative w-24 h-32 sm:w-32 sm:h-40 flex flex-col items-center justify-end group focus:outline-none"
                                >
                                    
                                    {/* LA BALLE (Rest attachée à la table) */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-0">
                                         <AnimatePresence>
                                             {showBall && (
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-yellow-600 to-yellow-300 rounded-full shadow-[inset_-2px_-5px_10px_rgba(0,0,0,0.5),0_10px_15px_rgba(0,0,0,0.5)]"
                                                >
                                                   <div className="absolute top-2 left-2 w-3 h-3 bg-white/60 rounded-full blur-[1px]" />
                                                </motion.div>
                                             )}
                                         </AnimatePresence>
                                         <div className="w-12 h-2 mt-1 bg-black/60 rounded-[100%] blur-[2px]" /> {/* Ombre de la balle */}
                                    </div>

                                    {/* LE GOBELET (Se lève pendant le lift) */}
                                    <motion.div
                                        animate={{ 
                                            y: isLifted ? -120 : 0, 
                                            rotate: isLifted ? (didIChooseThis ? -5 : 5) : 0,
                                            scale: 1
                                        }}
                                        transition={{ 
                                            y: { type: "spring", stiffness: 100, damping: 15 }
                                        }}
                                        className={`absolute bottom-0 w-full h-[120%] z-20 flex flex-col items-center justify-end
                                           ${gameState === 'waiting_choice' ? 'cursor-pointer hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]' : ''}
                                        `}
                                    >
                                        {/* Structure SVG Complexe pour dessiner un gobelet réaliste. Au lieu du SVG, on va utiliser une modélisation CSS */}
                                        <div className="relative w-full h-full flex flex-col items-center">
                                            {/* Top de la coupe */}
                                            <div className="w-[60%] h-6 bg-[#2a2c38] rounded-[100%] mb-[-12px] z-10 border-t border-white/20" />
                                            {/* Corps du gobelet */}
                                            <div className="w-full flex-1 bg-[linear-gradient(to_bottom,rgba(50,55,75,1),rgba(15,20,35,1))] rounded-b-[10px] transform perspective-[200px] rotateX-[-5deg] border-x border-[#3b4158] overflow-hidden flex items-center justify-center">
                                                {/* Rainures horizontales du gobelet plastique/métal */}
                                                <div className="w-full h-px bg-black/20 my-2" />
                                                <div className="w-full h-px bg-black/30 my-2 absolute top-1/2" />
                                            </div>
                                            {/* Lèvre inférieure */}
                                            <div className="w-full h-6 bg-[#1a1c25] rounded-[100%] mt-[-12px] border-b-2 border-black shadow-lg" />
                                        </div>
                                    </motion.div>

                                </motion.button>
                            );
                        })}
                    </div>
               </div>

               {/* Instruction text overlay */}
               <AnimatePresence>
                   {gameState === 'waiting_choice' && (
                       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute bottom-10 z-50 text-white font-black text-2xl uppercase tracking-[0.2em] animate-pulse">
                           Trouvez la balle
                       </motion.div>
                   )}
               </AnimatePresence>

            </div>

        </div>
    );
};
