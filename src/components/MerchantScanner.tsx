import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, CheckCircle, AlertCircle, Plus, Minus, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { UserSession, MerchantConfig } from '../types';
import { playStampSound } from '../utils/audio';

export const AUTHORIZED_CLERKS = [
  { name: 'JOSE LUIS', code: 'CO1', altCode: 'C01' },
  { name: 'DIANA', code: 'CR02' },
  { name: 'NOELIA', code: 'C03' },
  { name: 'AMAIRANI', code: 'CR04' },
  { name: 'GISELA', code: 'C05' }
];

interface MerchantScannerProps {
  session: UserSession;
  config: MerchantConfig;
  onStampAdded: (count: number, clerkName: string, clerkCode: string) => void;
  onVoucherValidated: (voucherId: string, clerkName: string, clerkCode: string) => void;
}

export default function MerchantScanner({ 
  session, 
  config, 
  onStampAdded, 
  onVoucherValidated 
}: MerchantScannerProps) {
  // Clerk code entry
  const [selectedClerkIndex, setSelectedClerkIndex] = useState(0);
  const [clerkCodeEntry, setClerkCodeEntry] = useState('');
  const [stampCount, setStampCount] = useState(1);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'stamp' | 'vouchers'>('stamp');

  const currentClerk = AUTHORIZED_CLERKS[selectedClerkIndex];

  const handleKeyClick = (char: string) => {
    setValidationError('');
    setSuccessMessage('');
    if (clerkCodeEntry.length < 6) {
      setClerkCodeEntry(prev => (prev + char).toUpperCase());
    }
  };

  const handleBackspace = () => {
    setClerkCodeEntry(prev => prev.slice(0, -1));
    setValidationError('');
  };

  const handleClear = () => {
    setClerkCodeEntry('');
    setValidationError('');
  };

  // Check manual/clerk key authorization
  const validateClerkAuth = () => {
    const entered = clerkCodeEntry.trim().toUpperCase();
    const targetCode = currentClerk.code.toUpperCase();
    const targetAlt = currentClerk.altCode ? currentClerk.altCode.toUpperCase() : null;

    if (entered !== targetCode && entered !== targetAlt) {
      return false;
    }
    return true;
  };

  const handleAuthorizeStamp = () => {
    if (!validateClerkAuth()) {
      setValidationError(`Clave incorrecta para ${currentClerk.name}. Inténtalo de nuevo.`);
      setClerkCodeEntry('');
      return;
    }

    // Success
    playStampSound();
    onStampAdded(stampCount, currentClerk.name, currentClerk.code);
    setSuccessMessage(`¡Éxito! +${stampCount} sellos registrados por ${currentClerk.name} para Folio #${session.folio || 'S/F'}.`);
    setClerkCodeEntry('');
    setValidationError('');
    setStampCount(1);
  };

  const handleAuthorizeVoucher = (voucherId: string, voucherTitle: string) => {
    if (!validateClerkAuth()) {
      setValidationError(`Clave incorrecta para ${currentClerk.name}.`);
      setClerkCodeEntry('');
      return;
    }

    // Success validation
    playStampSound();
    onVoucherValidated(voucherId, currentClerk.name, currentClerk.code);
    setSuccessMessage(`¡Cupón "${voucherTitle}" validado y quemado correctamente por ${currentClerk.name}!`);
    setClerkCodeEntry('');
    setValidationError('');
  };

  const pendingVouchers = session.unlockedVouchers.filter(v => !v.isRedeemed);

  return (
    <div className="bg-white border border-slate-205 rounded-3xl p-6 text-slate-800 max-w-md mx-auto shadow-sm relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <ShieldCheck size={18} />
        </div>
        <div className="text-left">
          <h3 className="text-base font-bold font-sans text-slate-900">Panel de Autorización</h3>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">Acceso de Cajeros / Líderes registrados</p>
        </div>
      </div>

      {/* Clerk Selection Dropdown */}
      <div className="space-y-1.5 mb-4 text-left">
        <label className="text-xs font-mono text-slate-500 uppercase tracking-wide font-semibold block flex items-center gap-1">
          <UserCheck size={12} />
          Selecciona tu Nombre:
        </label>
        <select
          value={selectedClerkIndex}
          onChange={(e) => {
            setSelectedClerkIndex(Number(e.target.value));
            setClerkCodeEntry('');
            setValidationError('');
            setSuccessMessage('');
          }}
          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-sans outline-none shadow-sm cursor-pointer"
        >
          {AUTHORIZED_CLERKS.map((clerk, index) => (
            <option key={clerk.code} value={index}>
              {clerk.name} (Clave)
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400 font-mono uppercase">
          Escribe la clave secreta asignada a tu usuario para validar.
        </p>
      </div>

      {/* Switch: Stamps vs Vouchers */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5 text-sm font-medium border border-slate-200">
        <button
          type="button"
          onClick={() => { setActiveTab('stamp'); setValidationError(''); setSuccessMessage(''); }}
          className={`py-2 rounded-lg transition-all font-sans font-bold text-xs uppercase cursor-pointer ${
            activeTab === 'stamp' 
              ? 'bg-white text-emerald-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Añadir Sellos
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('vouchers'); setValidationError(''); setSuccessMessage(''); }}
          className={`py-2 rounded-lg transition-all font-sans font-bold text-xs uppercase relative cursor-pointer ${
            activeTab === 'vouchers' 
              ? 'bg-white text-emerald-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Canjear Cupones
          {pendingVouchers.length > 0 && (
            <span className="absolute top-1.5 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Action Panels */}
      {activeTab === 'stamp' ? (
        <div className="space-y-4">
          {/* Stamp selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Cantidad de tazas a colocar</span>
            <div className="flex items-center gap-6 mt-3">
              <button
                type="button"
                onClick={() => setStampCount(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Minus size={16} />
              </button>
              <span className="text-3xl font-sans font-extrabold text-emerald-600">{stampCount}</span>
              <button
                type="button"
                onClick={() => setStampCount(prev => Math.min(8, prev + 1))}
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-3 uppercase tracking-tight">
              Para cliente: <span className="font-bold text-slate-600">{session.name} ({session.folio ? `Folio #${session.folio}` : 'Sin Folio'})</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[188px] overflow-y-auto pr-1">
          {pendingVouchers.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 flex flex-col items-center justify-center min-h-[140px]">
              <AlertCircle size={24} className="text-slate-400 mb-2" />
              <p className="text-sm font-sans font-bold text-slate-700">No hay cupones pendientes de validar</p>
              <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase">El cliente debe canjear premios en la tienda primero</p>
            </div>
          ) : (
            pendingVouchers.map(voucher => (
              <div 
                key={voucher.id}
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs"
              >
                <div className="text-left">
                  <p className="text-[10px] font-mono text-emerald-600 font-bold uppercase">{voucher.code}</p>
                  <h4 className="text-sm font-sans font-bold text-slate-800 mt-0.5">{voucher.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleAuthorizeVoucher(voucher.id, voucher.title)}
                  disabled={clerkCodeEntry.trim() === ''}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    clerkCodeEntry.trim() !== ''
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  Canjear
                  <ArrowRight size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Keypad & Output area */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        {/* Input field helper show with asterisk */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-full max-w-[200px]">
            <input
              type="text"
              readOnly
              placeholder="••••"
              value={clerkCodeEntry}
              className="w-full bg-slate-50 border border-slate-2.5 rounded-xl px-3 py-2 text-center text-base font-mono tracking-widest text-emerald-800 font-bold outline-none shadow-sm"
            />
          </div>
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-1">Escribe tu Clave Personal</span>
        </div>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {validationError && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2"
            >
              <AlertCircle size={14} className="flex-shrink-0 text-red-500" />
              <span>{validationError}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2"
            >
              <CheckCircle size={15} className="flex-shrink-0 text-emerald-600" />
              <span className="text-left font-sans">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom 3x4 Pocket Clerk Keypad supporting exact credentials */}
        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
          {/* Layout: C, O, R, 1, 2, 3, 4, 5, 0 */}
          {['C', 'O', 'R', '1', '2', '3', '4', '5', '0'].map(char => (
            <button
              type="button"
              key={char}
              onClick={() => handleKeyClick(char)}
              className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-lg font-extrabold text-slate-800 transition-colors active:scale-95 duration-75 cursor-pointer shadow-sm"
            >
              {char}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-[9px] font-extrabold text-slate-400 hover:text-red-500 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            LIMPIAR
          </button>
          {/* Auxiliary physical text entry trigger */}
          <div className="h-11 flex items-center justify-center">
            <input
              type="text"
              placeholder="Teclado"
              className="w-full h-full opacity-0 absolute pointer-events-none"
              onChange={(e) => {
                const text = e.target.value.toUpperCase().replace(/[^COR0123456789]/g, '');
                if (text.length <= 6) setClerkCodeEntry(text);
                e.target.value = '';
              }}
            />
            <span className="text-[9px] font-mono text-slate-400 leading-tight block text-center select-none">
              Soporta<br/>Físico
            </span>
          </div>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-[9px] font-extrabold text-slate-400 hover:text-slate-700 transition-colors active:scale-95 cursor-pointer shadow-sm"
          >
            BORRAR
          </button>
        </div>

        {/* Execute button only for stamping */}
        {activeTab === 'stamp' && (
          <button
            type="button"
            onClick={handleAuthorizeStamp}
            disabled={clerkCodeEntry.trim() === ''}
            className={`w-full mt-4 py-2.5 rounded-xl font-sans font-bold text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              clerkCodeEntry.trim() !== ''
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700 shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Key size={14} />
            Autorizar {stampCount} {stampCount === 1 ? 'Sello' : 'Sellos'}
          </button>
        )}
      </div>
    </div>
  );
}
