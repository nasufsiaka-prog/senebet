import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCasino } from '../../store/CasinoContext';
import { CircleDollarSign } from 'lucide-react';

export const BigWinParticles: React.FC = () => {
    const { state } = useCasino();
    const [isRaining, setIsRaining] = useState(false);
    const [winAmount, setWinAmount] = useState(0);

    // Ecoute des gains massifs pour déclencher la dopamine
    useEffect(() => {
        const lastTx = state.transactions[0];
        // Si le dernier event est une belle victoire (On met un seuil de 10 000 pour la démo)
        if (lastTx && lastTx.type === 'win' && lastTx.amount >= 10000) {
            
            // Éviler de le redéclencher si pas de nouvelle transaction (id)
            const memoryTrigger = localStorage.getItem('lastBigWinId');
            if (memoryTrigger === lastTx.id) return;
            localStorage.setItem('lastBigWinId', lastTx.id);

            setWinAmount(lastTx.amount);
            setIsRaining(true);
            setTimeout(() => setIsRaining(false), 5000); // 5 secondes de pluie
        }
    }, [state.transactions]);

    // Génération de pièces aléatoires en haut de l'écran
    const generateCoins = (count: number) => {
        return Array.from({ length: count }).map((_, i) => {
            const startX = Math.random() * 100; // % screen width
            const delay = Math.random() * 1.5; // Stagger effect
            const duration = Math.random() * 2 + 1.5; // Vitesse de chute
            const size = Math.random() * 20 + 20; // 20px - 40px
            const rot = Math.random() * 360; // Rotation initiale

            return (
                <motion.div
                    key={i}
                    initial={{ y: '-10vh', x: `${startX}vw`, rotate: rot, opacity: 0 }}
                    animate={{ y: '110vh', rotate: rot + 720, opacity: [0, 1, 1, 0] }}
                    transition={{ delay, duration, ease: "easeIn" }}
                    className="absolute z-[200] pointer-events-none"
                    style={{ width: size, height: size }}
                >
                    <CircleDollarSign className="w-full h-full text-yellow-400 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] fill-yellow-600" />
                </motion.div>
            );
        });
    };

    return (
        <AnimatePresence>
            {isRaining && (
                <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden flex items-center justify-center">
                    
                    {/* Le texte MEGA WIN au centre de l'écran */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                        exit={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 1.5, type: 'spring' }}
                        className="absolute z-[160] flex flex-col items-center justify-center drop-shadow-[0_0_50px_rgba(255,215,0,1)]"
                    >
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 uppercase">
                            Mega Win
                        </h1>
                        <p className="text-3xl md:text-5xl font-black text-white px-6 py-2 bg-black/50 backdrop-blur-sm rounded-full border-2 border-yellow-500 mt-2">
                            +{new Intl.NumberFormat('fr-FR').format(winAmount)} F
                        </p>
                    </motion.div>

                    {/* La pluie de pièces  */}
                    {generateCoins(80)}
                </div>
            )}
        </AnimatePresence>
    );
};
