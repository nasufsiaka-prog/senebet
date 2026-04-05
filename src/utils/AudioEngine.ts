/**
 * Moteur Audio Spatial Tier-1 [Anti-Gravity]
 * Génère des ondes procédurales, passthrough des filtres biquad, et spatialisation 3D.
 * Aucune dépendance externe, 0 latence réseau, 100% Mathématique.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isSoundEnabled: boolean = true;
  private isAmbientPlaying: boolean = false;

  constructor() {
    // Initialisation reporter pour respecter les "User-Gesture API policies" des navigateurs
  }

  /**
   * Initialise le graphe audio avec un compresseur de dynamique pour éviter le clipping
   * lorsque plusieurs sons (Explosion + Coins) jouent en même temps.
   */
  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6; // Master Volume

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0; // Starts at 0, faded in when needed

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-20, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Routage: Tous -> Compresseur -> Master -> Destination
      this.masterGain.connect(this.compressor);
      this.ambientGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    if (!enabled && this.isAmbientPlaying) {
      this.stopAmbient();
    } else if (enabled && this.isAmbientPlaying) {
      this.startAmbient();
    }
  }

  /**
   * Crée un drone de fond très grave et subtil (Fréquence de Schumman psychologique 43.2Hz)
   */
  public startAmbient() {
    if (!this.isSoundEnabled || this.isAmbientPlaying) return;
    this.init();
    if (!this.ctx || !this.ambientGain) return;

    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 43.2; // Fréquence de résonance très basse

    // Ajout d'un LFO (Low Frequency Oscillator) pour faire palpiter l'ambiance "Casino"
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5; // Oscille toutes les 2 secondes
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 10; // Profondeur de la pulsation

    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientOsc.frequency); // Le LFO module la fréquence centrale

    this.ambientOsc.connect(this.ambientGain);
    
    this.ambientOsc.start();
    lfo.start();
    
    // Fade IN de 3 secondes pour ne pas surprendre le joueur
    this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 3);

    this.isAmbientPlaying = true;
  }

  public stopAmbient() {
    if (!this.ctx || !this.ambientGain || !this.ambientOsc) return;
    
    // Fade OUT de 2 secondes
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
    
    setTimeout(() => {
      this.ambientOsc?.stop();
      this.ambientOsc?.disconnect();
      this.isAmbientPlaying = false;
    }, 2100);
  }

  public playHover() {
    if (!this.isSoundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();

    // Effet "bulle de verre" high-tech
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

    panner.pan.value = (Math.random() * 0.4) - 0.2; // Spatialisation très subtile gauche/droite

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playClick() {
    if (!this.isSoundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Son de validation mécanique (UI)
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playTension(step: number = 1, isFinal: boolean = false) {
    if (!this.isSoundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator(); // Deuxième harmonique pour enrichir le son
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Montage du pitch hyper stressant (Near Miss / Chicken avançant)
    const baseFreq = 200;
    const targetFreq = Math.min(baseFreq * Math.pow(1.15, step), 1200);

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(targetFreq, this.ctx.currentTime);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(targetFreq * 1.5, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.value = targetFreq * 2;
    filter.Q.value = 5; // Résonance cinglante

    // Sidechain/Duck effect si final (tension au climax)
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(isFinal ? 0.3 : 0.15, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.5);
    osc2.stop(this.ctx.currentTime + 0.5);
  }

  public playExplosion(severity: 'light' | 'heavy' = 'heavy') {
    if (!this.isSoundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const duration = severity === 'heavy' ? 2.5 : 0.8;
    const bufferSize = this.ctx.sampleRate * duration; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // Pure White Noise
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Distorsion pour "briser" le son du crash
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(severity === 'heavy' ? 400 : 50);
    distortion.oversample = '4x';

    // Rendre l'explosion grave et lourde
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime( severity === 'heavy' ? 800 : 2000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(severity === 'heavy' ? 1.2 : 0.6, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noiseSource.connect(distortion);
    distortion.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();
  }

  public playVictoryArpeggio(multiplier: number = 2) {
    if (!this.isSoundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const rootNotes = [440, 554, 659, 880, 1108, 1318]; // Arpège majeur étendu
    const maxNotes = Math.min(Math.floor(multiplier * 2), rootNotes.length);
    const notesToPlay = rootNotes.slice(0, Math.max(3, maxNotes)); // Minimum 3 notes
    const timePerNote = 0.08;

    notesToPlay.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Filtre "magique" qui s'ouvre
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, this.ctx!.currentTime);
        filter.frequency.linearRampToValueAtTime(3000, this.ctx!.currentTime + timePerNote);

        const startTime = this.ctx!.currentTime + idx * timePerNote;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + timePerNote * 2); // Débordement pour lier les notes

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(startTime);
        osc.stop(startTime + timePerNote * 3);
    });
  }

  public playCoin() {
    if (!this.isSoundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Utilitaire mathématique pour générer une courbe de distorsion (Overdrive)
  private makeDistortionCurve(amount: number) {
    let k = typeof amount === 'number' ? amount : 50;
    let n_samples = 44100;
    let curve = new Float32Array(n_samples);
    let deg = Math.PI / 180;
    let i = 0;
    let x;
    for ( ; i < n_samples; ++i ) {
      x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
  }
}

export const sfx = new AudioEngine();
