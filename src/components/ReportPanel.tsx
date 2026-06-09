import React, { useState } from 'react';
import { 
  Lock, Unlock, FileText, Printer, BarChart3, TrendingUp, Users, Award, RefreshCw, AlertCircle
} from 'lucide-react';
import { VisitRecord } from '../types';

interface ReportPanelProps {
  visits: VisitRecord[];
  onResetVisits: () => void;
}

export default function ReportPanel({ visits, onResetVisits }: ReportPanelProps) {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password.trim() === 'BISTRO2026') {
      setIsUnlocked(true);
      setPassword('');
    } else {
      setErrorMsg('Clave de acceso incorrecta. Inténtalo de nuevo.');
      setPassword('');
    }
  };

  // Trigger professional native SVG page print action
  const handlePrint = () => {
    window.print();
  };

  // Group stats by clerks
  const clerkStats = visits.reduce((acc, visit) => {
    const key = visit.clerkName || 'OTRO';
    if (!acc[key]) {
      acc[key] = { stamps: 0, actions: 0 };
    }
    acc[key].stamps += visit.stampsAdded;
    acc[key].actions += 1;
    return acc;
  }, {} as Record<string, { stamps: number, actions: number }>);

  // Total Stamps Registered
  const totalStampsAll = visits.reduce((sum, v) => sum + v.stampsAdded, 0);

  if (!isUnlocked) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto text-center shadow-lg my-6">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Lock size={24} />
        </div>
        
        <h3 className="text-lg font-sans font-extrabold text-slate-900">Apartado de Reportes Protegidos</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
          Esta sección contiene estadísticas sensitivas, registros de cajeros e historiales detallados. Por favor digite la clave de administrador.
        </p>

        <form onSubmit={handleUnlock} className="mt-6 space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold block">Clave del Líder / Gerente:</label>
            <input
              type="password"
              placeholder="Digite clave secreta..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500/50 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none font-mono tracking-widest text-center"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-150 text-red-650 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0 text-red-500" />
              <span className="text-left font-sans">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Unlock size={14} />
            Desbloquear Reportes
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Printable Report Section wrapper */}
      <div id="printable-report-area" className="space-y-6">
        
        {/* Header Block for Print & Visual */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">
              Reporte Oficial de Rendimiento
            </span>
            <h3 className="text-xl font-display font-black text-slate-900 mt-1">Historial & Control de Visitas</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono uppercase">Café & Bistró La Estancia • Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 md:flex-none py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Printer size={14} />
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Estas seguro que deseas limpiar todo el historial de visitas registradas por los cajeros? Esta acción no se puede deshacer.')) {
                  onResetVisits();
                }
              }}
              className="py-2 px-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-650 text-slate-500 rounded-xl transition-all cursor-pointer"
              title="Reiniciar Historial"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* PRINT SPECIFIC HEADER TITLE (Hidden on Screen unless print is requested) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 text-left">
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Reporte Integrado de Programa de Lealtad</h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">Módulo de Auditoría de Visitas y Sellos — Bistro Club</p>
          <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono">
            <div>
              <strong>Negocio:</strong> Café & Bistró La Estancia<br />
              <strong>Fecha Emisión:</strong> {new Date().toLocaleString('es-ES')}<br />
              <strong>Filtro de Folios:</strong> 000 a 500
            </div>
            <div className="text-right">
              <strong>Estatus Base:</strong> Autenticado con código de seguridad BISTRO2026<br />
              <strong>Total Registros:</strong> {visits.length} Visitas
            </div>
          </div>
        </div>

        {/* Telemetry Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Box 1 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Total Visitas</span>
                <h4 className="text-2xl font-sans font-extrabold text-slate-900 mt-0.5">{visits.length}</h4>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <p className="text-[10px] text-slate-450 font-mono uppercase mt-2.5">Registradas en mostrador</p>
          </div>

          {/* Box 2 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Sellos Registrados</span>
                <h4 className="text-2xl font-sans font-extrabold text-emerald-600 mt-0.5">{totalStampsAll}</h4>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award size={16} />
              </div>
            </div>
            <p className="text-[10px] text-slate-450 font-mono uppercase mt-2.5">Equivale a {Math.floor(totalStampsAll / 8)} premios grandes</p>
          </div>

          {/* Box 3 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Cajeros Activos</span>
                <h4 className="text-2xl font-sans font-extrabold text-slate-900 mt-0.5">
                  {Object.keys(clerkStats).length}
                </h4>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="text-[10px] text-slate-450 font-mono uppercase mt-2.5">Supervisando flujos físicos</p>
          </div>
        </div>

        {/* Clerk activity table breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <BarChart3 size={14} className="text-emerald-600" />
            Desglose de Visitas por Cajero / Líder
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            {[
              { name: 'JOSE LUIS', code: 'CO1' },
              { name: 'DIANA', code: 'CR02' },
              { name: 'NOELIA', code: 'C03' },
              { name: 'AMAIRANI', code: 'CR04' },
              { name: 'GISELA', code: 'C05' }
            ].map(clerk => {
              const stats = clerkStats[clerk.name] || { stamps: 0, actions: 0 };
              return (
                <div key={clerk.code} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{clerk.code}</span>
                  <h5 className="font-sans font-bold text-xs text-slate-800 mt-2">{clerk.name}</h5>
                  <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-slate-200/50 text-[10px] font-mono text-slate-500">
                    <div>
                      <p>Entradas</p>
                      <strong className="text-slate-800">{stats.actions}</strong>
                    </div>
                    <div>
                      <p>Tazas</p>
                      <strong className="text-emerald-600">+{stats.stamps}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Visits Log Report */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <FileText size={14} className="text-slate-500" />
            Registro de Visitas Recientes (Completo 000 - 500)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Fecha & Hora</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5">Folio</th>
                  <th className="px-4 py-2.5 text-center">Tazas colocadas</th>
                  <th className="px-4 py-2.5 text-right">Cajero / Autorizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No hay transacciones registradas por los líderes o cajeros en esta sesión.
                    </td>
                  </tr>
                ) : (
                  visits.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50">
                      {/* Timestamp */}
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {new Date(record.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {new Date(record.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      
                      {/* Customer name */}
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {record.customerName}
                      </td>

                      {/* Customer Folio */}
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          #{record.customerFolio}
                        </span>
                      </td>

                      {/* Stamps count */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          +{record.stampsAdded} {record.stampsAdded === 1 ? 'Taza' : 'Tazas'}
                        </span>
                      </td>

                      {/* Admin Clerk */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                        <span>{record.clerkName}</span>
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] ml-1.5">{record.clerkCode}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Styled Printable rule stylesheet for standard layout integration */}
      <style>{`
        @media print {
          /* Hide all components except the print area */
          body * {
            visibility: hidden !important;
          }
          #loyalty-app-container {
            background-color: white !important;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible !important;
          }
          #printable-report-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background-color: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
