import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ShieldAlert, Coins, History, TrendingUp, Skull } from 'lucide-react';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

// Types d'états
type EngineState = 'betting' | 'playing' | 'crashed';
type PlayerState = 'idle' | 'betted' | 'cashed_out' | 'dead';

export const CrashGame: React.FC = () => {
  const { state, dispatch } = useCasino();
  
  // -- Engine Core --
  const [engineState, setEngineState] = useState<EngineState>('betting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const multiplierTextRef = useRef<HTMLHeadingElement>(null);
  const profitTextRef = useRef<HTMLSpanElement>(null);
  const currentMultValue = useRef<number>(1.00);
  const [countdown, setCountdown] = useState<number>(5.0);
  
  // -- Player Interaction --
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [betAmount, setBetAmount] = useState<number>(1000);
  const [autoCashout, setAutoCashout] = useState<number>(2.00);
  const [isAutoBet, setIsAutoBet] = useState(false);
  const [profit, setProfit] = useState(0);
  
  // -- Historique Local --
  const [history, setHistory] = useState<number[]>([1.45, 2.12, 1.05, 5.60, 1.12, 13.4]);

  // -- Refs for 60 FPS Animation --
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const prevMultiplierRef = useRef<number>(1.00);

  // --- MOTEUR MATHEMATIQUE DU CRASH ---
  const generateCrashPoint = useCallback(() => {
    // e = 2^32
    const e = Math.pow(2, 32);
    // Hash simulé (Normalement généré par Server Seed + Client Seed + Nonce)
    const h = crypto.getRandomValues(new Uint32Array(1))[0];
    
    // Algorithme standard iGaming (1% House Edge instant crash x1.00)
    if (h % 100 === 0) return 1.00;
    
    const crashValue = Math.floor((100 * e - h) / (e - h)) / 100;
    // Cap mathématique pour la démo
    return Math.min(crashValue, 1000.00); 
  }, []);

  // --- MOTEUR DE RENDU (CANVAS 60FPS) ---
  const drawGraph = useCallback((currentMult: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas
    canvas.width = canvas.parentElement!.clientWidth;
    canvas.height = canvas.parentElement!.clientHeight;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dessin du fond (Grille spatiale)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, h - (i * (h/10)));
        ctx.lineTo(w, h - (i * (h/10)));
        ctx.stroke();
    }

    // Calcul de la pointe de la trajectoire (Parabole)
    // Plus le multiplicateur est haut, plus on stagne en X et on monte en Y
    const durationLog = Math.log(currentMult) / Math.log(1.06); // Simulation du temps écoulé
    const maxTimeToRender = 100; // Constante visuelle arbitraire
    
    const progressX = Math.min((durationLog / maxTimeToRender) * w * 0.9, w * 0.85);
    // Y monte de plus en plus vite
    const progressY = h - Math.min((currentMult / 10) * h * 0.8, h * 0.85); 

    // Dessin de la Courbe Principale
    ctx.beginPath();
    ctx.moveTo(0, h);
    
    // Contrôle Bézier pour donner l'effet parabolique
    ctx.quadraticCurveTo( progressX * 0.5, h, progressX, progressY );
    
    ctx.strokeStyle = engineState === 'crashed' ? '#FF3B3B' : '#00D4FF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Remplissage sous la courbe
    const gradient = ctx.createLinearGradient(0, progressY, 0, h);
    gradient.addColorStop(0, engineState === 'crashed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.lineTo(progressX, h);
    ctx.lineTo(0, h);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Dessin de l'objet de Tête (La Fusée / Point)
    ctx.beginPath();
    ctx.arc(progressX, progressY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

  }, [engineState]);

  // --- GAME LOOP ---
  const updateLoop = useCallback((time: number) => {
    if (engineState !== 'playing') return;

    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsedMs = time - startTimeRef.current;
    
    // Algorithme de croissance : Le multiplier croît de 1.06 chaque seconde en logarithmique continu
    // M = 1.00 * e^(0.06 * seconds)
    const secondsElapsed = elapsedMs / 1000;
    const currentMult = Math.pow(Math.E, 0.06 * secondsElapsed);

    currentMultValue.current = currentMult;
    if (multiplierTextRef.current) {
      multiplierTextRef.current.innerText = currentMult.toFixed(2) + 'x';
    }

    drawGraph(currentMult);

    // Audio Tension : Joue un petit bip à chaque palier entier
    if (Math.floor(currentMult) > Math.floor(prevMultiplierRef.current)) {
      sfx.playTension(Math.floor(currentMult));
    }
    prevMultiplierRef.current = currentMult;

    // -- LOGIQUE DE COLLISION / CRASH --
    if (currentMult >= crashPoint) {
      handleCrash(currentMult);
      return;
    }

    // -- LOGIQUE D'AUTO-CASHOUT --
    if (playerState === 'betted' && currentMult >= autoCashout) {
      handleCashout(autoCashout);
      // On laisse le jeu continuer pour les "autres joueurs" (Ghost logic)
    }

    // Update Profit dynamique pour l'affichage du bouton (sans setState)
    if (playerState === 'betted') {
      const currentProfit = betAmount * currentMult;
      if (profitTextRef.current) {
         profitTextRef.current.innerText = new Intl.NumberFormat('fr-FR').format(currentProfit) + ' F';
      }
    }

    requestRef.current = requestAnimationFrame(updateLoop);
  }, [engineState, crashPoint, playerState, autoCashout, betAmount]);

  // Démarre la frame loop
  useEffect(() => {
    if (engineState === 'playing') {
      requestRef.current = requestAnimationFrame(updateLoop);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [engineState, updateLoop]);

  // Draw initial state on mount/resize
  useEffect(() => {
    if (engineState === 'betting') drawGraph(1.00);
  }, [engineState, drawGraph]);


  // --- GAME LIFECYCLE HANDLERS ---
  
  const startGame = () => {
    if (engineState !== 'betting') return;
    sfx.playClick();
    
    const target = generateCrashPoint();
    setCrashPoint(target);
    
    setEngineState('playing');
    startTimeRef.current = 0;
    prevMultiplierRef.current = 1.00;
    currentMultValue.current = 1.00;
  };

  const startBettingPhase = useCallback(() => {
    setEngineState('betting');
    setMultiplier(1.00);
    setProfit(0);
    setCountdown(5.0);
    currentMultValue.current = 1.00;
    drawGraph(1.00);
    setPlayerState('idle');
  }, [drawGraph]);

  // Master Global Loop logic for Betting -> Playing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (engineState === 'betting') {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 0.1) {
            clearInterval(timer);
            startGame();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [engineState]);

  const handleCrash = (finalMult: number) => {
    currentMultValue.current = finalMult;
    setMultiplier(finalMult);
    setEngineState('crashed');
    sfx.playExplosion('heavy');
    drawGraph(finalMult); // Redraw graph un instant en ROUGE
    
    setHistory(prev => [parseFloat(finalMult.toFixed(2)), ...prev].slice(0, 8));

    if (playerState === 'betted') {
      setPlayerState('dead');
      // Le Dispatch BET a déjà enlevé l'argent au début, donc pas d'event WIN
    }

    // Trigger Screen Shake via classList au conteneur principal
    const container = document.getElementById('crash-container');
    if (container) {
      container.classList.add('animate-shake');
      setTimeout(() => container.classList.remove('animate-shake'), 400);
    }

    // Auto Restart (Dans un vrai jeu, géré par le backend en continu)
    setTimeout(startBettingPhase, 3000);
  };

  // --- ACTIONS JOUEUR ---

  const placeBet = () => {
    if (state.balance < betAmount || betAmount < 200) {
      sfx.playClick();
      return;
    }
    sfx.playCoin();
    dispatch({ type: 'BET', payload: { amount: betAmount, game: 'Crash' } });
    setPlayerState('betted');
    
    // Démarre le round immédiatement après le pari
    if (engineState === 'betting') {
      const target = generateCrashPoint();
      setCrashPoint(target);
      setEngineState('playing');
      startTimeRef.current = 0;
      prevMultiplierRef.current = 1.00;
      currentMultValue.current = 1.00;
    }
  };

  const handleCashout = (forcedMult?: number) => {
    if (engineState !== 'playing' || playerState !== 'betted') return;
    
    // Si forcedMult n'y est pas, on lit currentMultValue (et non l'état React laggé)
    const cashoutMult = forcedMult || currentMultValue.current;
    const finalProfit = betAmount * cashoutMult;
    
    sfx.playVictoryArpeggio(cashoutMult);
    dispatch({ type: 'WIN', payload: { amount: finalProfit, game: 'Crash', multiplier: cashoutMult } });
    
    setProfit(finalProfit);
    setPlayerState('cashed_out');
  };

  // Effet de flash vert sur l'écran entier quand cashout
  useEffect(() => {
    if (playerState === 'cashed_out') {
      const overlay = document.getElementById('cashout-flash-overlay');
      if (overlay) {
        overlay.classList.add('animate-cashout-flash');
        setTimeout(() => overlay.classList.remove('animate-cashout-flash'), 500);
      }
    }
  }, [playerState]);


  return (
    <div id="crash-container" className="w-full h-full flex flex-col md:flex-row gap-4 p-2 relative">
      <div id="cashout-flash-overlay" className="absolute inset-0 pointer-events-none z-[100] rounded-3xl" />

      {/* --- PANEL LATERAL DES PARIS (CONTROLES) --- */}
      <div className="w-full md:w-80 flex flex-col gap-4 z-10 shrink-0">
        
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
          
          {/* Toggle Auto/Manuel (Visuel) */}
          <div className="flex bg-slate-900/50 rounded-xl p-1 mb-2">
            <button 
              onClick={() => { sfx.playClick(); setIsAutoBet(false); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${!isAutoBet ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Manuel
            </button>
            <button 
              onClick={() => { sfx.playClick(); setIsAutoBet(true); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${isAutoBet ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Auto
            </button>
          </div>

          {/* Amount Input */}
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
            <label className="flex justify-between text-sm font-bold text-slate-300 mb-3">
              <span>Mise (Min 200)</span><span className="text-emerald-500">FCFA</span>
            </label>
            <div className="flex items-center bg-slate-800 rounded-xl overflow-hidden border border-slate-600 focus-within:border-emerald-500">
              <input 
                type="number"
                min="200"
                value={betAmount || ''}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="flex-1 bg-transparent border-none text-white font-black text-lg px-4 py-3 focus:outline-none w-full"
              />
              <div className="flex border-l border-slate-600">
                <button onClick={() => { sfx.playHover(); setBetAmount(Math.max(200, Math.floor(betAmount / 2))); }} className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-sm font-bold text-slate-300 transition-colors border-r border-slate-600">/2</button>
                <button onClick={() => { sfx.playHover(); setBetAmount(betAmount * 2); }} className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-sm font-bold text-slate-300 transition-colors">x2</button>
              </div>
            </div>
          </div>

          {/* Auto Cashout Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-bold uppercase">Retrait Auto à</label>
            <div className="flex bg-black/50 border border-white/10 rounded-xl overflow-hidden focus-within:border-casino-success transition-colors shadow-inner relative">
              <input 
                type="number"
                step="0.1"
                value={autoCashout || ''}
                onChange={(e) => setAutoCashout(Number(e.target.value))}
                className="w-full bg-transparent p-3 text-sm font-bold text-white outline-none"
                disabled={playerState !== 'idle'}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">x</span>
            </div>
          </div>

          {/* MAIN BUTTON (Le fameux bouton Dopaminergique massivement designé) */}
          <button
            onClick={() => {
              if (engineState === 'betting') placeBet();
              else if (engineState === 'playing' && playerState === 'betted') handleCashout();
              else if (engineState === 'crashed') startBettingPhase();
            }}
            disabled={engineState === 'playing' && playerState !== 'betted'}
            className={`
              w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-300 relative overflow-hidden group
              ${
                engineState === 'playing' && playerState === 'betted'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 shadow-[0_0_30px_rgba(250,204,21,0.6)] border-2 border-yellow-300 scale-105'
                  : playerState === 'cashed_out'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : playerState === 'dead'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : engineState === 'betting' && playerState === 'betted'
                  ? 'bg-red-500/80 hover:bg-red-500 text-white border border-red-400'
                  : engineState === 'crashed'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }
            `}
          >
            {/* Shimmer effect inside button */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sweep pointer-events-none" />

            {/* Label Logic */}
            {engineState === 'betting' && playerState === 'idle' && 'Parier & Lancer'}
            {engineState === 'betting' && playerState === 'betted' && 'Annuler'}
            
            {engineState === 'playing' && playerState === 'betted' && (
              <div className="flex flex-col items-center leading-none">
                <span className="text-sm text-black uppercase font-bold tracking-widest">Encaisser</span>
                <span className="text-2xl mt-1 text-black font-black drop-shadow-md">
                   <span ref={profitTextRef}>{new Intl.NumberFormat('fr-FR').format(betAmount * currentMultValue.current)} F</span>
                </span>
              </div>
            )}
            
            {playerState === 'cashed_out' && 'Gagné ✓'}
            {engineState === 'crashed' && playerState === 'dead' && 'CRASH — Rejouer'}
            {engineState === 'crashed' && playerState !== 'dead' && 'Rejouer'}
            {(engineState === 'playing' && playerState === 'idle') && 'En cours...'}
          </button>
          
        </div>

        {/* FAKE LIVE BETS FEED (FOMO) */}
        <div className="flex-1 bg-casino-dark/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden flex flex-col p-3">
           <div className="flex items-center gap-2 mb-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             Paris en Direct
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
             {/* Stub généré visuellement en CSS par manque de DB */}
             {[...Array(5)].map((_,i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 text-[10px] font-mono opacity-50">
                  <span className="text-gray-400">User_{Math.floor(Math.random()*9999)}</span>
                  <span className="text-white">{(Math.random()*50000).toFixed(0)} XOF</span>
                </div>
             ))}
           </div>
        </div>

      </div>

      {/* --- ZONE DU GRAPH ET DU MULTIPLICATEUR --- */}
      <div className="flex-1 bg-slate-800/60 rounded-2xl border border-slate-700 relative flex flex-col overflow-hidden min-h-0">
        
        {/* Header Historique */}
        <div className="absolute top-0 inset-x-0 h-10 bg-slate-900/80 border-b border-slate-700 px-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">LIVE</span>
          </div>
          <div className="flex items-center gap-1">
          {history.map((m, i) => (
            <span key={i} className={`text-[10px] font-black px-1.5 py-0.5 rounded ${m < 2 ? 'text-red-400 bg-red-500/10' : m > 5 ? 'text-yellow-400 bg-yellow-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
              {m.toFixed(2)}x
            </span>
          ))}
          </div>
        </div>

        {/* --- MAIN GRAPHIC DISPLAY --- */}
        <div className="flex-1 relative border-b border-white/5">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 block" />

          {/* Central Multiplier Indicator (Absolutely Positioned) */}
          <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            
            <AnimatePresence mode="wait">
              {engineState === 'betting' ? (
                <motion.div key="bet" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }} className="flex flex-col items-center">
                   <div className="flex items-center gap-2 mb-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">En attente des paris</span>
                   </div>
                   <h2 className="text-6xl font-black font-display text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                     {countdown.toFixed(1)}s
                   </h2>
                   <p className="mt-3 text-sm text-slate-400 font-bold">Placez votre mise et cliquez <span className="text-emerald-400">Parier</span></p>
                </motion.div>
              ) : engineState === 'playing' ? (
                <motion.h2 ref={multiplierTextRef} key="play" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-7xl md:text-[120px] font-black font-display text-[#00D4FF] tracking-tighter drop-shadow-[0_0_15px_rgba(0,212,255,0.5)] select-none">
                  {currentMultValue.current.toFixed(2)}x
                </motion.h2>
              ) : (
                <motion.div key="crash" initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }} className="flex flex-col items-center">
                  <h2 className="text-7xl md:text-[120px] font-black font-display text-[#FF3B3B] drop-shadow-[0_0_15px_rgba(255,59,59,0.5)] tracking-tighter select-none border-b-4 border-red-500 pb-2 mb-3">
                    {multiplier.toFixed(2)}x
                  </h2>
                  <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-[0.3em] bg-red-500/10 px-4 py-2 rounded-xl mb-2">
                    <Skull className="w-5 h-5" /> CRASHED
                  </div>
                  <p className="text-xs text-slate-500 animate-pulse">Prochain tour imminent...</p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>

    </div>
  );
};
