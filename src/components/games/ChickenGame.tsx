import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bird, Skull, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

// Configuration de la Difficulté
type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Hardcore';

interface DiffConfig {
  label: Difficulty;
  chanceSafe: number; // Probabilité de survie par saut (0-1)
  baseMult: number;   // Multiplicateur de départ
}

const DIFFICULTIES: Record<Difficulty, DiffConfig> = {
  'Easy': { label: 'Easy', chanceSafe: 0.85, baseMult: 1.15 },
  'Medium': { label: 'Medium', chanceSafe: 0.70, baseMult: 1.40 },
  'Hard': { label: 'Hard', chanceSafe: 0.50, baseMult: 1.95 },
  'Hardcore': { label: 'Hardcore', chanceSafe: 0.33, baseMult: 2.95 }
};

const TOTAL_LANES = 10;

// Génère la courbe de gains selon la difficulté
const getMultiplierForLane = (lane: number, diff: Difficulty) => {
  if (lane === 0) return 1.00;
  const config = DIFFICULTIES[diff];
  // Calcul mathématique avec avantage maison (1%)
  let probability = 1;
  for (let i = 0; i < lane; i++) {
    probability *= config.chanceSafe;
  }
  return parseFloat(((1 - 0.01) / probability).toFixed(2));
};

type GameState = 'idle' | 'playing' | 'cashed_out' | 'dead';

export const ChickenGame: React.FC = () => {
    const { state, dispatch } = useCasino();
    
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [betAmount, setBetAmount] = useState<number>(1000);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [currentLane, setCurrentLane] = useState(0); // 0 = Ligne de départ, MAX = TOTAL_LANES
    const [isAnimating, setIsAnimating] = useState(false);

    const currentMultiplier = currentLane === 0 ? 1.00 : getMultiplierForLane(currentLane, difficulty);
    const nextMultiplier = getMultiplierForLane(currentLane + 1, difficulty);
    const potentialWin = betAmount * currentMultiplier;

    // Reset à la fin
    useEffect(() => {
        if (gameState === 'idle') {
            setCurrentLane(0);
        }
    }, [gameState]);

    const startGame = () => {
        if (state.balance < betAmount || betAmount < 100) return sfx.playClick();
        
        sfx.playHover();
        dispatch({ type: 'BET', payload: { amount: betAmount, game: 'Chicken Cross' } });
        setGameState('playing');
        setCurrentLane(0);
    };

    const handleGo = async () => {
        if (gameState !== 'playing' || isAnimating) return;
        setIsAnimating(true);
        sfx.playClick();

        // Pause dramatique
        await new Promise(r => setTimeout(r, 600));

        const config = DIFFICULTIES[difficulty];
        const random = Math.random();
        
        if (random <= config.chanceSafe) {
            // SURVIE
            sfx.playCoin();
            setCurrentLane(prev => prev + 1);
            setIsAnimating(false);
            
            // Si on atteint le max, on force le cashout
            if (currentLane + 1 === TOTAL_LANES) {
               handleCashOut(currentLane + 1);
            }
        } else {
            // EXPLOSION
            sfx.playExplosion();
            setGameState('dead');
            setIsAnimating(false);
        }
    };

    const handleCashOut = (forcedLane?: number) => {
        if (gameState !== 'playing') return;
        
        const lane = forcedLane ?? currentLane;
        if (lane === 0) return; // Impossible d'encaisser avant le 1er saut

        const mult = getMultiplierForLane(lane, difficulty);
        const winAmount = betAmount * mult;
        
        dispatch({ type: 'WIN', payload: { amount: winAmount, multiplier: mult, game: 'Chicken Cross' } });
        setGameState('cashed_out');
    };

    // Rendu Visuel
    return (
        <div className="w-full flex flex-col md:flex-row gap-6 p-4 max-w-7xl mx-auto h-full">

            {/* CONTROLES (GAUCHE MD, HAUT MOBILE) */}
            <div className="w-full md:w-[350px] bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 flex flex-col shadow-2xl shrink-0">
               <h2 className="text-2xl font-black text-white italic tracking-wider mb-6 flex items-center gap-2">
                 CHICKEN <span className="text-amber-500">ROAD</span>
               </h2>

               <div className="space-y-6">
                 {/* Mise */}
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Mise (FCFA)</label>
                    <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            disabled={gameState === 'playing'}
                            className="bg-transparent text-white font-bold text-lg w-full px-4 outline-none disabled:opacity-50"
                        />
                        <div className="flex gap-1 p-1">
                            {['½', '2x', 'MAX'].map((action) => (
                                <button
                                    key={action}
                                    onClick={() => {
                                        sfx.playClick();
                                        if (action === '½') setBetAmount(Math.max(10, betAmount / 2));
                                        if (action === '2x') setBetAmount(betAmount * 2);
                                        if (action === 'MAX') setBetAmount(state.balance);
                                    }}
                                    disabled={gameState === 'playing'}
                                    className="px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 disabled:opacity-50 transition-colors"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>

                 {/* Difficulté */}
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block flex justify-between">
                      Difficulté 
                      <span className="text-rose-500">{(1 - DIFFICULTIES[difficulty].chanceSafe) * 100}% Chutes</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                       {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
                          <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            disabled={gameState === 'playing'}
                            className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${difficulty === d ? 'bg-amber-500 text-slate-900 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'} disabled:opacity-50`}
                          >
                            {d}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Action Principale */}
                 <div className="pt-4 border-t border-slate-800">
                    {gameState === 'idle' ? (
                       <button
                          onClick={startGame}
                          disabled={betAmount > state.balance || betAmount <= 0}
                          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 rounded-xl font-black text-xl italic tracking-wider transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:shadow-none"
                       >
                          START
                       </button>
                    ) : (
                       <div className="flex gap-2">
                          <button
                            onClick={() => handleCashOut()}
                            disabled={gameState !== 'playing' || currentLane === 0 || isAnimating}
                            className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest transition-all text-center leading-tight"
                          >
                             CASHOUT<br/>
                             <span className="text-xl">{currentLane > 0 ? potentialWin.toLocaleString('fr-FR') : '---'}</span>
                          </button>
                          
                          {gameState === 'playing' ? (
                            <button
                              onClick={handleGo}
                              disabled={isAnimating}
                              className={`flex-1 py-4 ${isAnimating ? 'bg-emerald-700 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02]'} text-slate-900 rounded-xl font-black text-3xl italic transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] relative overflow-hidden`}
                            >
                               GO!
                               {isAnimating && <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]"></div>}
                            </button>
                          ) : (
                            <button
                               onClick={() => setGameState('idle')}
                               className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                            >
                               <RefreshCw className="w-5 h-5"/> REJOUER
                            </button>
                          )}
                       </div>
                    )}
                 </div>

               </div>
            </div>

            {/* VISUELLE (DROITE MD, BAS MOBILE) */}
            <div className={`flex-1 bg-slate-900/50 backdrop-blur-md rounded-3xl border ${gameState === 'dead' ? 'border-rose-500/50 bg-rose-950/20 shadow-[inset_0_0_100px_rgba(244,63,94,0.1)]' : 'border-slate-700/50 shadow-inner'} relative overflow-hidden flex items-end p-6 min-h-[400px] transition-all duration-500`}>
               
               {/* ANIMATION DE MORT (ECRAN ROUGE) */}
               {gameState === 'dead' && (
                  <div className="absolute inset-0 z-50 pointer-events-none animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_1] bg-rose-500/20 mix-blend-screen flex items-center justify-center">
                    <Skull className="w-64 h-64 text-rose-500/50" />
                  </div>
               )}

               {/* PISTE (ROAD) */}
               <div className="w-full h-full relative overflow-x-auto no-scrollbar pb-8">
                  <div className="flex items-end h-full min-w-max gap-4 pb-4">
                     
                     {/* Ligne Départ (0) */}
                     <div className="w-24 h-full flex flex-col justify-end items-center relative gap-8">
                        {currentLane === 0 && (
                           <div className={`transition-all duration-300 z-20 ${gameState === 'dead' ? 'scale-0' : 'scale-100 bounce-animation'}`}>
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.3)]">
                               <Bird className="text-amber-500 w-10 h-10" />
                             </div>
                           </div>
                        )}
                        <div className="w-full text-center py-2 bg-slate-800 rounded-t-xl text-slate-500 border-t-2 border-slate-700 font-black text-sm uppercase">Départ</div>
                     </div>

                     {/* Lignes 1 à MAX */}
                     {Array.from({ length: TOTAL_LANES }).map((_, i) => {
                        const laneIndex = i + 1;
                        const mult = getMultiplierForLane(laneIndex, difficulty);
                        const isPassed = currentLane >= laneIndex;
                        const isCurrent = currentLane === laneIndex;

                        return (
                          <div key={i} className="w-24 h-full flex flex-col justify-end items-center relative gap-4 group">
                             
                             {/* Couloir pointillé */}
                             <div className="absolute inset-y-0 left-[50%] border-l-2 border-dashed border-slate-700/30 -z-10 group-hover:border-slate-500/30 transition-colors"></div>

                             {/* Multiplicateur dans une bulle */}
                             <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-sm md:text-md transition-all z-10 
                                ${isPassed ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 
                                  nextMultiplier === mult && gameState === 'playing' ? 'border-indigo-500 animate-pulse bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 
                                  'border-slate-700 bg-slate-800/80 text-slate-500'}`}>
                                {mult}x
                             </div>

                             {/* Avatar du poulet */}
                             <div className="h-20 flex items-end">
                                {isCurrent && (
                                  <div className={`transition-all duration-300 z-20 ${gameState === 'dead' ? 'scale-0' : 'scale-100 bounce-animation'}`}>
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.3)] ${gameState === 'cashed_out' ? 'bg-amber-400' : 'bg-white'}`}>
                                      {gameState === 'cashed_out' ? <DollarSign className="text-slate-900 w-10 h-10" /> : <Bird className="text-amber-500 w-10 h-10" />}
                                    </div>
                                  </div>
                                )}
                             </div>

                             {/* Base de la ligne */}
                             <div className={`w-full py-2 rounded-t-xl border-t-2 text-center text-[10px] font-black tracking-widest uppercase transition-colors
                                ${isPassed ? 'bg-emerald-950 border-emerald-500 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                               LANE {laneIndex}
                             </div>
                          </div>
                        )
                     })}
                  </div>
               </div>

               {/* OVERLAY DE FIN */}
               <AnimatePresence>
                   {gameState === 'cashed_out' && (
                       <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                          <div className="bg-slate-900 p-8 rounded-3xl border border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.4)] text-center scale-110">
                              <h3 className="text-emerald-400 font-black text-2xl mb-2 italic">CASH OUT SUCCESS !</h3>
                              <p className="text-white text-5xl font-black">{potentialWin.toLocaleString('fr-FR')} <span className="text-xl text-slate-400">FCFA</span></p>
                              <p className="text-emerald-500/50 font-bold mt-2">Multiplicateur Final : {currentMultiplier}x</p>
                          </div>
                       </div>
                   )}
                   {gameState === 'dead' && (
                       <div className="absolute inset-0 bg-rose-900/40 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                          <div className="bg-slate-900 p-8 rounded-3xl border border-rose-500 shadow-[0_0_100px_rgba(244,63,94,0.4)] text-center scale-110">
                              <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                              <h3 className="text-rose-500 font-black text-4xl mb-2 italic uppercase">Crash !</h3>
                              <p className="text-rose-500/50 font-bold">Le poulet n'a pas survécu.</p>
                          </div>
                       </div>
                   )}
               </AnimatePresence>
               
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              .bounce-animation { animation: chickenBounce 0.4s infinite alternate ease-in-out; }
              @keyframes chickenBounce { from { transform: translateY(0) scaleY(0.95); } to { transform: translateY(-10px) scaleY(1.05); } }
            `}} />
        </div>
    );
};
