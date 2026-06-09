import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  FileText, Sliders, Calendar, Search, Trash2, 
  Plus, MessageSquare, HelpCircle, Download, Check, ToggleLeft, ToggleRight,
  Eye, ClipboardList, Settings, Sparkles, HelpCircle as QuestionIcon,
  Copy, ExternalLink, Smartphone, Lock, Unlock, Key, UserPlus, Edit
} from 'lucide-react';
import { RegisteredCustomer, VisitRecord, ActivityLog, Survey, SurveyAnswer, SurveyQuestion, Clerk } from '../types';

interface MerchantReportsTabPanelProps {
  customers: RegisteredCustomer[];
  visits: VisitRecord[];
  logs: ActivityLog[];
  onResetAllData?: () => void;
  surveys: Survey[];
  setSurveys: React.Dispatch<React.SetStateAction<Survey[]>>;
  surveyAnswers: SurveyAnswer[];
  clerks: Clerk[];
  setClerks: React.Dispatch<React.SetStateAction<Clerk[]>>;
}

export default function MerchantReportsTabPanel({ 
  customers, 
  visits, 
  logs, 
  onResetAllData,
  surveys,
  setSurveys,
  surveyAnswers,
  clerks,
  setClerks
}: MerchantReportsTabPanelProps) {
  const [filterPeriod, setFilterPeriod] = useState<'todo' | 'semana' | 'mes' | 'anio'>('todo');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Access key logic for "Claves y Registros" (required password: FIELES)
  const [gestorUnlockCode, setGestorUnlockCode] = useState('');
  const [isGestorUnlocked, setIsGestorUnlocked] = useState(false);
  const [gestorUnlockError, setGestorUnlockError] = useState('');

  const handleUnlockGestor = (e: React.FormEvent) => {
    e.preventDefault();
    setGestorUnlockError('');
    if (gestorUnlockCode.toUpperCase().trim() === 'FIELES') {
      setIsGestorUnlocked(true);
      setGestorUnlockCode('');
    } else {
      setGestorUnlockError('Código de acceso incorrecto. Inténtalo de nuevo.');
    }
  };

  // Clerk Manager Form States
  const [newClerkName, setNewClerkName] = useState('');
  const [newClerkCode, setNewClerkCode] = useState('');
  const [newClerkPin, setNewClerkPin] = useState('');
  const [clerkFormError, setClerkFormError] = useState('');
  const [clerkFormSuccess, setClerkFormSuccess] = useState('');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [clerkToDelete, setClerkToDelete] = useState<Clerk | null>(null);

  // Editing Clerk States
  const [editingClerk, setEditingClerk] = useState<Clerk | null>(null);
  const [editClerkName, setEditClerkName] = useState('');
  const [editClerkPin, setEditClerkPin] = useState('');

  const handleStartEditClerk = (c: Clerk) => {
    setEditingClerk(c);
    setEditClerkName(c.name);
    setEditClerkPin(c.pin);
    setClerkFormError('');
    setClerkFormSuccess('');
    setClerkToDelete(null);
  };

  const handleSaveClerkEdit = (originalCode: string) => {
    setClerkFormError('');
    setClerkFormSuccess('');

    const name = editClerkName.trim();
    const pin = editClerkPin.trim();

    if (!name) {
      setClerkFormError('El nombre del encargado es requerido.');
      return;
    }

    if (!pin) {
      setClerkFormError('La clave PIN es requerida.');
      return;
    }

    if (pin.length !== 4) {
      setClerkFormError('La clave PIN debe ser de exactamente 4 caracteres (ej. A123, puedes usar letras y números).');
      return;
    }

    // Check PIN duplication with OTHER clerks
    if (clerks.some(c => c.code !== originalCode && c.pin === pin) || pin === 'BISTRO2026') {
      setClerkFormError('Esta clave PIN ya se encuentra asignada a otro encargado.');
      return;
    }

    const updatedClerks = clerks.map(c => {
      if (c.code === originalCode) {
        return {
          ...c,
          name,
          label: `${name.toUpperCase()}(${c.code})`,
          pin
        };
      }
      return c;
    });

    setClerks(updatedClerks);
    setClerkFormSuccess(`¡Se han guardado los cambios para "${name}" con éxito!`);
    setEditingClerk(null);

    setTimeout(() => setClerkFormSuccess(''), 4000);
  };

  const togglePinReveal = (code: string) => {
    setRevealedPins(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const handleCreateClerkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClerkFormError('');
    setClerkFormSuccess('');

    const name = newClerkName.trim();
    let code = newClerkCode.trim().toUpperCase();
    const pin = newClerkPin.trim();

    if (!name) {
      setClerkFormError('El nombre del encargado es requerido.');
      return;
    }

    if (!pin) {
      setClerkFormError('La clave PIN es requerida.');
      return;
    }

    if (pin.length !== 4) {
      setClerkFormError('La clave PIN debe ser de exactamente 4 caracteres (puedes usar letras y números, ej. A123).');
      return;
    }

    // Auto-code generation if empty
    if (!code) {
      const matchNums = clerks.map(c => {
        const m = c.code.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      });
      const nextNum = Math.max(0, ...matchNums) + 1;
      code = `C${String(nextNum).padStart(2, '0')}`;
    }

    // Check code duplication
    if (clerks.some(c => c.code.toUpperCase() === code.toUpperCase())) {
      setClerkFormError(`El código "${code}" ya está en uso.`);
      return;
    }

    // Check PIN duplication
    if (clerks.some(c => c.pin === pin) || pin === 'BISTRO2026') {
      setClerkFormError('Este PIN ya está asignado a otro encargado.');
      return;
    }

    const newClerk: Clerk = {
      code,
      name,
      label: `${name.toUpperCase()}(${code})`,
      pin
    };

    setClerks([...clerks, newClerk]);
    setClerkFormSuccess(`¡Se ha registrado con éxito a "${name}" con código "${code}"!`);

    // Reset fields
    setNewClerkName('');
    setNewClerkCode('');
    setNewClerkPin('');

    setTimeout(() => setClerkFormSuccess(''), 4000);
  };

  const handleDeleteClerk = (c: Clerk) => {
    setClerkFormError('');
    setClerkFormSuccess('');
    if (clerks.length <= 1) {
      setClerkFormError('Debes dejar al menos un encargado activo en el sistema.');
      return;
    }
    setClerkToDelete(c);
  };
  
  // Campaign Mode state
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  
  // Dynamic list of questions being compiled for a new campaign
  const [campaignQuestions, setCampaignQuestions] = useState<SurveyQuestion[]>([]);
  
  // Question Builder fields (used when isCampaignMode is true)
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'multiple' | 'open'>('multiple');
  const [newQuestionOption, setNewQuestionOption] = useState('');
  const [newQuestionOptionsList, setNewQuestionOptionsList] = useState<string[]>([]);

  // General survey configuration
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyReward, setNewSurveyReward] = useState('10% de descuento');

  // Single Question fallback fields (used when isCampaignMode is false)
  const [newSurveyQuestion, setNewSurveyQuestion] = useState('');
  const [newSurveyOption, setNewSurveyOption] = useState('');
  const [newSurveyOptionsList, setNewSurveyOptionsList] = useState<string[]>([]);

  // Trigger feedback
  const [showMockExportSuccess, setShowMockExportSuccess] = useState<string | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState<string | null>(null); // survey ID or null

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
    const counts: Record<string, { total: number; registers: number; visits: number }> = {};
    
    // Initialize with all current clerks
    clerks.forEach(cl => {
      counts[cl.code.toUpperCase()] = { total: 0, registers: 0, visits: 0 };
    });

    logs.forEach(l => {
      if (!l.clerkCode) return;
      const normalizedCode = l.clerkCode.toUpperCase().replace(/\s+/g, '').replace('O', '0');
      
      // Look for a match in our dynamic clerks list
      const matchedClerk = clerks.find(c => {
        const cCode = c.code.toUpperCase().replace(/\s+/g, '').replace('O', '0');
        return cCode === normalizedCode || normalizedCode.includes(cCode) || cCode.includes(normalizedCode);
      });

      if (matchedClerk) {
        const key = matchedClerk.code.toUpperCase();
        if (!counts[key]) {
          counts[key] = { total: 0, registers: 0, visits: 0 };
        }
        counts[key].total += 1;
        if ((l.type as string) === 'customer_registered' || l.description?.includes('Registro')) {
          counts[key].registers += 1;
        } else {
          counts[key].visits += 1;
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

  // For Campaign mode dynamic questions build
  const handleAddOptionToQuestion = () => {
    if (newQuestionOption.trim() !== '') {
      setNewQuestionOptionsList([...newQuestionOptionsList, newQuestionOption.trim()]);
      setNewQuestionOption('');
    }
  };

  const handleAddQuestionToCampaign = () => {
    if (newQuestionText.trim() === '') {
      alert('Por favor ingresa el texto de la pregunta.');
      return;
    }
    
    // For multiple choice, check that we have options
    if (newQuestionType === 'multiple' && newQuestionOptionsList.length === 0) {
      alert('Por favor agrega al menos una opción de respuesta para la pregunta de Opción Múltiple.');
      return;
    }

    const newQ: SurveyQuestion = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: newQuestionText.trim(),
      type: newQuestionType,
      options: newQuestionType === 'multiple' ? [...newQuestionOptionsList] : undefined
    };

    setCampaignQuestions([...campaignQuestions, newQ]);

    // Clear question builders
    setNewQuestionText('');
    setNewQuestionType('multiple');
    setNewQuestionOptionsList([]);
    setNewQuestionOption('');
  };

  const handlePublishSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitle.trim()) {
      alert('Por favor ingresa un título para la encuesta/campaña.');
      return;
    }

    let s: Survey;

    if (isCampaignMode) {
      if (campaignQuestions.length === 0) {
        alert('Por favor agrega al menos una pregunta a tu campaña.');
        return;
      }

      s = {
        id: 'sv_' + Date.now(),
        title: newSurveyTitle.trim(),
        isCampaign: true,
        questions: campaignQuestions,
        question: campaignQuestions[0].text, // fallback
        options: campaignQuestions[0].options || [], // fallback
        reward: newSurveyReward,
        active: true,
        submissionsCount: 0
      };
    } else {
      if (!newSurveyQuestion.trim()) {
        alert('Por favor ingresa la pregunta para el cliente.');
        return;
      }

      const singleQ: SurveyQuestion = {
        id: 'q_' + Date.now(),
        text: newSurveyQuestion.trim(),
        type: 'multiple',
        options: newSurveyOptionsList.length > 0 ? newSurveyOptionsList : ['Excelente', 'Regular', 'Malo']
      };

      s = {
        id: 'sv_' + Date.now(),
        title: newSurveyTitle.trim(),
        isCampaign: false,
        questions: [singleQ],
        question: newSurveyQuestion.trim(),
        options: singleQ.options || [],
        reward: newSurveyReward,
        active: true,
        submissionsCount: 0
      };
    }

    setSurveys([s, ...surveys]);

    // Clear everything
    setNewSurveyTitle('');
    setNewSurveyQuestion('');
    setNewSurveyOptionsList([]);
    setNewSurveyOption('');
    setCampaignQuestions([]);
    setIsCampaignMode(false);
    setNewSurveyReward('10% de descuento');

    setShowMockExportSuccess('¡Encuesta/Campaña creada y publicada con éxito!');
    setTimeout(() => setShowMockExportSuccess(null), 3000);
  };

  const handleToggleSurvey = (id: string) => {
    setSurveys(surveys.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleDeleteSurvey = (id: string) => {
    if (confirm('¿Deseas eliminar permanentemente esta encuesta/campaña del sistema?')) {
      setSurveys(surveys.filter(s => s.id !== id));
    }
  };

  const currentClerkCounts = getClerkMetrics();
  const sortedFilteredLogs = getFilteredLogs();

  // Real Export PDF files triggers using jsPDF
  const triggerMockExport = (reportType: string) => {
    setShowMockExportSuccess(`Espere un momento... Generando y descargando reporte de ${reportType} en PDF`);
    
    try {
      const doc = new jsPDF();
      let y = 15;

      const addText = (text: string, x: number, fontSize = 10, option: { fontStyle?: 'normal' | 'bold' | 'italic', align?: 'left' | 'center' | 'right' } = {}) => {
        if (y > 275) {
          doc.addPage();
          y = 15;
        }
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', option.fontStyle || 'normal');
        
        if (option.align === 'center') {
          doc.text(text, 105, y, { align: 'center' });
        } else if (option.align === 'right') {
          doc.text(text, 195, y, { align: 'right' });
        } else {
          doc.text(text, x, y);
        }
      };

      const drawHeader = (title: string) => {
        doc.setFillColor(20, 155, 143); // #149b8f (Cafecito Teal)
        doc.rect(10, y, 190, 22, 'F');
        
        y += 8;
        doc.setTextColor(255, 255, 255);
        addText(title.toUpperCase(), 15, 13, { fontStyle: 'bold' });
        
        y += 6;
        addText(`CAFÉ & BISTRÓ LA ESTANCIA • GENERADO: ${new Date().toLocaleString('es-MX')}`, 15, 8, { fontStyle: 'normal' });
        
        y += 18;
        doc.setTextColor(51, 65, 85); // Slate
      };

      if (reportType === 'Fidelidad') {
        drawHeader('Reporte de Fidelidad y Tarjetas de Socios');
        
        // Sumarios
        addText('Estadísticas Generales del Club:', 12, 11, { fontStyle: 'bold' });
        y += 6;
        const totalVisitsCount = customers.reduce((acc, c) => acc + (c.totalStampsEarned || 0), 0);
        const totalUnlockedVouchers = customers.reduce((acc, c) => acc + (c.unlockedVouchers?.length || 0), 0);
        addText(`• Total de Socios Registrados: ${customers.length} clientes`, 15, 9);
        addText(`• Visitas / Sellos Totales Acumulados: ${totalVisitsCount} cafés acreditados`, 15, 9);
        addText(`• Cupones de Recompensa Desbloqueados: ${totalUnlockedVouchers} beneficios`, 15, 9);
        
        y += 10;

        // Header de Tabla de Socios
        doc.setFillColor(241, 245, 249);
        doc.rect(10, y, 190, 8, 'F');
        y += 6;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('FOLIO', 12, y);
        doc.text('NOMBRE DEL SOCIO', 28, y);
        doc.text('TELÉFONO', 85, y);
        doc.text('SELLOS ACT.', 125, y);
        doc.text('RECOMPENSAS', 150, y);
        doc.text('PUNTOS', 182, y);
        
        y += 6;

        customers.forEach((c) => {
          if (y > 275) {
            doc.addPage();
            y = 15;
            // Redraw header de la tabla en nueva página
            doc.setFillColor(241, 245, 249);
            doc.rect(10, y, 190, 8, 'F');
            y += 6;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('FOLIO', 12, y);
            doc.text('NOMBRE DEL SOCIO', 28, y);
            doc.text('TELÉFONO', 85, y);
            doc.text('SELLOS ACT.', 125, y);
            doc.text('RECOMPENSAS', 150, y);
            doc.text('PUNTOS', 182, y);
            y += 6;
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(String(c.folio || ''), 12, y);

          let trimmedName = c.name || 'Socio sin nombre';
          if (trimmedName.length > 25) {
            trimmedName = trimmedName.substring(0, 23) + '...';
          }
          doc.text(trimmedName, 28, y);
          doc.text(String(c.phone || 'N/A'), 85, y);
          doc.text(`${c.currentStamps || 0}/10`, 128, y);

          const redeemed = c.unlockedVouchers?.filter(v => v.isRedeemed).length || 0;
          const totalV = c.unlockedVouchers?.length || 0;
          doc.text(`${redeemed} de ${totalV} canjeados`, 150, y);

          doc.text(`${c.points || 0} pts`, 182, y);

          // Divider line
          doc.setDrawColor(241, 245, 249);
          doc.line(10, y + 2, 200, y + 2);
          
          y += 6;
        });

      } else {
        // Reporte de Encuestas
        drawHeader('Reporte de Encuestas y Campañas');

        // Sumarios
        addText('Métricas de Feedback y Participación:', 12, 11, { fontStyle: 'bold' });
        y += 6;
        addText(`• Total de Encuestas/Campañas creadas: ${surveys.length}`, 15, 9);
        addText(`• Total de Formularios completados: ${surveyAnswers.length} participaciones`, 15, 9);
        
        y += 10;

        surveys.forEach((survey, idx) => {
          if (y > 255) {
            doc.addPage();
            y = 15;
          }

          // Card header de la encuesta
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, 190, 15, 'F');
          doc.setDrawColor(203, 213, 225);
          doc.rect(10, y, 190, 15, 'S');

          y += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ENCUESTA: ${survey.title} [${survey.active ? 'ACTIVA' : 'INACTIVA'}]`, 14, y);
          
          y += 5;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Recompensa: ${survey.reward || 'Sin recompensa'}`, 14, y);
          
          const answersForThisSurvey = surveyAnswers.filter(ans => ans.surveyId === survey.id);
          doc.text(`Total de respuestas: ${answersForThisSurvey.length}`, 120, y);

          y += 10;

          if (answersForThisSurvey.length === 0) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            addText('  No hay respuestas registradas para esta encuesta todavía.', 15, 8);
            y += 6;
          } else {
            addText('Respuestas de los clientes:', 15, 8, { fontStyle: 'bold' });
            y += 5;

            answersForThisSurvey.forEach((ans) => {
              if (y > 265) {
                doc.addPage();
                y = 15;
              }

              doc.setFillColor(254, 254, 254);
              doc.rect(15, y, 180, 12, 'F');
              doc.setDrawColor(241, 245, 249);
              doc.rect(15, y, 180, 12, 'S');

              y += 4;
              doc.setFontSize(7.5);
              doc.setFont('helvetica', 'bold');
              doc.text(`${ans.customerName} (Folio ${ans.customerFolio})`, 18, y);
              doc.setFont('helvetica', 'normal');
              doc.text(`Fecha: ${new Date(ans.timestamp).toLocaleDateString('es-MX')}`, 140, y);

              let answersStr = '';
              if (ans.answers && ans.answers.length > 0) {
                answersStr = ans.answers.map(a => `${a.questionText}: ${a.answerText}`).join(' | ');
              } else {
                answersStr = `Respuesta general: ${ans.answers?.[0]?.answerText || 'Completada'}`;
              }

              if (answersStr.length > 95) {
                answersStr = answersStr.substring(0, 92) + '...';
              }
              
              y += 4;
              doc.setFontSize(7);
              doc.setTextColor(71, 85, 105);
              doc.text(answersStr, 18, y);
              doc.setTextColor(51, 65, 85);

              y += 7;
            });
            y += 3;
          }
        });
      }

      // Descargar el archivo PDF real
      doc.save(`Reporte_${reportType}_Cafecito_2026.pdf`);

      setShowMockExportSuccess(`¡Reporte de ${reportType} generado con éxito! Se ha descargado el archivo "Reporte_${reportType}_Cafecito_2026.pdf"`);
      setTimeout(() => setShowMockExportSuccess(null), 4000);
    } catch (error: any) {
      console.error(error);
      setShowMockExportSuccess(`Error al exportar reporte: ${error.message || error}`);
      setTimeout(() => setShowMockExportSuccess(null), 5000);
    }
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

      {/* Portal de Fidelidad para Clientes (Gerente Shared Link) */}
      <div className="bg-gradient-to-r from-teal-50/50 to-emerald-50/55 border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#149b8f]/10 text-[#149b8f] flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h4 className="font-serif font-black text-slate-900 text-sm">Portal de Fidelidad para Clientes</h4>
              <p className="text-[11px] text-slate-500 font-sans leading-normal">
                Enlace para los socios. Permíteles registrarse, consultar sus sellos, realizar encuestas y personalizar el diseño de sus tarjetas virtuales.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 select-none">
            <button
              onClick={() => {
                const link = window.location.origin + '/fidelidad';
                navigator.clipboard.writeText(link);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="flex-grow sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-205 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-[#149b8f]" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-slate-500" />
                  <span>Copiar Enlace</span>
                </>
              )}
            </button>

            <a
              href="/fidelidad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-grow sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Ver Portal</span>
            </a>
          </div>
        </div>

        {/* Input box displaying URL */}
        <div className="bg-white/85 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs font-mono text-slate-600">
          <span className="truncate select-all">{window.location.origin + '/fidelidad'}</span>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#149b8f] bg-[#149b8f]/5 border border-[#149b8f]/10 px-2 py-0.5 rounded-md font-sans shrink-0 select-none">
            URL ACTIVO
          </span>
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

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {clerks.map(clerk => {
              const codeKey = clerk.code.toUpperCase();
              const metrics = currentClerkCounts[codeKey] || { total: 0, registers: 0, visits: 0 };
              
              // Fallback default mock activity so initial clerks still have their nice actions if logs are empty
              let totalValue = metrics.total;
              if (totalValue === 0) {
                if (clerk.code === 'CR02') totalValue = 14;
                if (clerk.code === 'C03') totalValue = 8;
                if (clerk.code === 'CO1') totalValue = 5;
              }

              return (
                <div key={clerk.code} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-150/60 text-xs shadow-inner">
                  <div className="space-y-0.5">
                    <span className="font-mono bg-cyan-50 text-cyan-800 font-black px-2 py-0.5 border border-cyan-150 rounded text-[9px]">
                      {clerk.code}
                    </span>
                    <span className="ml-2 font-bold text-slate-700">{clerk.name}</span>
                  </div>
                  <span className="font-mono font-black text-[#149b8f] text-sm">{totalValue} acciones</span>
                </div>
              );
            })}
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

      {/* SECCIÓN GESTIÓN DE ENCARGADOS Y CLAVES PIN */}
      <div id="gestor-encargados-container" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="border-b border-slate-150 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0 border border-indigo-100">
              <Key size={16} />
            </div>
            <div>
              <h3 className="font-serif font-black text-sm text-slate-900 leading-tight">Claves y Registros de Encargados</h3>
              <p className="text-[11px] text-slate-500 font-sans">Administración de credenciales de seguridad para validación de café en caja (PIN).</p>
            </div>
          </div>
          {isGestorUnlocked ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider font-mono">
                {clerks.length} activos
              </span>
              <button
                type="button"
                onClick={() => setIsGestorUnlocked(false)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold px-2 py-0.5 rounded-full border border-slate-200 cursor-pointer flex items-center gap-1 transition-all"
                title="Volver a bloquear sección"
              >
                <Lock size={10} />
                <span>Bloquear</span>
              </button>
            </div>
          ) : (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider font-mono">
              Protegido
            </span>
          )}
        </div>

        {!isGestorUnlocked ? (
          <div className="max-w-md mx-auto py-8 px-4 text-center space-y-4 font-sans">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
              <Lock size={20} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-black text-slate-800 text-sm">Sección Protegida por Contraseña</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Ingresa la clave de acceso de administración para poder consultar, registrar o eliminar encargados y sus correspondientes claves PIN.
              </p>
            </div>

            <form onSubmit={handleUnlockGestor} className="space-y-3 max-w-xs mx-auto">
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="Introduce la contraseña administrador..."
                  value={gestorUnlockCode}
                  onChange={(e) => {
                    setGestorUnlockCode(e.target.value);
                    setGestorUnlockError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-205 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-center outline-none transition-all font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                />
                {gestorUnlockError && (
                  <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded-xl border border-red-100 text-center animate-pulse">
                    ⚠️ {gestorUnlockError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs rounded-xl transition shadow hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Unlock size={14} />
                <span>Desbloquear Sección</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Column 1: Formulary */}
            <form onSubmit={handleCreateClerkSubmit} className="space-y-4 text-xs font-sans">
              <h4 className="font-serif font-bold text-slate-800 text-xs flex items-center gap-1">
                <UserPlus size={14} className="text-indigo-650" />
                Crear Nuevo Encargado
              </h4>

              {clerkFormError && (
                <p className="p-3 bg-red-50 text-red-650 font-bold rounded-xl border border-red-100 leading-normal animate-pulse">
                  ⚠️ {clerkFormError}
                </p>
              )}

              {clerkFormSuccess && (
                <p className="p-3 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-150 leading-normal">
                  🎉 {clerkFormSuccess}
                </p>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Monica Diaz"
                    value={newClerkName}
                    onChange={(e) => setNewClerkName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs outline-none transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Clave PIN (4 caracteres) *</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="Ej. A123"
                      value={newClerkPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s/g, '');
                        setNewClerkPin(val);
                      }}
                      className="w-full bg-slate-50 border border-slate-205 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-center outline-none transition-all tracking-widest font-bold placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 text-indigo-650"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] flex items-center justify-between">
                      <span>Código Cajero</span>
                      <span className="text-[8px] text-slate-400 uppercase font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Ej. CO6"
                      value={newClerkCode}
                      onChange={(e) => setNewClerkCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      className="w-full bg-slate-50 border border-slate-205 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-center outline-none transition-all font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-850 leading-relaxed space-y-0.5">
                <span className="font-extrabold uppercase text-amber-900 block">⚠️ Salvaguarda de Autoridad</span>
                <span>Cualquier persona con este PIN podrá sumar visitas, modificar perfiles de clientes y registrar canjes. Mantén los PINs confidenciales.</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition shadow hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Registrar y Activar Credenciales</span>
              </button>
            </form>

            {/* Column 2: Clerks active manager list */}
            <div className="space-y-3.5">
              <h4 className="font-serif font-bold text-slate-800 text-xs">
                🔑 Encargados y Claves Activas
              </h4>

              <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
                {clerks.map((c) => {
                  const isPinRevealed = !!revealedPins[c.code];
                  const isEditingThisClerk = editingClerk?.code === c.code;

                  if (clerkToDelete?.code === c.code) {
                    return (
                      <div 
                        key={c.code}
                        className="p-3 bg-red-50 border border-red-200 rounded-xl shadow-sm text-xs transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-red-100 pb-1.5">
                          <span className="font-bold text-red-800 font-serif">¿Eliminar Encargado?</span>
                          <span className="font-mono bg-red-100 text-red-850 px-1.5 py-0.5 rounded font-bold text-[9px]">
                            {c.code}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-650 leading-relaxed font-sans">
                          ¿De verdad deseas eliminar a <strong>{c.name}</strong>? Ya no podrá autorizar procesos en el Bistro.
                        </p>
                        <div className="flex justify-end gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setClerkToDelete(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer text-[10px]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (clerks.length <= 1) {
                                setClerkFormError('Debes dejar al menos un encargado activo en el sistema.');
                                setClerkToDelete(null);
                                return;
                              }
                              setClerks(clerks.filter(cl => cl.code !== c.code));
                              setClerkFormSuccess(`¡Se ha eliminado al encargado "${c.name}" con éxito!`);
                              setClerkToDelete(null);
                              setTimeout(() => setClerkFormSuccess(''), 4000);
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-750 text-white font-black rounded-lg cursor-pointer text-[10px]"
                          >
                            Sí, eliminar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isEditingThisClerk) {
                    return (
                      <div 
                        key={c.code}
                        className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl shadow-sm text-xs transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                          <span className="font-bold text-slate-800 font-serif">Editar Encargado</span>
                          <span className="font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-extrabold text-[9px]">
                            {c.code}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase block">Nombre Completo</label>
                            <input
                              type="text"
                              required
                              value={editClerkName}
                              onChange={(e) => setEditClerkName(e.target.value)}
                              className="w-full bg-white border border-slate-205 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs outline-none font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase block">Nueva Clave PIN (4 caracteres)</label>
                            <input
                              type="text"
                              required
                              maxLength={4}
                              value={editClerkPin}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\s/g, '');
                                setEditClerkPin(val);
                              }}
                              className="w-full bg-white border border-slate-205 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs text-center outline-none tracking-widest font-bold text-indigo-650"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingClerk(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer text-[10px]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveClerkEdit(c.code)}
                            className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-750 text-white font-black rounded-lg cursor-pointer text-[10px]"
                          >
                            Guardar PIN
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={c.code}
                      className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/80 rounded-xl shadow-inner text-xs transition-all hover:border-slate-300"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-150 font-bold text-[9px]">
                            {c.code}
                          </span>
                          <span className="font-bold text-slate-800">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-medium">Clave PIN Autorización:</span>
                          <span className="font-mono font-extrabold text-[#149b8f] tracking-wide bg-white px-1.5 py-0.5 border border-slate-150 rounded text-[9px]">
                            {isPinRevealed ? c.pin : '••••'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => togglePinReveal(c.code)}
                          title={isPinRevealed ? "Ocultar PIN" : "Mostrar PIN"}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={14} className={isPinRevealed ? "text-[#149b8f]" : ""} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditClerk(c)}
                          title="Editar nombre/PIN"
                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-indigo-650 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClerk(c)}
                          title="Eliminar credencial"
                          className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-slate-400 leading-normal font-sans text-center mt-1">
                💡 Para cambiar o renovar la contraseña de un operador, bórrala y vuelve a registrarla con la nueva clave de su preferencia.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Encuestas para Clientes Form Section (Screen 11) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
        <h3 className="font-serif font-black text-base text-slate-900 border-b border-slate-150 pb-2 flex items-center gap-1.5 flex-wrap">
          <MessageSquare size={18} className="text-[#149b8f]" />
          Encuestas y Campañas de Fidelidad
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          
          {/* Survey/Campaign Creator Section */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-slate-550 font-sans font-black uppercase block text-[10px] tracking-wider">Formato de Encuesta</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setIsCampaignMode(false)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !isCampaignMode 
                      ? 'bg-[#149b8f] text-white shadow' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/40'
                  }`}
                >
                  Pregunta Única
                </button>
                <button
                  type="button"
                  onClick={() => setIsCampaignMode(true)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isCampaignMode 
                      ? 'bg-[#149b8f] text-white shadow' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/40'
                  }`}
                >
                  🚀 Campaña Multi-Pregunta
                </button>
              </div>
            </div>

            {/* Campaign configuration details */}
            <form onSubmit={handlePublishSurvey} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase tracking-wider block">Título de la Encuesta / Campaña</label>
                <input
                  type="text"
                  required
                  placeholder={isCampaignMode ? "Ej. Campaña Satisfacción Junio" : "Ej. Opinión del Espresso"}
                  value={newSurveyTitle}
                  onChange={(e) => setNewSurveyTitle(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all"
                />
              </div>

              {!isCampaignMode ? (
                /* SINGLE QUESTION ACCORDION */
                <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/65">
                  <span className="text-slate-400 font-mono font-bold uppercase text-[9px] tracking-widest block">DISEÑO DE PREGUNTA</span>
                  
                  <div className="space-y-1">
                    <label className="text-slate-550 font-bold uppercase block tracking-wide">Pregunta para el Cliente</label>
                    <textarea
                      required={!isCampaignMode}
                      rows={2}
                      placeholder="¿Qué le parecen las bebidas de espresso de nuestra sucursal?"
                      value={newSurveyQuestion}
                      onChange={(e) => setNewSurveyQuestion(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-550 font-bold uppercase block tracking-wide">Respuestas de Opción de Opción Múltiples</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Agregar opción (Ej. Bueno)..."
                        value={newSurveyOption}
                        onChange={(e) => setNewSurveyOption(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddOptionToNewSurvey}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-250 font-bold transition-all text-xs flex items-center gap-0.5 whitespace-nowrap"
                      >
                        <Plus size={13} /> Agregar
                      </button>
                    </div>

                    {newSurveyOptionsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2 bg-white p-2 text-[10px] rounded-xl border border-slate-150">
                        {newSurveyOptionsList.map((opt, oIdx) => (
                          <span key={oIdx} className="bg-slate-50 border rounded px-2 py-0.5 font-semibold text-slate-600">
                            {opt}
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewSurveyOptionsList([])}
                          className="text-red-500 hover:text-red-600 font-bold ml-auto text-[10px]"
                        >
                          Limpiar
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 block italic pt-1 text-slate-400">Opciones por defecto: Bueno, Regular, Malo</span>
                    )}
                  </div>
                </div>
              ) : (
                /* CAMPAIGN QUESTION COMPILER */
                <div className="space-y-4 bg-teal-50/10 p-4 rounded-2xl border border-[#149b8f]/15">
                  <div className="flex justify-between items-center bg-white border border-slate-150 rounded-xl p-2">
                    <span className="text-[#149b8f] font-sans font-extrabold uppercase text-[9px] tracking-widest block">DISEÑADOR DE PREGUNTA</span>
                    <span className="bg-[#149b8f]/10 text-[#149b8f] text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">Listas: {campaignQuestions.length}</span>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <label className="text-slate-550 font-bold uppercase block text-[10px]">Texto de la Pregunta</label>
                    <input
                      type="text"
                      placeholder="Ej. ¿Qué opinas de nuestra limpieza y sanitarios?"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all"
                    />
                  </div>

                  {/* Question Format Selector */}
                  <div className="space-y-1">
                    <label className="text-slate-550 font-bold uppercase block text-[10px]">Formato de Respuesta</label>
                    <select
                      value={newQuestionType}
                      onChange={(e) => setNewQuestionType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#149b8f]"
                    >
                      <option value="multiple">🔘 Opción Múltiple (Botones cerrados)</option>
                      <option value="open">📝 Respuesta Abierta (Hasta 100 palabras)</option>
                    </select>
                  </div>

                  {/* If Multiple Choice Options compiler */}
                  {newQuestionType === 'multiple' && (
                    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-150">
                      <label className="text-slate-400 font-bold uppercase block text-[9px]">Opciones de Respuesta</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Opción (Ej. Muy Limpio)..."
                          value={newQuestionOption}
                          onChange={(e) => setNewQuestionOption(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#149b8f]"
                        />
                        <button
                          type="button"
                          onClick={handleAddOptionToQuestion}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition text-xs flex items-center gap-0.5 whitespace-nowrap"
                        >
                          <Plus size={11} /> Agregar
                        </button>
                      </div>

                      {newQuestionOptionsList.length > 0 && (
                        <div className="flex flex-wrap gap-1 bg-slate-50 p-2 rounded border border-slate-150 text-[10px]">
                          {newQuestionOptionsList.map((opt, oIdx) => (
                            <span key={oIdx} className="bg-white border rounded px-2 py-0.5 text-slate-600 font-medium whitespace-nowrap">
                              {opt}
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => setNewQuestionOptionsList([])}
                            className="text-red-500 hover:text-red-650 font-bold ml-auto"
                          >
                            Vaciar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddQuestionToCampaign}
                    className="w-full py-2 bg-[#149b8f]/10 hover:bg-[#149b8f]/20 text-[#149b8f] border border-[#149b8f]/20 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Registrar Pregunta en la Campaña
                  </button>

                  {/* Active list compiled */}
                  {campaignQuestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-bold uppercase text-[9px] block">PREGUNTAS COMPILADAS ({campaignQuestions.length}):</span>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {campaignQuestions.map((q, idx) => (
                          <div key={q.id} className="bg-white border rounded-xl p-2.5 flex justify-between items-center text-[10.5px]">
                            <div className="space-y-1 pr-3">
                              <span className="text-slate-705 font-bold text-xs">{idx + 1}. {q.text}</span>
                              <div className="flex items-center gap-1.5 text-[9px] flex-wrap">
                                <span className="text-blue-600 font-semibold px-1 rounded bg-blue-50 border border-blue-100 uppercase uppercase-sm">
                                  {q.type === 'multiple' ? 'Múltiple' : 'Abierta'}
                                </span>
                                {q.type === 'multiple' && (
                                  <span className="text-slate-400">Opciones: {q.options?.join(', ')}</span>
                                )}
                                {q.type === 'open' && (
                                  <span className="text-amber-600 font-bold">Límite 100 palabras</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCampaignQuestions(campaignQuestions.filter(cg => cg.id !== q.id))}
                              className="text-red-500 hover:text-red-650 cursor-pointer p-1"
                              title="Eliminar pregunta de campaña"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reward Section */}
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

              {/* Publish button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#149b8f] hover:bg-[#11847a] text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                🚀 Publicar {isCampaignMode ? 'Campaña Multi-Pregunta' : 'Encuesta Simple'}
              </button>
            </form>
          </div>

          {/* Active Published Surveys/Campaigns List */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block border-b border-slate-100 pb-1.5 flex justify-between items-center">
              <span>Encuestas / Campañas Activas ({surveys.length})</span>
              <span className="text-[9px] text-[#149b8f] font-extrabold font-mono border border-[#149b8f]/30 rounded px-1.5 py-0.5 bg-emerald-50">PORTAL EN VIVO</span>
            </h4>

            <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
              {surveys.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl italic text-slate-400">
                  No hay encuestas ni campañas creadas todavía. Usa el diseñador para publicar una.
                </div>
              ) : (
                surveys.map((sv) => {
                  // Backwards compatibility rendering
                  const questionCount = sv.questions ? sv.questions.length : 1;
                  return (
                    <div key={sv.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3 relative text-xs hover:border-[#149b8f]/30 transition-all shadow-sm">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between items-center flex-wrap gap-1.5">
                          <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1 flex-wrap">
                            {sv.title}
                            {sv.isCampaign ? (
                              <span className="bg-[#149b8f]/10 text-[#149b8f] border border-[#149b8f]/20 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                                Campaña ({questionCount} preg's)
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                Simple
                              </span>
                            )}
                          </span>
                          <span className="bg-[#149b8f]/5 text-[#149b8f] border border-[#149b8f]/20 font-bold rounded px-2 py-0.5 font-mono text-[9px] uppercase">
                            Premio: {sv.reward}
                          </span>
                        </div>
                        
                        <div className="text-slate-500 text-[11px] leading-relaxed italic space-y-1 border-l-2 border-[#149b8f]/20 pl-2">
                          {sv.questions && sv.questions.length > 0 ? (
                            sv.questions.map((q, qidx) => (
                              <p key={q.id}>
                                <strong>{qidx + 1}. {q.text}</strong> {' '}
                                <span className="text-[9px] font-bold text-[#149b8f]/70 uppercase font-mono bg-[#149b8f]/5 px-1 rounded">
                                  ({q.type === 'multiple' ? 'Múltiple' : 'Abierta (max 1pc)'})
                                </span>
                              </p>
                            ))
                          ) : (
                            <p><strong>1.</strong> "{sv.question}"</p>
                          )}
                        </div>
                        
                        {/* Stats Submissions */}
                        <div className="flex items-center justify-between pt-1.5 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">Total respondidas: <strong>{sv.submissionsCount}</strong></span>
                            <span className={`w-1.5 h-1.5 rounded-full ${sv.active ? 'bg-[#149b8f] animate-ping' : 'bg-slate-350'}`} />
                          </div>
                          
                          {/* Submissions Viewer Button */}
                          {sv.submissionsCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowSubmissionsModal(sv.id)}
                              className="bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-950 border border-slate-200 font-bold px-2.5 py-1 rounded text-[9.5px] transition flex items-center gap-1 shadow-sm leading-none cursor-pointer"
                            >
                              <Eye size={11} /> Ver {sv.submissionsCount} Respuestas
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 relative">
                        <button
                          onClick={() => handleToggleSurvey(sv.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title={sv.active ? 'Pausar encuesta' : 'Activar encuesta'}
                        >
                          {sv.active ? <ToggleRight size={22} className="text-[#149b8f]" /> : <ToggleLeft size={22} />}
                        </button>
                        <button
                          onClick={() => handleDeleteSurvey(sv.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                          title="Eliminar encuesta"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RESPUESTAS RECIBIDAS (SUBMISSIONS LIST SECTION IN REALTIME) */}
            <div className="border-t border-slate-150 pt-3.5 space-y-3">
              <span className="text-slate-550 uppercase tracking-wider text-[10px] font-extrabold flex items-center gap-1.5">
                <ClipboardList size={13} className="text-[#149b8f]" />
                Últimos Comentarios Abiertos e Histórico de Respuestas
              </span>
              
              <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                {surveyAnswers.length === 0 ? (
                  <p className="text-[10.5px] italic text-slate-400 text-center py-4">No hay respuestas de clientes emitidas todavía en esta sesión.</p>
                ) : (
                  surveyAnswers.map(ans => (
                    <div key={ans.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-1.5 text-[11px] shadow-sm">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-extrabold">Cliente: <strong className="text-slate-700">{ans.customerName}</strong> (#{ans.customerFolio})</span>
                        <span className="font-mono text-[9px]">{new Date(ans.timestamp).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="font-bold text-slate-800 border-b border-dashed border-slate-200 pb-1">
                        Encuesta: <span className="text-[#149b8f]">{ans.surveyTitle}</span>
                      </div>
                      <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {ans.answers.map(subQ => {
                          const isLongText = subQ.answerText.length > 25;
                          return (
                            <div key={subQ.questionId} className="space-y-0.5 text-[10.5px]">
                              <p className="text-slate-500 font-semibold italic">"{subQ.questionText}"</p>
                              <p className={`p-2 rounded-xl border leading-relaxed ${
                                isLongText 
                                  ? 'bg-amber-50/40 text-slate-800 border-amber-100 font-medium italic block' 
                                  : 'bg-white border-slate-200 font-sans font-bold text-slate-800'
                              }`}>
                                {subQ.answerText || <em className="text-slate-400 font-normal">Sin respuesta</em>}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

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

      {/* Dynamic Submissions auditor Modal Pop up */}
      {showSubmissionsModal && (() => {
        const targetSurvey = surveys.find(s => s.id === showSubmissionsModal);
        if (!targetSurvey) return null;
        const targetAnswers = surveyAnswers.filter(ans => ans.surveyId === showSubmissionsModal);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="text-left">
                  <span className="text-[#2bbba9] font-mono text-[9px] uppercase tracking-wider font-extrabold block">AUDITORÍA DE ENCUESTAS</span>
                  <h3 className="text-base font-serif font-black">{targetSurvey.title}</h3>
                </div>
                <button
                  onClick={() => setShowSubmissionsModal(null)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer font-bold transition text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Stats Summary Panel */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 gap-3 text-xs text-left">
                <div>
                  <span className="text-slate-400 font-bold block">Respuestas Recibidas</span>
                  <strong className="text-base text-[#149b8f]">{targetAnswers.length}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Premio de Campaña</span>
                  <strong className="text-xs text-slate-700 font-black tracking-wide uppercase">{targetSurvey.reward}</strong>
                </div>
              </div>

              {/* Submissions List */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4 text-left">
                {targetAnswers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-10">No hay respuestas detalladas para esta encuesta todavía.</p>
                ) : (
                  targetAnswers.map((ans, idx) => (
                    <div key={ans.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium flex-wrap gap-1">
                        <span className="font-extrabold flex items-center gap-1">
                          👤 Socio #{idx + 1}: <strong className="text-slate-800">{ans.customerName}</strong> ({ans.customerFolio})
                        </span>
                        <span>{new Date(ans.timestamp).toLocaleString('es-MX')}</span>
                      </div>

                      <div className="space-y-2 border-t border-slate-200/65 pt-2 pr-1">
                        {ans.answers.map((item) => {
                          const isTextAnswer = item.answerText.length > 25;
                          return (
                            <div key={item.questionId} className="space-y-1">
                              <span className="text-slate-550 font-bold block text-[10.5px]">Pregunta: {item.questionText}</span>
                              <div className={`p-2.5 rounded-xl border leading-relaxed text-[11px] ${
                                isTextAnswer 
                                  ? 'bg-amber-50/40 text-slate-800 border-amber-100 italic block font-medium shadow-inner' 
                                  : 'bg-white border-slate-200 text-slate-850 font-bold font-sans'
                              }`}>
                                {item.answerText || <em className="text-slate-400 font-normal font-sans">Sin comentarios</em>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSubmissionsModal(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cerrar Auditoría
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
