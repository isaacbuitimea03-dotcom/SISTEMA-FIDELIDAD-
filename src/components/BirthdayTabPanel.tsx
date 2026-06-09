import React, { useState } from 'react';
import { Gift, Calendar, Share2, Copy, Check } from 'lucide-react';
import { RegisteredCustomer } from '../types';

interface BirthdayTabPanelProps {
  customers: RegisteredCustomer[];
}

export default function BirthdayTabPanel({ customers }: BirthdayTabPanelProps) {
  const [innerTab, setInnerTab] = useState<'proximos' | 'mes'>('proximos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    
    const today = new Date('2026-06-09T00:37:48Z'); // Today absolute mock date
    const currentYear = today.getFullYear();
    
    let nextBday = new Date(currentYear, birthMonth, birthDay);
    if (nextBday.getTime() < today.getTime()) {
      nextBday.setFullYear(currentYear + 1);
    }
    
    const diffTime = nextBday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      daysLeft: diffDays,
      month: birthMonth,
      day: birthDay,
      label: `${birthDay} de ${getSpanishMonthName(birthMonth)}`
    };
  };

  const analyzed = customers
    .map(c => ({ customer: c, bday: getBirthdayAnalysis(c) }))
    .filter(item => item.bday !== null) as Array<{ customer: RegisteredCustomer; bday: NonNullable<ReturnType<typeof getBirthdayAnalysis>> }>;

  // Sort by days left
  const sortedUpcoming = [...analyzed].sort((a, b) => a.bday.daysLeft - b.bday.daysLeft);

  // Group by month
  const monthlyGroups: Record<number, typeof analyzed> = {};
  for (let m = 0; m < 12; m++) {
    monthlyGroups[m] = [];
  }
  analyzed.forEach(item => {
    monthlyGroups[item.bday.month].push(item);
  });

  const upcomingThisWeek = sortedUpcoming.filter(item => item.bday.daysLeft <= 7);
  const upcomingThisMonth = sortedUpcoming.filter(item => item.bday.daysLeft <= 30);

  const handleCopyInvitation = (name: string, phone: string, folio: string, label: string) => {
    const text = `¡Hola, ${name}! 🥳 Te saludamos de parte de tu cafetería favorita "Mi Cafecito" ☕. Nos dimos cuenta de que pronto es tu cumpleaños (${label}) y queremos consentirte. Visítanos en tu semana de cumpleaños y te regalaremos una deliciosa rebanada de pastel gratis en tu consumo 🍰✨. ¡Te esperamos con el folio de tu tarjeta #${folio}!`;
    navigator.clipboard.writeText(text);
    setCopiedId(folio);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const currentMonthIdx = 5; // June based on 2026-06-09

  return (
    <div className="w-full space-y-5 text-left">
      {/* Metrics mini layout banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#149b8f]/5 border border-[#149b8f]/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#149b8f] text-white flex items-center justify-center">
            <Gift size={20} />
          </div>
          <div>
            <p className="text-[11px] font-sans text-slate-500 uppercase tracking-widest font-bold">Esta Semana</p>
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
      </div>

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
          ⏰ Próximos
        </button>
        <button
          onClick={() => setInnerTab('mes')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            innerTab === 'mes'
              ? 'bg-white text-[#149b8f] shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📂 Por Mes
        </button>
      </div>

      {innerTab === 'proximos' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 mb-2 flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Cliente de Cumpleaños</span>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Cuenta Regresiva</span>
          </div>

          {sortedUpcoming.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No hay registros de cumpleaños disponibles.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {sortedUpcoming.slice(0, 30).map(({ customer, bday }) => {
                const daysBadgeColor = bday.daysLeft <= 3 
                  ? 'bg-red-50 text-red-600 border-red-100' 
                  : 'bg-teal-50 text-teal-700 border-teal-100';

                return (
                  <div key={customer.folio} className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold border border-cyan-100">
                          #{customer.folio}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{customer.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        🎂 Nacimiento: {bday.label} • ☎ {customer.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${daysBadgeColor}`}>
                        {bday.daysLeft === 0 ? '¡Hoy! 🎉' : `En ${bday.daysLeft} días`}
                      </span>

                      {/* Action trigger copy */}
                      <button
                        onClick={() => handleCopyInvitation(customer.name, customer.phone, customer.folio, bday.label)}
                        className="p-2 border border-slate-200 hover:border-[#149b8f] rounded-xl text-slate-500 hover:text-[#149b8f] hover:bg-[#149b8f]/5 transition-all cursor-pointer"
                        title="Copiar Invitación para WhatsApp"
                      >
                        {copiedId === customer.folio ? (
                          <Check size={14} className="text-teal-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
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
                    {monthsCustomers.map(({ customer, bday }) => (
                      <div key={customer.folio} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[120px]" title={customer.name}>
                          {customer.name}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          Día {bday.day} (#{customer.folio})
                        </span>
                      </div>
                    ))}
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
