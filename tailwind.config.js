/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Outfit', 'sans-serif'], 
        'mono': ['"Fira Code"', '"JetBrains Mono"', 'monospace'], 
      },
      colors: {
        casino: {
          dark: '#050a1f',
          darker: '#030512',
          darkest: '#050816', // L'abysse de Senepronostic
          surface: '#0f172a',
          surfaceGlow: '#1e293b',

          cyber: '#00D4FF', // Bleu néon de senepronostic
          cyberCyan: '#00ffff',
          cyberYellow: '#FF7A00', // Orange Senepronostic
          
          gold: '#ffd700',
          goldDark: '#b8860b',
          goldLight: '#ffeb73',

          accent: '#00D4FF',    // Wave Deposit Blue / Neon Blue
          success: '#00FF88',   // Profit Green senepronostic
          successGlow: '#00cc6a',
          danger: '#FF3B3B',    // Loss Red
          dangerGlow: '#cc2f2f',
          warning: '#FF7A00',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-pattern': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))',
      },
      animation: {
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'pop': 'pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse-fast': 'glow-pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'confetti': 'confetti 3s ease-out forwards',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'cashout-flash': 'cashout-flash 0.5s ease-out forwards',
        'sweep': 'sweep 2s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(4px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-8px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(8px, 0, 0)' }
        },
        pop: {
          '0%': { transform: 'scale(0.5) translateY(0)', opacity: '0' },
          '70%': { transform: 'scale(1.1) translateY(-20px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-30px)', opacity: '0' }
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px currentColor' },
          '50%': { opacity: '.7', boxShadow: '0 0 25px currentColor' }
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg) scale(0.5)', opacity: '0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', boxShadow: '0 0 0 0 rgba(0, 255, 136, 0.7)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 15px rgba(0, 255, 136, 0)' },
          '100%': { transform: 'scale(0.8)', boxShadow: '0 0 0 0 rgba(0, 255, 136, 0)' },
        },
        'cashout-flash': {
          '0%': { backgroundColor: 'transparent', boxShadow: 'none' },
          '50%': { backgroundColor: 'rgba(0, 255, 136, 0.3)', boxShadow: 'inset 0 0 60px rgba(0, 255, 136, 0.6)' },
          '100%': { backgroundColor: 'transparent', boxShadow: 'none' },
        },
        sweep: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' }
        }
      },
      boxShadow: {
        'neon-cyber': '0 0 5px theme("colors.casino.cyber"), 0 0 15px theme("colors.casino.cyber")',
        'neon-cyberCyan': '0 0 5px theme("colors.casino.cyberCyan"), 0 0 15px theme("colors.casino.cyberCyan")',
        'neon-gold': '0 0 5px theme("colors.casino.gold"), 0 0 10px theme("colors.casino.goldDark")',
        'neon-success': '0 0 5px theme("colors.casino.success"), 0 0 20px theme("colors.casino.successGlow")',
        'neon-danger': '0 0 5px theme("colors.casino.danger"), 0 0 15px theme("colors.casino.danger")',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'glass-inset': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.05)',
        'active-border': '0 0 0 1px theme("colors.casino.cyberCyan"), 0 0 5px theme("colors.casino.cyberCyan")',
      },
      dropShadow: {
        'glow-gold': '0 0 8px rgba(255, 215, 0, 0.6)',
        'glow-cyber': '0 0 8px rgba(0, 212, 255, 0.6)',
        'glow-success': '0 0 10px rgba(0, 255, 136, 0.8)',
        'glow-danger': '0 0 10px rgba(255, 59, 59, 0.8)',
      }
    },
  },
  plugins: [
    plugin(function({ addUtilities, theme }) {
      addUtilities({
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.transform-style-3d': {
          'transform-style': 'preserve-3d',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        '.text-glow-cyber': {
          textShadow: `0 0 8px ${theme('colors.casino.cyber')}`,
        },
        '.text-glow-gold': {
          textShadow: `0 0 8px ${theme('colors.casino.gold')}`,
        },
        '.text-glow-success': {
          textShadow: `0 0 8px ${theme('colors.casino.success')}`,
        },
        '.text-glow-danger': {
          textShadow: `0 0 8px ${theme('colors.casino.danger')}`,
        },
        '.glass-panel': {
          backgroundColor: 'rgba(5, 10, 31, 0.70)',
          /* Retrait du blur excessif cause de FPS drops massif */
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 15px 0 rgba(0, 0, 0, 0.3)',
        },
        '.glass-panel-heavy': {
          backgroundColor: 'rgba(3, 5, 18, 0.90)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 25px 0 rgba(0, 0, 0, 0.5)',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none',
        }
      })
    })
  ],
}
