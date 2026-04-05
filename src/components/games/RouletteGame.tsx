import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCasino } from '../../store/CasinoContext';
import { sfx } from '../../utils/AudioEngine';

// --- Roulette Européenne : 0 à 36, Rouge/Noir/Vert ---
const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACKS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

const getColor = (n: number): 'red' | 'black' | 'green' => {
  if (n === 0) return 'green';
  return REDS.includes(n) ? 'red' : 'black';
};

// Ordre des numéros sur la roue européenne
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

type BetType = 'red' | 'black' | 'green' | 'odd' | 'even' | '1-18' | '19-36' | 'number';

interface PlacedBet {
  type: BetType;
  number?: number;
  amount: number;
}

const getMultiplier = (betType: BetType): number => {
  switch (betType) {
    case 'green': return 36;
    case 'number': return 36;
    case 'red': case 'black': return 2;
    case 'odd': case 'even': return 2;
    case '1-18': case '19-36': return 2;
    default: return 2;
  }
};

const isBetWinner = (bet: PlacedBet, result: number): boolean => {
  const color = getColor(result);
  switch (bet.type) {
    case 'red': return color === 'red';
    case 'black': return color === 'black';
    case 'green': return result === 0;
    case 'odd': return result > 0 && result % 2 !== 0;
    case 'even': return result > 0 && result % 2 === 0;
    case '1-18': return result >= 1 && result <= 18;
    case '19-36': return result >= 19 && result <= 36;
    case 'number': return result === bet.number;
    default: return false;
  }
};

type GameState = 'betting' | 'spinning' | 'result';

export const RouletteGame: React.FC = () => {
  const { state, dispatch } = useCasino();

  const [betAmount, setBetAmount] = useState(500);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [result, setResult] = useState<number | null>(null);
  const [lastResults, setLastResults] = useState<number[]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);

  const placeBet = (type: BetType, number?: number) => {
    if (gameState !== 'betting') return;
    if (betAmount < 200) return;
    if (state.balance < totalBet + betAmount) {
      sfx.playClick();
      return;
    }
    sfx.playClick();
    setBets(prev => [...prev, { type, number, amount: betAmount }]);
  };

  const clearBets = () => {
    if (gameState !== 'betting') return;
    setBets([]);
    sfx.playClick();
  };

  const spin = () => {
    if (gameState !== 'betting' || bets.length === 0) return;

    // Déduire le montant total des paris
    const total = bets.reduce((sum, b) => sum + b.amount, 0);
    if (state.balance < total) return;
    dispatch({ type: 'BET', payload: { amount: total, game: 'Roulette' } });

    sfx.playCoin();
    setGameState('spinning');
    setWinAmount(0);

    // Numéro gagnant aléatoire
    const winningNumber = Math.floor(Math.random() * 37);

    // Position de la roue : trouver l'index du numéro sur la roue
    const winIndex = WHEEL_ORDER.indexOf(winningNumber);
    const segmentAngle = 360 / 37;
    
    // Rotation de la roue : plusieurs tours + position exacte
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const finalWheelRotation = wheelRotation + extraSpins * 360 + (winIndex * segmentAngle);
    setWheelRotation(finalWheelRotation);

    // Rotation de la bille (sens inverse, plus de tours)
    const ballSpins = 8 + Math.floor(Math.random() * 4);
    setBallRotation(-(ballSpins * 360 + winIndex * segmentAngle));

    // Résultat après l'animation
    setTimeout(() => {
      setResult(winningNumber);
      setLastResults(prev => [winningNumber, ...prev].slice(0, 15));

      // Calculer les gains
      let totalWin = 0;
      bets.forEach(bet => {
        if (isBetWinner(bet, winningNumber)) {
          totalWin += bet.amount * getMultiplier(bet.type);
        }
      });

      if (totalWin > 0) {
        dispatch({ type: 'WIN', payload: { amount: totalWin, game: 'Roulette', multiplier: totalWin / total } });
        sfx.playVictoryArpeggio(totalWin / total);
      } else {
        sfx.playExplosion('light');
      }
      setWinAmount(totalWin);
      setGameState('result');
    }, 4500);
  };

  const newRound = () => {
    setBets([]);
    setResult(null);
    setWinAmount(0);
    setGameState('betting');
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-1 sm:p-2">
      
      {/* --- PANNEAU GAUCHE : PARIS --- */}
      <div className="w-full lg:w-72 flex flex-col gap-3 shrink-0">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
          
          {/* Input Mise */}
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
            <label className="flex justify-between text-xs font-bold text-slate-300 mb-2">
              <span>Mise par pari</span><span className="text-emerald-500">FCFA</span>
            </label>
            <div className="flex items-center bg-slate-800 rounded-lg overflow-hidden border border-slate-600 focus-within:border-emerald-500">
              <input 
                type="number" min="200" value={betAmount || ''}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="flex-1 bg-transparent text-white font-black text-base px-3 py-2 focus:outline-none w-full"
              />
              <div className="flex border-l border-slate-600">
                <button onClick={() => setBetAmount(Math.max(200, Math.floor(betAmount / 2)))} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-300 border-r border-slate-600">/2</button>
                <button onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-300">x2</button>
              </div>
            </div>
          </div>

          {/* Paris rapides */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => placeBet('red')} className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm transition-colors border border-red-400">
              Rouge
            </button>
            <button onClick={() => placeBet('green')} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-colors border border-emerald-400">
              0
            </button>
            <button onClick={() => placeBet('black')} className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition-colors border border-slate-500">
              Noir
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => placeBet('odd')} className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs border border-slate-600">Impair</button>
            <button onClick={() => placeBet('even')} className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs border border-slate-600">Pair</button>
            <button onClick={() => placeBet('1-18')} className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs border border-slate-600">1-18</button>
            <button onClick={() => placeBet('19-36')} className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs border border-slate-600">19-36</button>
          </div>

          {/* Paris en cours */}
          {bets.length > 0 && (
            <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-700 max-h-28 overflow-y-auto no-scrollbar">
              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Paris placés ({bets.length})</div>
              {bets.map((b, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5 text-slate-400">
                  <span className="capitalize">{b.type === 'number' ? `N°${b.number}` : b.type}</span>
                  <span className="text-white font-bold">{b.amount.toLocaleString()} F</span>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1 mt-1 border-t border-slate-700 font-black text-emerald-400">
                <span>Total</span>
                <span>{totalBet.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          {gameState === 'betting' && (
            <div className="flex gap-2">
              <button onClick={clearBets} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-sm border border-slate-600">
                Effacer
              </button>
              <button 
                onClick={spin}
                disabled={bets.length === 0}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${bets.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                Tourner 🎰
              </button>
            </div>
          )}

          {gameState === 'result' && (
            <div className="flex flex-col gap-2">
              {winAmount > 0 ? (
                <div className="bg-emerald-500/20 border border-emerald-500 rounded-xl p-3 text-center">
                  <p className="text-emerald-400 font-black text-xl">+{winAmount.toLocaleString()} FCFA</p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                  <p className="text-red-400 font-bold">Perdu</p>
                </div>
              )}
              <button onClick={newRound} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 font-black text-sm">
                Nouveau Tour
              </button>
            </div>
          )}
        </div>

        {/* Historique des résultats */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">Derniers résultats</p>
          <div className="flex flex-wrap gap-1.5">
            {lastResults.map((n, i) => (
              <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white ${getColor(n) === 'red' ? 'bg-red-600' : getColor(n) === 'green' ? 'bg-emerald-600' : 'bg-slate-900 border border-slate-600'}`}>
                {n}
              </div>
            ))}
            {lastResults.length === 0 && <span className="text-xs text-slate-600">Aucun</span>}
          </div>
        </div>
      </div>

      {/* --- ZONE PRINCIPALE : ROUE + TABLEAU --- */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        
        {/* LA ROUE */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden" style={{ minHeight: '280px' }}>
          
          {/* Roue extérieure */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64">
            {/* Indicateur / Flèche */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            
            {/* Roue qui tourne */}
            <motion.div
              animate={{ rotate: wheelRotation }}
              transition={{ duration: 4, ease: [0.2, 0.8, 0.3, 1] }}
              className="w-full h-full rounded-full border-4 border-yellow-600/50 shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden"
              style={{ background: 'conic-gradient(from 0deg, #1a1a2e, #0f0f23)' }}
            >
              {/* Segments de la roue */}
              {WHEEL_ORDER.map((num, i) => {
                const angle = (i * 360) / 37;
                const color = getColor(num);
                const bgColor = color === 'red' ? '#dc2626' : color === 'green' ? '#16a34a' : '#1e1e2e';
                return (
                  <div
                    key={i}
                    className="absolute top-0 left-1/2 h-1/2 origin-bottom text-[7px] sm:text-[8px] font-black text-white flex items-start justify-center pt-1.5"
                    style={{
                      width: '22px',
                      marginLeft: '-11px',
                      transform: `rotate(${angle}deg)`,
                    }}
                  >
                    <div className="px-0.5 py-0.5 rounded-sm" style={{ backgroundColor: bgColor, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                      {num}
                    </div>
                  </div>
                );
              })}
              
              {/* Centre de la roue */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-slate-900 border-2 border-yellow-700/50 shadow-inner flex items-center justify-center z-10">
                <span className="text-yellow-400 font-black text-xs">SPIN</span>
              </div>
            </motion.div>

            {/* Bille */}
            {gameState === 'spinning' && (
              <motion.div
                className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-30"
                animate={{ rotate: ballRotation }}
                transition={{ duration: 4, ease: [0.2, 0.8, 0.3, 1] }}
                style={{ transformOrigin: '50% calc(50% + 112px)' }}
              />
            )}
          </div>

          {/* Résultat affiché au centre */}
          {gameState === 'result' && result !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl z-30"
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-[0_0_40px] ${getColor(result) === 'red' ? 'bg-red-600 border-red-400 shadow-red-500/50' : getColor(result) === 'green' ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/50' : 'bg-slate-800 border-slate-500 shadow-slate-400/30'}`}>
                <span className="text-white font-black text-4xl">{result}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* TABLEAU DE PARIS (numéros 0-36) */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Rangée du zéro */}
            <div className="flex mb-1">
              <button
                onClick={() => placeBet('number', 0)}
                disabled={gameState !== 'betting'}
                className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm border border-emerald-500 transition-colors disabled:opacity-50"
              >
                0
              </button>
            </div>
            
            {/* Grille 3x12 des numéros 1-36 */}
            <div className="grid grid-cols-12 gap-1">
              {Array.from({length: 36}, (_, i) => i + 1).map(num => {
                const color = getColor(num);
                const row = (num - 1) % 3;
                const col = Math.floor((num - 1) / 3);
                // Réorganiser en colonnes de 3
                return (
                  <button
                    key={num}
                    onClick={() => placeBet('number', num)}
                    disabled={gameState !== 'betting'}
                    className={`py-1.5 rounded text-[10px] sm:text-xs font-black text-white transition-all hover:scale-110 hover:z-10 border disabled:opacity-50 ${color === 'red' ? 'bg-red-700 hover:bg-red-600 border-red-500/50' : 'bg-slate-900 hover:bg-slate-800 border-slate-600'} ${result === num ? 'ring-2 ring-yellow-400 scale-110 z-10' : ''}`}
                    style={{ gridRow: row + 1, gridColumn: col + 1 }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
