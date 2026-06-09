import React from 'react';
import { motion } from 'motion/react';
import { Ticket, Clock, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { Voucher } from '../types';

interface VoucherCardProps {
  voucher: Voucher;
  onDelete?: (voucherId: string) => void;
  key?: React.Key;
}

export default function VoucherCard({ voucher, onDelete }: VoucherCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative rounded-3xl border ${
        voucher.isRedeemed 
          ? 'bg-slate-100/70 border-slate-250 opacity-60' 
          : 'bg-white border-slate-200'
      } p-5 shadow-sm overflow-hidden text-left`}
    >
      {/* Decorative Ticket Cutouts */}
      <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#F8FAFC] border-r border-slate-200 -translate-y-1/2" />
      <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#F8FAFC] border-l border-slate-200 -translate-y-1/2" />

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Ticket className={`w-5 h-5 ${voucher.isRedeemed ? 'text-slate-400' : 'text-emerald-600'}`} />
          <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
            voucher.isRedeemed ? 'text-slate-400' : 'text-emerald-700'
          }`}>
            CÓDIGO: {voucher.code}
          </span>
        </div>
        
        {/* Status badges */}
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${
          voucher.isRedeemed 
            ? 'bg-slate-200 text-slate-500' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {voucher.isRedeemed ? 'CANJEADO' : 'PENDIENTE'}
        </span>
      </div>

      <div className="mt-3 border-b border-dashed border-slate-200 pb-3">
        <h4 className={`text-base font-bold font-sans ${voucher.isRedeemed ? 'text-slate-400' : 'text-slate-800'}`}>
          {voucher.title}
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          {voucher.isRedeemed 
            ? `Utilizado el ${new Date(voucher.redeemedAt || '').toLocaleDateString('es-ES')}`
            : `Canjeado el ${new Date(voucher.unlockedAt).toLocaleDateString('es-ES')}`
          }
        </p>
      </div>

      {/* Ticket Footer / Instructions */}
      <div className="mt-3 pt-1.5 flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        {!voucher.isRedeemed ? (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
            <Clock size={11} className="text-emerald-600" />
            <span>Muestra al cajero para validar</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
            <CheckCircle size={11} className="text-slate-400" />
            <span>Transacción completada</span>
          </div>
        )}

        {/* Delete action for cleanliness */}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(voucher.id)}
            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Eliminar del historial"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Mock barcode simulation for aesthetic detail */}
      {!voucher.isRedeemed && (
        <div className="mt-3 opacity-80 hover:opacity-100 transition-opacity">
          <div className="h-6 flex gap-0.5 justify-center items-stretch bg-white p-1 rounded-xl border border-slate-200">
            {/* Simple barcode generation mockup pattern */}
            {[2, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 1, 3, 2, 4].map((width, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900 snap-none" 
                style={{ width: `${width}px` }} 
              />
            ))}
          </div>
          <p className="text-[8px] font-mono text-center text-slate-400 mt-0.5 select-all">{voucher.id}</p>
        </div>
      )}
    </motion.div>
  );
}
