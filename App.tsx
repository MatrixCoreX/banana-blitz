
import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, GameState, Language } from './types';

// Constants
const STROKE_THRESHOLD = 0.06; 
const MAX_LEVEL = 12; 
const MOSAIC_SIZE = 12; 

declare const Hands: any;
declare const FaceDetection: any;
declare const Camera: any;

// Audio System Class
class GameAudio {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, fadeOut = true) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    if (fadeOut) {
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playStroke() {
    if (!this.ctx) return;
    this.playTone(150 + Math.random() * 50, 'sine', 0.1, 0.3);
    this.playTone(300, 'triangle', 0.05, 0.1);
  }

  playLevelClear() {
    if (!this.ctx) return;
    [440, 554, 659, 880].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.4, 0.15), i * 100);
    });
  }

  playFailure() {
    if (!this.ctx) return;
    [200, 150, 100].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.6, 0.1), i * 200);
    });
  }

  playVictory() {
    if (!this.ctx) return;
    [523, 659, 783, 1046].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.5, 0.05), i * 150);
    });
  }
}

const audioManager = new GameAudio();

const translations = {
  en: {
    title: "BANANA BLITZ",
    protocol: "Neuro-Mechanical Peeling Protocol",
    level: "Level",
    time: "Time",
    score: "Score",
    sensorsActive: "SENSORS ACTIVE",
    searching: "SEARCHING...",
    peelIntegrity: "Peel Integrity",
    initialize: "INITIALIZE PROTOCOL",
    instruction: "Grip tight and move UP & DOWN fast.",
    auth: "CLICK TO START",
    privacy: "Processing occurs locally. No video data is uploaded.",
    ready: "READY",
    levelClear: "LEVEL CLEAR",
    exceeded: "Exceeded minimum requirements.",
    nextLevel: "Next Level",
    godlike: "GODLIKE",
    finished: "Protocol fully completed. Peak efficiency.",
    failed: "FAILED",
    inadequate: "Inadequate performance. Protocol terminated.",
    reinit: "Re-Initialize",
    gripStatus: "Grip Status",
    locked: "LOCKED",
    open: "OPEN",
    kinetics: "Kinetics",
    latency: "LATENCY",
    perfect: "PERFECT PEEL!",
    victory: "VICTORY",
    mosaicOn: "MOSAIC ON",
    mosaicOff: "MOSAIC OFF",
    target: "TARGET: {n} STROKES",
    timeTaken: "CLEAR TIME: {s}s",
    selectLevel: "SELECT PROTOCOL LEVEL",
    stop: "ABORT PROTOCOL",
    special: "SPECIAL",
    marathon: "ULTRA"
  },
  zh: {
    title: "香蕉大作战",
    protocol: "神经机械剥皮协议",
    level: "等级",
    time: "时间",
    score: "分数",
    sensorsActive: "传感器已激活",
    searching: "正在搜索...",
    peelIntegrity: "果皮完整度",
    initialize: "初始化协议",
    instruction: "握紧拳头，快速上下挥动。",
    auth: "点击开始",
    privacy: "系统使用训练好的模块在本地运行，不会上传你的视频",
    ready: "准备",
    levelClear: "关卡完成",
    exceeded: "你很棒！",
    nextLevel: "下一关",
    godlike: "任务达成",
    finished: "协议完全执行。极致效率！",
    failed: "失败",
    inadequate: "性能不足。协议终止。",
    reinit: "重新初始化",
    gripStatus: "握紧状态",
    locked: "锁定",
    open: "未握紧",
    kinetics: "动力感应",
    latency: "延迟",
    perfect: "完美剥离！",
    victory: "通关成功",
    mosaicOn: "马赛克: 开启",
    mosaicOff: "马赛克: 关闭",
    target: "目标: {n} 次挥动",
    timeTaken: "完成用时: {s} 秒",
    selectLevel: "选择协议等级",
    stop: "中止协议",
    special: "特殊挑战",
    marathon: "极限挑战"
  }
};

const BananaVisual: React.FC<{ progress: number; lang: Language }> = ({ progress, lang }) => {
  const isFullyPeeled = progress >= 100;
  const peelVal = Math.min(progress / 100, 1);
  const t = translations[lang];
  
  return (
    <div className="relative w-full h-full max-h-[400px] md:max-h-[600px] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-yellow-400/5 blur-[80px] rounded-full transition-opacity duration-700 ${progress > 0 ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: `scale(${0.6 + peelVal * 0.4})` }}
      />
      
      <svg viewBox="0 0 400 600" className="w-auto h-full max-w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-10 overflow-visible animate-float">
        <defs>
          <linearGradient id="bananaSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#fef08a', stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: '#facc15', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#a16207', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="bananaFruit" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#fffef0', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#fef9c3', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="peelShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        <path 
          d="M200,50 C280,80 320,250 280,450 C260,550 210,560 180,550 C160,540 160,500 180,480 C210,400 240,150 200,50 Z" 
          fill="url(#bananaFruit)" 
          style={{ transition: 'opacity 0.2s ease-out' }}
        />

        {!isFullyPeeled && (
          <>
            <g style={{ transform: `rotate(${peelVal * 105}deg) translate(${peelVal * 115}px, ${peelVal * -65}px)`, transformOrigin: '280px 450px', transition: 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)' }}>
               <path d="M200,50 C280,80 320,250 280,450 L180,550 C240,500 230,200 200,50 Z" fill="#eab308" filter="url(#peelShadow)" />
            </g>
            <g style={{ transform: `rotate(${-peelVal * 125}deg) translate(${-peelVal * 135}px, ${peelVal * 65}px)`, transformOrigin: '180px 550px', transition: 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)' }}>
               <path d="M200,50 C210,150 180,450 180,550 L195,565 C160,500 170,100 200,50 Z" fill="#facc15" filter="url(#peelShadow)" />
            </g>
            <g style={{ transform: `scaleY(${Math.max(0, 1 - peelVal * 1.6)}) translateY(${peelVal * 230}px)`, transformOrigin: '180px 550px', transition: 'transform 0.2s ease-out', opacity: 1 - peelVal }}>
               <path d="M185,50 C300,100 280,400 200,550 L170,540 C220,400 220,100 185,50 Z" fill="url(#bananaSkin)" filter="url(#peelShadow)" />
            </g>
            <path d="M180,550 Q195,585 185,605 Q175,615 170,605 L165,550 Z" fill="#422006" />
          </>
        )}

        {isFullyPeeled && (
          <g className="animate-pulse">
            <circle cx="250" cy="150" r="5" fill="white" />
            <circle cx="280" cy="220" r="3" fill="white" />
            <circle cx="220" cy="100" r="4" fill="white" />
            <circle cx="200" cy="180" r="2.5" fill="white" />
          </g>
        )}
      </svg>

      {isFullyPeeled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-yellow-400 text-slate-950 px-6 py-3 md:px-10 md:py-5 rounded-3xl font-black text-2xl md:text-5xl italic tracking-tighter animate-bounce shadow-2xl border-4 border-white rotate-[-3deg]">
            {t.perfect}
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const browserLang = navigator.language.toLowerCase();
    const defaultLang: Language = browserLang.startsWith('zh') ? 'zh' : 'en';
    return {
      score: 0,
      timeLeft: 60,
      status: GameStatus.IDLE,
      level: 1,
      language: defaultLang
    };
  });
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isFist, setIsFist] = useState(false);
  const [mosaicActive, setMosaicActive] = useState(true);
  const [levelClearTime, setLevelClearTime] = useState<number | null>(null);
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  
  // Refs for logic to avoid race conditions with MediaPipe/WASM
  const gameStateRef = useRef<GameState>(gameState);
  const isDestroyedRef = useRef(false);
  const lastYRef = useRef<number | null>(null);
  const motionStateRef = useRef<'UP' | 'DOWN' | 'IDLE'>('IDLE');
  const travelDistRef = useRef<number>(0);
  const faceResultsRef = useRef<any[]>([]);
  const mosaicActiveRef = useRef(true);
  const initialTimeForLevelRef = useRef<number>(60);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    mosaicActiveRef.current = mosaicActive;
  }, [mosaicActive]);

  const t = translations[gameState.language];
  const currentGoal = gameState.level === 11 ? 500 : gameState.level === 12 ? 1000 : Math.min(gameState.level * 10, 100);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    isDestroyedRef.current = false;

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    
    hands.onResults((results: any) => {
      if (isDestroyedRef.current) return;
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setIsHandDetected(true);
        const landmarks = results.multiHandLandmarks[0];
        const tips = [8, 12, 16, 20], mcps = [5, 9, 13, 17];
        let curled = 0;
        for (let i = 0; i < tips.length; i++) if (landmarks[tips[i]].y > landmarks[mcps[i]].y) curled++;
        const fist = curled >= 3;
        setIsFist(fist);
        if (fist && gameStateRef.current.status === GameStatus.PLAYING) {
          const currentY = landmarks[0].y;
          if (lastYRef.current !== null) {
            const deltaY = currentY - lastYRef.current;
            if (Math.abs(deltaY) > 0.001) {
              const dir = deltaY > 0 ? 'DOWN' : 'UP';
              if (motionStateRef.current === 'IDLE') motionStateRef.current = dir;
              else if (motionStateRef.current !== dir) {
                if (travelDistRef.current > STROKE_THRESHOLD) {
                  audioManager.playStroke();
                  setGameState(prev => {
                    const goal = prev.level === 11 ? 500 : prev.level === 12 ? 1000 : Math.min(prev.level * 10, 100);
                    const nextScore = Math.min(prev.score + 1, goal);
                    return { ...prev, score: nextScore };
                  });
                }
                motionStateRef.current = dir;
                travelDistRef.current = 0;
              }
              travelDistRef.current += Math.abs(deltaY);
            }
          }
          lastYRef.current = currentY;
        }
      } else { setIsHandDetected(false); setIsFist(false); }
    });

    const faceDetection = new FaceDetection({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });
    faceDetection.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
    faceDetection.onResults((results: any) => {
      if (isDestroyedRef.current) return;
      faceResultsRef.current = results.detections || [];
    });

    const ctx = canvasRef.current.getContext('2d');
    let animationFrameId: number;

    const drawMosaic = () => {
      if (isDestroyedRef.current || !ctx || !videoRef.current || !canvasRef.current) return;
      
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      ctx.restore();

      if (mosaicActiveRef.current) {
        faceResultsRef.current.forEach((detection) => {
          const bbox = detection.boundingBox;
          const bufferTop = 0.35; 
          const originalW = bbox.width * width;
          const originalH = bbox.height * height;
          const expandedH = originalH * (1 + bufferTop + 0.1);
          const expandedW = originalW * 1.25; 
          const x = (1 - bbox.xCenter - bbox.width / 2) * width - (expandedW - originalW) / 2;
          const y = (bbox.yCenter - bbox.height / 2) * height - (originalH * bufferTop);

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = MOSAIC_SIZE;
          tempCanvas.height = MOSAIC_SIZE;
          const tctx = tempCanvas.getContext('2d');
          if (tctx && canvasRef.current) {
            tctx.drawImage(canvasRef.current, x, y, expandedW, expandedH, 0, 0, MOSAIC_SIZE, MOSAIC_SIZE);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tempCanvas, 0, 0, MOSAIC_SIZE, MOSAIC_SIZE, x, y, expandedW, expandedH);
            ctx.imageSmoothingEnabled = true;
          }
        });
      }
      animationFrameId = requestAnimationFrame(drawMosaic);
    };

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (!isDestroyedRef.current && videoRef.current) {
          try {
            await hands.send({ image: videoRef.current });
            await faceDetection.send({ image: videoRef.current });
          } catch (e) {
            console.error("MediaPipe send error:", e);
          }
        }
      },
      width: 640, height: 480
    });
    
    camera.start().then(() => {
      if (!isDestroyedRef.current) drawMosaic();
    });

    return () => { 
      isDestroyedRef.current = true;
      camera.stop(); 
      cancelAnimationFrame(animationFrameId);
      // Wait a tick before closing to allow any in-flight WASM calls to finish
      setTimeout(() => {
        hands.close(); 
        faceDetection.close();
      }, 100);
    };
    // Re-setup only on mount to prevent frequent "deleted object" errors
  }, []);

  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && gameState.score >= currentGoal) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      const duration = initialTimeForLevelRef.current - gameState.timeLeft;
      setLevelClearTime(duration);
      if (gameState.level >= MAX_LEVEL) {
        audioManager.playVictory();
        setGameState(prev => ({ ...prev, status: GameStatus.FINISHED }));
      } else {
        audioManager.playLevelClear();
        setGameState(prev => ({ ...prev, status: GameStatus.LEVEL_COMPLETE }));
      }
    } else if (gameState.status === GameStatus.FINISHED && gameState.score < currentGoal) {
      audioManager.playFailure();
    }
  }, [gameState.score, currentGoal, gameState.level, gameState.status, gameState.timeLeft]);

  const toggleLanguage = () => {
    setGameState(prev => ({ ...prev, language: prev.language === 'zh' ? 'en' : 'zh' }));
  };

  const startGame = () => {
    audioManager.init();
    initialTimeForLevelRef.current = 60;
    setGameState(prev => ({ ...prev, score: 0, timeLeft: 60, status: GameStatus.STARTING, level: 1 }));
    setLevelClearTime(null);
    setIsLevelSelectorOpen(false);
    startCountdown();
  };

  const selectLevelManually = (level: number) => {
    audioManager.init();
    let timeLimit = level * 60;
    if (level === 11) timeLimit = 600;
    if (level === 12) timeLimit = 1200;
    initialTimeForLevelRef.current = timeLimit;
    setGameState(prev => ({ ...prev, score: 0, timeLeft: timeLimit, status: GameStatus.STARTING, level }));
    setLevelClearTime(null);
    setIsLevelSelectorOpen(false);
    startCountdown();
  };

  const stopGame = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    setGameState(prev => ({ ...prev, status: GameStatus.IDLE, score: 0 }));
    setLevelClearTime(null);
    lastYRef.current = null;
    motionStateRef.current = 'IDLE';
    travelDistRef.current = 0;
  };

  const nextLevel = () => {
    const nextLvl = gameState.level + 1;
    let nextTime = nextLvl * 60;
    if (nextLvl === 11) nextTime = 600;
    if (nextLvl === 12) nextTime = 1200;
    initialTimeForLevelRef.current = nextTime;
    setGameState(prev => ({ ...prev, score: 0, timeLeft: nextTime, status: GameStatus.STARTING, level: nextLvl }));
    setLevelClearTime(null);
    startCountdown();
  };

  const startCountdown = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    let countdownValue = 3;
    countdownRef.current = window.setInterval(() => {
      countdownValue -= 1;
      if (countdownValue <= 0) {
        if (countdownRef.current) window.clearInterval(countdownRef.current);
        setGameState(prev => ({ ...prev, status: GameStatus.PLAYING }));
        startTimer();
      }
    }, 1000);
  };

  const startTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return { ...prev, timeLeft: 0, status: GameStatus.FINISHED };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  const progressPercentage = (gameState.score / currentGoal) * 100;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden p-2 md:p-6 font-sans">
      {isLevelSelectorOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-400/10 blur-[80px] rounded-full" />
             <div className="relative z-10 text-center">
                <h3 className="text-xl md:text-3xl font-black italic tracking-tighter text-yellow-400 mb-8 uppercase">{t.selectLevel}</h3>
                <div className="grid grid-cols-5 gap-3 mb-8">
                   {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
                     <button key={lvl} onClick={() => selectLevelManually(lvl)} className={`aspect-square flex items-center justify-center rounded-2xl font-black text-xl md:text-2xl transition-all border-2 ${gameState.level === lvl ? 'bg-yellow-400 text-slate-950 border-white shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'bg-slate-800 text-white border-white/5 hover:bg-slate-700 active:scale-90'}`}>{lvl}</button>
                   ))}
                </div>
                <div className="flex flex-col gap-3">
                   <button onClick={() => selectLevelManually(11)} className={`w-full py-4 flex items-center justify-center rounded-2xl font-black transition-all border-2 ${gameState.level === 11 ? 'bg-orange-500 text-white border-white' : 'bg-slate-800 text-orange-400 border-orange-500/20 hover:bg-slate-700'}`}>
                     <span className="text-xs uppercase mr-3 opacity-60 tracking-widest">{t.special}</span>
                     <span className="text-2xl">500</span>
                   </button>
                   <button onClick={() => selectLevelManually(12)} className={`w-full py-4 flex items-center justify-center rounded-2xl font-black transition-all border-2 ${gameState.level === 12 ? 'bg-red-600 text-white border-white shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 'bg-slate-800 text-red-500 border-red-600/20 hover:bg-slate-700'}`}>
                     <span className="text-xs uppercase mr-3 opacity-60 tracking-widest">{t.marathon}</span>
                     <span className="text-2xl">1000</span>
                   </button>
                </div>
                <button onClick={() => setIsLevelSelectorOpen(false)} className="mt-8 w-full py-4 bg-slate-800 text-white/30 font-black rounded-2xl hover:text-white transition-colors uppercase text-[10px] tracking-widest">CANCEL / 关闭</button>
             </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center z-30 mb-2 md:mb-6">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-yellow-400 rounded-xl md:rounded-2xl rotate-12 flex items-center justify-center border-2 border-white/40 shadow-[0_0_20px_rgba(250,204,21,0.3)] select-none">
             <span className="text-xl md:text-3xl font-black text-slate-950">B</span>
             <span className="text-lg md:text-2xl font-black text-slate-950 -ml-1">B</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl md:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-600 uppercase leading-none pr-4">{t.title}</h1>
            <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest">{t.protocol} {gameState.level > 10 ? (gameState.level === 11 ? 'S-500' : 'U-1000') : gameState.level}</p>
          </div>
        </div>
        <div className="flex gap-1 md:gap-3 items-center">
          <div className="flex gap-1 md:gap-2 bg-slate-900/50 p-1 rounded-xl md:rounded-2xl border border-white/5 mr-1 md:mr-2">
            <button onClick={() => setMosaicActive(!mosaicActive)} className={`px-3 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all ${mosaicActive ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{mosaicActive ? t.mosaicOn : t.mosaicOff}</button>
            <button onClick={toggleLanguage} className="px-3 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-slate-800 text-white text-[10px] md:text-xs font-black border border-white/5 hover:bg-slate-700 transition-all uppercase whitespace-nowrap">{gameState.language === 'zh' ? 'EN' : '中文'}</button>
          </div>
          <button onClick={() => setIsLevelSelectorOpen(true)} className="group bg-slate-900/80 backdrop-blur px-2 py-1 md:px-5 md:py-2 rounded-xl border border-white/5 flex flex-col items-center min-w-[50px] md:min-w-[70px] hover:border-yellow-400/50 transition-all active:scale-95">
            <span className="text-[7px] md:text-[8px] uppercase font-bold text-slate-500 group-hover:text-yellow-400 transition-colors">{t.level}</span>
            <span className="text-sm md:text-xl font-black group-hover:text-yellow-400 transition-colors">{gameState.level > 10 ? 'S' : gameState.level}</span>
          </button>
          <div className="bg-slate-900/80 backdrop-blur px-2 py-1 md:px-5 md:py-2 rounded-xl border border-white/5 flex flex-col items-center min-w-[60px] md:min-w-[80px]">
            <span className="text-[7px] md:text-[8px] uppercase font-bold text-slate-500">{t.time}</span>
            <span className={`text-sm md:text-xl font-mono font-black ${gameState.timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>{gameState.timeLeft}s</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur px-2 py-1 md:px-5 md:py-2 rounded-xl border border-white/5 flex flex-col items-center min-w-[70px] md:min-w-[90px]">
            <span className="text-[7px] md:text-[8px] uppercase font-bold text-slate-500">{t.score}</span>
            <span className="text-sm md:text-xl font-mono font-black">{gameState.score}/{currentGoal}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 relative min-h-0">
        <div className="flex-[1.2] flex flex-col bg-slate-900/30 rounded-[2rem] border border-white/5 relative overflow-hidden p-4">
          <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
             <div className={`w-2 h-2 rounded-full ${isHandDetected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{isHandDetected ? t.sensorsActive : t.searching}</span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0">
            <BananaVisual progress={progressPercentage} lang={gameState.language} />
          </div>
          <div className="w-full max-w-sm mx-auto z-20 pb-4">
            <div className="flex justify-between mb-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <span>{t.peelIntegrity}</span>
              <span className="text-yellow-400">{Math.floor(progressPercentage)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-[2px] border border-white/5 shadow-inner">
              <div className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-white rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
        </div>
        <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900 shadow-2xl min-h-[180px] md:min-h-0">
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale blur-[1px]" width={640} height={480} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
          {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30">
              <h2 className="text-3xl md:text-5xl font-black text-yellow-400 italic mb-4 leading-tight uppercase">{t.initialize}</h2>
              <div className="max-w-md bg-slate-950/60 backdrop-blur-md p-6 rounded-3xl border border-yellow-400/20 shadow-2xl mb-8 transform hover:scale-105 transition-transform">
                <p className="text-sm md:text-xl text-yellow-100 font-black uppercase tracking-widest leading-relaxed">{t.instruction}</p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button onClick={startGame} className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-yellow-400 transition-all uppercase tracking-widest text-sm shadow-xl active:scale-95">{t.auth}</button>
                <p className="text-[10px] text-white/40 font-bold px-4 uppercase tracking-tighter leading-tight">{t.privacy}</p>
                <button onClick={() => setIsLevelSelectorOpen(true)} className="mt-2 w-full py-3 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] border border-white/5 active:scale-95">{t.selectLevel}</button>
              </div>
            </div>
          )}
          {(gameState.status === GameStatus.STARTING || gameState.status === GameStatus.PLAYING) && (
            <div className="absolute top-6 right-6 z-40">
               <button onClick={stopGame} className="px-6 py-2 bg-red-600/20 hover:bg-red-600 border border-red-600/50 text-white font-black text-[10px] uppercase rounded-full transition-all backdrop-blur shadow-lg active:scale-95">{t.stop}</button>
            </div>
          )}
          {gameState.status === GameStatus.STARTING && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-slate-950/40 backdrop-blur-sm text-center">
               <div className="text-yellow-400 text-2xl md:text-4xl font-black italic mb-2 uppercase tracking-tight">{t.target.replace('{n}', currentGoal.toString())}</div>
               <div className="text-8xl font-black text-white italic animate-pulse tracking-tighter">{t.ready}</div>
            </div>
          )}
          {gameState.status === GameStatus.LEVEL_COMPLETE && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl z-40 text-center">
              <div className="text-yellow-400 text-6xl mb-4 animate-bounce">✨</div>
              <h2 className="text-4xl font-black italic mb-2 tracking-tighter uppercase">{t.levelClear}</h2>
              <div className="mb-8 p-4 bg-slate-900 rounded-2xl border border-white/5 shadow-xl">
                 <p className="text-yellow-400 text-2xl font-black italic">{t.timeTaken.replace('{s}', (levelClearTime || 0).toString())}</p>
              </div>
              <p className="text-slate-400 text-xs mb-8 uppercase font-bold tracking-[0.3em]">{t.exceeded}</p>
              <button onClick={nextLevel} className="w-full max-w-xs py-4 bg-yellow-400 text-slate-950 font-black rounded-2xl hover:scale-105 transition-all uppercase text-sm shadow-[0_0_30px_rgba(250,204,21,0.4)]">{t.nextLevel}</button>
            </div>
          )}
          {gameState.status === GameStatus.FINISHED && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/95 overflow-hidden ${gameState.score >= currentGoal ? 'animate-screen-shake' : ''}`}>
                <div className="text-center">
                  <div className={`text-8xl mb-4 ${gameState.score >= currentGoal ? 'animate-bounce' : ''}`}>{gameState.score >= currentGoal ? '🏆' : '❌'}</div>
                  <h2 className={`text-5xl font-black italic mb-4 tracking-tighter ${gameState.score >= currentGoal ? 'text-yellow-400' : 'text-red-500'}`}>{gameState.score >= currentGoal ? t.victory : t.failed}</h2>
                  {gameState.score >= currentGoal && (
                    <div className="mb-6 p-4 bg-slate-900 rounded-2xl border border-yellow-400/20 shadow-xl"><p className="text-yellow-400 text-2xl font-black italic">{t.timeTaken.replace('{s}', (levelClearTime || 0).toString())}</p></div>
                  )}
                  <p className="text-slate-400 text-xs mb-8 font-bold tracking-widest">{gameState.score >= currentGoal ? t.finished : t.inadequate}</p>
                  <button onClick={startGame} className="w-full max-w-xs py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-yellow-400 transition-all uppercase text-sm shadow-xl active:scale-95">{t.reinit}</button>
                </div>
            </div>
          )}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
             <div className="flex flex-col gap-1">
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">{t.gripStatus}</div>
                <div className={`text-xs font-black italic ${isFist ? 'text-yellow-400' : 'text-slate-600'}`}>{isFist ? t.locked : t.open}</div>
             </div>
             <div className="flex flex-col items-end gap-1">
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">{t.kinetics}</div>
                <div className="text-xs font-black italic text-white/80">{Math.floor(travelDistRef.current * 100)}% AMP</div>
             </div>
          </div>
        </div>
      </div>
      <div className="py-2 flex justify-between items-center text-slate-800 text-[8px] font-black uppercase tracking-[0.4em] opacity-40">
        <span>{t.latency}: 0.8ms</span>
        <span>© 2025 HYPERPEEL DYNAMICS // V2.2</span>
      </div>
    </div>
  );
};

export default App;