import { AlertSoundType } from '@/types/transit';

/**
 * Default continuous alarm duration in seconds.
 * Configurable so it can easily be adjusted later.
 */
export const DEFAULT_ALARM_DURATION_SECONDS = 30;

/**
 * Multi-sensory continuous alert dispatcher for BusStop Alert:
 * - Continuous Web Audio API synthesized sounds for 30 seconds
 * - Native Speech Synthesis ("Approaching [Stop Name]") at the beginning
 * - Device Vibration API repeating pulses
 * - Browser Notification API
 * - Instant manual dismiss/stop capability
 * - Single-trigger latching to prevent restarts from GPS updates
 */
class AlertManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Active continuous alarm state
  private isAlarmActive: boolean = false;
  private alarmIntervalId: ReturnType<typeof setInterval> | null = null;
  private vibrationIntervalId: ReturnType<typeof setInterval> | null = null;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private masterTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Tone currently driving the active alarm loop. Read live by the interval
  // callback (rather than captured in a closure) so it can be changed
  // mid-alarm via `setActiveSoundType()`.
  private activeSoundType: AlertSoundType = 'gentle-chime';
  private activeStopName: string = '';

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Gain multiplier applied only to the active continuous destination alert,
   * so repeated in-journey alarms are more noticeable without affecting
   * normal "Test Alarm" / tap-to-preview volume.
   */
  private static readonly LOUD_ALERT_GAIN_MULTIPLIER = 1.5;

  /**
   * Plays Classic Bell tone. `loud` boosts gain for the active alert only.
   */
  public playClassicBell(loud: boolean = false): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const boost = loud ? AlertManager.LOUD_ALERT_GAIN_MULTIPLIER : 1;

      [587.33, 1174.66, 1760.0].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = Math.min(1, (0.35 / (i + 1)) * boost);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (1.2 - i * 0.2));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.3);
      });
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  }

  /**
   * Plays Gentle Chime tone. `loud` boosts gain for the active alert only.
   */
  public playGentleChime(loud: boolean = false): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const boost = loud ? AlertManager.LOUD_ALERT_GAIN_MULTIPLIER : 1;

      const notes = [
        { freq: 523.25, start: now + 0.0, dur: 0.3 },
        { freq: 659.25, start: now + 0.18, dur: 0.3 },
        { freq: 783.99, start: now + 0.36, dur: 0.5 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(Math.min(1, 0.28 * boost), start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  }

  /**
   * Plays Urgent Alarm tone. `loud` boosts gain for the active alert only.
   */
  public playUrgentAlarm(loud: boolean = false): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const boost = loud ? AlertManager.LOUD_ALERT_GAIN_MULTIPLIER : 1;

      const beeps = [
        { freq: 1046.5, start: now + 0.0, dur: 0.12 },
        { freq: 1318.5, start: now + 0.15, dur: 0.12 },
        { freq: 1046.5, start: now + 0.3, dur: 0.12 },
        { freq: 1318.5, start: now + 0.45, dur: 0.2 },
      ];

      beeps.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(Math.min(1, 0.18 * boost), start);
        gain.gain.setValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      });
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  }

  /**
   * Plays Attention Alert tone. `loud` boosts gain for the active alert only.
   */
  public playAttentionAlert(loud: boolean = false): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const boost = loud ? AlertManager.LOUD_ALERT_GAIN_MULTIPLIER : 1;

      [
        { freq: 880.0, start: now, dur: 0.18 },
        { freq: 1760.0, start: now + 0.16, dur: 0.4 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(Math.min(1, 0.35 * boost), start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  }

  /**
   * Plays a single sound cycle based on type. `loud` boosts gain for the
   * active continuous alert only — preview calls omit it and stay at
   * normal volume.
   */
  public playSingleSound(type: AlertSoundType, loud: boolean = false): void {
    switch (type) {
      case 'classic-bell':
        this.playClassicBell(loud);
        break;
      case 'gentle-chime':
        this.playGentleChime(loud);
        break;
      case 'urgent-alarm':
        this.playUrgentAlarm(loud);
        break;
      case 'attention-alert':
        this.playAttentionAlert(loud);
        break;
      case 'voice-announcement':
      case 'vibration-only':
        // Voice is handled at start; gentle chime fills background if unmuted
        this.playGentleChime(loud);
        break;
      default:
        this.playGentleChime(loud);
        break;
    }
  }

  /**
   * Speaks the announcement using browser SpeechSynthesis
   */
  public speakAnnouncement(stopName: string, distanceStr?: string): void {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const text = distanceStr
        ? `Approaching ${stopName}. Your stop is ${distanceStr} away. Please get ready to get down.`
        : `Approaching ${stopName}. Please prepare to get down.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => (v.lang.startsWith('en') && v.name.includes('Google')) || v.name.includes('Natural')
      );
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  /**
   * Device vibration pattern (safely cancels if pattern is 0 or empty)
   */
  public triggerVibration(pattern: number[] = [400, 200, 400]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Vibration API error:', e);
      }
    }
  }

  /**
   * Request system notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Sends a browser system notification
   */
  public showSystemNotification(stopName: string, distanceStr: string): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification('🔔 BusStop Alert: Approaching Your Stop!', {
        body: `Get ready! You are ${distanceStr} from ${stopName}.`,
        icon: '/icons/bus-alert-icon.png',
        tag: 'bus-stop-arrival',
        requireInteraction: true,
      });
    } catch (e) {
      console.warn('Notification error:', e);
    }
  }

  /**
   * Previews a selected sound type for the "Test Alarm" interaction (one-shot preview)
   */
  public previewSound(type: AlertSoundType, sampleStopName = 'Central Station'): void {
    switch (type) {
      case 'classic-bell':
        this.playClassicBell();
        this.triggerVibration([200]);
        break;
      case 'gentle-chime':
        this.playGentleChime();
        this.triggerVibration([150]);
        break;
      case 'urgent-alarm':
        this.playUrgentAlarm();
        this.triggerVibration([300, 100, 300]);
        break;
      case 'attention-alert':
        this.playAttentionAlert();
        this.triggerVibration([200, 100, 200]);
        break;
      case 'voice-announcement':
        this.speakAnnouncement(sampleStopName, '300 meters');
        this.triggerVibration([250]);
        break;
      case 'vibration-only':
        this.triggerVibration([400, 200, 400]);
        break;
    }
  }

  /**
   * Starts a continuous destination alert that plays for `durationSeconds` (default 30 seconds).
   * - Guarded against multiple executions (will not restart on repeated GPS updates).
   * - Vibrates periodically along with sound if device supports it.
   * - For voice announcements: speaks at the beginning, followed by repeating alert chime.
   * - Can be stopped manually at any time via `stopActiveAlarm()`.
   */
  public startContinuousDestinationAlert(options: {
    soundType: AlertSoundType;
    stopName: string;
    distanceStr: string;
    durationSeconds?: number;
    onTick?: (remainingSeconds: number) => void;
    onStop?: () => void;
  }): void {
    // Prevent re-triggering if already playing continuously
    if (this.isAlarmActive) {
      return;
    }

    const {
      soundType,
      stopName,
      distanceStr,
      durationSeconds = DEFAULT_ALARM_DURATION_SECONDS,
      onTick,
      onStop,
    } = options;

    this.isAlarmActive = true;
    this.activeSoundType = soundType;
    this.activeStopName = stopName;

    // 1. Show system notification immediately
    this.showSystemNotification(stopName, distanceStr);

    // 2. Play initial voice announcement or initial sound (loud path)
    if (soundType === 'voice-announcement') {
      this.speakAnnouncement(stopName, distanceStr);
    } else if (soundType !== 'vibration-only') {
      this.playSingleSound(soundType, true);
    }

    // 3. Initial device vibration (strong pattern to grab attention immediately)
    this.triggerVibration([500, 150, 500, 150, 700]);

    // 4. Set up repeating audio cadence during the alert window.
    // The loop always reads `this.activeSoundType` live, so calling
    // `setActiveSoundType()` mid-alarm changes what plays on the very next tick
    // without needing to restart the alert.
    this.scheduleSoundLoop(soundType);

    // 5. Set up repeating vibration cadence (tightened from 3s -> 2.2s, stronger pulses)
    this.vibrationIntervalId = setInterval(() => {
      if (!this.isAlarmActive) return;
      this.triggerVibration([500, 150, 500]);
    }, 2200);

    // 6. Countdown tracking
    let remaining = durationSeconds;
    onTick?.(remaining);

    this.countdownIntervalId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        this.stopActiveAlarm();
        onStop?.();
      } else {
        onTick?.(remaining);
      }
    }, 1000);

    // 7. Master timeout safety (stops after durationSeconds)
    this.masterTimeoutId = setTimeout(() => {
      this.stopActiveAlarm();
      onStop?.();
    }, durationSeconds * 1000);
  }

  /**
   * (Re)schedules the repeating audio cadence for the active alarm based on
   * the given tone. Clears any existing loop first, so it is safe to call
   * again mid-alarm (used by `setActiveSoundType`).
   * Cadence: urgent alarm every 0.9s; voice announcement chime every 2.2s
   * (after a delay so speech has room to finish); other tones every 1.4s.
   * Loud gain path is used throughout (`playSingleSound(type, true)`).
   */
  private scheduleSoundLoop(soundType: AlertSoundType): void {
    if (this.alarmIntervalId) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }

    if (soundType === 'vibration-only') return;

    const soundIntervalMs =
      soundType === 'urgent-alarm' ? 900 : soundType === 'voice-announcement' ? 2200 : 1400;
    const initialDelay = soundType === 'voice-announcement' ? 3000 : soundIntervalMs;

    const startLoop = () => {
      if (!this.isAlarmActive) return;
      this.alarmIntervalId = setInterval(() => {
        if (!this.isAlarmActive) return;
        this.playSingleSound(this.activeSoundType, true);
      }, soundIntervalMs);
    };

    if (soundType === 'voice-announcement') {
      setTimeout(startLoop, initialDelay);
    } else {
      startLoop();
    }
  }

  /**
   * Changes the tone used by an in-progress continuous destination alert
   * (e.g. when the user picks a different tone in the Journey settings
   * while the alarm is already sounding). Takes effect immediately: if the
   * new tone has a different repeat cadence than the previous one, the loop
   * is rescheduled at the new cadence; otherwise the next tick simply plays
   * the new tone. Has no effect if no alarm is currently active.
   */
  public setActiveSoundType(soundType: AlertSoundType): void {
    if (!this.isAlarmActive) return;
    if (this.activeSoundType === soundType) return;

    this.activeSoundType = soundType;

    if (soundType === 'voice-announcement') {
      this.speakAnnouncement(this.activeStopName);
    }

    // Cadence differs per tone, so restart the loop timer for the new tone.
    this.scheduleSoundLoop(soundType);
  }

  /**
   * Manually stops / dismisses the continuous alarm at any time.
   * Cancels all intervals, audio, speech, and vibrations.
   */
  public stopActiveAlarm(): void {
    this.isAlarmActive = false;

    if (this.alarmIntervalId) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }
    if (this.vibrationIntervalId) {
      clearInterval(this.vibrationIntervalId);
      this.vibrationIntervalId = null;
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    if (this.masterTimeoutId) {
      clearTimeout(this.masterTimeoutId);
      this.masterTimeoutId = null;
    }

    // Cancel speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    // Cancel vibration immediately
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  }

  public getIsAlarmActive(): boolean {
    return this.isAlarmActive;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.isAlarmActive) {
      // Mute active speech and audio immediately
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const alertManager = new AlertManager();
