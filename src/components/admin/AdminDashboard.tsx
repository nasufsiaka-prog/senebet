import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldAlert, Users, TrendingUp, Search, Save, X, DollarSign, Activity, History } from 'lucide-react';
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
}

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States of editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Transactions Modal
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

  const handleEditClick = (user: UserData) => {
    sfx.playClick();
    setEditingId(user.uid);
    setEditBalance(user.balance);
  };

  const handleSaveBalance = async (uid: string) => {
    sfx.playClick();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        balance: editBalance
      });
      // Mettre à jour la prop local
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
      // Trier du plus récent au plus ancien
      txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(txs);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la récupération de l'historique.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Statistiques pour le God Mode
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

         {/* UTILISATEURS TABLE */}
         <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Rechercher un joueur (Pseudo, Email)..." className="bg-transparent border-none outline-none text-sm w-full font-bold text-white placeholder-slate-500" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-700">
                       <th className="p-4 py-3">Joueur</th>
                       <th className="p-4 py-3 hidden sm:table-cell">Contact & IP</th>
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
                               <div className="text-slate-300">{user.email}</div>
                               <div className="text-slate-500 text-xs">{user.phone}</div>
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
      </div>
    </div>
  );
};
