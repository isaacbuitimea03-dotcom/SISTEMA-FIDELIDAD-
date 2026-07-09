import React, { useState } from 'react';
import { Gift, Calendar, Share2, Copy, Check, Lock, Phone, UserCheck, TrendingUp } from 'lucide-react';
import { RegisteredCustomer, Clerk } from '../types';

interface BirthdayTabPanelProps {
  customers: RegisteredCustomer[];
  clerks?: Clerk[];
  onConfirmBirthdayCall?: (customerFolio: string, clerkCode: string, clerkName: string) => Promise<void>;
  onConfirmBirthdayWhatsApp?: (customerFolio: string, clerkCode: string, clerkName: string) => Promise<void>;
  logs?: any[];
}

export default function BirthdayTabPanel({ 
  customers, 
  clerks = [], 
  onConfirmBirthdayCall,
  onConfirmBirthdayWhatsApp,
  logs = []
}: BirthdayTabPanelProps) {
  const [innerTab, setInnerTab] = useState<'proximos' | 'mes'>('proximos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // State for PIN verification for calls
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [pinErrors, setPinErrors] = useState<Record<string, string>>({});
  const [loadingFolio, setLoadingFolio] = useState<string | null>(null);

  // State for PIN verification for WhatsApp
  const [waPinInputs, setWaPinInputs] = useState<Record<string, string>>({});
  const [waPinErrors, setWaPinErrors] = useState<Record<string, string>>({});
  const [waLoadingFolio, setWaLoadingFolio] = useState<string | null>(null);

  const getSpanishMonthName = (monthIdx: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIdx];
  };

  const getBirthdayAnalysis = (c: RegisteredCustomer) => {
    if (!c.birthday) return null;
    const parts = c.birthday.split('-');
    if (parts.length < 3) return null;
    
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);
    
    const today = new Date(); // Today actual date
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const todayMidnight = new Date(Date.UTC(todayYear, todayMonth, todayDay));
    
    let bdayYear = todayYear;
    let nextBdayMidnight = new Date(Date.UTC(bdayYear, birthMonth, birthDay));
    
    if (nextBdayMidnight.getTime() < todayMidnight.getTime()) {
      bdayYear += 1;
      nextBdayMidnight = new Date(Date.UTC(bdayYear, birthMonth, birthDay));
    }
    
    const diffTime = nextBdayMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      daysLeft: diffDays,
      month: birthMonth,
      day: birthDay,
      label: `${birthDay} de ${getSpanishMonthName(birthMonth)}`
    };
  };

  const currentYear = new Date().getFullYear();

  const analyzed = customers
    .map(c => ({ customer: c, bday: getBirthdayAnalysis(c) }))
    .filter(item => item.bday !== null) as Array<{ customer: RegisteredCustomer; bday: NonNullable<ReturnType<typeof getBirthdayAnalysis>> }>;

  // Filter out those who have already been called this year from active listing,
  // EXCEPT if their birthday is still upcoming/today (daysLeft <= 7 and daysLeft >= 0)
  const sortedUpcoming = [...analyzed]
    .filter(item => {
      const hasBeenCalled = item.customer.lastBirthdayCallYear === currentYear;
      if (!hasBeenCalled) return true;
      return item.bday.daysLeft <= 7 && item.bday.daysLeft >= 0;
    })
    .sort((a, b) => a.bday.daysLeft - b.bday.daysLeft);

  // Group by month (include everyone but note called status)
  const monthlyGroups: Record<number, typeof analyzed> = {};
  for (let m = 0; m < 12; m++) {
    monthlyGroups[m] = [];
  }
  analyzed.forEach(item => {
    monthlyGroups[item.bday.month].push(item);
  });

  // Calculate stats based on full analyzed list
  const upcomingThisWeek = analyzed.filter(item => item.bday.daysLeft <= 7 && item.bday.daysLeft >= 0);
  const upcomingThisMonth = analyzed.filter(item => item.bday.daysLeft <= 30 && item.bday.daysLeft >= 0);

  // Today and upcoming calls registry (has birthday within 7 days, OR today)
  const pendingCallsToday = analyzed.filter(item => item.bday.daysLeft >= 0 && item.bday.daysLeft <= 7);
  const pendingCallsCount = pendingCallsToday.filter(item => item.customer.lastBirthdayCallYear !== currentYear).length;

  const bdayTemplate = localStorage.getItem('mi_cafecito_bday_template') || 
    '¡Hola, {nombre}! 🥳 Te saludamos de parte de tu cafetería favorita "Mi Cafecito" ☕. ¡Feliz Cumpleaños! Hoy en tu día especial ({fecha}) queremos consentirte. Visítanos en el Bistro hoy y te regalaremos una deliciosa rebanada de pastel gratis en tu consumo 🍰✨. ¡Presenta tu tarjeta con el folio #{folio}! 🎉';

  const onlyTodayActive = localStorage.getItem('mi_cafecito_only_today_active') !== 'false';

  const getCustomGreeting = (name: string, folio: string, label: string) => {
    let text = bdayTemplate;
    text = text.replace(/{nombre}/g, name);
    text = text.replace(/{folio}/g, folio);
    text = text.replace(/{fecha}/g, label);
    return text;
  };

  const handleCopyCustomGreeting = (name: string, folio: string, label: string) => {
    const text = getCustomGreeting(name, folio, label);
    navigator.clipboard.writeText(text);
    setCopiedId(folio);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWhatsApp = (name: string, phone: string, folio: string, label: string) => {
    const text = getCustomGreeting(name, folio, label);
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const handlePinChange = (folio: string, val: string) => {
    setPinInputs(prev => ({ ...prev, [folio]: val }));
    setPinErrors(prev => ({ ...prev, [folio]: '' }));
  };

  const handleWaPinChange = (folio: string, val: string) => {
    setWaPinInputs(prev => ({ ...prev, [folio]: val }));
    setWaPinErrors(prev => ({ ...prev, [folio]: '' }));
  };

  const handleConfirmCall = async (folio: string, customerName: string) => {
    const pin = pinInputs[folio] || '';
    if (!pin.trim()) {
      setPinErrors(prev => ({ ...prev, [folio]: 'Digita tu clave PIN' }));
      return;
    }

    // Verify clock/clerk
    const matchedClerk = clerks.find(c => c.pin === pin) || 
                         (pin === 'BISTRO2026' ? { code: 'ADMIN', name: 'Gerente General' } : null);

    if (!matchedClerk) {
      setPinErrors(prev => ({ ...prev, [folio]: 'Clave PIN incorrecta' }));
      return;
    }

    setLoadingFolio(folio);
    try {
      if (onConfirmBirthdayCall) {
        await onConfirmBirthdayCall(folio, matchedClerk.code, matchedClerk.name);
      }

      // Success: clear fields
      setPinInputs(prev => {
        const u = { ...prev };
        delete u[folio];
        return u;
      });
      setPinErrors(prev => {
        const u = { ...prev };
        delete u[folio];
        return u;
      });
    } catch (e) {
      console.error(e);
      setPinErrors(prev => ({ ...prev, [folio]: 'Error de conexión' }));
    } finally {
      setLoadingFolio(null);
    }
  };

  const handleConfirmWhatsApp = async (folio: string, customerName: string, phone: string, bdayLabel: string) => {
    const pin = waPinInputs[folio] || '';
    if (!pin.trim()) {
      setWaPinErrors(prev => ({ ...prev, [folio]: 'Digita tu clave PIN' }));
      return;
    }

    // Verify clock/clerk
    const matchedClerk = clerks.find(c => c.pin === pin) || 
                         (pin === 'BISTRO2026' ? { code: 'ADMIN', name: 'Gerente General' } : null);

    if (!matchedClerk) {
      setWaPinErrors(prev => ({ ...prev, [folio]: 'Clave PIN incorrecta' }));
      return;
    }

    setWaLoadingFolio(folio);
    try {
      if (onConfirmBirthdayWhatsApp) {
        await onConfirmBirthdayWhatsApp(folio, matchedClerk.code, matchedClerk.name);
      }

      // Success: clear fields
      setWaPinInputs(prev => {
        const u = { ...prev };
        delete u[folio];
        return u;
      });
      setWaPinErrors(prev => {
        const u = { ...prev };
        delete u[folio];
        return u;
      });

      // Launch WhatsApp API
      handleSendWhatsApp(customerName, phone, folio, bdayLabel);
    } catch (e) {
      console.error(e);
      setWaPinErrors(prev => ({ ...prev, [folio]: 'Error de conexión' }));
    } finally {
      setWaLoadingFolio(null);
    }
  };

  const currentMonthIdx = new Date().getMonth(); // Dynamic current month index

  return (
    <div className="w-full space-y-5 text-left">
      {/* Metrics mini layout banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#149b8f]/5 border border-[#149b8f]/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#149b8f] text-white flex items-center justify-center">
            <Gift size={20} />
          </div>
          <div>
            <p className="text-[11px] font-sans text-slate-500 uppercase tracking-widest font-bold">Hoy y esta Semana</p>
            <h4 className="text-xl font-serif font-black text-slate-800">{upcomingThisWeek.length} Cumpleaños</h4>
          </div>
        </div>

        <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[11px] font-sans text-slate-500 uppercase tracking-widest font-bold">Próximos 30 días</p>
            <h4 className="text-xl font-serif font-black text-slate-800">{upcomingThisMonth.length} Cumpleaños</h4>
          </div>
        </div>

        {/* Total birthdays metric card */}
        <div className="bg-blue-50/50 border border-blue-150 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
            <Phone size={20} />
          </div>
          <div>
            <p className="text-[11px] font-sans text-slate-500 uppercase tracking-widest font-bold">Pendientes de llamar</p>
            <h4 className="text-xl font-serif font-black text-slate-800">{pendingCallsCount} de {pendingCallsToday.length}</h4>
          </div>
        </div>
      </div>

      {/* ALERT BOX FOR ACTIVE BIRTHDAYS AND SEVEN DAYS BEFORE */}
      {pendingCallsToday.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500 text-white animate-pulse">
              <Phone size={18} />
            </span>
            <h3 className="font-serif font-black text-base text-amber-900">
              Registro de Llamadas de Cumpleaños (Abierto 7 días antes)
            </h3>
          </div>
          
          <p className="text-xs text-amber-800/90 leading-relaxed font-sans font-medium">
            El registro de llamadas se abre una semana (7 días) antes de la fecha de cumpleaños. Una vez registrada la llamada, el cliente seguirá apareciendo hasta el día de su cumpleaños para su seguimiento, pero con una leyenda indicando que ya se le marcó.
          </p>

          <div className="space-y-4 mt-2">
            {pendingCallsToday.map(({ customer, bday }) => {
              const folio = customer.folio;
              const error = pinErrors[folio];
              const pinVal = pinInputs[folio] || '';
              const isLoading = loadingFolio === folio;

              // Search call log
              const callLog = logs?.find(l => l.type === 'birthday_call' && l.customerFolio === customer.folio && new Date(l.timestamp).getFullYear() === currentYear);
              const hasBeenCalled = customer.lastBirthdayCallYear === currentYear;

              // Search WhatsApp log
              const whatsappLog = logs?.find(l => l.type === 'birthday_whatsapp' && l.customerFolio === customer.folio && new Date(l.timestamp).getFullYear() === currentYear);
              const hasSentWhatsApp = !!whatsappLog;

              const isBdayToday = bday.daysLeft === 0;

              return (
                <div key={folio} className="bg-white/80 border border-amber-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-100 pb-2">
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                          #{customer.folio}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{customer.name}</h4>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        📱 Teléfono: <strong className="text-[#149b8f] font-mono text-sm">{customer.phone}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      {isBdayToday ? (
                        <span className="text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full animate-pulse uppercase tracking-wide">
                          🎉 ¡HOY ES SU CUMPLEAÑOS!
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100/50 border border-amber-200 px-2.5 py-1 rounded-full">
                          ⏰ Cumpleaños en {bday.daysLeft} {bday.daysLeft === 1 ? 'día' : 'días'} ({bday.label})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                    {/* SECTION 1: BIRTHDAY CALL REGISTRATION */}
                    <div className="space-y-1.5 flex-1 max-w-md">
                      <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block">1. Registro de Llamada</span>
                      {hasBeenCalled ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl font-bold leading-normal">
                          <Check size={14} className="stroke-[3] text-emerald-600" />
                          <span>
                            Llamada ya registrada para este cumpleaños
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative">
                            <input 
                              type="password"
                              placeholder="PIN Encargado"
                              value={pinVal}
                              onChange={(e) => handlePinChange(folio, e.target.value)}
                              className={`text-xs px-3 py-2 border rounded-xl w-full sm:w-36 focus:outline-none focus:ring-1 focus:ring-[#149b8f] ${
                                error ? 'border-red-500' : 'border-slate-200'
                              }`}
                              maxLength={10}
                            />
                            {error && (
                              <p className="absolute left-1 -bottom-4 text-[9px] text-red-500 font-bold whitespace-nowrap">{error}</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleConfirmCall(folio, customer.name)}
                            disabled={isLoading}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            <UserCheck size={14} />
                            {isLoading ? 'Registrando...' : 'Confirmar Llamada'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: BIRTHDAY WHATSAPP MESSAGE */}
                    <div className="space-y-1.5 flex-1 max-w-md">
                      <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block">2. Enviar WhatsApp</span>
                      {isBdayToday ? (
                        hasSentWhatsApp ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-850 bg-emerald-50 border border-emerald-150 px-3 py-2 rounded-xl font-semibold leading-normal">
                            <Check size={14} className="stroke-[3] text-emerald-600" />
                            <span>
                              WhatsApp de felicitación enviado
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="relative">
                              <input 
                                type="password"
                                placeholder="PIN Encargado"
                                value={waPinInputs[folio] || ''}
                                onChange={(e) => handleWaPinChange(folio, e.target.value)}
                                className={`text-xs px-3 py-2 border rounded-xl w-full sm:w-36 focus:outline-none focus:ring-1 focus:ring-[#25D366] ${
                                  waPinErrors[folio] ? 'border-red-500' : 'border-slate-200'
                                }`}
                                maxLength={10}
                              />
                              {waPinErrors[folio] && (
                                <p className="absolute left-1 -bottom-4 text-[9px] text-red-500 font-bold whitespace-nowrap">{waPinErrors[folio]}</p>
                              )}
                            </div>

                            <button
                              onClick={() => handleConfirmWhatsApp(folio, customer.name, customer.phone, bday.label)}
                              disabled={waLoadingFolio === folio}
                              className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.7 1.45 5.515 0 10.002-4.48 10.005-9.998.002-2.673-1.04-5.186-2.936-7.087-1.895-1.9-4.41-2.946-7.086-2.947-5.518 0-10.005 4.477-10.008 9.995-.001 2 .526 3.96 1.53 5.7l-.37 1.34 1.397-.365zm10.825-7.41c-.29-.145-1.713-.845-1.978-.94-.265-.1-.458-.145-.65.145-.19.29-.74.94-.908 1.135-.166.19-.335.215-.625.07-.29-.145-1.225-.45-2.333-1.442-.862-.77-1.443-1.72-1.611-2.01-.168-.29-.018-.45.127-.59.13-.125.29-.34.436-.51.145-.165.19-.29.29-.48.1-.19.05-.355-.025-.5-.075-.145-.65-1.566-.89-2.14-.233-.56-.47-.482-.65-.492-.17-.008-.363-.01-.555-.01-.19 0-.5.07-.76.355-.26.29-1 .98-1 2.39 0 1.41 1.025 2.78 1.17 2.97.145.19 2.015 3.077 4.88 4.32.68.29 1.21.465 1.625.596.685.22 1.31.19 1.8.116.546-.08 1.712-.7 1.954-1.378.24-.678.24-1.26.17-1.38-.076-.12-.27-.19-.56-.335z" />
                              </svg>
                              {waLoadingFolio === folio ? 'Enviando...' : 'Enviar WhatsApp'}
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-400 px-3 py-2 rounded-xl cursor-default text-[11px] font-sans font-medium">
                          <Lock size={12} className="text-slate-400" />
                          <span>Bloqueado hasta el día del cumple ({bday.day})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Switcher tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full max-w-sm gap-1 self-start">
        <button
          onClick={() => setInnerTab('proximos')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            innerTab === 'proximos'
               ? 'bg-white text-[#149b8f] shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          ⏰ Próximos (Pendientes)
        </button>
        <button
          onClick={() => setInnerTab('mes')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            innerTab === 'mes'
              ? 'bg-white text-[#149b8f] shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📂 Calendario por Mes
        </button>
      </div>

      {innerTab === 'proximos' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 mb-2 flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Cliente de Cumpleaños</span>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Acciones & Canal de Envío</span>
          </div>

          {sortedUpcoming.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No hay registros de cumpleaños pendientes de llamada.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {sortedUpcoming.slice(0, 30).map(({ customer, bday }) => {
                const isBdayToday = bday.daysLeft === 0;
                const isActionActive = !onlyTodayActive || isBdayToday;

                const daysBadgeColor = bday.daysLeft <= 3 
                  ? 'bg-red-50 text-red-600 border-red-100' 
                  : 'bg-teal-50 text-teal-700 border-teal-100';

                const callLog = logs?.find(l => l.type === 'birthday_call' && l.customerFolio === customer.folio && new Date(l.timestamp).getFullYear() === currentYear);
                const hasBeenCalled = customer.lastBirthdayCallYear === currentYear;

                const whatsappLog = logs?.find(l => l.type === 'birthday_whatsapp' && l.customerFolio === customer.folio && new Date(l.timestamp).getFullYear() === currentYear);
                const hasSentWhatsApp = !!whatsappLog;

                return (
                  <div key={customer.folio} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold border border-cyan-100">
                          #{customer.folio}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{customer.name}</h4>
                        {hasBeenCalled && (
                          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded" title="Llamada ya registrada para este cumpleaños">
                            📞 LLAMADO
                          </span>
                        )}
                        {hasSentWhatsApp && (
                          <span className="text-[9px] font-mono font-bold text-[#25D366] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded" title="WhatsApp de felicitación enviado">
                            💬 ENVIADO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        🎂 Nacimiento: {bday.label} • ☎ {customer.phone}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${daysBadgeColor}`}>
                        {isBdayToday ? '¡Hoy! 🎉' : `En ${bday.daysLeft} días`}
                      </span>

                      {/* Copiar */}
                      <button
                        onClick={() => handleCopyCustomGreeting(customer.name, customer.folio, bday.label)}
                        className="p-2.5 border border-slate-200 hover:border-[#149b8f] rounded-xl text-slate-500 hover:text-[#149b8f] hover:bg-[#149b8f]/5 transition-all cursor-pointer flex items-center gap-1"
                        title="Copiar mensaje de felicitación"
                      >
                        {copiedId === customer.folio ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                        <span className="text-[10px] font-bold">Copiar</span>
                      </button>

                      {/* WhatsApp Link directly to WA.ME (Required PIN verification on birthday) */}
                      {isBdayToday ? (
                        hasSentWhatsApp ? (
                          <div className="text-[11px] font-sans font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1">
                            <Check size={12} className="stroke-[3] text-emerald-600" />
                            <span>WhatsApp listo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="password"
                              placeholder="PIN"
                              value={waPinInputs[customer.folio] || ''}
                              onChange={(e) => handleWaPinChange(customer.folio, e.target.value)}
                              className="text-xs px-2 py-1.5 border border-slate-200 rounded-xl w-14 text-center focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                              maxLength={10}
                            />
                            <button
                              onClick={() => handleConfirmWhatsApp(customer.folio, customer.name, customer.phone, bday.label)}
                              disabled={waLoadingFolio === customer.folio}
                              className="p-2 bg-[#25D366] text-white border border-[#25D366] hover:bg-[#20ba59] rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Confirmar PIN y enviar WhatsApp"
                            >
                              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.7 1.45 5.515 0 10.002-4.48 10.005-9.998.002-2.673-1.04-5.186-2.936-7.087-1.895-1.9-4.41-2.946-7.086-2.947-5.518 0-10.005 4.477-10.008 9.995-.001 2 .526 3.96 1.53 5.7l-.37 1.34 1.397-.365zm10.825-7.41c-.29-.145-1.713-.845-1.978-.94-.265-.1-.458-.145-.65.145-.19.29-.74.94-.908 1.135-.166.19-.335.215-.625.07-.29-.145-1.225-.45-2.333-1.442-.862-.77-1.443-1.72-1.611-2.01-.168-.29-.018-.45.127-.59.13-.125.29-.34.436-.51.145-.165.19-.29.29-.48.1-.19.05-.355-.025-.5-.075-.145-.65-1.566-.89-2.14-.233-.56-.47-.482-.65-.492-.17-.008-.363-.01-.555-.01-.19 0-.5.07-.76.355-.26.29-1 .98-1 2.39 0 1.41 1.025 2.78 1.17 2.97.145.19 2.015 3.077 4.88 4.32.68.29 1.21.465 1.625.596.685.22 1.31.19 1.8.116.546-.08 1.712-.7 1.954-1.378.24-.678.24-1.26.17-1.38-.076-.12-.27-.19-.56-.335z" />
                              </svg>
                              <span className="text-[10px] font-bold">WA</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-400 px-3 py-1.5 rounded-xl cursor-default text-[11px] font-sans font-medium" title="Solo disponible el día de cumpleaños">
                          <Lock size={12} className="text-slate-400" />
                          <span>Bloqueado</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 12 }).map((_, mIdx) => {
            const monthsCustomers = monthlyGroups[mIdx] || [];
            const isCurrentMonth = mIdx === currentMonthIdx;

            return (
              <div 
                key={mIdx} 
                className={`bg-white border rounded-2xl p-4 shadow-sm relative overflow-hidden ${
                  isCurrentMonth ? 'border-[#149b8f]/60 ring-2 ring-[#149b8f]/10' : 'border-slate-200'
                }`}
              >
                {isCurrentMonth && (
                  <div className="absolute top-0 right-0 bg-[#149b8f] text-white text-[9px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-bl">
                    Mes Actual
                  </div>
                )}

                <h3 className="font-serif font-black text-sm text-slate-900 border-b border-slate-150 pb-2 flex justify-between items-center">
                  <span>{getSpanishMonthName(mIdx)}</span>
                  <span className="text-xs text-[#149b8f] bg-[#149b8f]/5 px-2 py-0.5 rounded-full font-sans font-bold">
                    {monthsCustomers.length} {monthsCustomers.length === 1 ? 'cliente' : 'clientes'}
                  </span>
                </h3>

                {monthsCustomers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-5 text-center">Nadie registrado en este mes.</p>
                ) : (
                  <div className="mt-3.5 space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {monthsCustomers.map(({ customer, bday }) => {
                      const isBdayCalledThisYear = customer.lastBirthdayCallYear === currentYear;
                      return (
                        <div key={customer.folio} className="flex justify-between items-center text-xs">
                          <span className={`font-medium truncate max-w-[120px] ${isBdayCalledThisYear ? 'text-slate-400 line-through' : 'text-slate-700'}`} title={customer.name}>
                            {customer.name}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                            {isBdayCalledThisYear ? (
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded text-[9px]">📞 Sí</span>
                            ) : (
                              <span>Día {bday.day}</span>
                            )}
                            <span>(#{customer.folio})</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
