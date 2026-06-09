import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Coffee, Cake, Utensils, Sparkles, AlertCircle, CheckCircle, Gift, ArrowRight } from 'lucide-react';
import { UserSession, RewardOption, Voucher } from '../types';
import { REWARD_OPTIONS } from '../utils/rewards';
import { playSuccessChime } from '../utils/audio';

interface RewardsStoreProps {
  session: UserSession;
  onRewardRedeemed: (rewardOption: RewardOption, method: 'stamps' | 'points') => void;
}

type CategoryType = 'all' | 'coffee' | 'dessert' | 'food' | 'special';

export default function RewardsStore({ session, onRewardRedeemed }: RewardsStoreProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [successRedemption, setSuccessRedemption] = useState<{title: string, code: string} | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredRewards = activeCategory === 'all' 
    ? REWARD_OPTIONS
    : REWARD_OPTIONS.filter(option => option.category === activeCategory);

  const handleRedeem = (reward: RewardOption, method: 'stamps' | 'points') => {
    setErrorMessage('');
    setSuccessRedemption(null);

    if (method === 'stamps') {
      const stampCost = reward.costInStamps || 0;
      if (session.currentStamps < stampCost) {
        setErrorMessage(`No tienes suficientes sellos. Necesitas ${stampCost} y tienes ${session.currentStamps}.`);
        return;
      }
    } else {
      const pointsCost = reward.costInPoints || 0;
      if (session.points < pointsCost) {
        setErrorMessage(`No tienes suficientes puntos. Necesitas ${pointsCost} PTS y tienes ${session.points} PTS.`);
        return;
      }
    }

    // Generate random code
    const randomCode = 'EST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Play sound!
    playSuccessChime();

    // Fire state update
    onRewardRedeemed(reward, method);

    // Set success modal
    setSuccessRedemption({
      title: reward.title,
      code: randomCode
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coffee': return <Coffee size={14} />;
      case 'dessert': return <Cake size={14} />;
      case 'food': return <Utensils size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-left">
      {/* Rewards Header / Balances */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 text-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Gift size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold font-sans text-slate-900">Canjea tus Recompensas</h3>
            <p className="text-xs text-slate-500 font-sans">Intercambia tus sellos acumulados o puntos por platillos y bebidas gratis.</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
            <p className="text-[10px] text-slate-450 font-mono uppercase font-semibold">Tus Puntos</p>
            <p className="text-lg font-mono font-bold text-emerald-600">{session.points} <span className="text-xs text-slate-400">PTS</span></p>
          </div>
          <div className="flex-1 sm:flex-none bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
            <p className="text-[10px] text-slate-450 font-mono uppercase font-semibold">Tus Sellos</p>
            <p className="text-lg font-mono font-bold text-emerald-600">{session.currentStamps} <span className="text-xs text-slate-400">/ 8</span></p>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'coffee', 'dessert', 'food', 'special'] as CategoryType[]).map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === category 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-605'
            }`}
          >
            {category === 'all' ? 'Ver Todo' : category === 'coffee' ? 'Cafetería' : category === 'dessert' ? 'Postres' : category === 'food' ? 'Alimentos' : 'Especialidades'}
          </button>
        ))}
      </div>

      {/* Alert Banner for errors */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Modal / Banner */}
      <AnimatePresence>
        {successRedemption && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-r from-emerald-50/50 to-teal-50/70 border border-emerald-250 rounded-3xl p-6 text-slate-800 text-center flex flex-col items-center relative overflow-hidden shadow-sm"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mb-3 shadow-[0_0_10px_rgba(5,150,105,0.3)]">
              <CheckCircle size={26} />
            </div>
            <h4 className="text-lg font-sans font-bold text-slate-900">¡Premio Desbloqueado Exitosamente!</h4>
            <p className="text-sm text-slate-505 max-w-sm mt-1 font-sans">
              Has canjeado tu premio <strong>{successRedemption.title}</strong>. El boleto se ha guardado en tus cupones activos.
            </p>
            <div className="bg-white border border-slate-200 px-6 py-2.5 rounded-2xl font-mono text-emerald-600 font-bold text-lg tracking-wider mt-4 shadow-sm">
              CÓDIGO: {successRedemption.code}
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[11px] text-emerald-600 font-mono uppercase tracking-tight font-semibold">
              <span>Presenta este código al mesero para validar</span>
              <ArrowRight size={11} className="animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Reward Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRewards.map((reward) => {
          const hasEnoughStamps = session.currentStamps >= (reward.costInStamps || 999);
          const hasEnoughPoints = session.points >= (reward.costInPoints || 999999);

          return (
            <motion.div 
              key={reward.id}
              layout
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Product Photo & Badge */}
              <div className="relative h-44 w-full bg-slate-100">
                <img 
                  src={reward.image} 
                  alt={reward.title}
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 text-[10px] font-mono uppercase tracking-wider text-emerald-600 flex items-center gap-1 font-semibold shadow-sm">
                  {getCategoryIcon(reward.category)}
                  {reward.category === 'coffee' ? 'Cafetería' : reward.category === 'dessert' ? 'Postre' : 'Alimento'}
                </div>
              </div>

              {/* Product Content */}
              <div className="p-5 flex-1 flex flex-col justify-between text-left">
                <div>
                  <h4 className="text-base font-bold font-sans text-slate-800">{reward.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sans">{reward.description}</p>
                </div>

                {/* Redeem Buttons layout */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono tracking-wide">
                    <span>MÉTODOS DE CANJE ADMITIDOS:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Redeem by Stamps */}
                    {reward.costInStamps && (
                      <button
                        type="button"
                        onClick={() => handleRedeem(reward, 'stamps')}
                        className={`py-2 rounded-xl px-2.5 text-xs font-sans font-bold flex flex-col justify-center items-center transition-all border ${
                          hasEnoughStamps
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-250 text-emerald-700 cursor-pointer shadow-sm'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span className="font-semibold text-[10px] uppercase text-slate-400">Por Sellos</span>
                        <span className="mt-0.5 text-[11px]">{reward.costInStamps} {reward.costInStamps === 1 ? 'Sello' : 'Sellos'}</span>
                      </button>
                    )}

                    {/* Redeem by Points */}
                    {reward.costInPoints && (
                      <button
                        type="button"
                        onClick={() => handleRedeem(reward, 'points')}
                        className={`py-2 rounded-xl px-2.5 text-xs font-sans font-bold flex flex-col justify-center items-center transition-all border ${
                          hasEnoughPoints
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-250 text-emerald-700 cursor-pointer shadow-sm'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span className="font-semibold text-[10px] uppercase text-slate-400">Por Puntos</span>
                        <span className="mt-0.5 text-[11px]">{reward.costInPoints} PTS</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
