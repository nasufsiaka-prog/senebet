import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldAlert, Users, DollarSign, Activity, History, Search, X, List, AlertCircle } from 'lucide-react';
import { sfx } from '../../utils/AudioEngine';

interface UserData {
  uid: string;
  username: string;
  email: string;
  phone: string;
  balance: number;
  xp: number;
  vipLevel: string;
  lastIp?: string;
  lastLocation?: string;
  createdAt?: string;
}

interface TransactionLog {
  id: string;
  type: string;
  game: string;
  amount: number;
  date: string;
  timestamp: string;
  username?: string; // Ajouté pour la vue globale
}

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'global'>('users');
  
  // States of editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Global Transactions
  const [globalLogs, setGlobalLogs] = useState<TransactionLog[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  // Modal specifique utilisateur
  const [historyUser, setHistoryUser] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList: UserData[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push(doc.data() as UserData);
        });
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch Global Logs without needing complex Firestore Indexes
  const fetchGlobalLogs = async () => {
      if (globalLogs.length > 0) return; // Déjà loadés
      setLoadingGlobal(true);
      try {
          let allLogs: TransactionLog[] = [];
          
          await Promise.all(users.map(async (u) => {
              const qSnap = await getDocs(collection(db, "users", u.uid, "transactions_logs"));
              qSnap.forEach(d => {
                  allLogs.push({ ...(d.data() as TransactionLog), username: u.username });
              });
          }));

          allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setGlobalLogs(allLogs);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingGlobal(false);
      }
  };

  useEffect(() => {
      if (activeTab === 'global' && users.length > 0) {
          fetchGlobalLogs();
      }
  }, [activeTab, users]);

  const handleEditClick = (user: UserData) => {
    sfx.playClick();
    setEditingId(user.uid);
    setEditBalance(user.balance);
  };

  const handleSaveBalance = async (uid: string) => {
    sfx.playClick();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), { balance: editBalance });
      setUsers(users.map(u => u.uid === uid ? { ...u, balance: editBalance } : u));
      setEditingId(null);
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      alert("Erreur base de données (Avez-vous configuré Firestore?)");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenHistory = async (user: UserData) => {
    sfx.playClick();
    setHistoryUser(user);
    setLoadingHistory(true);
    try {
      const qSnap = await getDocs(collection(db, "users", user.uid, "transactions_logs"));
      const txs: TransactionLog[] = [];
      qSnap.forEach(d => txs.push(d.data() as TransactionLog));
      txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(txs);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la récupération de l'historique.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const totalBalances = users.reduce((acc, u) => acc + u.balance, 0);

  return (
    <div className="fixed inset-0 bg-[#060913] z-50 overflow-y-auto no-scrollbar font-sans text-white animate-[popIn_0.3s_ease-out]">
      {/* HEADER ADMIN */}
      <div className="sticky top-0 bg-slate-900/90 backdrop-blur-xl border-b border-indigo-500/30 p-4 flex justify-between items-center z-20 shadow-lg">
         <div className="flex items-center gap-3">
           <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/50">
             <ShieldAlert className="text-indigo-400 w-6 h-6" />
           </div>
           <div>
             <h1 className="text-lg font-black text-indigo-400 tracking-[0.2em] uppercase">Senebet Management Center</h1>
             <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Admin Access: Authorized</p>
           </div>
         </div>
         <button onClick={() => { sfx.playClick(); onClose(); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
           <X className="w-5 h-5" />
         </button>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
         
         {/* TOP METRICS */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-16 h-16"/></div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Joueurs Inscrits</h3>
                <p className="text-3xl font-black text-white">{users.length}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-16 h-16"/></div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Passif Global (FCFA)</h3>
                <p className="text-3xl font-black text-emerald-400">{totalBalances.toLocaleString('fr-FR')}</p>
            </div>
            <div className="bg-slate-800/50 border border-indigo-500/30 rounded-2xl p-5 relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-16 h-16 text-indigo-400"/></div>
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-1">Statut Serveur</h3>
                <p className="text-xl font-black text-indigo-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  CONNECTÉ
                </p>
            </div>
         </div>

         {/* ONGLETS */}
         <div className="flex gap-4 mb-6 border-b border-slate-800 pb-px">
            <button 
                onClick={() => setActiveTab('users')}
                className={`pb-3 font-bold uppercase tracking-widest text-sm flex items-center gap-2 transition-all ${activeTab === 'users' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Users className="w-5 h-5"/> Joueurs & Soldes
            </button>
            <button 
                onClick={() => setActiveTab('global')}
                className={`pb-3 font-bold uppercase tracking-widest text-sm flex items-center gap-2 transition-all ${activeTab === 'global' ? 'border-b-2 border-amber-500 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <List className="w-5 h-5"/> Vision Globale (Feed)
            </button>
         </div>

         {activeTab === 'users' && (
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Rechercher un joueur (Pseudo, Email)..." className="bg-transparent border-none outline-none text-sm w-full font-bold text-white placeholder-slate-500" />
                </div>

                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-700">
                            <th className="p-4 py-3">Joueur / ID</th>
                            <th className="p-4 py-3 hidden sm:table-cell">Contact & Empreinte IP</th>
                            <th className="p-4 py-3">Solde (FCFA)</th>
                            <th className="p-4 py-3 text-right">Actions B2B</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-700/50">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold animate-pulse">Chargement base de données...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">Aucun joueur trouvé.</td></tr>
                        ) : (
                            users.map(user => (
                            <tr key={user.uid} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-black text-white">{user.username}</div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {user.uid.slice(0,8)}...</div>
                                </td>
                                <td className="p-4 hidden sm:table-cell">
                                    <div className="text-indigo-300 font-mono text-xs">{user.email}</div>
                                    <div className="text-slate-400 text-xs">{user.phone}</div>
                                    <div className="text-emerald-500 tracking-widest text-[9px] uppercase mt-1">IP: {user.lastIp || 'INCONNUE'} | {user.lastLocation || 'N/A'}</div>
                                </td>
                                <td className="p-4 font-black">
                                    {editingId === user.uid ? (
                                        <input 
                                            type="number" 
                                            value={editBalance} 
                                            onChange={e => setEditBalance(Number(e.target.value))}
                                            className="bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-1 w-32 text-emerald-400 outline-none"
                                        />
                                    ) : (
                                        <span className="text-emerald-400">{user.balance.toLocaleString('fr-FR')}</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2 items-center">
                                    {editingId === user.uid ? (
                                        <button onClick={() => handleSaveBalance(user.uid)} disabled={isSaving} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-900 rounded-lg text-xs font-bold transition-colors">
                                            {isSaving ? '...' : 'Sauvegarder'}
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => handleOpenHistory(user)} className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                                            <History className="w-3 h-3" /> Logs
                                            </button>
                                            <button onClick={() => handleEditClick(user)} className="px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-900 rounded-lg text-xs font-bold transition-colors">
                                                Modifier Solde
                                            </button>
                                        </>
                                    )}
                                    </div>
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>
         )}

         {activeTab === 'global' && (
             <div className="bg-slate-800/30 rounded-2xl border border-slate-700 p-6 shadow-inner animate-[popIn_0.3s_ease-out]">
                 <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                     <AlertCircle className="text-amber-500" /> Flux d'Activité en direct
                 </h2>

                 {loadingGlobal ? (
                     <div className="text-center p-10 text-slate-500 font-bold animate-pulse">Extraction de toutes les transactions sur Firebase...</div>
                 ) : globalLogs.length === 0 ? (
                     <div className="text-center p-10 text-slate-500 font-bold">Aucune transaction enregistrée.</div>
                 ) : (
                     <div className="space-y-3">
                         {globalLogs.slice(0, 100).map((log, idx) => (
                             <div key={idx} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                                 <div className="flex items-center gap-4">
                                     <div className={`p-3 rounded-xl ${
                                         log.type === 'WIN' ? 'bg-emerald-500/20 text-emerald-500' :
                                         log.type === 'BET' ? 'bg-amber-500/20 text-amber-500' :
                                         'bg-blue-500/20 text-blue-500'
                                     }`}>
                                         {log.type === 'WIN' ? <DollarSign className="w-5 h-5"/> : log.type === 'BET' ? <Activity className="w-5 h-5"/> : <ShieldAlert className="w-5 h-5"/>}
                                     </div>
                                     <div>
                                         <p className="font-bold text-white text-sm uppercase tracking-wide">[{log.username}] - {log.game}</p>
                                         <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className={`font-black text-lg ${log.type === 'WIN' || log.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                         {log.type === 'WIN' || log.type === 'DEPOSIT' ? '+' : '-'}{Math.abs(log.amount).toLocaleString('fr-FR')} FCFA
                                     </p>
                                     <p className="text-[10px] text-slate-500 uppercase tracking-widest">{log.type}</p>
                                 </div>
                             </div>
                         ))}
                         {globalLogs.length > 100 && (
                             <div className="text-center text-slate-600 text-xs pt-4 font-bold">... Affichage des 100 dernières actions.</div>
                         )}
                     </div>
                 )}
             </div>
         )}
      </div>

      {/* HISTORIQUE MODAL INDIVIDUELLE */}
      {historyUser && (
        <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-[popIn_0.3s_ease-out]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
               <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <History className="text-indigo-400" />
                    B2B Logs : {historyUser.username}
                  </h2>
                  <p className="text-xs text-emerald-500 font-mono mt-1">ID: {historyUser.uid}</p>
               </div>
               <button onClick={() => setHistoryUser(null)} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar bg-slate-950/30">
               {loadingHistory ? (
                 <div className="text-center p-10 text-slate-500">Chargement des logs cryptographiques...</div>
               ) : transactions.length === 0 ? (
                 <div className="text-center p-10 text-slate-600 font-bold uppercase tracking-widest">Aucune transaction bancaire.</div>
               ) : (
                 transactions.map((tx, idx) => (
                   <div key={idx} className="flex justify-between items-center p-4 bg-slate-800/40 rounded-xl border border-slate-700">
                      <div>
                        <div className="font-bold text-slate-200 uppercase tracking-widest text-sm">{tx.game} <span className="text-slate-500 ml-2">[{tx.type}]</span></div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">{new Date(tx.timestamp).toLocaleString('fr-FR')}</div>
                      </div>
                      <div className={`font-black text-lg ${tx.type === 'WIN' || tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {tx.type === 'WIN' || tx.type === 'DEPOSIT' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('fr-FR')} <span className="text-[10px]">CFA</span>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
