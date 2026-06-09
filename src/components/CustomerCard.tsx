import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Sparkles, QrCode, Award, Info, RefreshCw, User, HelpCircle } from 'lucide-react';
import { UserSession, MerchantConfig } from '../types';

interface CustomerCardProps {
  session: UserSession;
  config: MerchantConfig;
  onReset: () => void;
}

export default function CustomerCard({ session, config, onReset }: CustomerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Create an array for the stamps (e.g., length config.stampsRequired)
  const stampIndices = Array.from({ length: config.stampsRequired });
  const filledCount = session.currentStamps;
  const progressPercent = (filledCount / config.stampsRequired) * 100;

  // Sound context activator (optional layer)
  const handleToggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Help text */}
      <p className="text-sm text-slate-500 mb-3 flex items-center gap-1.5 font-sans">
        <Info size={14} className="text-emerald-600" />
        Haz clic en la tarjeta para voltearla y ver tu código QR
      </p>

      {/* 3D Card Container */}
      <div 
        id="loyalty-card-wrapper"
        className="w-full h-[280px] perspective-1000 cursor-pointer relative"
        onClick={handleToggleFlip}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-full h-full relative preserve-3d"
        >
          {/* CARD FRONT */}
          <div className="absolute inset-0 w-full h-full rounded-3xl p-6 bg-gradient-to-br from-emerald-800 via-emerald-950 to-slate-905 text-white shadow-lg border border-emerald-555/20 flex flex-col justify-between backface-hidden">
            {/* Card Glare & Pattern Overlay */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header info */}
            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-mono font-bold">Tarjeta de Cliente Frecuente</p>
                <h3 className="text-lg font-sans font-bold tracking-tight mt-0.5 text-white">{config.shopName}</h3>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-xl px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1">
                <Award size={13} />
                {session.points} PTS
              </div>
            </div>

            {/* Grid of Stamps */}
            <div className="my-2 z-10">
              <div className="grid grid-cols-4 gap-3.5 justify-items-center">
                {stampIndices.map((_, index) => {
                  const isStamped = index < filledCount;
                  return (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={isStamped ? { scale: [1, 1.2, 1], rotate: [0, 10, -5, 0] } : {}}
                      className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                        isStamped 
                          ? 'bg-gradient-to-br from-emerald-300 to-teal-500 border-white shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                          : 'bg-white/10 border-white/20 hover:border-white/35 text-white/50'
                      }`}
                    >
                      {isStamped ? (
                        <Coffee className="text-emerald-950 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" size={24} />
                      ) : (
                        <span className="text-white/60 font-mono text-sm font-semibold">{index + 1}</span>
                      )}

                      {/* Sparkle overlay on latest stamped stamp */}
                      {index === filledCount - 1 && isStamped && (
                        <motion.div 
                          animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute -top-1 -right-1 text-emerald-250"
                        >
                          <Sparkles size={12} fill="currentColor" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Progress indicator */}
            <div className="z-10 mt-2">
              <div className="flex justify-between text-[11px] text-emerald-200/80 mb-1 font-mono">
                <span>RECOMPENSA: {config.mainRewardTitle}</span>
                <span>{filledCount} / {config.stampsRequired} SELLOS</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* CARD BACK */}
          <div className="absolute inset-0 w-full h-full rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white shadow-lg border border-slate-800 flex flex-col justify-between [transform:rotateY(180deg)] backface-hidden">
            {/* Design header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono tracking-wider uppercase text-emerald-200">Cliente Autenticado</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">ID: {session.id}</div>
            </div>

            {/* QR Scanner Display */}
            <div className="flex items-center gap-5 my-auto">
              <div className="relative p-2.5 bg-white rounded-2xl shadow-inner flex-shrink-0">
                {/* Simulated QR Code */}
                <div className="relative w-28 h-28 flex items-center justify-center bg-white">
                  <QrCode size={96} className="text-slate-900" />
                  {/* Dynamic central stamp logo */}
                  <div className="absolute w-7 h-7 bg-emerald-600 rounded-md border-2 border-white flex items-center justify-center">
                    <Coffee size={14} className="text-white" />
                  </div>
                  {/* Holographic scanner line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 opacity-60 animate-bounce" />
                </div>
              </div>

              {/* Client specifications */}
              <div className="flex-1 flex flex-col justify-center text-left">
                <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Socio del Club</p>
                <h4 className="text-base font-bold text-white mt-0.5 truncate">{session.name}</h4>
                <p className="text-xs text-slate-350 truncate">{session.email}</p>
                
                <p className="text-[10px] text-slate-400 mt-4 leading-normal bg-white/5 p-2 rounded-xl border border-white/10">
                  Presenta este QR al mesero para registrar consumos y acumular sellos.
                </p>
              </div>
            </div>

            {/* Footer with actions */}
            <div className="flex justify-between items-center text-xs font-mono text-slate-300 pt-2 border-t border-white/10">
              <span className="text-emerald-400">Premium Loyalty Flow</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="hover:text-red-400 transition-colors flex items-center gap-1 text-[11px] bg-white/5 hover:bg-red-950/30 px-2 py-1 rounded-xl border border-white/10 hover:border-red-900/40 cursor-pointer"
              >
                <RefreshCw size={10} />
                Reiniciar Cuenta
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
