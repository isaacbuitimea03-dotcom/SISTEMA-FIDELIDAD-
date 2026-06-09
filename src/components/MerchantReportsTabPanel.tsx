import React, { useState } from 'react';
import { 
  FileText, Sliders, Calendar, Search, Trash2, 
  Plus, MessageSquare, HelpCircle, Download, Check, ToggleLeft, ToggleRight
} from 'lucide-react';
import { RegisteredCustomer, VisitRecord, ActivityLog } from '../types';

interface Survey {
  id: string;
  title: string;
  question: string;
  options: string[];
  reward: string;
  active: boolean;
  submissionsCount: number;
}

interface MerchantReportsTabPanelProps {
  customers: RegisteredCustomer[];
  visits: VisitRecord[];
  logs: ActivityLog[];
  onResetAllData?: () => void;
}

export default function MerchantReportsTabPanel({ 
  customers, 
  visits, 
  logs, 
  onResetAllData 
}: MerchantReportsTabPanelProps) {
  const [filterPeriod, setFilterPeriod] = useState<'todo' | 'semana' | 'mes' | 'anio'>('todo');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  
  // Custom Surveys State
  const [surveys, setSurveys] = useState<Survey[]>([
    {
      id: 'sv01',
      title: 'Satisfacción del Café',
      question: '¿Qué le pareció la intensidad y sabor de nuestros granos de especialidad esta semana?',
      options: ['Excelente sabor', 'Muy fuerte', 'Le falta cuerpo', 'No consumo café'],
      reward: '10% de descuento',
      active: true,
      submissionsCount: 42
    },
    {
      id: 'sv02',
      title: 'Limpieza y Atención',
      question: '¿Cómo evalúa el tiempo de espera por parte del barista?',
      options: ['Inmediato (<5 min)', 'Estándar (5-10 min)', 'Lento (>10 min)'],
      reward: 'Café de cortesía',
      active: true,
      submissionsCount: 19
    }
  ]);

  // Survey Builder state
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyQuestion, setNewSurveyQuestion] = useState('');
  const [newSurveyOption, setNewSurveyOption] = useState('');
  const [newSurveyOptionsList, setNewSurveyOptionsList] = useState<string[]>([]);
  const [newSurveyReward, setNewSurveyReward] = useState('10% de descuento');

  // Trigger feedback
  const [showMockExportSuccess, setShowMockExportSuccess] = useState<string | null>(null);

  // Filter logs by period
  const getFilteredLogs = () => {
    let filtered = [...logs];
    const today = new Date('2026-06-09T00:37:48Z');
    
    if (filterPeriod === 'semana') {
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= oneWeekAgo.getTime());
    } else if (filterPeriod === 'mes') {
      const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= oneMonthAgo.getTime());
    } else if (filterPeriod === 'anio') {
      const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= oneYearAgo.getTime());
    }

    if (logSearchQuery.trim() !== '') {
      const query = logSearchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.clerkCode?.toLowerCase().includes(query) ||
        l.clerkName?.toLowerCase().includes(query) ||
        l.customerFolio?.toLowerCase().includes(query) ||
        l.title.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Dynamic Clerk activity metrics
  const getClerkMetrics = () => {
    const counts: Record<string, { total: number; registers: number; visits: number }> = {
      'CO1': { total: 0, registers: 0, visits: 0 },
      'CR02': { total: 0, registers: 0, visits: 0 },
      'C03': { total: 0, registers: 0, visits: 0 },
      'CR04': { total: 0, registers: 0, visits: 0 },
      'C05': { total: 0, registers: 0, visits: 0 }
    };

    logs.forEach(l => {
      const normalizedCode = l.clerkCode?.toUpperCase()
        .replace(/\s+/g, '')
        .replace('O', '0'); // standardizes CO1 to C01 or similar

      let targetKey = '';
      if (normalizedCode?.includes('C01') || normalizedCode?.includes('CO1')) targetKey = 'CO1';
      else if (normalizedCode?.includes('CR02')) targetKey = 'CR02';
      else if (normalizedCode?.includes('C03')) targetKey = 'C03';
      else if (normalizedCode?.includes('CR04')) targetKey = 'CR04';
      else if (normalizedCode?.includes('C05')) targetKey = 'C05';

      if (targetKey && counts[targetKey]) {
        counts[targetKey].total += 1;
        if ((l.type as string) === 'customer_registered' || l.description?.includes('Registro')) {
          counts[targetKey].registers += 1;
        } else {
          counts[targetKey].visits += 1;
        }
      }
    });

    return counts;
  };

  const handleAddOptionToNewSurvey = () => {
    if (newSurveyOption.trim() !== '') {
      setNewSurveyOptionsList([...newSurveyOptionsList, newSurveyOption.trim()]);
      setNewSurveyOption('');
    }
  };

  const handlePublishSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitle || !newSurveyQuestion) return;
    
    const s: Survey = {
      id: 'sv_' + Date.now(),
      title: newSurveyTitle,
      question: newSurveyQuestion,
      options: newSurveyOptionsList.length > 0 ? newSurveyOptionsList : ['Bueno', 'Regular', 'Malo'],
      reward: newSurveyReward,
      active: true,
      submissionsCount: 0
    };

    setSurveys([s, ...surveys]);
    
    // Clear forms
    setNewSurveyTitle('');
    setNewSurveyQuestion('');
    setNewSurveyOptionsList([]);
    setNewSurveyReward('10% de descuento');
    
    setShowMockExportSuccess('¡Encuesta creada con éxito!');
    setTimeout(() => setShowMockExportSuccess(null), 3000);
  };

  const handleToggleSurvey = (id: string) => {
    setSurveys(surveys.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleDeleteSurvey = (id: string) => {
    setSurveys(surveys.filter(s => s.id !== id));
  };

  const currentClerkCounts = getClerkMetrics();
  const sortedFilteredLogs = getFilteredLogs();

  // Mock Export files triggers
  const triggerMockExport = (reportType: string) => {
    setShowMockExportSuccess(`Espere un momento... Descargando reporte en formato PDF (${reportType})`);
    setTimeout(() => {
      setShowMockExportSuccess(`¡Reporte cargado con éxito! Se ha descargado "Reporte_${reportType}_Cafecito_2026.pdf"`);
      setTimeout(() => setShowMockExportSuccess(null), 4000);
    }, 1500);
  };

  // Top Customers
  const topCustomers = [...customers]
    .sort((a, b) => b.totalStampsEarned - a.totalStampsEarned)
    .slice(0, 5);

  return (
    <div className="w-full space-y-7 text-left">
      
      {/* Mock Export Success Banner Alert */}
      {showMockExportSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-slate-800 p-4 rounded-2xl flex items-center gap-2.5 shadow-sm text-xs font-bold animate-pulse">
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <Check size={11} className="stroke-[3]" />
          </div>
          <span>{showMockExportSuccess}</span>
        </div>
      )}

      {/* Header Top Export Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg bg-white border border-slate-200 p-3.5 rounded-2xl">
        <span className="text-xs text-slate-500 font-medium">Exportar reportes del sistema para auditoria y cortes externos:</span>
        <div className="flex gap-2">
          <button
            onClick={() => triggerMockExport('Encuestas')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-slate-250"
          >
            <FileText size={13} />
            📄 PDF Encuestas
          </button>
          
          <button
            onClick={() => triggerMockExport('Fidelidad')}
            className="px-3.5 py-1.5 bg-[#149b8f] hover:bg-[#11847a] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1"
          >
            <Download size={13} />
            📥 Reporte Fidelidad
          </button>
        </div>
      </div>

      {/* Grid of 4 metrics Cards (Screen 9) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clientes Registrados', value: customers.length, color: 'text-[#149b8f]' },
          { label: 'Visitas Totales', value: visits.length > 0 ? visits.length : 124, color: 'text-slate-800' },
          { label: 'Premios Otorgados', value: customers.reduce((sum, c) => sum + (c.unlockedVouchers?.length || 0), 0) || 12, color: 'text-rose-600' },
          { label: 'Promedio Visitas/Cliente', value: ( (visits.length > 0 ? visits.length : 124) / customers.length).toFixed(1), color: 'text-teal-700' }
        ].map((met, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-sans text-slate-400 font-bold tracking-wider">{met.label}</p>
            <h3 className={`text-2xl font-serif font-black ${met.color} mt-1.5`}>{met.value}</h3>
          </div>
        ))}
      </div>

      {/* Period Select Filter Tab Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">Filtrar registros por período:</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'todo', label: 'Todo' },
            { id: 'semana', label: 'Esta semana' },
            { id: 'mes', label: 'Este mes' },
            { id: 'anio', label: 'Este año' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterPeriod(btn.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filterPeriod === btn.id
                  ? 'bg-slate-900 border-slate-950 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clerk and Survey widgets inside a bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Actividad por Clave de Encargado (Screen 9) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-150 pb-2 flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
            <span>Encargado (Clasificados)</span>
            <span>Total Acciones</span>
          </div>

          <div className="space-y-3">
            {[
              { code: 'CR02', name: 'Diana', value: currentClerkCounts['CR02'].total || 14 },
              { code: 'C03', name: 'Noelia', value: currentClerkCounts['C03'].total || 8 },
              { code: 'C01', name: 'Jose Luis', value: currentClerkCounts['CO1'].total || 5 },
              { code: 'CR04', name: 'Amairani', value: currentClerkCounts['CR04'].total || 0 },
              { code: 'C05', name: 'Gisela', value: currentClerkCounts['C05'].total || 0 }
            ].map(clerk => (
              <div key={clerk.code} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-150/60 text-xs shadow-inner">
                <div className="space-y-0.5">
                  <span className="font-mono bg-cyan-50 text-cyan-800 font-black px-2 py-0.5 border border-cyan-150 rounded">
                    {clerk.code}
                  </span>
                  <span className="ml-2 font-bold text-slate-700">{clerk.name}</span>
                </div>
                <span className="font-mono font-black text-[#149b8f] text-sm">{clerk.value} acciones</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Charts using visual custom meters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-black text-sm text-slate-800 border-b border-slate-150 pb-2">
            Top Clientes Frecuentes
          </h3>

          <div className="space-y-3.5">
            {topCustomers.map((cust, idx) => {
              const maxStamps = Math.max(...customers.map(c => c.totalStampsEarned));
              const widthPerc = maxStamps > 0 ? (cust.totalStampsEarned / maxStamps) * 100 : 50;
              return (
                <div key={cust.folio} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>{idx + 1}. {cust.name} (#{cust.folio})</span>
                    <span>{cust.totalStampsEarned} tazas</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-[#149b8f] to-teal-400 rounded-full" 
                      style={{ width: `${widthPerc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Encuestas para Clientes Form Section (Screen 11) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
        <h3 className="font-serif font-black text-base text-slate-900 border-b border-slate-150 pb-2 flex items-center gap-1.5">
          <MessageSquare size={18} className="text-[#149b8f]" />
          Encuestas para Clientes
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          
          {/* Survey Builder Form */}
          <form onSubmit={handlePublishSurvey} className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="text-slate-500 font-bold uppercase tracking-wider block">Título de la Encuesta</label>
              <input
                type="text"
                required
                placeholder="Ejemplo: Satisfacción del Servicio"
                value={newSurveyTitle}
                onChange={(e) => setNewSurveyTitle(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-bold uppercase tracking-wider block">Pregunta para el Cliente</label>
              <textarea
                required
                rows={2}
                placeholder="¿Qué le parecen las bebidas de espresso de nuestra sucursal?"
                value={newSurveyQuestion}
                onChange={(e) => setNewSurveyQuestion(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-bold uppercase tracking-wider block">Respuestas de Opción de Opción Múltiples</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar opción..."
                  value={newSurveyOption}
                  onChange={(e) => setNewSurveyOption(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddOptionToNewSurvey}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-250 font-bold transition-all text-xs flex items-center gap-0.5"
                >
                  <Plus size={13} /> Agregar
                </button>
              </div>

              {newSurveyOptionsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  {newSurveyOptionsList.map((opt, oIdx) => (
                    <span key={oIdx} className="bg-white border rounded px-2.5 py-0.5 font-sans font-medium text-slate-600">
                      {opt}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewSurveyOptionsList([])}
                    className="text-red-500 hover:text-red-600 font-bold ml-auto"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-bold uppercase tracking-wider block">Recompensa tras Responder (Cupón de Regalo)</label>
              <select
                value={newSurveyReward}
                onChange={(e) => setNewSurveyReward(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
              >
                <option value="10% de descuento">10% de descuento de cortesía</option>
                <option value="Café de cortesía">Café de especialidad gratis</option>
                <option value="Postre gratis">Postre casero gratis</option>
                <option value="Sin recompensa">Sin premio (solo estadísticas)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#149b8f] hover:bg-[#11847a] text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              🚀 Crear y Publicar Encuesta
            </button>
          </form>

          {/* Active Published Surveys List */}
          <div className="space-y-3.5">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block border-b border-slate-100 pb-1.5">
              Encuestas Activas en Tablet/QR ({surveys.length})
            </h4>

            {surveys.map((sv) => (
              <div key={sv.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3 relative text-xs">
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 text-sm">{sv.title}</span>
                    <span className="bg-[#149b8f]/5 text-[#149b8f] border border-[#149b8f]/20 font-bold rounded px-2 py-0.5 font-mono text-[9px] uppercase">
                      Premio: {sv.reward}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed italic">"{sv.question}"</p>
                  
                  {/* Stats Submissions */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-slate-400">Respuestas: <strong>{sv.submissionsCount}</strong></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#149b8f] animate-ping" />
                    <span className="text-[10px] text-emerald-600 font-bold">Activo en Portal</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 relative">
                  <button
                    onClick={() => handleToggleSurvey(sv.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 transition"
                    title={sv.active ? 'Pausar encuesta' : 'Activar encuesta'}
                  >
                    {sv.active ? <ToggleRight size={20} className="text-teal-600" /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => handleDeleteSurvey(sv.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition"
                    title="Eliminar encuesta"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registro Detallado de Acciones Table (Screen 10) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-serif font-black text-base text-slate-900 border-b border-slate-150 pb-2 flex items-center gap-1.5">
          <Sliders size={18} className="text-[#149b8f]" />
          Registro Detallado de Acciones
        </h3>

        {/* Query Input Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Buscar por cliente, encargado (Diana, Noelia, etc.) o acción..."
            value={logSearchQuery}
            onChange={(e) => setLogSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/55 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all"
          />
        </div>

        {/* Beautiful Table Layout */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full border-collapse text-left text-xs bg-white">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Encargado</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Acción</th>
                <th className="p-3.5 text-right">Estatus tazas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedFilteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">No hay registros que coincidan con la búsqueda.</td>
                </tr>
              ) : (
                sortedFilteredLogs.map((item) => {
                  const dateStr = new Date(item.timestamp).toLocaleString('es-MX', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: false
                  });
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">{dateStr}</td>
                      <td className="p-3.5">
                        <span className="font-mono bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                          {item.clerkCode || 'GER'}
                        </span>
                        <span className="ml-1.5 font-medium text-slate-650">{item.clerkName || 'Gerencia'}</span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {item.title?.replace('Registro de Visita #', 'Cliente #') || 'Socio'} 
                        <span className="block text-[10px] text-slate-400 font-normal">{item.description?.split(' para ')?.[1] || ''}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {(item.type as string) === 'customer_registered' ? '🆕 Registro Nuevo' : '☕ Visita registrada'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-[#149b8f]">
                        {(item.type as string) === 'stamp_added' ? `+${item.amount} taza(s)` : 'Creado'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
