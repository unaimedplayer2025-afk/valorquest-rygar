// WebAudio SFX + John's tracks (OGG with MP3 fallback via canPlayType).
// First user gesture calls Snd.start() to unlock playback. M toggles mute.
//
// Title:    audio/title-theme.{ogg,mp3}  — from /workspace/wadget/audio/title-theme
// Gameplay: audio/gameplay.{ogg,mp3}     — from /workspace/wadget/audio/gameplay
const Snd = {
  ctx: null, muted: false, ready: false, unlocked: false,
  titleAud: null, gameAud: null, musicMode: 'title',
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } else {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    this.ready = !!this.ctx;
    this.unlocked = true;
    this._makeTracks();
    this._kickMusic();
  },
  _pick(base) {
    const a = document.createElement('audio');
    const ogg = a.canPlayType('audio/ogg; codecs="vorbis"') || a.canPlayType('audio/ogg; codecs="opus"');
    return ogg ? base + '.ogg' : base + '.mp3';
  },
  _makeTracks() {
    if (this.titleAud) return;
    const make = (base) => {
      const a = new Audio(this._pick(base));
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0;
      return a;
    };
    this.titleAud = make('audio/title-theme');
    this.gameAud = make('audio/gameplay');
  },
  setScene(mode) {
    this.musicMode = (mode === 'title' || mode === 'end') ? 'title' : 'game';
  },
  _kickMusic() {
    if (!this.unlocked || this.muted) return;
    const a = this.musicMode === 'title' ? this.titleAud : this.gameAud;
    if (a && a.paused) {
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    }
  },
  update(dt) {
    if (!this.titleAud) return;
    const fade = 1.4;
    const tracks = [
      [this.titleAud, this.musicMode === 'title' ? 0.46 : 0],
      [this.gameAud, this.musicMode === 'game' ? 0.42 : 0],
    ];
    for (const [a, vol] of tracks) {
      const target = (!this.muted && this.unlocked) ? vol : 0;
      if (a.volume < target) a.volume = Math.min(target, a.volume + dt * fade * Math.max(target, 0.4));
      else if (a.volume > target) a.volume = Math.max(target, a.volume - dt * fade * 0.5);
      if (target > 0.01 && a.paused && this.unlocked && !this.muted) {
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
      }
      if (target <= 0 && a.volume < 0.02 && !a.paused) a.pause();
    }
  },
  setMuted(m) {
    this.muted = m;
    if (m) {
      if (this.titleAud) this.titleAud.pause();
      if (this.gameAud) this.gameAud.pause();
    } else {
      if (!this.unlocked) this.start();
      else this._kickMusic();
    }
  },
  toggleMute() { this.setMuted(!this.muted); return this.muted; },
  _out() { if (!this.ctx || this.muted) return null; if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
  tone(freq, dur, type = 'square', vol = 0.08, slide = 0) {
    const c = this._out(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur + 0.02);
  },
  noise(dur, vol = 0.1, freq = 800, type = 'lowpass') {
    const c = this._out(); if (!c) return;
    const n = c.createBufferSource(), buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    n.connect(f); f.connect(g); g.connect(c.destination); n.start();
  },
  throw() { this.noise(0.16, 0.12, 2400, 'bandpass'); this.tone(280, 0.16, 'sawtooth', 0.05, 900); },
  hit() { this.noise(0.1, 0.16, 900, 'lowpass'); this.tone(180, 0.12, 'square', 0.07, 60); },
  jump() { this.tone(420, 0.12, 'square', 0.05, 220); },
  hurt() { this.tone(260, 0.25, 'sawtooth', 0.1, 70); this.noise(0.12, 0.12, 600); },
  die() { this.tone(300, 0.7, 'sawtooth', 0.12, 40); this.noise(0.4, 0.16, 400, 'lowpass'); },
  win() { this.tone(440, 0.2, 'square', 0.08); setTimeout(() => this.tone(660, 0.25, 'square', 0.08), 160); setTimeout(() => this.tone(880, 0.4, 'square', 0.08), 320); },
  pickup() { this.tone(880, 0.1, 'square', 0.06, 1400); },
  land() { this.noise(0.06, 0.07, 300, 'lowpass'); },
  fanfare() { this.tone(110, 0.5, 'sawtooth', 0.08, 50); this.noise(0.3, 0.1, 400); },
  roar() { this.noise(0.8, 0.22, 400, 'lowpass'); this.tone(70, 0.9, 'sawtooth', 0.14, 30); },
  dash() { this.noise(0.12, 0.14, 1200, 'bandpass'); this.tone(220, 0.12, 'sawtooth', 0.06, 80); },
  charge() { this.tone(180, 0.08, 'square', 0.03, 600); },
  catch() { this.tone(720, 0.1, 'square', 0.07, 1400); this.noise(0.06, 0.08, 2000, 'highpass'); },
  spark() { this.noise(0.08, 0.12, 1800, 'bandpass'); },
  fly() { this.noise(0.08, 0.04, 500, 'lowpass'); },
  chomp() { this.noise(0.22, 0.22, 500, 'lowpass'); this.tone(90, 0.22, 'sawtooth', 0.14, 40); this.tone(180, 0.12, 'square', 0.06, 70); },
  gulp() { this.tone(140, 0.2, 'sine', 0.08, 60); this.noise(0.12, 0.08, 300, 'lowpass'); },
};
export default Snd;
