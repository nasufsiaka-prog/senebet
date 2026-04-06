import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { sfx } from '../utils/AudioEngine';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, addDoc, collection } from 'firebase/firestore';

// --- Types & Interfaces Strictes ---
export type ThemeType = 'dark' | 'cyberpunk' | 'gold';
export type VIPLevel = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Whale';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'faucet';
  game?: string; // Opt: Source du bet/win
  amount: number;
  date: Date;
  hash: string; // Provably fair illusion
}

export interface ProvablyFair {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface UserState {
  userId: string;
  username: string;
  balance: number; // en FCFA
  xp: number;
  vipLevel: VIPLevel;
  theme: ThemeType;
  soundEnabled: boolean;
  is2FAEnabled: boolean;
  lastFaucetClaim: Date | null;
  transactions: Transaction[];
  crypto: ProvablyFair;
}

// --- Payload Types ---
type BetPayload = { amount: number; game: string };
type WinPayload = { amount: number; game: string; multiplier: number };

// --- Actions Globales ---
type ActionType = 
  | { type: 'BET'; payload: BetPayload }
  | { type: 'WIN'; payload: WinPayload }
  | { type: 'DEPOSIT'; payload: number }
  | { type: 'WITHDRAW'; payload: number }
  | { type: 'TOGGLE_SOUND'; payload?: boolean }
  | { type: 'SET_THEME'; payload: ThemeType }
  | { type: 'CLAIM_FAUCET'; payload: number }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserState> }
  | { type: 'SYNC_FROM_DB'; payload: { balance: number; xp: number; vipLevel: VIPLevel } }
  | { type: 'GENERATE_NEW_SEED' };

// --- Utilitaires de Logique Métier ---
const generateHash = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const calculateVipLevel = (xp: number): VIPLevel => {
  if (xp >= 1000000) return 'Whale';
  if (xp >= 250000) return 'Diamond';
  if (xp >= 75000) return 'Gold';
  if (xp >= 15000) return 'Silver';
  return 'Bronze';
};

const getXPBonusMultiplier = (level: VIPLevel): number => {
  switch (level) {
    case 'Whale': return 2.5;
    case 'Diamond': return 2.0;
    case 'Gold': return 1.5;
    case 'Silver': return 1.2;
    default: return 1.0;
  }
};

// --- Etat Initial ---
const getInitialState = (): UserState => {
  // Tentative de récupération LocalStorage (Persistance) pseudo-backend
  const savedState = localStorage.getItem('AntiGravity_CasinoState');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      // Réhydrate les dates
      parsed.lastFaucetClaim = parsed.lastFaucetClaim ? new Date(parsed.lastFaucetClaim) : null;
      parsed.transactions = parsed.transactions.map((tx: any) => ({ ...tx, date: new Date(tx.date) }));
      // Si le joueur est ruiné, on lui redonne des crédits de démo
      if (parsed.balance <= 0) {
        parsed.balance = 0;
      }
      return parsed;
    } catch (e) {
      console.warn("State Corrupted, resetting.");
    }
  }

  return {
    userId: 'USR-' + generateHash().substring(0, 8).toUpperCase(),
    username: 'Joueur_Senebet',
    balance: 0, // Solde initial : 0 FCFA — vrai casino, pas de démo
    xp: 5000,
    vipLevel: 'Bronze',
    theme: 'dark',
    soundEnabled: true,
    is2FAEnabled: false,
    lastFaucetClaim: null,
    transactions: [],
    crypto: {
      serverSeed: generateHash() + generateHash(),
      clientSeed: 'AG_CLIENT_' + Date.now(),
      nonce: 0
    }
  };
};

// --- Reducer Principal ---
function userReducer(state: UserState, action: ActionType): UserState {
  switch (action.type) {
    case 'BET': {
      if (state.balance < action.payload.amount) return state; // Empêche bilan négatif
      const xpGained = (action.payload.amount * 0.05) * getXPBonusMultiplier(state.vipLevel);
      const newXp = state.xp + xpGained;
      
      const tx: Transaction = {
        id: 'TX-' + Date.now().toString(),
        type: 'bet',
        game: action.payload.game,
        amount: -action.payload.amount,
        date: new Date(),
        hash: generateHash()
      };

      return {
        ...state,
        balance: state.balance - action.payload.amount,
        xp: newXp,
        vipLevel: calculateVipLevel(newXp),
        transactions: [tx, ...state.transactions].slice(0, 100), // Conserve 100 tx max pour les perfs
        crypto: { ...state.crypto, nonce: state.crypto.nonce + 1 }
      };
    }

    case 'WIN': {
      const { amount, multiplier } = action.payload;
      if (multiplier >= 10) sfx.playVictoryArpeggio(multiplier);
      else sfx.playCoin();

      // Bonus d'XP sur les grosses victoires
      const winXpBonus = multiplier >= 5 ? 500 : 0;
      const newXpWin = state.xp + winXpBonus;

      const tx: Transaction = {
        id: 'TX-' + Date.now().toString(),
        type: 'win',
        game: action.payload.game,
        amount: amount,
        date: new Date(),
        hash: generateHash()
      };

      return {
        ...state,
        balance: state.balance + amount,
        xp: newXpWin,
        vipLevel: calculateVipLevel(newXpWin),
        transactions: [tx, ...state.transactions].slice(0, 100),
        crypto: { ...state.crypto, nonce: state.crypto.nonce + 1 }
      };
    }

    case 'DEPOSIT': {
      const tx: Transaction = {
        id: 'DEP-' + Date.now().toString(),
        type: 'deposit',
        amount: action.payload,
        date: new Date(),
        hash: generateHash()
      };
      return {
        ...state,
        balance: state.balance + action.payload,
        transactions: [tx, ...state.transactions]
      };
    }

    case 'WITHDRAW': {
      if (state.balance < action.payload) return state;
      const tx: Transaction = {
        id: 'WTH-' + Date.now().toString(),
        type: 'withdraw',
        amount: -action.payload,
        date: new Date(),
        hash: generateHash()
      };
      return {
        ...state,
        balance: state.balance - action.payload,
        transactions: [tx, ...state.transactions]
      };
    }

    case 'CLAIM_FAUCET': {
      const tx: Transaction = {
        id: 'FCT-' + Date.now().toString(),
        type: 'faucet',
        amount: action.payload,
        date: new Date(),
        hash: generateHash()
      };
      return {
        ...state,
        balance: state.balance + action.payload,
        lastFaucetClaim: new Date(),
        transactions: [tx, ...state.transactions]
      };
    }

    case 'TOGGLE_SOUND': {
      const ns = action.payload !== undefined ? action.payload : !state.soundEnabled;
      sfx.setEnabled(ns);
      return { ...state, soundEnabled: ns };
    }

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'UPDATE_PROFILE':
      return { ...state, ...action.payload };

    case 'SYNC_FROM_DB':
      return { 
        ...state, 
        balance: action.payload.balance, 
        xp: action.payload.xp, 
        vipLevel: action.payload.vipLevel 
      };

    case 'GENERATE_NEW_SEED':
      return {
        ...state,
        crypto: {
          serverSeed: generateHash() + generateHash(),
          clientSeed: 'AG_CLIENT_' + Date.now(),
          nonce: 0
        }
      };

    default:
      return state;
  }
}

// --- Provider & Hook ---
const CasinoContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<ActionType>;
} | undefined>(undefined);

export const CasinoProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(userReducer, getInitialState());
  const lastTxRef = useRef<string | null>(null);

  // Effet de Bord 1 : Synchro CSS THEME
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'cyberpunk', 'gold');
    root.classList.add(state.theme);
  }, [state.theme]);

  // Effet de Bord 2 : Persistance LocalStorage
  useEffect(() => {
    localStorage.setItem('AntiGravity_CasinoState', JSON.stringify(state));
    // SYNC Vers Firebase DB pour sauvegarder l'avancée si l'utilisateur est connecté !
    if (auth.currentUser && state.userId === auth.currentUser.uid) {
       updateDoc(doc(db, "users", auth.currentUser.uid), {
         balance: state.balance,
         xp: state.xp,
         vipLevel: state.vipLevel
       }).catch(() => {}); // catch silent en cas de spam
    }
  }, [state.balance, state.xp, state.vipLevel, state.userId]);

  // Effet de Bord 3 : Logs Transactions Business
  useEffect(() => {
    if (auth.currentUser && state.userId === auth.currentUser.uid && state.transactions.length > 0) {
      const latestTx = state.transactions[0];
      if (lastTxRef.current !== latestTx.id) {
         lastTxRef.current = latestTx.id;
         addDoc(collection(db, "users", auth.currentUser.uid, "transactions_logs"), {
            ...latestTx,
            amount: Number(latestTx.amount.toFixed(2)),
            date: latestTx.date.toISOString(),
            timestamp: new Date().toISOString()
         }).catch(() => {});
      }
    }
  }, [state.transactions, state.userId]);

  // Listener d'Authentification et de Firestore pour MAJ Temps Réel Administrateur
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
       if (user) {
         dispatch({ type: 'UPDATE_PROFILE', payload: { userId: user.uid } });
         // Ecoute Firestore en temps réel !
         const unsubscribeDb = onSnapshot(doc(db, "users", user.uid), (docsnap) => {
            if (docsnap.exists()) {
               const data = docsnap.data();
               // Si le solde venant de la BDD est très différent, c'est l'admin qui l'a changé ou c'est un reload
               dispatch({ 
                 type: 'SYNC_FROM_DB', 
                 payload: { 
                   balance: data.balance, 
                   xp: data.xp || 0, 
                   vipLevel: data.vipLevel || 'Bronze' 
                 } 
               });
            }
         });
         return () => unsubscribeDb();
       }
    });
    return () => unsubscribeAuth();
  }, []);

  // Initialisation du son dès l'app mount
  useEffect(() => {
    sfx.setEnabled(state.soundEnabled);
  }, []);

  return (
    <CasinoContext.Provider value={{ state, dispatch }}>
      {children}
    </CasinoContext.Provider>
  );
};

export const useCasino = () => {
  const context = useContext(CasinoContext);
  if (context === undefined) {
    throw new Error('useCasino must be used within exclusively inside a CasinoProvider');
  }
  return context;
};
