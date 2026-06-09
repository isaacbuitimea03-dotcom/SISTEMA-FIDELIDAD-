/**
 * Sound synthesis using Web Audio API for rewarding feedback.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (typeof AudioCtxClass === 'function') {
        audioCtx = new AudioCtxClass();
      } else {
        console.warn('AudioContext is not a constructible constructor in this environment.');
      }
    } catch (e) {
      console.warn('Failed to initialize AudioContext due to construction restriction:', e);
      return null;
    }
  }
  return audioCtx;
}

export function playStampSound() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  // Simulate a thick mechanical ink stamp press (sound of a heavy pop/thud)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Frequency slide downwards
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.12);
  
  gain.gain.setValueAtTime(0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.15);

  // Add a slight friction/click sound
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.frequency.setValueAtTime(1200, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
  gain2.gain.setValueAtTime(0.15, ctx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  osc2.type = 'triangle';
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start();
  osc2.stop(ctx.currentTime + 0.05);
}

export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  const playNote = (freq: number, delay: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  };

  // Play a minor arpeggio that sounds sweet and magical
  playNote(523.25, 0, 0.4);      // C5
  playNote(659.25, 0.08, 0.4);   // E5
  playNote(783.99, 0.16, 0.4);   // G5
  playNote(1046.50, 0.24, 0.6);  // C6
}
