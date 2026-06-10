import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Sparkles, QrCode, Award, Info } from 'lucide-react';
import { UserSession, MerchantConfig } from '../types';
import { MiCafecitoLogo } from './MiCafecitoLogo';

interface CustomerCardProps {
  session: UserSession;
  config: MerchantConfig;
  onReset?: () => void;
}

interface CardTheme {
  id: string;
  name: string;
  buttonClass: string;
  frontGradient: string;
  backGradient: string;
  stampGradient: string;
  textColor: string;
  badgeClass: string;
  logoBg: string;
  activeDot: string;
  scannerLine: string;
}

const THEMES: CardTheme[] = [
  {
    id: 'emerald',
    name: 'Esmeralda',
    buttonClass: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    frontGradient: 'from-emerald-800 via-emerald-950 to-slate-900 border-emerald-550/20',
    backGradient: 'from-slate-900 via-slate-950 to-emerald-950 border-slate-800/60',
    stampGradient: 'from-emerald-300 to-teal-400 text-emerald-950 shadow-[0_0_12px_rgba(52,211,153,0.35)]',
    textColor: 'text-emerald-300',
    badgeClass: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
    logoBg: 'bg-emerald-600',
    activeDot: 'bg-emerald-400',
    scannerLine: 'bg-emerald-500'
  },
  {
    id: 'sapphire',
    name: 'Zafiro',
    buttonClass: 'bg-gradient-to-br from-sky-500 to-blue-700',
    frontGradient: 'from-blue-800 via-blue-950 to-slate-900 border-blue-500/20',
    backGradient: 'from-slate-900 via-slate-950 to-blue-950 border-slate-800/60',
    stampGradient: 'from-blue-300 to-sky-400 text-blue-950 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
    textColor: 'text-blue-300',
    badgeClass: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
    logoBg: 'bg-blue-600',
    activeDot: 'bg-blue-400',
    scannerLine: 'bg-blue-500'
  },
  {
    id: 'amethyst',
    name: 'Amatista',
    buttonClass: 'bg-gradient-to-br from-purple-500 to-fuchsia-700',
    frontGradient: 'from-purple-800 via-purple-950 to-slate-900 border-purple-500/20',
    backGradient: 'from-slate-900 via-slate-950 to-purple-950 border-slate-800/60',
    stampGradient: 'from-purple-300 to-fuchsia-450 text-purple-950 shadow-[0_0_12px_rgba(232,121,249,0.35)]',
    textColor: 'text-purple-300',
    badgeClass: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
    logoBg: 'bg-purple-600',
    activeDot: 'bg-purple-400',
    scannerLine: 'bg-purple-500'
  },
  {
    id: 'gold',
    name: 'Oro',
    buttonClass: 'bg-gradient-to-br from-amber-400 to-yellow-600',
    frontGradient: 'from-amber-700 via-amber-950 to-stone-900 border-amber-550/20',
    backGradient: 'from-stone-900 via-stone-950 to-amber-950 border-stone-850/60',
    stampGradient: 'from-amber-200 to-yellow-400 text-amber-950 shadow-[0_0_12px_rgba(250,204,21,0.35)]',
    textColor: 'text-amber-300',
    badgeClass: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
    logoBg: 'bg-amber-650',
    activeDot: 'bg-amber-400',
    scannerLine: 'bg-amber-550'
  },
  {
    id: 'ruby',
    name: 'Rubí',
    buttonClass: 'bg-gradient-to-br from-rose-500 to-red-700',
    frontGradient: 'from-rose-800 via-rose-950 to-zinc-900 border-rose-500/20',
    backGradient: 'from-zinc-900 via-zinc-950 to-rose-950 border-zinc-805/60',
    stampGradient: 'from-rose-300 to-orange-400 text-rose-950 shadow-[0_0_12px_rgba(251,113,133,0.35)]',
    textColor: 'text-rose-300',
    badgeClass: 'bg-rose-500/20 border-rose-400/40 text-rose-300',
    logoBg: 'bg-rose-600',
    activeDot: 'bg-rose-400',
    scannerLine: 'bg-rose-500'
  }
];

export default function CustomerCard({ session, config }: CustomerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  // Initialize theme from localStorage keyed to the session folio/ID
  const storageKey = session?.folio || session?.id ? `customer_card_theme_${session.folio || session.id}` : 'customer_card_theme_default';
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem(storageKey) || 'emerald';
  });

  const currentTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];
  
  // Create an array for the stamps (e.g., length config.stampsRequired)
  const stampIndices = Array.from({ length: config.stampsRequired });
  const filledCount = session.currentStamps;
  const progressPercent = (filledCount / config.stampsRequired) * 100;

  const handleToggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Help text */}
      <p className="text-xs text-slate-500 mb-3.5 flex items-center gap-1.5 font-sans leading-none">
        <Info size={13} className="text-[#149b8f]" />
        Haz clic en la tarjeta para cambiar de vista (Frontal / Reverso)
      </p>

      {/* 3D Card Container */}
      <div 
        id="loyalty-card-wrapper"
        className="w-full h-[240px] perspective-1000 cursor-pointer relative select-none"
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-full h-full relative preserve-3d"
        >
          {/* CARD FRONT */}
          <div 
            onClick={handleToggleFlip}
            className={`absolute inset-0 w-full h-full rounded-3xl p-5 bg-gradient-to-br ${currentTheme.frontGradient} text-white shadow-xl border flex flex-col justify-between backface-hidden transition-all duration-300 ${isFlipped ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-10'}`}
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {/* Card Glare & Pattern Overlay */}
            <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header info */}
            <div className="flex justify-between items-start z-10 text-left">
              <div>
                <p className={`text-[9px] uppercase tracking-widest ${currentTheme.textColor} font-mono font-black`}>Club Frecuente</p>
                <h3 className="text-base font-sans font-black tracking-tight mt-0.5 text-white truncate max-w-[180px]">{config.shopName}</h3>
              </div>
              <div className={`${currentTheme.badgeClass} rounded-xl px-2.5 py-1 text-xs font-mono font-black flex items-center gap-1 shrink-0`}>
                <Award size={13} />
                {session.points} PTS
              </div>
            </div>

            {/* Grid of Stamps */}
            <div className="my-1.5 z-10">
              <div className="grid grid-cols-4 gap-3 justify-items-center">
                {stampIndices.map((_, index) => {
                  const isStamped = index < filledCount;
                  return (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={isStamped ? { scale: [1, 1.2, 1], rotate: [0, 10, -5, 0] } : {}}
                      className={`relative w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
                        isStamped 
                          ? `bg-gradient-to-br ${currentTheme.stampGradient} border-white`
                          : 'bg-white/10 border-white/15 hover:border-white/25 text-white/50'
                      }`}
                    >
                      {isStamped ? (
                        <Coffee className="text-slate-900 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" size={20} />
                      ) : (
                        <span className="text-white/45 font-mono text-xs font-bold">{index + 1}</span>
                      )}

                      {/* Sparkle overlay on latest stamped stamp */}
                      {index === filledCount - 1 && isStamped && (
                        <motion.div 
                          animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute -top-1 -right-1 text-amber-200"
                        >
                          <Sparkles size={11} fill="currentColor" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Progress indicator */}
            <div className="z-10 mt-1 text-left">
              <div className="flex justify-between text-[9.5px] font-mono mb-1">
                <span className="text-white/80 uppercase font-bold truncate max-w-[200px]">Premio: {config.mainRewardTitle}</span>
                <span className={`${currentTheme.textColor} font-black`}>{filledCount} / {config.stampsRequired} SELLOS</span>
              </div>
              <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <motion.div 
                  className={`h-full bg-white rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* CARD BACK */}
          <div 
            onClick={handleToggleFlip}
            className={`absolute inset-0 w-full h-full rounded-3xl p-5 bg-gradient-to-br ${currentTheme.backGradient} text-white shadow-xl border flex flex-col justify-between rotate-y-180 backface-hidden transition-all duration-300 ${isFlipped ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {/* Design header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-2 flex-wrap gap-1 leading-none text-left">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${currentTheme.activeDot} animate-pulse`} />
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-305 font-bold">Tarjeta Registrada</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400">FOLIO: {session.folio || session.id}</div>
            </div>

            {/* QR Scanner Display */}
            <div className="flex items-center gap-4 my-auto">
              {/* Click to expand hover zoom wrapper */}
              <div 
                onClick={(e) => {
                  e.stopPropagation(); // Avoid flipping when clicking the QR to expand!
                  setIsQrZoomed(true);
                }}
                className="relative p-2 bg-white rounded-2xl shadow-lg flex-shrink-0 transition hover:scale-105 hover:rotate-1 active:scale-95 cursor-zoom-in group"
                title="Haga clic para ampliar el QR y escanear fácilmente"
              >
                {/* Simulated QR Code */}
                <div className="relative w-24 h-24 flex items-center justify-center bg-white">
                  <QrCode size={80} className="text-slate-900" />
                  
                  {/* Dynamic central stamp logo */}
                  <div className="absolute w-6 h-6 rounded-full border-1.5 border-white flex items-center justify-center shadow-md overflow-hidden bg-white">
                    <MiCafecitoLogo size={23} />
                  </div>
                  
                  {/* Holographic scanner line animation */}
                  <div className={`absolute left-0 right-0 h-0.5 ${currentTheme.scannerLine} opacity-60 animate-bounce`} />
                </div>
                
                {/* Magnify lens badge */}
                <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 w-5 h-5 rounded-full flex items-center justify-center shadow text-[10px] text-white">
                  🔍
                </div>
              </div>

              {/* Client specifications */}
              <div className="flex-1 flex flex-col justify-center text-left min-w-0">
                <p className="text-[9px] text-slate-400 font-mono tracking-tight uppercase font-extrabold">Titular de Cuenta</p>
                <h4 className="text-sm font-black text-white mt-0.5 truncate leading-tight">{session.name}</h4>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">{session.email || 'Socio Registrado'}</p>
                
                <p className="text-[9px] text-slate-400 mt-2 leading-tight bg-white/5 p-1.5 rounded-xl border border-white/5 text-left select-none">
                  Presiona el QR para agrandarlo y facilitarle el escaneo al cajero.
                </p>
              </div>
            </div>

            {/* Footer without Reset commands, now clean back branding */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2 border-t border-white/10 leading-none">
              <span className={currentTheme.textColor}>Mi Cafecito Club</span>
              <span className="uppercase font-black text-slate-500 tracking-wider">Socio Activo</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Theme Picker controls - CARD PERSONALIZATION OPTION */}
      <div className="mt-5 w-full bg-white border border-slate-205 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm text-center">
        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 flex items-center gap-1 select-none">
          ✨ Personaliza tu tarjeta digital
        </span>
        <div className="flex gap-3">
          {THEMES.map((t) => {
            const isSelected = activeThemeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveThemeId(t.id);
                  localStorage.setItem(storageKey, t.id);
                }}
                className={`w-7 h-7 rounded-full ${t.buttonClass} transition-all duration-150 relative cursor-pointer hover:scale-110 flex items-center justify-center ${
                  isSelected 
                    ? 'ring-4 ring-[#149b8f]/30 scale-105 border-2 border-white shadow-md' 
                    : 'border border-slate-200 opacity-80'
                }`}
                title={`Estilo ${t.name}`}
              >
                {isSelected && (
                  <span className="w-1.5 h-1.5 bg-white rounded-full block shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zoomed QR Code Modal */}
      <AnimatePresence>
        {isQrZoomed && (
          <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-4"
            onClick={() => setIsQrZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800 relative space-y-5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsQrZoomed(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer font-bold text-xs transition-all"
              >
                ✕
              </button>

              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#149b8f] font-extrabold block">ESCANEAR CÓDIGO</span>
                <h3 className="text-lg font-serif font-black text-slate-900">Código QR del Socio</h3>
              </div>

              {/* Huge QR Code */}
              <div className="mx-auto w-56 h-56 p-3 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 to-transparent pointer-events-none" />
                <div className="relative w-48 h-48 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <QrCode size={170} className="text-slate-900" />
                  
                  {/* Floating Mini stamp */}
                  <div className="absolute w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shadow-md overflow-hidden bg-white">
                    <MiCafecitoLogo size={38} />
                  </div>
                  
                  {/* Holographic scanner line visual effect */}
                  <div className={`absolute left-0 right-0 h-1 ${currentTheme.scannerLine} opacity-75 animate-bounce`} />
                </div>
              </div>

              {/* Customer description */}
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 truncate leading-tight px-2">{session.name}</p>
                <div className="flex justify-center items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <span>Folio:</span>
                  <span className="font-extrabold text-[#149b8f] bg-[#149b8f]/5 border border-[#149b8f]/10 px-2 py-0.5 rounded-md">
                    {session.folio || session.id}
                  </span>
                </div>
              </div>

              {/* Action Hint */}
              <p className="text-[11.5px] text-slate-400 font-sans leading-normal px-2">
                Presenta este código al camarero para capturar visitas, acumular sellos y canjear premios de {config.shopName || 'Mi Cafecito'}.
              </p>

              <button
                type="button"
                onClick={() => setIsQrZoomed(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow transition"
              >
                Cerrar Código
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
