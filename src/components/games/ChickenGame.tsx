import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Hardcore';

interface DiffConfig {
  label: Difficulty;
  chanceSafe: number;
  baseMult: number;
}

const DIFFICULTIES: Record<Difficulty, DiffConfig> = {
  'Easy': { label: 'Easy', chanceSafe: 0.85, baseMult: 1.15 },
  'Medium': { label: 'Medium', chanceSafe: 0.70, baseMult: 1.40 },
  'Hard': { label: 'Hard', chanceSafe: 0.50, baseMult: 1.95 },
  'Hardcore': { label: 'Hardcore', chanceSafe: 0.33, baseMult: 2.95 }
};

const TOTAL_LANES = 10;

const getMultiplierForLane = (lane: number, diff: Difficulty) => {
  if (lane === 0) return 1.00;
  const config = DIFFICULTIES[diff];
  let probability = 1;
  for (let i = 0; i < lane; i++) { probability *= config.chanceSafe; }
  return parseFloat(((1 - 0.01) / probability).toFixed(2));
};

type GameState = 'idle' | 'playing' | 'cashed_out' | 'dead';

export const ChickenGame: React.FC = () => {
    const { state, dispatch } = useCasino();
    
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [betAmount, setBetAmount] = useState<number>(1000);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [currentLane, setCurrentLane] = useState(0); 
    const [isAnimating, setIsAnimating] = useState(false);
    
    const roadRef = useRef<HTMLDivElement>(null);

    const currentMultiplier = currentLane === 0 ? 1.00 : getMultiplierForLane(currentLane, difficulty);
    const nextMultiplier = getMultiplierForLane(currentLane + 1, difficulty);
    const potentialWin = betAmount * currentMultiplier;

    // Reset à la fin
    useEffect(() => {
        if (gameState === 'idle') {
            setCurrentLane(0);
            if (roadRef.current) {
                roadRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }
    }, [gameState]);

    // Auto-scroll dynamique
    useEffect(() => {
        if (roadRef.current && currentLane > 0) {
            // Scroll calculation based on child lane width (approx 96px width per lane)
            const targetScroll = (currentLane - 1) * 112; 
            roadRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
    }, [currentLane]);

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

        await new Promise(r => setTimeout(r, 600));

        const config = DIFFICULTIES[difficulty];
        const random = Math.random();
        
        if (random <= config.chanceSafe) {
            sfx.playCoin();
            setCurrentLane(prev => prev + 1);
            setIsAnimating(false);
            if (currentLane + 1 === TOTAL_LANES) {
               handleCashOut(currentLane + 1);
            }
        } else {
            sfx.playExplosion();
            setCurrentLane(prev => prev + 1); // Déplace le poulet visuellement sur la route dangereuse
            setGameState('dead');
            setIsAnimating(false);
        }
    };

    const handleCashOut = (forcedLane?: number) => {
        if (gameState !== 'playing') return;
        const lane = forcedLane ?? currentLane;
        if (lane === 0) return; 

        const mult = getMultiplierForLane(lane, difficulty);
        const winAmount = betAmount * mult;
        
        dispatch({ type: 'WIN', payload: { amount: winAmount, multiplier: mult, game: 'Chicken Cross' } });
        setGameState('cashed_out');
    };

    return (
        <div className="w-full flex flex-col md:flex-row gap-6 p-4 max-w-7xl mx-auto h-full">

            {/* CONTROLES */}
            <div className="w-full md:w-[350px] bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 flex flex-col shadow-2xl shrink-0 z-10">
               <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500 italic tracking-wider mb-6 flex items-center gap-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                 CHICKEN ROAD
               </h2>

               <div className="space-y-6">
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Mise (FCFA)</label>
                    <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 shadow-inner">
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            disabled={gameState === 'playing' || gameState === 'dead' || gameState === 'cashed_out'}
                            className="bg-transparent text-emerald-400 font-black text-xl w-full px-4 outline-none disabled:opacity-50"
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
                                    disabled={gameState === 'playing' || gameState === 'dead' || gameState === 'cashed_out'}
                                    className="px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 disabled:opacity-50 transition-colors"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block flex justify-between">
                      Difficulté 
                      <span className="text-rose-500">{(1 - DIFFICULTIES[difficulty].chanceSafe) * 100}% Chutes</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                       {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
                          <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            disabled={gameState === 'playing' || gameState === 'dead' || gameState === 'cashed_out'}
                            className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${difficulty === d ? 'bg-amber-500 text-slate-900 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'} disabled:opacity-50`}
                          >
                            {d}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-800">
                    {gameState === 'idle' ? (
                       <button
                          onClick={startGame}
                          disabled={betAmount > state.balance || betAmount <= 0}
                          className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 rounded-2xl font-black text-2xl italic tracking-wider transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)] disabled:shadow-none hover:scale-[1.02] active:scale-95"
                       >
                          START
                       </button>
                    ) : (
                       <div className="flex gap-2">
                          <button
                            onClick={() => handleCashOut()}
                            disabled={gameState !== 'playing' || currentLane === 0 || isAnimating}
                            className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest transition-all text-center leading-tight hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                          >
                             CASHOUT<br/>
                             <span className="text-xl">{currentLane > 0 ? potentialWin.toLocaleString('fr-FR') : '---'}</span>
                          </button>
                          
                          {gameState === 'playing' ? (
                            <button
                              onClick={handleGo}
                              disabled={isAnimating}
                              className={`flex-1 py-4 ${isAnimating ? 'bg-emerald-700 animate-[pulse_0.4s_infinite]' : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02]'} text-slate-900 rounded-xl font-black text-4xl italic transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] relative overflow-hidden`}
                            >
                               GO!
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

            {/* VISUELLE : MATRICE DE LA ROUTE */}
            <div className={`flex-1 bg-slate-950 rounded-3xl border border-slate-700/50 shadow-inner relative overflow-hidden flex items-end p-2 sm:p-6 min-h-[400px] transition-all duration-500 ${gameState === 'dead' ? 'border-rose-500/80 shadow-[inset_0_0_100px_rgba(244,63,94,0.3)]' : ''}`}>
               
               {gameState === 'dead' && (
                  <div className="absolute inset-0 z-40 pointer-events-none animate-[ping_0.5s_ease-out_1] bg-rose-600/40 mix-blend-screen"></div>
               )}

               <div 
                 ref={roadRef}
                 className="w-full h-full relative overflow-x-auto no-scrollbar pb-4 scroll-smooth"
               >
                  <div className="flex items-end h-full min-w-max gap-3 pb-8 px-[10%] sm:px-[30%]">
                     
                     <div className="w-24 h-full flex flex-col justify-end items-center relative gap-8 shrink-0">
                        {currentLane === 0 && (
                           <div className="transition-all duration-300 z-30 scale-100 chicken-bounce relative">
                             <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                               <span className="text-4xl drop-shadow-xl">🐔</span>
                             </div>
                           </div>
                        )}
                        <div className="w-full py-3 bg-slate-800 rounded-xl text-slate-400 font-black text-xs uppercase tracking-widest text-center shadow-lg border-b-4 border-slate-900">SAFE ZONE</div>
                     </div>

                     {/* LINGES DE ROUTE */}
                     {Array.from({ length: TOTAL_LANES }).map((_, i) => {
                        const laneIndex = i + 1;
                        const mult = getMultiplierForLane(laneIndex, difficulty);
                        const isPassed = currentLane > laneIndex;
                        const isCurrent = currentLane === laneIndex;
                        const isNext = currentLane + 1 === laneIndex;

                        // Varier la vitesse et la direction purement CSS
                        const duration = 2 + Math.random() * 2;
                        const direction = i % 2 === 0 ? 'driveRight' : 'driveLeft';
                        const carEmoji = i % 3 === 0 ? '🏎️' : i % 2 === 0 ? '🚙' : '🚕';

                        return (
                          <div key={i} className="w-24 h-full flex flex-col justify-end items-center relative gap-4 shrink-0 group">
                             
                             {/* Asphalte dynamique & Trafic visuel */}
                             <div className="absolute inset-x-0 bottom-16 top-20 bg-slate-900/60 border-l border-r border-slate-800 overflow-hidden flex items-center">
                                {/* Marquage au sol au centre */}
                                <div className="absolute inset-y-0 left-[50%] border-l-2 border-dashed border-white/10"></div>
                                
                                {/* Voitures (sauf si victoire passée pour alléger) */}
                                {(!isPassed || gameState !== 'playing') && (
                                   <div 
                                     className="absolute text-3xl z-10 w-full opacity-60"
                                     style={{ 
                                       animation: `${direction} ${duration}s linear infinite`,
                                       transform: 'translateX(150%)'
                                     }}
                                   >
                                      {carEmoji}
                                   </div>
                                )}
                             </div>

                             {/* Hitbox Crash sanglante si mort sur cette ligne */}
                             {isCurrent && gameState === 'dead' && (
                                 <div className="absolute bottom-20 text-6xl z-40 animate-pulse text-center w-full shadow-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,1)]">💥</div>
                             )}

                             {/* Bulle de multiplicateur (Glow intense) */}
                             <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-sm transition-all z-20 
                                ${isPassed ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 
                                  isNext && gameState === 'playing' ? 'border-amber-400 animate-pulse bg-amber-500/20 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]' : 
                                  'border-slate-800 bg-slate-900/80 text-slate-600'}`}>
                                {mult}x
                             </div>

                             {/* POULET S'IL EST LÀ */}
                             <div className="h-24 w-full flex items-end justify-center">
                                {isCurrent && gameState !== 'dead' && (
                                  <div className={`transition-all duration-300 z-30 scale-100 chicken-bounce`}>
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md border ${gameState === 'cashed_out' ? 'bg-amber-400/90 border-amber-300 shadow-[0_0_50px_rgba(245,158,11,0.6)]' : 'bg-white/10 border-white/30'}`}>
                                      {gameState === 'cashed_out' ? <DollarSign className="text-slate-900 w-10 h-10" /> : <span className="text-4xl drop-shadow-lg">🐔</span>}
                                    </div>
                                  </div>
                                )}
                             </div>

                             {/* SOCLE LIGNE */}
                             <div className={`w-full py-3 rounded-xl text-center text-[10px] font-black tracking-widest uppercase transition-colors shadow-lg border-b-4
                                ${isPassed ? 'bg-emerald-900/50 border-emerald-900 text-emerald-500' : 'bg-slate-800 border-slate-900 text-slate-600'}`}>
                               LANE {laneIndex}
                             </div>
                          </div>
                        )
                     })}
                  </div>
               </div>

               <AnimatePresence>
                   {gameState === 'cashed_out' && (
                       <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease-out]">
                          <div className="bg-slate-900 p-8 rounded-3xl border-2 border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.8)] text-center scale-110">
                              <h3 className="text-emerald-400 font-black text-2xl mb-2 italic">EXCELLENTE ESQUIVE !</h3>
                              <p className="text-white text-5xl font-black drop-shadow-xl">{potentialWin.toLocaleString('fr-FR')} <span className="text-xl text-slate-400">FCFA</span></p>
                              <p className="text-emerald-500/70 font-bold mt-4 uppercase tracking-widest">Multiplicateur Final : {currentMultiplier}x</p>
                          </div>
                       </div>
                   )}
                   {gameState === 'dead' && (
                       <div className="absolute inset-0 bg-rose-950/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                          <div className="bg-slate-900 p-8 rounded-3xl border-2 border-rose-500 shadow-[0_0_100px_rgba(244,63,94,0.8)] text-center scale-110">
                              <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-pulse" />
                              <h3 className="text-rose-500 font-black text-4xl mb-2 italic uppercase drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">ROADKILL !</h3>
                              <p className="text-rose-500/70 font-bold uppercase tracking-widest mt-2">Le trafic ne pardonne pas.</p>
                          </div>
                       </div>
                   )}
               </AnimatePresence>
               
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              .chicken-bounce { animation: chickenB 0.3s infinite alternate ease-in-out; }
              @keyframes chickenB { from { transform: translateY(0) scaleY(0.95); } to { transform: translateY(-15px) scaleY(1.05); } }
              
              @keyframes driveRight {
                 0% { transform: translateX(-150%); }
                 100% { transform: translateX(150%); }
              }
              @keyframes driveLeft {
                 0% { transform: translateX(150%) scaleX(-1); }
                 100% { transform: translateX(-150%) scaleX(-1); }
              }
            `}} />
        </div>
    );
};
