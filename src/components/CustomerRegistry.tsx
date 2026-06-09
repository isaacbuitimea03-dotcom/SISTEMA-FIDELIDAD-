import React, { useState } from 'react';
import { 
  UserPlus, Search, Cake, Mail, Phone, Calendar, Trash2, CheckCircle2, 
  AlertCircle, MessageCircle, Copy, Check, ChevronRight, Sparkles 
} from 'lucide-react';
import { RegisteredCustomer } from '../types';

interface CustomerRegistryProps {
  customers: RegisteredCustomer[];
  onAddCustomer: (customer: RegisteredCustomer) => void;
  onDeleteCustomer: (folio: string) => void;
  onSelectCustomer: (folio: string) => void;
  selectedFolio: string | undefined;
}

export default function CustomerRegistry({
  customers,
  onAddCustomer,
  onDeleteCustomer,
  onSelectCustomer,
  selectedFolio
}: CustomerRegistryProps) {
  // Input form state
  const [folioInput, setFolioInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [birthdayInput, setBirthdayInput] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Messaging & UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedLabelId, setCopiedLabelId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'add'>('list');

  // Validate and submit new customer
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Folio validation
    const cleanFolio = folioInput.trim().padStart(3, '0');
    if (!/^\d{3}$/.test(cleanFolio)) {
      setErrorMsg('El folio debe ser un número entero (ej. 005 o 145)');
      return;
    }

    const folioNum = parseInt(cleanFolio, 10);
    if (folioNum < 0 || folioNum > 500) {
      setErrorMsg('El folio debe estar en el rango de 000 a 500.');
      return;
    }

    // Duplicate folio check
    if (customers.some(c => c.folio === cleanFolio)) {
      setErrorMsg(`El folio ${cleanFolio} ya se encuentra registrado.`);
      return;
    }

    // Basic empty validations
    if (!nameInput.trim()) {
      setErrorMsg('El nombre completo es requerido.');
      return;
    }
    if (!phoneInput.trim()) {
      setErrorMsg('El número de celular es requerido.');
      return;
    }
    if (!emailInput.trim()) {
      setErrorMsg('El correo electrónico es requerido.');
      return;
    }
    if (!birthdayInput) {
      setErrorMsg('La fecha de cumpleaños es requerida.');
      return;
    }

    // Create customer model
    const newCustomer: RegisteredCustomer = {
      folio: cleanFolio,
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      email: emailInput.trim(),
      birthday: birthdayInput,
      currentStamps: 0,
      totalStampsEarned: 0,
      points: 0,
      unlockedVouchers: [],
      visitsHistory: []
    };

    onAddCustomer(newCustomer);
    setSuccessMsg(`¡Cliente registrado exitosamente con el Folio ${cleanFolio}!`);
    
    // Clear form
    setFolioInput('');
    setNameInput('');
    setPhoneInput('');
    setEmailInput('');
    setBirthdayInput('');
    
    // Move back to list view and select new user
    setTimeout(() => {
      setActiveSubTab('list');
      onSelectCustomer(cleanFolio);
      setSuccessMsg('');
    }, 1200);
  };

  // Check birthday status
  const getBirthdayStatus = (birthdayStr: string) => {
    if (!birthdayStr) return { isToday: false, isUpcoming: false, daysLeft: -1 };
    
    const today = new Date();
    const bdate = new Date(birthdayStr);
    
    // Set to same year to compare
    const birthMonth = bdate.getMonth();
    const birthDay = bdate.getDate();
    
    const bdateThisYear = new Date(today.getFullYear(), birthMonth, birthDay);
    
    // If birthday has passed this year, check next year
    let diffTime = bdateThisYear.getTime() - today.getTime();
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 && Math.abs(diffDays) > 1) {
      // Birthday already occurred this year, look at next year
      const bdateNextYear = new Date(today.getFullYear() + 1, birthMonth, birthDay);
      diffTime = bdateNextYear.getTime() - today.getTime();
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const isToday = today.getDate() === birthDay && today.getMonth() === birthMonth;
    const isUpcoming = diffDays >= 0 && diffDays <= 7;

    return {
      isToday,
      isUpcoming,
      daysLeft: isToday ? 0 : diffDays
    };
  };

  // Birthday list helpers
  const birthdayTodayCustomers = customers.filter(c => getBirthdayStatus(c.birthday).isToday);
  const upcomingBirthdayCustomers = customers.filter(c => {
    const status = getBirthdayStatus(c.birthday);
    return status.isUpcoming && !status.isToday;
  }).sort((a, b) => {
    const daysA = getBirthdayStatus(a.birthday).daysLeft;
    const daysB = getBirthdayStatus(b.birthday).daysLeft;
    return daysA - daysB;
  });

  // Filter clients list
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.folio.includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  });

  // Copy invitation text
  const handleCopyInvitation = (customer: RegisteredCustomer, isToday: boolean) => {
    const greeting = isToday ? '¡Feliz Cumpleaños! 🥳🎂' : '¡Ya casi es tu cumpleaños! 🎉🎈';
    const text = `Hola *${customer.name}* ${greeting} de parte de todo el equipo de *Café & Bistró La Estancia* ☕🍳.\n\nQueremos consentirte en tu día especial de cumpleaños. Te invitamos a visitarnos para obsequiarte un delicioso Postre Gourmet gratis 🍰.\n\nY al presentar tu tarjeta física con el folio *#${customer.folio}*, obtendrás doble sella en todos tus consumos de hoy.\n\n¡Te esperamos con los brazos abiertos! Reservaciones llamando al número del restaurante.`;
    
    navigator.clipboard.writeText(text);
    setCopiedLabelId(customer.folio);
    setTimeout(() => {
      setCopiedLabelId(null);
    }, 2500);
  };

  // WhatsApp invite click
  const handleWhatsAppInvite = (customer: RegisteredCustomer, isToday: boolean) => {
    const greeting = isToday ? '¡Feliz Cumpleaños! 🥳🎂' : '¡Ya casi es tu cumpleaños! 🎉🎈';
    const text = encodeURIComponent(`Hola *${customer.name}* ${greeting} de parte de todo el equipo de *Café & Bistró La Estancia* ☕🍳.\n\nQueremos consentirte en tu día especial de cumpleaños. Te invitamos a visitarnos para obsequiarte un delicioso Postre Gourmet gratis 🍰.\n\nY al presentar tu tarjeta física con el folio *#${customer.folio}*, obtendrás doble sella en todos tus consumos de hoy.\n\n¡Te esperamos con los brazos abiertos!`);
    
    const cleanPhone = customer.phone.replace(/[^\d+]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-left">
      
      {/* Birthdays warning / notifier banner */}
      {(birthdayTodayCustomers.length > 0 || upcomingBirthdayCustomers.length > 0) && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-600/15 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="text-emerald-600 animate-bounce" size={20} />
            <span className="font-sans font-extrabold text-sm text-emerald-800 tracking-tight uppercase">Historial & Avisos de Cumpleaños</span>
            <span className="bg-emerald-600 text-white font-mono rounded-full text-[10px] px-2 py-0.5 ml-2 font-bold uppercase animate-pulse">
              AVISO DE ACCIÓN
            </span>
          </div>

          <div className="space-y-3">
            {/* Today birthdays */}
            {birthdayTodayCustomers.map(c => (
              <div key={c.folio} className="bg-white/70 border border-emerald-200/50 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-left">
                  <p className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                    <span>🎉 ¡HOY ES SU CUMPLEAÑOS!</span>
                  </p>
                  <h4 className="text-sm font-sans font-bold text-slate-900 mt-0.5">{c.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">Folio Tarjeta: #{c.folio} • Celular: {c.phone}</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleCopyInvitation(c, true)}
                    className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-sans font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedLabelId === c.folio ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Copiar Invitación
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWhatsAppInvite(c, true)}
                    className="flex-1 sm:flex-none py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <MessageCircle size={13} />
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}

            {/* Upcoming birthdays */}
            {upcomingBirthdayCustomers.map(c => {
              const status = getBirthdayStatus(c.birthday);
              return (
                <div key={c.folio} className="bg-white/40 border border-emerald-100/50 p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                  <div>
                    <span className="font-mono text-emerald-600 font-bold uppercase tracking-wider text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Cumpleaños en {status.daysLeft} {status.daysLeft === 1 ? 'día' : 'días'}
                    </span>
                    <h5 className="font-sans font-bold text-slate-800 mt-1">{c.name} ({new Date(c.birthday).toLocaleDateString('es-ES', {day: 'numeric', month: 'long'})})</h5>
                  </div>
                  <button
                    onClick={() => handleCopyInvitation(c, false)}
                    className="py-1 px-2 text-slate-500 hover:text-emerald-700 font-bold font-mono text-[10px] uppercase flex items-center gap-1.5 hover:underline cursor-pointer bg-transparent border-none mt-1 sm:mt-0"
                  >
                    {copiedLabelId === c.folio ? 'Copiado ✓' : 'Copiar invitación de calentamiento'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Control Switch: List of Customers vs Register New Customer */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => { setActiveSubTab('list'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`py-2 rounded-xl transition-all font-sans font-bold text-xs uppercase cursor-pointer ${
            activeSubTab === 'list' 
              ? 'bg-white text-emerald-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Lista de Clientes Registrados {customers.length > 0 && `(${customers.length})`}
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('add'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`py-2 rounded-xl transition-all font-sans font-bold text-xs uppercase cursor-pointer ${
            activeSubTab === 'add' 
              ? 'bg-white text-emerald-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Registrar Nuevo Cliente
        </button>
      </div>

      {activeSubTab === 'add' ? (
        /* REGISTER NEW CUSTOMER FORM */
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm text-left">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserPlus className="text-emerald-600" size={18} />
            <h3 className="text-base font-bold text-slate-950 font-sans">Formulario de Registro</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Folio Input (Between 000-500) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wide font-semibold block">
                Folio Tarjeta Física <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={3}
                placeholder="Rango 000 - 500 (ej: 015)"
                value={folioInput}
                onChange={(e) => setFolioInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono tracking-widest outline-none transition-all"
              />
              <span className="text-[10px] text-slate-400 font-mono block">Escribe el número de folio de la tarjeta física.</span>
            </div>

            {/* Birthday Date Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wide font-semibold block">
                Fecha de Cumpleaños <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={birthdayInput}
                onChange={(e) => setBirthdayInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono outline-none transition-all"
              />
              <span className="text-[10px] text-slate-400 font-mono block">Historial de alertas automático.</span>
            </div>

            {/* Customer Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wide font-semibold block">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Isaac Buitimea"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
              />
            </div>

            {/* Mobile phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wide font-semibold block">
                Número de Celular (Para WhatsApp) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Ej. 6441234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/[^\d+]/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all font-mono"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wide font-semibold block">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="Ej. cliente@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
              />
            </div>

          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold rounded-xl text-sm shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
          >
            Añadir Cliente y Generar Tarjeta
          </button>
        </form>
      ) : (
        /* CUSTOMERS DIRECTORY LIST & SEARCH SECTION */
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, folio (000-500), correo o celular..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none transition-all"
              />
            </div>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-150">
                <tr>
                  <th className="px-4 py-2.5">Folio</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5">Contacto</th>
                  <th className="px-4 py-2.5">Cumpleaños</th>
                  <th className="px-4 py-2.5 text-center">Tazas (Sellos)</th>
                  <th className="px-4 py-2.5 text-right font-sans">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-sans">
                      No se encontraron clientes registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(customer => {
                    const isSelected = selectedFolio === customer.folio;
                    const isBirthdayObj = getBirthdayStatus(customer.birthday);
                    return (
                      <tr 
                        key={customer.folio}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isSelected ? 'bg-emerald-500/5 font-semibold' : ''
                        }`}
                      >
                        {/* Folio Badge */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                            #{customer.folio}
                          </span>
                        </td>
                        
                        {/* Client details */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-850 flex items-center gap-1">
                            {customer.name}
                            {isSelected && (
                              <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                                ACTIVO
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{customer.email}</div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <div>{customer.phone}</div>
                        </td>

                        {/* Birthday Date with small cake icon if today */}
                        <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {isBirthdayObj.isToday && (
                              <Cake size={11} className="text-red-500 fill-current animate-pulse" />
                            )}
                            {new Date(customer.birthday + 'T00:00:00').toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                        </td>

                        {/* Stamp counter */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                            {customer.currentStamps} / 8
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectCustomer(customer.folio)}
                              className={`py-1 px-2 text-[10px] font-sans font-bold border rounded-lg transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                  : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-650'
                              }`}
                            >
                              {isSelected ? 'Cargado' : 'Cargar Tarjeta'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Estás seguro que deseas eliminar permanentemente al cliente con Folio #${customer.folio}?`)) {
                                  onDeleteCustomer(customer.folio);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                              title="Eliminar Cliente"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Selection indicator helper */}
          {selectedFolio && (
            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex items-center justify-between text-xs font-sans">
              <span className="text-slate-500">
                Cliente activo cargado actualmente: <strong className="text-slate-800">
                  {customers.find(c => c.folio === selectedFolio)?.name || 'Isaac Buitimea'} (Folio #{selectedFolio})
                </strong>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 animate-pulse uppercase font-extrabold flex items-center gap-1">
                <span>Listo dándose de alta</span>
                <ChevronRight size={10} />
              </span>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
