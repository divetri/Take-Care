import { AppSettings } from './types';

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

let audioCtx: AudioContext | null = null;
let alarmIntervalId: number | null = null;
let customAudioEl: HTMLAudioElement | null = null;

export function startAlarmAudio(settings: AppSettings) {
  stopAlarmAudio();

  const isVibrateOnly = settings.alarmMode === 'vibrate';
  const shouldVibrate = settings.alarmMode === 'vibrate' || settings.alarmMode === 'ring-vibrate';
  const shouldRing = settings.alarmMode === 'ring' || settings.alarmMode === 'ring-vibrate';

  // VIBRATION
  if (shouldVibrate && navigator.vibrate) {
    navigator.vibrate(500);
  }

  // AUDIO
  if (shouldRing) {
    if (settings.soundPreset === 'custom' && settings.customSoundUrl) {
      if (!customAudioEl) {
        customAudioEl = new Audio(settings.customSoundUrl);
        customAudioEl.loop = true;
      } else if (customAudioEl.src !== settings.customSoundUrl) {
          customAudioEl.src = settings.customSoundUrl;
      }
      customAudioEl.play().catch(console.error);
    } else {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      alarmIntervalId = window.setInterval(() => {
        if (shouldVibrate && navigator.vibrate) {
           if (settings.soundPreset === 'urgent') {
               navigator.vibrate([250, 100]); 
           } else {
               navigator.vibrate([500, 200, 500]);
           }
        }

        const oscillator = audioCtx!.createOscillator();
        const gainNode = audioCtx!.createGain();
        
        if (settings.soundPreset === 'urgent') {
          oscillator.type = 'square';
          const freq = (Date.now() % 1000 < 500) ? 880 : 1046.50;
          oscillator.frequency.setValueAtTime(freq, audioCtx!.currentTime); 
          gainNode.gain.setValueAtTime(0, audioCtx!.currentTime); 
          gainNode.gain.linearRampToValueAtTime(1, audioCtx!.currentTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 0.35);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx!.destination);
          oscillator.start();
          oscillator.stop(audioCtx!.currentTime + 0.4);
        } else {
          // Gentle
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioCtx!.currentTime); // A4
          oscillator.frequency.setValueAtTime(554.37, audioCtx!.currentTime + 0.5); // C#5
          gainNode.gain.setValueAtTime(0, audioCtx!.currentTime); 
          gainNode.gain.linearRampToValueAtTime(0.3, audioCtx!.currentTime + 0.2); 
          gainNode.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 0.8);   
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx!.destination);
          oscillator.start();
          oscillator.stop(audioCtx!.currentTime + 1);
        }
      }, settings.soundPreset === 'urgent' ? 400 : 1500);
    }
  } else {
      // If only vibrate, set up a vibrate loop
      alarmIntervalId = window.setInterval(() => {
          if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 500]);
          }
      }, 1500);
  }
}

export function stopAlarmAudio() {
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
  if (alarmIntervalId !== null) {
    window.clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  if (customAudioEl) {
    customAudioEl.pause();
    customAudioEl.currentTime = 0;
  }
}