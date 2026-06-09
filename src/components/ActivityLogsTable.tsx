import React from 'react';
import { motion } from 'motion/react';
import { Award, Plus, Ticket, Star, Calendar } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogsTableProps {
  logs: ActivityLog[];
}

export default function ActivityLogsTable({ logs }: ActivityLogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-white border border-slate-205 rounded-3xl p-8 text-center text-slate-500 shadow-sm">
        <Calendar size={32} className="mx-auto text-slate-350 mb-2" />
        <p className="text-sm font-sans font-bold text-slate-700">No hay transacciones registradas aún</p>
        <p className="text-xs text-slate-400 mt-1">Los sellos y cupones que acumules aparecerán aquí</p>
      </div>
    );
  }

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'stamp_added':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Plus size={15} />
          </div>
        );
      case 'reward_unlocked':
        return (
          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-605 text-emerald-600">
            <Star size={14} fill="currentColor" />
          </div>
        );
      case 'voucher_redeemed':
        return (
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-emerald-800">
            <Ticket size={14} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-250 flex items-center justify-center text-emerald-800 animate-pulse">
            <Award size={14} />
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-205 rounded-3xl p-6 text-slate-800 max-w-xl mx-auto shadow-sm">
      <h3 className="text-base font-bold font-sans text-slate-900 text-left border-b border-slate-100 pb-3 mb-4">
        Historial de Actividad
      </h3>
      
      <div className="space-y-4">
        {logs.map((log, idx) => (
          <div key={log.id} className="relative flex gap-4 text-left">
            {/* Timeline line connector */}
            {idx !== logs.length - 1 && (
              <div className="absolute left-4 top-8 bottom-[-16px] w-[2px] bg-slate-100" />
            )}
            
            {/* Left Column icon */}
            <div className="flex-shrink-0 z-10">
              {getLogIcon(log.type)}
            </div>

            {/* Right Column details */}
            <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-sans font-bold text-slate-800">{log.title}</h4>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-normal font-sans">{log.description}</p>
              
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200/50 justify-between">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-medium">
                  {new Date(log.timestamp).toLocaleDateString('es-ES', {day: 'numeric', month: 'short', year: 'numeric'})}
                </span>
                
                {log.amount !== 0 && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    log.amount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {log.amount > 0 ? `+${log.amount}` : log.amount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
