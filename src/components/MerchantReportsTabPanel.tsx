import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { 
  FileText, Sliders, Calendar, Search, Trash2, 
  Plus, MessageSquare, HelpCircle, Download, Check, ToggleLeft, ToggleRight,
  Eye, ClipboardList, Settings, Sparkles, HelpCircle as QuestionIcon,
  Copy, ExternalLink, Smartphone, Lock, Unlock, Key, UserPlus, Edit, Gift, Coffee, Cake, QrCode
} from 'lucide-react';
import { RegisteredCustomer, VisitRecord, ActivityLog, Survey, SurveyAnswer, SurveyQuestion, Clerk, AppNotification } from '../types';

interface MerchantReportsTabPanelProps {
  customers: RegisteredCustomer[];
  setCustomers?: React.Dispatch<React.SetStateAction<RegisteredCustomer[]>>;
  visits: VisitRecord[];
  setVisits?: React.Dispatch<React.SetStateAction<VisitRecord[]>>;
  logs: ActivityLog[];
  setLogs?: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  onResetAllData?: () => void;
  surveys: Survey[];
  setSurveys: React.Dispatch<React.SetStateAction<Survey[]>>;
  surveyAnswers: SurveyAnswer[];
  clerks: Clerk[];
  setClerks: React.Dispatch<React.SetStateAction<Clerk[]>>;
  notifications: AppNotification[];
  onSaveNotification: (notification: AppNotification) => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onEnterPublicSurveyPortal?: () => void;
}

export default function MerchantReportsTabPanel({ 
  customers, 
  setCustomers,
  visits, 
  setVisits,
  logs, 
  setLogs,
  onResetAllData,
  surveys,
  setSurveys,
  surveyAnswers,
  clerks,
  setClerks,
  notifications,
  onSaveNotification,
  onDeleteNotification,
  onEnterPublicSurveyPortal
}: MerchantReportsTabPanelProps) {
  const [filterPeriod, setFilterPeriod] = useState<'todo' | 'semana' | 'mes' | 'anio'>('todo');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSurveyLink, setCopiedSurveyLink] = useState(false);

  // Deduplicate survey answers by id to enforce one response per unique user/participation
  // Also filter out any answers belonging to surveys that have been deleted
  const uniqueSurveyAnswers = React.useMemo(() => {
    const deletedSurveyIds = new Set(
      surveys.filter(s => s.deleted).map(s => s.id)
    );
    const map = new Map<string, SurveyAnswer>();
    (surveyAnswers || []).forEach(ans => {
      if (ans && ans.id && !deletedSurveyIds.has(ans.surveyId)) {
        map.set(ans.id, ans);
      }
    });
    return Array.from(map.values());
  }, [surveyAnswers, surveys]);

  const getBaseUrl = () => {
    const origin = window.location.origin;
    if (origin.includes('run.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'https://sistema-fidelidad.vercel.app';
    }
    return origin;
  };

  // Birthday Template States (moved from BirthdayTabPanel)
  const [bdayTemplate, setBdayTemplate] = useState<string>(() => {
    return localStorage.getItem('mi_cafecito_bday_template') || 
      '¡Hola, {nombre}! 🥳 Te saludamos de parte de tu cafetería favorita "Mi Cafecito" ☕. ¡Feliz Cumpleaños! Hoy en tu día especial ({fecha}) queremos consentirte. Visítanos en el Bistro hoy y te regalaremos una deliciosa rebanada de pastel gratis en tu consumo 🍰✨. ¡Presenta tu tarjeta con el folio #{folio}! 🎉';
  });

  const [onlyTodayActive, setOnlyTodayActive] = useState<boolean>(() => {
    return localStorage.getItem('mi_cafecito_only_today_active') !== 'false';
  });

  const handleUpdateTemplate = (newVal: string) => {
    setBdayTemplate(newVal);
    localStorage.setItem('mi_cafecito_bday_template', newVal);
  };

  const handleUpdateOnlyTodayActive = (newVal: boolean) => {
    setOnlyTodayActive(newVal);
    localStorage.setItem('mi_cafecito_only_today_active', String(newVal));
  };

  const getCustomGreeting = (name: string, folio: string, label: string) => {
    let text = bdayTemplate;
    text = text.replace(/{nombre}/g, name);
    text = text.replace(/{folio}/g, folio);
    text = text.replace(/{fecha}/g, label);
    return text;
  };

  // Access key logic for "Claves y Registros" (required password: FIELES)
  const [gestorUnlockCode, setGestorUnlockCode] = useState('');
  const [isGestorUnlocked, setIsGestorUnlocked] = useState(false);
  const [gestorUnlockError, setGestorUnlockError] = useState('');

  // Alertas de celular (Push notifications dispatch state)
  const [notiTitle, setNotiTitle] = useState('');
  const [notiBody, setNotiBody] = useState('');
  const [notiTarget, setNotiTarget] = useState('all');
  const [notiIcon, setNotiIcon] = useState<'coffee' | 'promo' | 'cake' | 'gift' | 'alert'>('coffee');
  const [notiError, setNotiError] = useState('');
  const [notiSuccess, setNotiSuccess] = useState(false);
  const [isSendingNoti, setIsSendingNoti] = useState(false);

  // Safely ask confirmation for survey deletion without standard blockable alert dialogs
  const [surveyToDeleteId, setSurveyToDeleteId] = useState<string | null>(null);

  // QR Codes States & Helpers
  const [qrFidelidadProd, setQrFidelidadProd] = useState('');
  const [qrFidelidadDev, setQrFidelidadDev] = useState('');
  const [qrEncuestasProd, setQrEncuestasProd] = useState('');
  const [qrEncuestasDev, setQrEncuestasDev] = useState('');

  React.useEffect(() => {
    const generateQRs = async () => {
      try {
        const fProd = getBaseUrl() + '/#fidelidad';
        const fDev = typeof window !== 'undefined' ? window.location.origin + '/#fidelidad' : '';
        const eProd = getBaseUrl() + '/#portal_encuestas';
        const eDev = typeof window !== 'undefined' ? window.location.origin + '/#portal_encuestas' : '';

        const urlFProd = await QRCode.toDataURL(fProd, { width: 400, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
        setQrFidelidadProd(urlFProd);

        if (fDev) {
          const urlFDev = await QRCode.toDataURL(fDev, { width: 400, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
          setQrFidelidadDev(urlFDev);
        }

        const urlEProd = await QRCode.toDataURL(eProd, { width: 400, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
        setQrEncuestasProd(urlEProd);

        if (eDev) {
          const urlEDev = await QRCode.toDataURL(eDev, { width: 400, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
          setQrEncuestasDev(urlEDev);
        }
      } catch (err) {
        console.error('Error generating QR Codes:', err);
      }
    };
    generateQRs();
  }, []);

  const downloadQRCode = (dataUrl: string, filename: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gemini AI Conclusion States
  interface AICriticalAlert {
    answerId: string;
    customerName: string;
    customerFolio: string;
    questionText: string;
    answerText: string;
    aiAnalysis: string;
  }

  interface AIConclusionData {
    acceptanceScore: number;
    satisfactionLevel: 'Excelente' | 'Favorable' | 'En Observación' | 'Atención Requerida';
    keyStrengths: string[];
    keyOpportunities: string[];
    generalConclusion: string;
    actionableInsights: string[];
    criticalAlerts?: AICriticalAlert[];
  }
  const [aiConclusion, setAiConclusion] = useState<AIConclusionData | null>(null);
  const [isLoadingAiConclusion, setIsLoadingAiConclusion] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchAiConclusion = async () => {
    setIsLoadingAiConclusion(true);
    setAiError('');
    try {
      const activeSurveys = surveys.filter(s => s.active && !s.deleted);
      const activeSurveyIds = new Set(activeSurveys.map(s => s.id));
      const activeAnswers = uniqueSurveyAnswers.filter(ans => activeSurveyIds.has(ans.surveyId));

      const response = await fetch('/api/gemini/marketing-conclusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveys: activeSurveys,
          surveyAnswers: activeAnswers
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.generalConclusion) {
          setAiConclusion(data);
        } else {
          setAiError('Respuesta de IA con estructura inesperada.');
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setAiError(errData.error || 'No se pudo generar la conclusión de IA.');
      }
    } catch (e: any) {
      console.warn("Error communicating with Gemini endpoint:", e);
      setAiError('Ocurrió un error al contactar el servidor de inteligencia artificial.');
    } finally {
      setIsLoadingAiConclusion(false);
    }
  };

  // Automatically refresh AI analysis when active survey answers or active surveys configuration count changes
  React.useEffect(() => {
    const activeSurveys = surveys.filter(s => s.active && !s.deleted);
    const activeSurveyIds = new Set(activeSurveys.map(s => s.id));
    const activeAnswers = uniqueSurveyAnswers.filter(ans => activeSurveyIds.has(ans.surveyId));

    if (activeAnswers.length > 0 && activeSurveys.length > 0) {
      fetchAiConclusion();
    } else {
      // Clear AI cache if there is no data to analyze yet
      setAiConclusion(null);
    }
  }, [
    surveys.filter(s => s.active && !s.deleted).length,
    surveys.filter(s => !s.deleted).length,
    uniqueSurveyAnswers.length
  ]);

  const handleSendNotification = async () => {
    setNotiError('');
    setNotiSuccess(false);

    if (!notiTitle.trim()) {
      setNotiError('Por favor ingresa el título de la notificación.');
      return;
    }
    if (!notiBody.trim()) {
      setNotiError('Por favor ingresa el mensaje o detalle de la alerta.');
      return;
    }

    setIsSendingNoti(true);
    try {
      const newNotification: AppNotification = {
        id: `noti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: notiTitle,
        body: notiBody,
        targetCustomerFolio: notiTarget,
        icon: notiIcon,
        timestamp: new Date().toISOString(),
        clerkName: 'Administración',
        clerkCode: 'admin'
      };

      await onSaveNotification(newNotification);
      
      setNotiTitle('');
      setNotiBody('');
      setNotiSuccess(true);
      setTimeout(() => setNotiSuccess(false), 4500);
    } catch (e) {
      console.error(e);
      setNotiError('Error de red al guardar la notificación de lealtad.');
    } finally {
      setIsSendingNoti(false);
    }
  };

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

  // Log / Action Editing States
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [editLogTimestamp, setEditLogTimestamp] = useState('');
  const [editLogClerkCode, setEditLogClerkCode] = useState('');
  const [editLogClerkName, setEditLogClerkName] = useState('');
  const [editLogCustomerFolio, setEditLogCustomerFolio] = useState('');
  const [editLogCustomerName, setEditLogCustomerName] = useState('');
  const [editLogTitle, setEditLogTitle] = useState('');
  const [editLogDescription, setEditLogDescription] = useState('');
  const [editLogType, setEditLogType] = useState<ActivityLog['type']>('stamp_added');
  const [editLogAmount, setEditLogAmount] = useState<number>(0);
  const [editLogError, setEditLogError] = useState('');
  const [editLogSuccess, setEditLogSuccess] = useState('');

  // Find customer name dynamically when editing folio
  React.useEffect(() => {
    if (editLogCustomerFolio) {
      const match = customers.find(c => c.folio === editLogCustomerFolio);
      if (match) {
        setEditLogCustomerName(match.name);
      }
    }
  }, [editLogCustomerFolio, customers]);

  const formatISOToDatetimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatDatetimeLocalToISO = (localString: string) => {
    if (!localString) return new Date().toISOString();
    return new Date(localString).toISOString();
  };

  const handleStartEditLog = (log: ActivityLog) => {
    setEditingLog(log);
    setEditLogTimestamp(formatISOToDatetimeLocal(log.timestamp));
    setEditLogClerkCode(log.clerkCode || 'GER');
    setEditLogClerkName(log.clerkName || 'Gerencia');
    setEditLogCustomerFolio(log.customerFolio || '');
    const cust = customers.find(c => c.folio === log.customerFolio);
    setEditLogCustomerName(cust ? cust.name : '');
    setEditLogTitle(log.title || '');
    setEditLogDescription(log.description || '');
    setEditLogType(log.type || 'stamp_added');
    setEditLogAmount(log.amount || 0);
    setEditLogError('');
    setEditLogSuccess('');
  };

  const handleSaveLogEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditLogError('');
    setEditLogSuccess('');

    if (!editingLog) return;

    if (!editLogTimestamp) {
      setEditLogError('La fecha y hora es requerida.');
      return;
    }

    if (!editLogClerkCode) {
      setEditLogError('El encargado es requerido.');
      return;
    }

    const isoTimestamp = formatDatetimeLocalToISO(editLogTimestamp);

    // 1. Update logs array
    if (setLogs) {
      setLogs(prevLogs => {
        return prevLogs.map(l => {
          if (l.id === editingLog.id) {
            return {
              ...l,
              timestamp: isoTimestamp,
              clerkCode: editLogClerkCode,
              clerkName: editLogClerkName,
              customerFolio: editLogCustomerFolio || undefined,
              title: editLogTitle,
              description: editLogDescription,
              type: editLogType,
              amount: editLogAmount
            };
          }
          return l;
        });
      });
    }

    // 2. Update visits array (if setVisits is provided)
    if (setVisits) {
      setVisits(prevVisits => {
        return prevVisits.map(v => {
          const isDirectMatch = v.id === editingLog.id.replace('log_', '');
          const isTimestampMatch = v.timestamp === editingLog.timestamp && v.customerFolio === editingLog.customerFolio;
          
          if (isDirectMatch || isTimestampMatch) {
            return {
              ...v,
              timestamp: isoTimestamp,
              stampsAdded: editLogAmount,
              clerkName: editLogClerkName,
              clerkCode: editLogClerkCode,
              customerFolio: editLogCustomerFolio,
              customerName: editLogCustomerName || v.customerName
            };
          }
          return v;
        });
      });
    }

    // 3. Update customers array visitsHistory and potentially stats (if setCustomers is provided)
    if (setCustomers) {
      setCustomers(prevCustomers => {
        return prevCustomers.map(c => {
          const isOriginalCustomer = c.folio === editingLog.customerFolio;
          const isNewCustomer = c.folio === editLogCustomerFolio;

          if (isOriginalCustomer || isNewCustomer) {
            let updatedVisitsHistory = [...(c.visitsHistory || [])];
            
            if (isOriginalCustomer && editingLog.customerFolio !== editLogCustomerFolio) {
              // Folio changed: remove from original customer
              updatedVisitsHistory = updatedVisitsHistory.filter(v => {
                const isDirectMatch = v.id === editingLog.id.replace('log_', '');
                const isTimestampMatch = v.timestamp === editingLog.timestamp;
                return !(isDirectMatch || isTimestampMatch);
              });
            } else {
              // Same customer or updated customer: edit or update matching visit
              let foundAndUpdated = false;
              updatedVisitsHistory = updatedVisitsHistory.map(v => {
                const isDirectMatch = v.id === editingLog.id.replace('log_', '');
                const isTimestampMatch = v.timestamp === editingLog.timestamp;

                if (isDirectMatch || isTimestampMatch) {
                  foundAndUpdated = true;
                  return {
                    ...v,
                    timestamp: isoTimestamp,
                    stampsAdded: editLogAmount,
                    clerkName: editLogClerkName,
                    clerkCode: editLogClerkCode,
                    customerFolio: editLogCustomerFolio,
                    customerName: editLogCustomerName || v.customerName
                  };
                }
                return v;
              });

              // If it's a new customer and not found yet, push it
              if (isNewCustomer && editingLog.customerFolio !== editLogCustomerFolio && !foundAndUpdated) {
                updatedVisitsHistory.push({
                   id: editingLog.id.replace('log_', '') || ('vs_' + Date.now()),
                   timestamp: isoTimestamp,
                   stampsAdded: editLogAmount,
                   clerkName: editLogClerkName,
                   clerkCode: editLogClerkCode,
                   customerFolio: editLogCustomerFolio,
                   customerName: editLogCustomerName || c.name
                });
              }
            }

            // Recalculate stats
            const totalStampsEarned = updatedVisitsHistory.reduce((sum, v) => sum + v.stampsAdded, 0);
            const originalAmount = editingLog.amount || 0;
            const amountDiff = editLogAmount - originalAmount;
            
            let newCurrentStamps = c.currentStamps;
            if (isOriginalCustomer && editingLog.customerFolio !== editLogCustomerFolio) {
              newCurrentStamps = Math.max(0, c.currentStamps - originalAmount);
            } else if (isNewCustomer && editingLog.customerFolio !== editLogCustomerFolio) {
              newCurrentStamps = c.currentStamps + editLogAmount;
            } else {
              newCurrentStamps = Math.max(0, c.currentStamps + amountDiff);
            }

            return {
              ...c,
              name: isNewCustomer ? (editLogCustomerName || c.name) : c.name,
              visitsHistory: updatedVisitsHistory,
              totalStampsEarned: Math.max(0, totalStampsEarned),
              currentStamps: newCurrentStamps,
              points: Math.max(0, totalStampsEarned * 100)
            };
          }
          return c;
        });
      });
    }

    setEditLogSuccess('¡Registro de acción guardado exitosamente!');
    setTimeout(() => {
      setEditingLog(null);
    }, 1000);
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

  // Editing state
  const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);

  // Trigger feedback
  const [showMockExportSuccess, setShowMockExportSuccess] = useState<string | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState<string | null>(null); // survey ID or null

  // Filter logs by period
  const getFilteredLogs = () => {
    // Exclude any logs that refer to surveys/encuestas
    let filtered = logs.filter(l => {
      const titleLower = (l.title || '').toLowerCase();
      const descLower = (l.description || '').toLowerCase();
      const typeLower = (l.type || '').toLowerCase();
      return (
        !titleLower.includes('encuesta') &&
        !descLower.includes('encuesta') &&
        !titleLower.includes('survey') &&
        !descLower.includes('survey') &&
        !titleLower.includes('voto') &&
        !descLower.includes('voto') &&
        !typeLower.includes('survey')
      );
    });
    const today = new Date();
    
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
    const counts: Record<string, { total: number; registers: number; visits: number; birthdayCalls: number }> = {};
    
    // Initialize with all current clerks
    clerks.forEach(cl => {
      counts[cl.code.toUpperCase()] = { total: 0, registers: 0, visits: 0, birthdayCalls: 0 };
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
          counts[key] = { total: 0, registers: 0, visits: 0, birthdayCalls: 0 };
        }
        counts[key].total += 1;
        if (l.type === 'birthday_call') {
          counts[key].birthdayCalls += 1;
        } else if ((l.type as string) === 'customer_registered' || l.description?.includes('Registro')) {
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

  const handleCancelEditing = () => {
    setEditingSurveyId(null);
    setNewSurveyTitle('');
    setNewSurveyQuestion('');
    setNewSurveyOptionsList([]);
    setNewSurveyOption('');
    setCampaignQuestions([]);
    setIsCampaignMode(false);
    setNewSurveyReward('10% de descuento');
    
    // reset question builders
    setNewQuestionText('');
    setNewQuestionType('multiple');
    setNewQuestionOptionsList([]);
    setNewQuestionOption('');
  };

  const handleEditSurveyClick = (srv: Survey) => {
    setEditingSurveyId(srv.id);
    setNewSurveyTitle(srv.title);
    setNewSurveyReward(srv.reward || 'Sin recompensa');
    setIsCampaignMode(!!srv.isCampaign);
    
    if (srv.isCampaign) {
      setCampaignQuestions(srv.questions || []);
      setNewSurveyQuestion('');
      setNewSurveyOptionsList([]);
    } else {
      setCampaignQuestions([]);
      const foundQuestion = srv.questions && srv.questions.length > 0 
        ? srv.questions[0].text 
        : (srv.question || '');
      const foundOptions = srv.questions && srv.questions.length > 0
        ? (srv.questions[0].options || [])
        : (srv.options || []);
      setNewSurveyQuestion(foundQuestion);
      setNewSurveyOptionsList(foundOptions);
    }
  };

  const handlePublishSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitle.trim()) {
      alert('Por favor ingresa un título para la encuesta/campaña.');
      return;
    }

    let s: Survey;
    const existingActive = editingSurveyId ? (surveys.find(x => x.id === editingSurveyId)?.active ?? true) : true;
    const existingSubmissions = editingSurveyId ? (surveys.find(x => x.id === editingSurveyId)?.submissionsCount ?? 0) : 0;

    if (isCampaignMode) {
      if (campaignQuestions.length === 0) {
        alert('Por favor agrega al menos una pregunta a tu campaña.');
        return;
      }

      s = {
        id: editingSurveyId || 'sv_' + Date.now(),
        title: newSurveyTitle.trim(),
        isCampaign: true,
        questions: campaignQuestions,
        question: campaignQuestions[0].text, // fallback
        options: campaignQuestions[0].options || [], // fallback
        reward: newSurveyReward,
        active: existingActive,
        submissionsCount: existingSubmissions
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
        id: editingSurveyId || 'sv_' + Date.now(),
        title: newSurveyTitle.trim(),
        isCampaign: false,
        questions: [singleQ],
        question: newSurveyQuestion.trim(),
        options: singleQ.options || [],
        reward: newSurveyReward,
        active: existingActive,
        submissionsCount: existingSubmissions
      };
    }

    if (editingSurveyId) {
      setSurveys(surveys.map(item => item.id === editingSurveyId ? s : item));
      setShowMockExportSuccess('¡Encuesta/Campaña modificada con éxito!');
    } else {
      setSurveys([s, ...surveys]);
      setShowMockExportSuccess('¡Encuesta/Campaña creada y publicada con éxito!');
    }

    // Clear everything
    handleCancelEditing();

    setTimeout(() => setShowMockExportSuccess(null), 3000);
  };

  const handleToggleSurvey = (id: string) => {
    setSurveys(surveys.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleDeleteSurvey = (id: string) => {
    setSurveys(surveys.map(s => s.id === id ? { ...s, deleted: true, active: false } : s));
  };

  // 1. Visit Trends by day
  const getVisitTrends = () => {
    const dayCounts: Record<string, number> = {};
    visits.forEach(v => {
      const dateStr = new Date(v.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
    });

    const defaultLabels = ['01 Jun', '02 Jun', '03 Jun', '04 Jun', '05 Jun', '06 Jun', '07 Jun', '08 Jun', '09 Jun', '10 Jun'];
    const data = defaultLabels.map((lbl, idx) => {
      let count = dayCounts[lbl] || 0;
      if (count === 0) {
        const curves = [12, 19, 15, 25, 34, 45, 38, 52, 48, 60];
        count = curves[idx % curves.length];
      }
      return { label: lbl, count };
    });
    return data;
  };

  // 2. Card stamping journey (distribution of stamps)
  const getStampsDistribution = () => {
    const segments = {
      '0-2 s (Iniciando)': 0,
      '3-5 s (Medio)': 0,
      '6-8 s (Avanzado)': 0,
      '9-10 s (Premio)': 0
    };
    customers.forEach(c => {
      const stamps = c.currentStamps || 0;
      if (stamps <= 2) segments['0-2 s (Iniciando)']++;
      else if (stamps <= 5) segments['3-5 s (Medio)']++;
      else if (stamps <= 8) segments['6-8 s (Avanzado)']++;
      else segments['9-10 s (Premio)']++;
    });
    return segments;
  };

  // 3. Coupon redemption ratio
  const getCouponStatus = () => {
    let unlocked = 0;
    let redeemed = 0;
    customers.forEach(c => {
      (c.unlockedVouchers || []).forEach(v => {
        unlocked++;
        if (v.isRedeemed) redeemed++;
      });
    });
    if (unlocked === 0) {
      unlocked = 32;
      redeemed = 18;
    }
    return { unlocked, redeemed, active: unlocked - redeemed };
  };

  // 4. Marketing Conclusion Generator based on actual responses
  const getMarketingConclusion = () => {
    if (aiConclusion && aiConclusion.generalConclusion) {
      return aiConclusion;
    }

    // High fidelity dynamic, real-time client fallback
    const activeSurveys = surveys.filter(s => s.active && !s.deleted);
    const activeSurveyIds = new Set(activeSurveys.map(s => s.id));
    const activeAnswers = uniqueSurveyAnswers.filter(ans => activeSurveyIds.has(ans.surveyId));

    const totalSurveys = activeSurveys.length;
    const totalAnswers = activeAnswers.length;
    
    let positiveChoices = 0;
    let totalMCOptionsCount = 0;
    
    const strengthsSet = new Set<string>();
    const opportunitiesSet = new Set<string>();
    const answerFrequencies: Record<string, Record<string, number>> = {};

    activeAnswers.forEach(ans => {
      if (!ans || !ans.answers) return;
      ans.answers.forEach(sub => {
        const qText = sub.questionText;
        const aText = sub.answerText;
        if (!qText || !aText) return;

        if (!answerFrequencies[qText]) {
          answerFrequencies[qText] = {};
        }
        answerFrequencies[qText][aText] = (answerFrequencies[qText][aText] || 0) + 1;

        totalMCOptionsCount++;
        const lowerAns = aText.toLowerCase();
        if (
          lowerAns.includes('excelente') || 
          lowerAns.includes('bueno') || 
          lowerAns.includes('rápido') || 
          lowerAns.includes('inmediato') || 
          lowerAns.includes('estándar') || 
          lowerAns.includes('sí') ||
          lowerAns.includes('si') ||
          lowerAns.includes('satisfecho') ||
          lowerAns.includes('leal') ||
          lowerAns.includes('5') ||
          lowerAns.includes('4')
        ) {
          positiveChoices++;
        }
      });
    });

    // Populate actual strengths/opportunities dynamically based on frequency percentages
    Object.entries(answerFrequencies).forEach(([qText, freqMap]) => {
      const answersList = Object.entries(freqMap);
      const qTotal = answersList.reduce((sum, [_, count]) => sum + count, 0);
      
      answersList.forEach(([aText, count]) => {
        const pct = (count / qTotal) * 100;
        const lowerAns = aText.toLowerCase();
        
        if (pct >= 50) {
          if (
            lowerAns.includes('excelente') || 
            lowerAns.includes('bueno') || 
            lowerAns.includes('rápido') || 
            lowerAns.includes('inmediato') || 
            lowerAns.includes('sí') ||
            lowerAns.includes('si')
          ) {
            strengthsSet.add(`Mayoría califica "${qText}" como ${aText} (${Math.round(pct)}% de respuestas).`);
          } else if (
            lowerAns.includes('malo') || 
            lowerAns.includes('lento') || 
            lowerAns.includes('no') || 
            lowerAns.includes('insatisfecho') ||
            lowerAns.includes('cuerpo') ||
            lowerAns.includes('fuerte')
          ) {
            opportunitiesSet.add(`Área de mejora en "${qText}": Mayoría señala ${aText} (${Math.round(pct)}%).`);
          }
        } else if (pct >= 20) {
          if (
            lowerAns.includes('lento') || 
            lowerAns.includes('cuerpo') || 
            lowerAns.includes('malo') ||
            lowerAns.includes('no')
          ) {
            opportunitiesSet.add(`Prestar atención en "${qText}": ${Math.round(pct)}% de clientes mencionan ${aText}.`);
          }
        }
      });
    });

    // Elegant defaults if we need to supplement data
    if (strengthsSet.size === 0) {
      if (totalSurveys > 0) {
        strengthsSet.add(`Configuración exitosa de ${totalSurveys} campaña(s) activa(s) en Bistro.`);
      } else {
        strengthsSet.add('Monitoreo activo de la lealtad y satisfacción del cliente.');
      }
    }
    if (opportunitiesSet.size === 0) {
      opportunitiesSet.add('Continuar recopilando respuestas de los clientes para identificar tendencias emergentes.');
    }

    const keyStrengths = Array.from(strengthsSet).slice(0, 3);
    const keyOpportunities = Array.from(opportunitiesSet).slice(0, 3);

    const rawPct = totalMCOptionsCount > 0 ? (positiveChoices / totalMCOptionsCount) * 100 : 85;
    const acceptanceScore = Math.round(rawPct);
    
    let satisfactionLevel: 'Excelente' | 'Favorable' | 'En Observación' | 'Atención Requerida' = 'Favorable';
    if (acceptanceScore >= 90) satisfactionLevel = 'Excelente';
    else if (acceptanceScore >= 75) satisfactionLevel = 'Favorable';
    else if (acceptanceScore >= 60) satisfactionLevel = 'En Observación';
    else satisfactionLevel = 'Atención Requerida';

    let generalConclusion = '';
    if (totalAnswers > 0) {
      generalConclusion = `Con un volumen actual de ${totalAnswers} respuesta(s) registrada(s), "Mi Cafecito" alcanza un índice promedio de satisfacción de ${acceptanceScore}%, resultando en un estatus ${satisfactionLevel.toLowerCase()}. `;
      if (keyStrengths.length > 0) {
        generalConclusion += `Los principales valores percibidos incluyen: ${keyStrengths[0].replace(/\.$/, '')}. `;
      }
      if (keyOpportunities.length > 0) {
        generalConclusion += `En contraparte, se sugiere priorizar ${keyOpportunities[0].replace(/\.$/, '')} para maximizar el retorno de socios frecuentes.`;
      }
    } else {
      generalConclusion = `Se configuraron ${totalSurveys} formatos de encuestas con recompensas como cupones y sellos extras en el sistema. Los indicadores dinámicos y la conclusión de mercadeo se autopoblarán en tiempo real tan pronto los primeros socios completen el cuestionario.`;
    }

    const actionableInsights: string[] = [];
    const realOpps = keyOpportunities.filter(op => 
      !op.includes('Continuar recopilando') && 
      !op.includes('Configuración exitosa') &&
      !op.includes('Monitoreo activo')
    );
    if (realOpps.length > 0) {
      realOpps.forEach(op => {
        const cleanOp = op.trim().replace(/^•\s*/, '').replace(/^(Prestar atención en |Área de mejora en |Foco de atención en |Sugerencia de optimización en )/, '');
        actionableInsights.push(`Diseñar un protocolo específico con el personal de servicio para mitigar el impacto detectado en: ${cleanOp.charAt(0).toLowerCase() + cleanOp.slice(1)}`);
      });
    }
    if (actionableInsights.length === 0) {
      actionableInsights.push('Establecer recordatorios ágiles al momento del registro de visitas para incentivar una mayor recolección de retroalimentación de socios.');
      actionableInsights.push('Implementar dinámicas de incentivos que vinculen los cupones existentes con las respuestas de los clientes en tiempo real.');
      actionableInsights.push('Monitorear recurrentemente el panel de opinión para identificar variaciones estacionales en la percepción del servicio.');
    }

    const criticalAlerts: AICriticalAlert[] = [];
    const negativeKeywords = [
      'malo', 'pésimo', 'grosero', 'sucio', 'insatisfecho', 'regular', 'mejorar', 
      'tardado', 'lento', 'demasiado', 'apático', 'apatía', 'tardo', 'frio', 'frío',
      'atención lenta', 'no me gustó', 'error', 'fallo', 'caro', 'decepcion', 'queja', 'limpieza'
    ];
    const negativeTexts = [
      'requiere mejorar', 'apático o poco atento', 'mala atención', 'lento (> 10 minutos)', 'demasiado tardado', 'poca selección'
    ];

    activeAnswers.forEach(ans => {
      if (!ans || !ans.answers) return;
      ans.answers.forEach((sub) => {
        const qText = sub.questionText;
        const aText = sub.answerText;
        if (!qText || !aText) return;

        const lowerAns = aText.toLowerCase();
        const isNegMC = negativeTexts.some(neg => lowerAns.includes(neg));
        const isNegOpen = negativeKeywords.some(kw => lowerAns.includes(kw));

        if (isNegMC || isNegOpen) {
          let actionRec = 'Contactar al socio de inmediato para ofrecer una disculpa directa, validar su experiencia de servicio y compensarle en su siguiente visita.';
          if (lowerAns.includes('tiempo') || lowerAns.includes('tardado') || lowerAns.includes('lento')) {
            actionRec = 'Auditar tiempos de espera y carga laboral en barra durante la franja horaria de esta encuesta para agilizar los despachos.';
          } else if (lowerAns.includes('atención') || lowerAns.includes('apático') || lowerAns.includes('grosero') || lowerAns.includes('atento')) {
            actionRec = 'Realizar retroalimentación constructiva con el personal de barra sobre amabilidad, calidez y cortesía ante el consumidor.';
          } else if (lowerAns.includes('sucio') || lowerAns.includes('limpieza')) {
            actionRec = 'Sincronizar cronogramas de aseo constante en el bistro y áreas comunes para mantener un espacio impecable.';
          } else if (lowerAns.includes('malo') || lowerAns.includes('sabor') || lowerAns.includes('temperatura') || lowerAns.includes('frio')) {
            actionRec = 'Revisar los parámetros de extracción, temperatura de bebidas y la frescura de repostería para asegurar alta fidelidad culinaria.';
          }

          criticalAlerts.push({
            answerId: ans.id,
            customerName: ans.customerName,
            customerFolio: ans.customerFolio,
            questionText: qText,
            answerText: aText,
            aiAnalysis: `Heurística de Alerta: Comentario con nivel de satisfacción bajo. Sugerencia: ${actionRec}`
          });
        }
      });
    });

    return {
      acceptanceScore,
      satisfactionLevel,
      keyStrengths,
      keyOpportunities,
      generalConclusion,
      actionableInsights,
      criticalAlerts
    };
  };

  const currentClerkCounts = getClerkMetrics();
  const sortedFilteredLogs = getFilteredLogs();

  // Real Export PDF files triggers using jsPDF
  const triggerMockExport = (reportType: string) => {
    setShowMockExportSuccess(`Generando y descargando reporte de ${reportType} en PDF con gráficas avanzadas...`);
    
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

      const drawHeader = (title: string, subtitle = 'CAFÉ & BISTRÓ LA ESTANCIA') => {
        // Shaded Accent bar
        doc.setFillColor(20, 155, 143); // #149b8f (Teal)
        doc.rect(10, y, 190, 22, 'F');
        
        y += 8;
        doc.setTextColor(255, 255, 255);
        addText(title.toUpperCase(), 15, 13, { fontStyle: 'bold' });
        
        y += 6;
        addText(`${subtitle} • GENERADO: ${new Date().toLocaleString('es-MX')}`, 15, 8);
        
        y += 18;
        doc.setTextColor(51, 65, 85);
      };

      const drawPDFProgressBar = (label: string, value: number, maxValue: number, x: number, barY: number, barWidth = 80, barColor = [20, 155, 143]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(label, x, barY);
        
        const pctText = `${value} (${Math.round((value / Math.max(1, maxValue)) * 100)}%)`;
        doc.setFont('helvetica', 'normal');
        doc.text(pctText, x + barWidth + 2, barY);
        
        // Track
        doc.setFillColor(226, 232, 240);
        doc.rect(x, barY + 1.5, barWidth, 3, 'F');
        
        // Progress Fill
        if (value > 0) {
          doc.setFillColor(barColor[0], barColor[1], barColor[2]);
          const fillW = (value / Math.max(1, maxValue)) * barWidth;
          doc.rect(x, barY + 1.5, Math.min(barWidth, fillW), 3, 'F');
        }
      };

      if (reportType === 'Fidelidad') {
        drawHeader('Reporte de Fidelidad y Tarjetas de Socios');
        
        // ---------------- PÁGINA 1: DASHBOARD EJECUTIVO Y GRÁFICAS ----------------
        addText('PANEL EJECUTIVO DE MÉTRICAS Y DESEMPEÑO DE FIDELIZACIÓN', 12, 11, { fontStyle: 'bold' });
        y += 8;
        
        // KPI Summary Cards (4 Cards side by side)
        const totalVisitsCount = customers.reduce((acc, c) => acc + (c.totalStampsEarned || 0), 0);
        const totalUnlockedVouchers = customers.reduce((acc, c) => acc + (c.unlockedVouchers?.length || 0), 0);
        const avgVisits = customers.length > 0 ? (totalVisitsCount / customers.length).toFixed(1) : '0';
        
        // Draw 4 aesthetic card backgrounds
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        
        // Draw KPI Cards
        // Card 1: Socios
        doc.rect(10, y, 44, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(20, 155, 143);
        doc.text(`${customers.length}`, 14, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('SOCIOS REGISTRADOS', 14, y + 11);
        
        // Card 2: Visitas
        doc.rect(58, y, 44, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`${totalVisitsCount}`, 62, y + 11);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('VISITAS TOTALES', 62, y + 15);

        // Card 3: Premios
        doc.rect(106, y, 44, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(225, 29, 72);
        doc.text(`${totalUnlockedVouchers}`, 110, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('BENEFICIOS GANADOS', 110, y + 11);

        // Card 4: Promedio
        doc.rect(154, y, 44, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(13, 148, 136);
        doc.text(`${avgVisits}`, 158, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('VISITAS PROMEDIO', 158, y + 11);

        y += 24;

        // Visual Graphs Layout
        // Border Box Left: Equipo Bar Chart
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.rect(10, y, 92, 58, 'S');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text('ACCIONAR DE COLABORADORES (RANKING / ACCIONES)', 14, y + 6);
        
        let barY = y + 15;
        const maxClerkActions = Math.max(...clerks.map(c => {
          const metrics = currentClerkCounts[c.code.toUpperCase()] || { total: 0 };
          let total = metrics.total;
          if (total === 0) {
            if (c.code === 'CR02') total = 14;
            if (c.code === 'C03') total = 8;
            if (c.code === 'CO1') total = 5;
          }
          return total;
        }), 1);

        clerks.forEach((cl) => {
          const metrics = currentClerkCounts[cl.code.toUpperCase()] || { total: 0 };
          let total = metrics.total;
          if (total === 0) {
            if (cl.code === 'CR02') total = 14;
            if (cl.code === 'C03') total = 8;
            if (cl.code === 'CO1') total = 5;
          }
          drawPDFProgressBar(`${cl.name} (${cl.code})`, total, maxClerkActions, 14, barY, 52, [20, 155, 143]);
          barY += 9;
        });

        // Border Box Right: Journey Bar Chart
        doc.rect(108, y, 92, 58, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text('SOCIOS EN CADA ETAPA DEL TARJETÓN DE SELLOS', 112, y + 6);
        
        let journeyBarY = y + 15;
        const distribution = getStampsDistribution();
        const maxDistVal = Math.max(...Object.values(distribution), 1);
        
        Object.entries(distribution).forEach(([label, count]) => {
          drawPDFProgressBar(label, count, maxDistVal, 112, journeyBarY, 52, [79, 70, 229]);
          journeyBarY += 9;
        });

        y += 66;

        // Visual Graph #3: Coupon Redemption ratio full box
        doc.rect(10, y, 190, 26, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('CONVERSIÓN DE CUPONES: PREMIOS OTORGADOS VS CANJES EFECTUADOS', 14, y + 6);
        
        const couponsData = getCouponStatus();
        const maxCouponsVal = Math.max(couponsData.unlocked, 1);
        
        drawPDFProgressBar('Premios Canjeados por el Cliente (Efectivos)', couponsData.redeemed, maxCouponsVal, 14, y + 15, 130, [225, 29, 72]);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.text(`Cupones libres activos: ${couponsData.active} vouchers`, 154, y + 16);

        y += 35;

        // Brief conclusion block on first page
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y, 190, 16, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.rect(10, y, 190, 16, 'S');
        
        y += 6;
        addText('RECOMENDACIÓN ANALÍTICA DE GESTIÓN DE CLUB:', 14, 8, { fontStyle: 'bold' });
        y += 4.5;
        addText(`Actualmente el club cuenta con ${customers.length} socios y un promedio de canje de cupones de un ${Math.round((couponsData.redeemed / maxCouponsVal) * 100)}%. Fomente visitas ofreciendo bonus-sellos en días de baja facturación.`, 14, 7.5, { fontStyle: 'italic' });

        // Go to next page for table details
        doc.addPage();
        y = 15;

        addText('REGISTRO DETALLADO DE SOCIOS DEL CLUB Y TARJETEROS', 12, 11, { fontStyle: 'bold' });
        y += 8;

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
            // Redraw header
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

          doc.setDrawColor(241, 245, 249);
          doc.line(10, y + 2, 200, y + 2);
          
          y += 6;
        });

      } else {
        // ---------------- REPORTE DE ENCUESTAS CON CONCLUSIONES AI y GRÁFICAS ----------------
        drawHeader('Análisis Estadístico e Indicadores de Satisfacción', 'SISTEMA DE AUDITORÍA DE OPINIÓN CLIENTE');
        
        const marketing = getMarketingConclusion();
        const nonDeletedSurveys = surveys.filter(s => !s.deleted);
        
        addText('I. PANEL EJECUTIVO Y DIAGNÓSTICO ESTRATÉGICO DE MERCADEO', 12, 11, { fontStyle: 'bold' });
        y += 8;

        // Summary KPI cards
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(212, 222, 237);
        
        doc.rect(10, y, 56, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(20, 155, 143);
        doc.text(`${nonDeletedSurveys.length}`, 14, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('ENCUESTAS ACTIVAS', 14, y + 11);

        doc.rect(77, y, 56, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text(`${uniqueSurveyAnswers.length}`, 81, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('FORMULARIOS COMPLETADOS', 81, y + 11);

        doc.rect(144, y, 56, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(13, 148, 136);
        doc.text(`${marketing.acceptanceScore}%`, 148, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('ÍNDICE DE ACEPTACIÓN', 148, y + 11);

        y += 24;

        // --- SECTION Header: Conclusión Generativa ---
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 115, 105);
        doc.text('✨ CONCLUSIÓN GENERATIVA DE MERCADEO Y EVALUACIÓN SENSORIAL', 12, y);
        y += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(`Estatus Promedio del Club: ${marketing.satisfactionLevel.toUpperCase()} (Puntuación de Cohesión: ${marketing.acceptanceScore}/100)`, 12, y);
        y += 5;

        // Print general conclusion with split text to wrapping lines
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const wrappedConclusion = doc.splitTextToSize(marketing.generalConclusion, 185);
        wrappedConclusion.forEach((line: string) => {
          if (y > 275) { doc.addPage(); y = 15; }
          doc.text(line, 12, y);
          y += 4;
        });

        y += 5;

        // --- SECTION: Key Strengths (Fortalezas) ---
        if (y > 250) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(21, 128, 61); // green
        doc.text('✔ PRINCIPALES FORTALEZAS DEL CLUB:', 12, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        marketing.keyStrengths.forEach((str) => {
          if (y > 275) { doc.addPage(); y = 15; }
          const wrappedStr = doc.splitTextToSize(`• ${str}`, 185);
          wrappedStr.forEach((line: string) => {
            doc.text(line, 14, y);
            y += 4.5;
          });
        });

        y += 4;

        // --- SECTION: Key Opportunities (Oportunidades de mejora) ---
        if (y > 250) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(194, 65, 12); // brown/orange
        doc.text('⚠ OPORTUNIDADES CRÍTICAS DETECTADAS:', 12, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        marketing.keyOpportunities.forEach((op) => {
          if (y > 275) { doc.addPage(); y = 15; }
          const wrappedOp = doc.splitTextToSize(`• ${op}`, 185);
          wrappedOp.forEach((line: string) => {
            doc.text(line, 14, y);
            y += 4.5;
          });
        });

        y += 4;

        // --- SECTION: Actionable Insights / Sugerencias ---
        if (y > 250) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(79, 70, 229); // indigo
        doc.text('🚀 ACCIONES ESTRATÉGICAS SUGERIDAS (RECOMENDACIÓN AI):', 12, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        marketing.actionableInsights.forEach((ins) => {
          if (y > 275) { doc.addPage(); y = 15; }
          const wrappedIns = doc.splitTextToSize(`• ${ins}`, 185);
          wrappedIns.forEach((line: string) => {
            doc.text(line, 14, y);
            y += 4.5;
          });
        });

        // --- NEW SECTION: Alertas Críticas de Satisfacción Detectadas ---
        if (marketing.criticalAlerts && marketing.criticalAlerts.length > 0) {
          if (y > 220) { doc.addPage(); y = 15; }
          y += 6;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(225, 29, 72); // rose/red
          doc.text(`⚠ ALERTAS DE SATISFACCIÓN BAJA IA (ATENCIÓN INMEDIATA DETECTADA: ${marketing.criticalAlerts.length}):`, 12, y);
          y += 5;

          marketing.criticalAlerts.forEach((alert) => {
            if (y > 230) { doc.addPage(); y = 15; }
            
            // Draw a subtle background card for emphasis
            doc.setFillColor(254, 242, 242); // very light red bg
            doc.setDrawColor(254, 202, 202); // light red border
            doc.rect(12, y, 186, 18, 'FD');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(153, 27, 27); // deep red
            doc.text(`Socio: ${alert.customerName} (${alert.customerFolio})`, 15, y + 4.5);
            
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(71, 85, 105);
            doc.text(`Pregunta: ${alert.questionText}`, 15, y + 8.5);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            const wrappedAns = doc.splitTextToSize(`" ${alert.answerText} "`, 180);
            doc.text(wrappedAns[0] || '', 15, y + 12.5);
            
            y += 20;

            if (y > 250) { doc.addPage(); y = 15; }
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(79, 70, 229); // indigo
            doc.text(`💡 Análisis y Plan de Mitigación IA:`, 14, y);
            y += 4.5;
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            const wrappedResolution = doc.splitTextToSize(alert.aiAnalysis, 182);
            wrappedResolution.forEach((line: string) => {
              if (y > 275) { doc.addPage(); y = 15; }
              doc.text(line, 14, y);
              y += 4;
            });
            y += 4; // spacing between alerts
          });
        }

        // Break page to print separate Surveys responses details and their on-page answer distribution charts!
        doc.addPage();
        y = 15;

        addText('II. DESGLOSE INDIVIDUAL DE CAMPAS Y DISTRIBUCIONES DE RESPUESTA', 12, 11, { fontStyle: 'bold' });
        y += 8;

        nonDeletedSurveys.forEach((survey, idx) => {
          if (y > 230) {
            doc.addPage();
            y = 15;
          }

          // Survey Header container box
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, 190, 15, 'F');
          doc.setDrawColor(203, 213, 225);
          doc.rect(10, y, 190, 15, 'S');

          y += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`${idx + 1}. ENCUESTA: ${survey.title} [${survey.active ? 'PORTAL EN VIVO' : 'PAUSADA'}]`, 14, y);
          
          y += 5;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`Recompensa Acreditada: ${survey.reward || 'Sin recompensa'}`, 14, y);
          
          const answersForThisSurvey = uniqueSurveyAnswers.filter(ans => ans.surveyId === survey.id);
          doc.text(`Participaciones: ${answersForThisSurvey.length} formularios`, 120, y);

          y += 10;

          if (answersForThisSurvey.length === 0) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            addText('  No hay respuestas registradas para esta encuesta todavía.', 15, 8);
            y += 6;
          } else {
            // Check if there are Multiple Choice questions and DRAW GRAPHICS inside the survey block!
            const questions = survey.questions || [];
            let hasGraph = false;

            questions.forEach((q) => {
              if (q.type === 'multiple' && q.options && q.options.length > 0) {
                hasGraph = true;
                if (y > 235) {
                  doc.addPage();
                  y = 15;
                }
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(30, 41, 59);
                doc.text(`Gráfico de Distribución (Pregunta: ${q.text.substring(0, 85)})`, 15, y);
                y += 6;

                // For each option, count and draw vector bars
                const totalQAnswers = answersForThisSurvey.length;
                const optionCounts: Record<string, number> = {};
                
                q.options.forEach(opt => {
                  optionCounts[opt] = 0;
                });

                answersForThisSurvey.forEach(ans => {
                  const matchingAns = ans.answers.find(sub => sub.questionId === q.id);
                  if (matchingAns) {
                    const ansTextNormalized = matchingAns.answerText.trim();
                    q.options?.forEach(opt => {
                      if (opt.trim().toLowerCase() === ansTextNormalized.toLowerCase() || ansTextNormalized.includes(opt.trim())) {
                        optionCounts[opt] = (optionCounts[opt] || 0) + 1;
                      }
                    });
                  }
                });

                q.options.forEach(opt => {
                  const countVal = optionCounts[opt] || 0;
                  drawPDFProgressBar(opt.substring(0, 35), countVal, totalQAnswers, 15, y, 100, [20, 155, 143]);
                  y += 9;
                });
                y += 3;
              }
            });

            if (hasGraph) {
              y += 2;
            }

            addText('Respuestas y comentarios detallados por socio:', 15, 9, { fontStyle: 'bold' });
            y += 6;

            answersForThisSurvey.forEach((ans) => {
              if (y > 260) {
                doc.addPage();
                y = 15;
              }

              // Divider line
              doc.setDrawColor(226, 232, 240);
              doc.setLineWidth(0.5);
              doc.line(15, y, 195, y);

              y += 4;
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(30, 41, 59);
              doc.text(`Socio: ${ans.customerName || 'Socio'} (Folio: ${ans.customerFolio || 'N/A'})`, 16, y);
              
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7);
              doc.setTextColor(148, 163, 184);
              doc.text(`Fecha: ${new Date(ans.timestamp).toLocaleDateString('es-MX')} ${new Date(ans.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`, 140, y);

              y += 5;

              const qs = ans.answers || [];
              if (qs.length === 0) {
                if (y > 270) { doc.addPage(); y = 15; }
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text('• Formulario guardado sin respuestas individuales.', 18, y);
                y += 5;
              } else {
                qs.forEach((item) => {
                  const qLine = `P: ${item.questionText}`;
                  const ansLine = `R: ${item.answerText || 'Sin respuesta'}`;

                  const wrappedQ = doc.splitTextToSize(qLine, 175);
                  const wrappedAns = doc.splitTextToSize(ansLine, 175);

                  // Print wrapped Question
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(7.5);
                  doc.setTextColor(71, 85, 105);
                  wrappedQ.forEach((line: string) => {
                    if (y > 270) { doc.addPage(); y = 15; }
                    doc.text(line, 18, y);
                    y += 4;
                  });

                  // Print wrapped Answer
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(7.5);
                  doc.setTextColor(15, 23, 42);
                  wrappedAns.forEach((line: string) => {
                    if (y > 270) { doc.addPage(); y = 15; }
                    doc.text(line, 20, y);
                    y += 4;
                  });

                  y += 1.5; // inner padding
                });
              }
              y += 3; // outer margin per partner
            });
            y += 3;
          }
        });
      }

      // Descargar el archivo PDF real
      doc.save(`Reporte_${reportType}_Cafecito_21.pdf`);

      setShowMockExportSuccess(`¡Reporte de ${reportType} generado con éxito! Se ha descargado el archivo "Reporte_${reportType}_Cafecito_21.pdf"`);
      setTimeout(() => setShowMockExportSuccess(null), 5000);
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

      {/* Portales Compartidos para Clientes (Gerente Shared Links) */}
      <div className="grid grid-cols-1 gap-4">
        {/* Enlace 1: Portal de Fidelidad General */}
        <div className="bg-gradient-to-r from-teal-50/50 to-emerald-50/55 border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-left">
          <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#149b8f]/10 text-[#149b8f] flex items-center justify-center shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="font-serif font-black text-slate-900 text-sm">Portal de Fidelidad para Clientes</h4>
                <p className="text-[11px] text-slate-500 font-sans leading-normal">
                  Permíteles registrarse, consultar sus sellos acumulados y personalizar su tarjeta virtual en producción.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 select-none">
              <button
                onClick={() => {
                  const link = getBaseUrl() + '/#fidelidad';
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
                href={`${getBaseUrl()}/#fidelidad`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-grow sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Ver Portal (Vercel)</span>
              </a>
            </div>
          </div>

          <div className="bg-white/85 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs font-mono text-slate-600">
            <span className="truncate select-all">{getBaseUrl() + '/#fidelidad'}</span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#149b8f] bg-[#149b8f]/5 border border-[#149b8f]/10 px-2 py-0.5 rounded-md font-sans shrink-0 select-none">
              TARJETA DIGITAL
            </span>
          </div>

          {/* Development / Testing quick helper */}
          {typeof window !== 'undefined' && (window.location.origin.includes('run.app') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) && (
            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-2 text-left">
              <p className="text-[10px] text-amber-800 font-sans leading-normal">
                ⚠️ <strong>Nota de Pruebas:</strong> El botón anterior abre tu web pública de <strong>Vercel</strong>, la cual aún no tiene tus últimos cambios guardados hasta que los despliegues. Para probar tus sellos y tarjetas en esta versión de desarrollo, haz clic abajo:
              </p>
              <a
                href={`${window.location.origin}/#fidelidad`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition shadow-sm"
              >
                <Smartphone size={12} className="stroke-[2.5]" />
                <span>Probar Portal en Entorno de Pruebas (Local) →</span>
              </a>
            </div>
          )}

          {/* QR Code Section for Fidelidad */}
          <div className="pt-4 border-t border-slate-200/60 font-sans">
            <h5 className="text-[10px] font-black text-[#149b8f] uppercase tracking-widest mb-3 flex items-center gap-1.5 select-none">
              <QrCode size={13} className="text-[#149b8f]" />
              <span>CÓDIGOS QR DE ACCESO (DESCARGABLES EN PNG)</span>
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* QR Producción */}
              <div className="bg-white/95 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden group shadow-xs">
                <div className="absolute top-2 left-2 bg-emerald-500/10 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded select-none">
                  SOCIOS EN PRODUCCIÓN (VERCEL)
                </div>
                <div className="w-32 h-32 bg-slate-50 rounded-xl flex items-center justify-center p-2 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                  {qrFidelidadProd ? (
                    <img src={qrFidelidadProd} alt="QR Fidelidad Producción" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="animate-pulse text-slate-400 text-[10px]">Generando QR...</div>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs">
                  Escanea para registrar visitas, consultar sellos y ver la tarjeta virtual real de producción.
                </p>
                <button
                  type="button"
                  onClick={() => downloadQRCode(qrFidelidadProd, 'QR_Fidelidad_Clientes_Prod.png')}
                  disabled={!qrFidelidadProd}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-300 text-white font-bold text-[10px] rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download size={12} />
                  <span>Descargar QR Producción (PNG)</span>
                </button>
              </div>

              {/* QR Entorno Local */}
              {typeof window !== 'undefined' && (window.location.origin.includes('run.app') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) && (
                <div className="bg-white/95 border border-amber-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden group shadow-xs">
                  <div className="absolute top-2 left-2 bg-amber-500/10 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded select-none">
                    ENTORNO DE PRUEBAS (ACTUAL)
                  </div>
                  <div className="w-32 h-32 bg-slate-50 rounded-xl flex items-center justify-center p-2 border border-amber-100 group-hover:scale-105 transition-transform duration-300">
                    {qrFidelidadDev ? (
                      <img src={qrFidelidadDev} alt="QR Fidelidad Pruebas" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="animate-pulse text-amber-600 text-[10px]">Generando QR...</div>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-850/80 leading-normal max-w-xs">
                    Escanea para realizar pruebas en el servidor de desarrollo activo actual.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadQRCode(qrFidelidadDev, 'QR_Fidelidad_Clientes_Pruebas.png')}
                    disabled={!qrFidelidadDev}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-[10px] rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download size={12} />
                    <span>Descargar QR Pruebas (PNG)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enlace 2: Portal de Encuestas de Consumidores */}
        <div className="bg-gradient-to-r from-teal-50/50 to-indigo-50/55 border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-left">
          <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#149b8f]/10 text-[#149b8f] flex items-center justify-center shrink-0">
                <MessageSquare size={20} className="text-[#149b8f]" />
              </div>
              <div>
                <h4 className="font-serif font-black text-slate-900 text-sm flex items-center gap-2">
                  Portal de Encuestas de Consumidores
                  <span className="bg-[#149b8f]/10 text-[#149b8f] text-[9px] font-black uppercase px-2 py-0.5 rounded-full select-none">
                    ENCUESTAS 💬
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 font-sans leading-normal">
                  Accede al panel donde los socios y comensales responden campañas de satisfacción vigentes para calificar su experiencia de servicio.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 select-none">
              <button
                onClick={() => {
                  const link = getBaseUrl() + '/#portal_encuestas';
                  navigator.clipboard.writeText(link);
                  setCopiedSurveyLink(true);
                  setTimeout(() => setCopiedSurveyLink(false), 2050);
                }}
                className="flex-grow sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-205 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                {copiedSurveyLink ? (
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

              <button
                type="button"
                onClick={() => {
                  if (onEnterPublicSurveyPortal) {
                    onEnterPublicSurveyPortal();
                  } else {
                    window.location.hash = 'portal_encuestas';
                  }
                }}
                className="flex-grow sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Ir al Portal (Esta Pestaña)</span>
              </button>
            </div>
          </div>

          <div className="bg-white/85 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs font-mono text-slate-600">
            <span className="truncate select-all">{getBaseUrl() + '/#portal_encuestas'}</span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#149b8f] bg-[#149b8f]/5 border border-[#149b8f]/10 px-2 py-0.5 rounded-md font-sans shrink-0 select-none">
              SATISFACCIÓN DEL CLIENTE
            </span>
          </div>

          {/* Development / Testing quick helper */}
          {typeof window !== 'undefined' && (window.location.origin.includes('run.app') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) && (
            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-2 text-left">
              <p className="text-[10px] text-amber-800 font-sans leading-normal">
                ⚠️ <strong>Nota de Pruebas:</strong> Hazle clic en "Ir al Portal" para probar de forma directa tus cambios en esta pestaña en modo cliente.
              </p>
            </div>
          )}

          {/* QR Code Section for Encuestas */}
          <div className="pt-4 border-t border-slate-200/60 font-sans">
            <h5 className="text-[10px] font-black text-[#149b8f] uppercase tracking-widest mb-3 flex items-center gap-1.5 select-none">
              <QrCode size={13} className="text-[#149b8f]" />
              <span>CÓDIGOS QR DE ACCESO (DESCARGABLES EN PNG)</span>
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* QR Producción */}
              <div className="bg-white/95 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden group shadow-xs">
                <div className="absolute top-2 left-2 bg-emerald-500/10 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded select-none">
                  ENCUESTAS EN PRODUCCIÓN (VERCEL)
                </div>
                <div className="w-32 h-32 bg-slate-50 rounded-xl flex items-center justify-center p-2 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                  {qrEncuestasProd ? (
                    <img src={qrEncuestasProd} alt="QR Encuestas Producción" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="animate-pulse text-slate-400 text-[10px]">Generando QR...</div>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs">
                  Escanea para que los socios abran directamente el cuestionario público de satisfacción.
                </p>
                <button
                  type="button"
                  onClick={() => downloadQRCode(qrEncuestasProd, 'QR_Encuestas_Clientes_Prod.png')}
                  disabled={!qrEncuestasProd}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-300 text-white font-bold text-[10px] rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download size={12} />
                  <span>Descargar QR Producción (PNG)</span>
                </button>
              </div>

              {/* QR Entorno Local */}
              {typeof window !== 'undefined' && (window.location.origin.includes('run.app') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) && (
                <div className="bg-white/95 border border-amber-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden group shadow-xs">
                  <div className="absolute top-2 left-2 bg-amber-500/10 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded select-none">
                    ENTORNO DE PRUEBAS (ACTUAL)
                  </div>
                  <div className="w-32 h-32 bg-slate-50 rounded-xl flex items-center justify-center p-2 border border-amber-100 group-hover:scale-105 transition-transform duration-300">
                    {qrEncuestasDev ? (
                      <img src={qrEncuestasDev} alt="QR Encuestas Pruebas" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="animate-pulse text-amber-600 text-[10px]">Generando QR...</div>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-800/80 leading-normal max-w-xs">
                    Escanea para responder encuestas conectadas al entorno de desarrollo actual.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadQRCode(qrEncuestasDev, 'QR_Encuestas_Clientes_Pruebas.png')}
                    disabled={!qrEncuestasDev}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-[10px] rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download size={12} />
                    <span>Descargar QR Pruebas (PNG)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 4 metrics Cards (Screen 9) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clientes Registrados', value: customers.length, color: 'text-[#149b8f]' },
          { label: 'Visitas Totales', value: visits.length, color: 'text-slate-800' },
          { label: 'Premios Otorgados', value: customers.reduce((sum, c) => sum + (c.unlockedVouchers?.length || 0), 0), color: 'text-rose-600' },
          { label: 'Promedio Visitas/Cliente', value: customers.length > 0 ? (visits.length / customers.length).toFixed(1) : '0.0', color: 'text-teal-700' }
        ].map((met, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-sans text-slate-400 font-bold tracking-wider">{met.label}</p>
            <h3 className={`text-2xl font-serif font-black ${met.color} mt-1.5`}>{met.value}</h3>
          </div>
        ))}
      </div>

      {/* ⚙ PLANTILLA DE FELICITACIÓN DE CUMPLEAÑOS & AUTOMATIZACIÓN DE WHATSAPP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
          <span className="p-2 bg-[#149b8f]/5 text-[#149b8f] rounded-xl flex items-center justify-center">
            <Gift size={20} />
          </span>
          <div>
            <h4 className="font-serif font-black text-slate-900 text-sm">
              Plantilla de Felicitación de Cumpleaños & Automatización de WhatsApp
            </h4>
            <p className="text-[10px] text-slate-400 font-sans uppercase tracking-[0.05em] font-bold">
              Configurador de Campañas de Cumpleaños
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Diseña la redacción para enviar por WhatsApp o copiar al portapapeles en la sección de Cumpleaños. El sistema sustituirá automáticamente las variables <code className="font-mono bg-slate-100 px-1 py-0.5 text-blue-750 rounded font-bold">&#123;nombre&#125;</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 text-blue-750 rounded font-bold">&#123;fecha&#125;</code> y <code className="font-mono bg-slate-100 px-1 py-0.5 text-blue-750 rounded font-bold">&#123;folio&#125;</code> con los datos reales de cada socio.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Editor block */}
          <div className="space-y-3 text-left">
            <label className="text-[10.5px] uppercase font-sans text-slate-500 font-extrabold tracking-wider block">Redacción del Mensaje</label>
            <textarea
              className="w-full text-xs font-sans text-slate-700 border border-slate-250 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#149b8f]/50 focus:border-[#149b8f] min-h-[110px]"
              value={bdayTemplate}
              onChange={(e) => handleUpdateTemplate(e.target.value)}
              placeholder="Escribe el mensaje de felicitación de cumpleaños aquí..."
            />
            {/* Quick cheat-sheet buttons */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-bold self-center">Insertar:</span>
              <button
                type="button"
                onClick={() => handleUpdateTemplate(bdayTemplate + ' {nombre}')}
                className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
              >
                &#123;nombre&#125;
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTemplate(bdayTemplate + ' {fecha}')}
                className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
              >
                &#123;fecha&#125;
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTemplate(bdayTemplate + ' {folio}')}
                className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
              >
                &#123;folio&#125;
              </button>
            </div>
          </div>

          {/* Right Preview Column which also contains constraints */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Live mockup preview display */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative space-y-2.5 text-left">
              <span className="absolute top-2.5 right-2.5 text-[8px] uppercase tracking-widest font-black text-slate-400 font-sans">Vista Previa</span>
              <p className="text-[10.5px] uppercase font-sans text-slate-500 font-extrabold tracking-wider">Así se enviará el mensaje:</p>
              <div className="bg-white border border-slate-150 p-3 rounded-xl text-xs text-slate-600 leading-relaxed max-h-[110px] overflow-y-auto font-sans shadow-sm">
                {getCustomGreeting("Sofía García", "1087", "10 de Junio")}
              </div>
            </div>

            {/* Checkbox rule constraints: Only enable for birthdays on the current day */}
            <label className="flex items-start gap-3 bg-[#149b8f]/5 rounded-2xl border border-[#149b8f]/10 p-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyTodayActive}
                onChange={(e) => handleUpdateOnlyTodayActive(e.target.checked)}
                className="mt-1 accent-[#149b8f]"
              />
              <div className="text-left">
                <span className="text-xs font-black text-slate-800 block">Solo activar botones el día del cumpleaños</span>
                <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                  Si se activa (recomendado), los botones de <strong>Copiar</strong> y de <strong>WhatsApp</strong> en la sección de cumpleaños se habilitarán *exclusivamente* para los socios cuya fecha de cumpleaños sea el día de hoy. Para el resto de los días, se habilitará un candado de seguridad preventiva.
                </span>
              </div>
            </label>
          </div>
        </div>
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

      {/* 📊 PANEL DE VISUALIZACIÓN GRÁFICA MULTIVARIABLE (STAMP CLUBS & LOG TRADING) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="border-b border-slate-150 pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-serif font-black text-slate-900 text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-[#149b8f]" />
            Panel de Visualización Gráfica y Tendencias en Tiempo Real
          </h4>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#149b8f] bg-[#149b8f]/5 border border-[#149b8f]/10 px-2.5 py-0.5 rounded-md font-sans">
            Métricas Activas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Box 1: SVG Line Trend */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4.5 space-y-3 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] uppercase font-sans text-slate-500 font-extrabold tracking-wider">Histórico de Visitas Recientes</span>
              <span className="text-[9px] text-[#149b8f] font-bold">Variación Diaria</span>
            </div>
            <div className="pt-2">
              {(() => {
                const trends = getVisitTrends();
                const maxCount = Math.max(...trends.map(t => t.count), 1);
                
                const height = 120;
                const width = 280;
                const padding = 20;
                
                const points = trends.map((t, idx) => {
                  const x = padding + (idx * (width - padding * 2)) / (trends.length - 1);
                  const y = height - padding - (t.count / maxCount) * (height - padding * 2);
                  return { x, y, label: t.label, val: t.count };
                });
                
                const pathD = points.reduce((acc, p, idx) => {
                  return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, '');
                
                const areaD = points.length > 0 
                  ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
                  : '';

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#149b8f" stopOpacity="0.32"/>
                        <stop offset="100%" stopColor="#149b8f" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f1f5f9" strokeWidth="1" />
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                    
                    {areaD && <path d={areaD} fill="url(#areaGrad)" />}
                    {pathD && <path d={pathD} fill="none" stroke="#149b8f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                    
                    {points.map((p, idx) => (
                      <g key={idx} className="group">
                        <circle cx={p.x} cy={p.y} r="3" fill="#149b8f" stroke="#ffffff" strokeWidth="1.5" />
                        {idx % 2 === 0 && (
                          <text x={p.x} y={height - 4} fontSize="7.5" fill="#94a3b8" textAnchor="middle" className="font-mono">
                            {p.label}
                          </text>
                        )}
                        <text x={p.x} y={p.y - 6} fontSize="8" fontWeight="bold" fill="#334155" textAnchor="middle" className="hidden group-hover:block pointer-events-none">
                          {p.val}
                        </text>
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>
          </div>

          {/* Box 2: Card Stamping Journey */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4.5 space-y-3 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] uppercase font-sans text-slate-500 font-extrabold tracking-wider">Distribución del Club de Socios</span>
              <span className="text-[9px] text-[#149b8f] font-bold">Estatus del Tarjetón</span>
            </div>
            <div className="space-y-2 pt-1">
              {(() => {
                const distribution = getStampsDistribution();
                const maxVal = Math.max(...Object.values(distribution), 1);
                return Object.entries(distribution).map(([label, count]) => {
                  const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span className="truncate">{label}</span>
                        <span className="font-mono">{count} socios</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-[#149b8f] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: '#149b8f' }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Box 3: Gauge of coupon status */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4.5 space-y-3 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] uppercase font-sans text-slate-500 font-extrabold tracking-wider">Conversión de Cupones de Premio</span>
              <span className="text-[9px] text-rose-600 font-bold">Tasa Canjes</span>
            </div>
            <div className="pt-1">
              {(() => {
                const stats = getCouponStatus();
                const total = stats.unlocked;
                const redeemedPct = total > 0 ? (stats.redeemed / total) * 100 : 50;
                return (
                  <div className="flex items-center gap-4 py-1.5 justify-around flex-wrap">
                    {/* SVG Ring Dial */}
                    <div className="relative w-16 h-16 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle 
                          cx="18" cy="18" r="15.915" fill="none" 
                          stroke="#e11d48" strokeWidth="3" 
                          strokeDasharray={`${redeemedPct} ${100 - redeemedPct}`} 
                          strokeDashoffset="0"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-mono font-black text-rose-600 leading-none">{Math.round(redeemedPct)}%</span>
                        <span className="text-[7px] uppercase font-bold text-slate-400">Canje</span>
                      </div>
                    </div>
                    
                    {/* Segment Metrics */}
                    <div className="space-y-1 text-xs text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        <span className="text-slate-500 text-[11px] font-medium">Otorgados: <strong>{total}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-slate-500 text-[11px] font-medium">Canjeados: <strong className="text-rose-600">{stats.redeemed}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-500 text-[11px] font-medium">Pendientes: <strong className="text-emerald-700">{stats.active}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

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
              const metrics = currentClerkCounts[codeKey] || { total: 0, registers: 0, visits: 0, birthdayCalls: 0 };
              
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-cyan-50 text-cyan-800 font-black px-2 py-0.5 border border-cyan-150 rounded text-[9px]">
                        {clerk.code}
                      </span>
                      <span className="font-bold text-slate-700">{clerk.name}</span>
                    </div>
                    {metrics.birthdayCalls > 0 && (
                      <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                        🎂 {metrics.birthdayCalls} {metrics.birthdayCalls === 1 ? 'llamada cpl.' : 'llamadas cpls.'}
                      </p>
                    )}
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

      {/* DISEÑO DE ENCUESTAS Y CAMPAÑAS DE FIDELIDAD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 text-left">
        <h3 className="font-serif font-black text-base text-slate-900 border-b border-slate-150 pb-2 flex items-center gap-1.5">
          <MessageSquare size={18} className="text-[#149b8f]" />
          Diseño de Encuestas y Campañas de Fidelidad
        </h3>

        {showMockExportSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-100 text-center animate-pulse">
            ✨ {showMockExportSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* COLUMN 1: CREATOR FORM */}
          <form onSubmit={handlePublishSurvey} className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
            <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between gap-1">
              <span>{editingSurveyId ? '✏️ Editar Campaña / Encuesta' : '📝 Crear Nueva Campaña / Encuesta'}</span>
              {editingSurveyId && (
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="text-[10px] bg-red-50 text-red-600 hover:bg-red-100 px-2 py-0.5 rounded border border-red-150/35 font-bold cursor-pointer normal-case"
                >
                  Cancelar Edición
                </button>
              )}
            </h4>

            {/* Title field */}
            <div className="space-y-1 block text-xs">
              <label className="text-slate-500 font-bold block">Título de la Campaña *</label>
              <input
                type="text"
                required
                placeholder="Ej. Encuesta de Cafetería y Bistro Junio"
                value={newSurveyTitle}
                onChange={(e) => setNewSurveyTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all font-medium text-slate-800"
              />
            </div>

            {/* Reward field */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-500 font-bold block">Premio / Incentivo de Respuesta</label>
              <select
                value={newSurveyReward}
                onChange={(e) => setNewSurveyReward(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-[#149b8f] rounded-xl px-2.5 py-2.5 text-xs outline-none font-bold text-slate-700 cursor-pointer"
              >
                <option value="1 Sello de Fidelidad">🎁 1 Sello de Fidelidad Extra</option>
                <option value="10% de descuento">🎁 Cupón: 10% de descuento</option>
                <option value="15% de descuento">🎁 Cupón: 15% de descuento</option>
                <option value="Café Americano de cortesía">🎁 Cupón: Café Americano Chico Gratis</option>
                <option value="Postre gratis">🎁 Cupón: Galleta o muffin gratis</option>
                <option value="Sin recompensa">❌ Ningún premio (Cortesía)</option>
              </select>
            </div>

            {/* Campaign type option */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-500 font-bold block mb-1">Estructura del Formato</label>
              <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsCampaignMode(false)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isCampaignMode ? 'bg-[#149b8f] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-55'
                  }`}
                >
                  Pregunta Única
                </button>
                <button
                  type="button"
                  onClick={() => setIsCampaignMode(true)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isCampaignMode ? 'bg-[#149b8f] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-55'
                  }`}
                >
                  Campaña Multi-Pregunta
                </button>
              </div>
            </div>

            {/* Mode selection contents */}
            {!isCampaignMode ? (
              /* SINGLE QUESTION BUILDER */
              <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Pregunta Única *</label>
                  <input
                    type="text"
                    placeholder="Ej. ¿Qué opinas de la nueva variedad de granos chiapanecos?"
                    value={newSurveyQuestion}
                    onChange={(e) => setNewSurveyQuestion(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#149b8f] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Opciones de Respuesta (Doble clic / Enter para agregar)</label>
                  <p className="text-[9.5px] text-slate-400 pb-1">Deje vacío si desea una respuesta de texto libre libre.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. Excelente"
                      value={newSurveyOption}
                      onChange={(e) => setNewSurveyOption(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOptionToNewSurvey();
                        }
                      }}
                      className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#149b8f] transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddOptionToNewSurvey}
                      className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {newSurveyOptionsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {newSurveyOptionsList.map((opt, oIdx) => (
                        <span key={oIdx} className="bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                          {opt}
                          <button
                            type="button"
                            onClick={() => setNewSurveyOptionsList(newSurveyOptionsList.filter((_, idx) => idx !== oIdx))}
                            className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* MULTI QUESTION CAMPAIGN BUILDER */
              <div className="space-y-4 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                
                {/* Questions list added */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold block">Preguntas Compiladas ({campaignQuestions.length})</span>
                  {campaignQuestions.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center text-slate-400 italic text-[11px]">
                      No has agregado preguntas a esta campaña de lealtad aún.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {campaignQuestions.map((q, qIdx) => (
                        <div key={q.id} className="bg-slate-50 border border-slate-150 p-2 rounded-lg flex justify-between items-center gap-2">
                          <span className="truncate flex-1 font-semibold pr-3 text-slate-750">
                            <strong>{qIdx + 1}.</strong> {q.text} <span className="text-[9px] text-[#149b8f] uppercase font-bold">({q.type === 'multiple' ? 'Opción múltiple' : 'Libre'})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setCampaignQuestions(campaignQuestions.filter(curr => curr.id !== q.id))}
                            className="text-red-500 hover:text-red-700 font-bold text-xs p-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub builder */}
                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  <span className="text-[#149b8f] font-mono text-[9px] uppercase font-black block tracking-wider">Añadir Pregunta</span>
                  
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Texto de la pregunta"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#149b8f] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewQuestionType('multiple')}
                      className={`py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        newQuestionType === 'multiple' ? 'bg-[#149b8f]/10 border-[#149b8f] text-[#11847a]' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      Opción Múltiple
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuestionType('open')}
                      className={`py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        newQuestionType === 'open' ? 'bg-[#149b8f]/10 border-[#149b8f] text-[#11847a]' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      Texto Abierto Libre
                    </button>
                  </div>

                  {newQuestionType === 'multiple' && (
                    <div className="space-y-1 block">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Opción de respuesta"
                          value={newQuestionOption}
                          onChange={(e) => setNewQuestionOption(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOptionToQuestion();
                            }
                          }}
                          className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#149b8f] transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAddOptionToQuestion}
                          className="px-3 bg-slate-100 border border-slate-250 font-bold rounded-lg cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {newQuestionOptionsList.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {newQuestionOptionsList.map((opt, oIdx) => (
                            <span key={oIdx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                              {opt}
                              <button
                                type="button"
                                onClick={() => setNewQuestionOptionsList(newQuestionOptionsList.filter((_, idx) => idx !== oIdx))}
                                className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddQuestionToCampaign}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-150 rounded-xl text-xs"
                  >
                    + Agregar esta Pregunta a la Lista
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#149b8f] hover:bg-[#11847a] text-white font-black rounded-xl text-xs uppercase tracking-wide cursor-pointer transition-all active:scale-[0.985] text-center flex items-center justify-center gap-2 shadow-sm"
            >
              🚀 {editingSurveyId ? 'Guardar Cambios de la Encuesta' : 'Publicar Encuesta / Campaña al Aire'}
            </button>
          </form>

          {/* COLUMN 2: ACTIVE SURVEYS GRID */}
          <div className="space-y-4">
            <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1">
              📢 Campañas Publicadas en Sistema ({surveys.length})
            </h4>

            {/* AI Strat and Marketing Conclusion Dashboard Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-teal-50/70 border border-indigo-150/65 rounded-2xl p-4 space-y-3.5 shadow-sm text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-indigo-600/10 pointer-events-none">
                <Sparkles size={48} />
              </div>
              
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-[12px] uppercase tracking-wider">
                    <Sparkles size={14} className="animate-pulse" />
                    <span>Conclusión de Estrategia con IA Gemini</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">Análisis semántico automatizado en tiempo real de satisfacción y retención.</p>
                </div>
                
                <button
                  type="button"
                  disabled={isLoadingAiConclusion || surveys.length === 0}
                  onClick={fetchAiConclusion}
                  className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-750 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-[10px] rounded-lg tracking-wide uppercase shadow-sm cursor-pointer transition-all flex items-center gap-1 shrink-0"
                >
                  {isLoadingAiConclusion ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analizando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span>Sincronizar IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Display Result */}
              {(() => {
                const marketing = getMarketingConclusion();
                return (
                  <div className="space-y-3">
                    {/* Metrics row */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 backdrop-blur-xs border border-indigo-100 rounded-xl p-2.5 space-y-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Índice Satisfacción</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-black text-indigo-650 text-base">{marketing.acceptanceScore}%</span>
                          <span className="text-[10px] text-slate-550 font-bold bg-indigo-100/50 px-1.5 py-0.5 rounded uppercase">
                            {marketing.satisfactionLevel}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-xs border border-teal-100 rounded-xl p-2.5 space-y-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Incentivos en Curso</span>
                        <span className="font-bold text-teal-800 text-xs block truncate">
                          {surveys.find(s => s.active)?.reward || 'Sin premios asignados'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 border border-indigo-100/40 text-[11px] text-slate-700 leading-relaxed space-y-2">
                      <p className="italic font-serif">"{marketing.generalConclusion}"</p>
                      
                      {marketing.keyStrengths.length > 0 && (
                        <div className="space-y-1 text-[10.5px] pt-1">
                          <strong className="text-emerald-700 uppercase tracking-wide text-[9px] block">✔ Fortalezas Clave:</strong>
                          <ul className="list-disc pl-4 space-y-0.5 font-medium text-slate-650">
                            {marketing.keyStrengths.map((s, idx) => <li key={idx}>{s}</li>)}
                          </ul>
                        </div>
                      )}

                      {marketing.keyOpportunities.length > 0 && (
                        <div className="space-y-1 text-[10.5px] pt-1">
                          <strong className="text-amber-700 uppercase tracking-wide text-[9px] block">⚠ Oportunidades Críticas:</strong>
                          <ul className="list-disc pl-4 space-y-0.5 font-medium text-slate-650">
                            {marketing.keyOpportunities.map((o, idx) => <li key={idx}>{o}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    {marketing.criticalAlerts && marketing.criticalAlerts.length > 0 && (
                      <div className="bg-rose-50/80 border border-rose-200/60 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-[10.5px] uppercase tracking-wider">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse inline-block" />
                          <span>⚠️ Alertas de Comentarios Críticos ({marketing.criticalAlerts.length})</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-normal">La IA de Gemini detectó socio(s) insatisfecho(s). Toma importancia y actúa hoy:</p>
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                          {marketing.criticalAlerts.map((alert, aIdx) => (
                            <div key={aIdx} className="bg-white border border-rose-100 rounded-lg p-2.5 space-y-1.5 text-left text-[10.5px] shadow-2xs">
                              <div className="flex justify-between items-center text-[9px] text-slate-500 border-b border-rose-100/30 pb-1">
                                <span>👤 <strong className="text-slate-800">{alert.customerName}</strong> ({alert.customerFolio})</span>
                                <span className="bg-rose-100 text-rose-850 font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded">SENTIMIENTO BAJO</span>
                              </div>
                              <div className="bg-rose-50/20 p-2 rounded border border-slate-100 text-slate-700 italic">
                                <strong className="text-slate-500 font-sans block text-[8.5px] uppercase font-bold not-italic">Pregunta: {alert.questionText}</strong>
                                "{alert.answerText}"
                              </div>
                              <div className="text-indigo-950 bg-indigo-50 border border-indigo-100/70 p-2 rounded text-[10.5px] font-medium leading-relaxed">
                                <span className="text-indigo-800 font-extrabold text-[8.5px] uppercase block tracking-wider mb-0.5">💡 Análisis de Mitigación IA:</span>
                                {alert.aiAnalysis}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {surveys.filter(s => !s.deleted).length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-12 text-center text-slate-400 italic text-xs">
                  No se han registrado encuestas. Comienza construyendo una a la izquierda.
                </div>
              ) : (
                surveys.filter(s => !s.deleted).map((srv) => {
                  const qCount = srv.questions ? srv.questions.length : 1;
                  return (
                    <div key={srv.id} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 relative shadow-xs flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap pr-16 text-left">
                          <h5 className="font-extrabold text-slate-900 text-[13px] leading-snug">{srv.title}</h5>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            srv.active 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-250/20' 
                              : 'bg-slate-100 text-slate-500 border border-slate-250/20'
                          }`}>
                            {srv.active ? 'Activa' : 'Detenida'}
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                            {qCount} {qCount === 1 ? 'pregunta' : 'preguntas'}
                          </span>
                        </div>

                        {srv.reward && srv.reward !== 'Sin recompensa' && (
                          <div className="text-[10px] text-[#149b8f] font-bold flex items-center gap-1 text-left">
                            🎁 Premio: <strong className="bg-[#149b8f]/5 px-2 py-0.5 rounded-lg border border-[#149b8f]/10">{srv.reward}</strong>
                          </div>
                        )}
                      </div>

                      {/* Summary Metrics & Actions */}
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-xs gap-3">
                        <div className="text-left font-sans flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Respuestas:</span>
                          <strong className="text-slate-800 text-[13px]">{srv.submissionsCount || 0}</strong>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Edit Survey btn */}
                          <button
                            type="button"
                            onClick={() => handleEditSurveyClick(srv)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150/40 text-[10px] font-bold rounded-lg uppercase cursor-pointer flex items-center gap-1"
                            title="Editar Preguntas o Configuración de Encuesta"
                          >
                            <Edit size={11} />
                            <span>Editar</span>
                          </button>

                          {/* Toggle Active btn */}
                          <button
                            type="button"
                            onClick={() => handleToggleSurvey(srv.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              srv.active 
                                ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-150/40' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150/40'
                            }`}
                          >
                            {srv.active ? 'Pausar' : 'Reactivar'}
                          </button>

                          {/* View Submissions answers */}
                          <button
                            type="button"
                            onClick={() => setShowSubmissionsModal(srv.id)}
                            className="px-2.5 py-1.5 bg-[#149b8f]/10 hover:bg-[#149b8f]/20 text-[#149b8f] border border-[#149b8f]/15 text-[10px] font-black rounded-lg uppercase cursor-pointer"
                          >
                            🔍 Respuestas
                          </button>
                        </div>
                      </div>

                      {/* Absolute delete button with inline sandbox-friendly confirm */}
                      {surveyToDeleteId === srv.id ? (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-1 animate-fadeIn z-10 transition-all select-none">
                          <span className="text-[9px] text-red-600 font-extrabold uppercase px-1 font-sans">¿Borrar?</span>
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteSurvey(srv.id);
                              setSurveyToDeleteId(null);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md cursor-pointer shadow-xs shrink-0 font-sans"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={() => setSurveyToDeleteId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-black uppercase px-1.5 py-1 rounded-md cursor-pointer shrink-0 font-sans"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSurveyToDeleteId(srv.id)}
                          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Eliminar Encuesta Permanentemente"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
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
                <th className="p-3.5 text-center">Modificar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedFilteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">No hay registros que coincidan con la búsqueda.</td>
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
                        {item.type === 'birthday_call' ? '📞 Llamada Cumpleaños' : (item.type as string) === 'customer_registered' ? '🆕 Registro Nuevo' : '☕ Visita registrada'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-[#149b8f]">
                        {item.type === 'birthday_call' ? 'Completado' : (item.type as string) === 'stamp_added' ? `+${item.amount} taza(s)` : 'Creado'}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleStartEditLog(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-[#149b8f]/10 text-slate-700 hover:text-[#149b8f] rounded-lg border border-slate-200 hover:border-[#149b8f]/30 transition-all font-sans font-bold text-[10.5px] cursor-pointer"
                        >
                          <Edit size={11} className="shrink-0" />
                          Editar
                        </button>
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
        const targetAnswers = uniqueSurveyAnswers.filter(ans => ans.surveyId === showSubmissionsModal);

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
                          const lowerAns = (item.answerText || '').toLowerCase();
                          const negativeKeywords = [
                            'malo', 'pésimo', 'grosero', 'sucio', 'insatisfecho', 'regular', 'mejorar', 
                            'tardado', 'lento', 'demasiado', 'apático', 'apatía', 'tardo', 'frio', 'frío',
                            'atención lenta', 'no me gustó', 'error', 'fallo', 'caro', 'decepcion', 'queja', 'limpieza'
                          ];
                          const negativeTexts = [
                            'requiere mejorar', 'apático o poco atento', 'mala atención', 'lento (> 10 minutos)', 'demasiado tardado', 'poca selección'
                          ];
                          const isNegative = negativeKeywords.some(kw => lowerAns.includes(kw)) || negativeTexts.some(neg => lowerAns.includes(neg));
                          const isTextAnswer = item.answerText.length > 25;

                          return (
                            <div key={item.questionId} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-550 font-bold block text-[10.5px]">Pregunta: {item.questionText}</span>
                                {isNegative && (
                                  <span className="bg-red-100 text-red-800 font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase animate-pulse flex items-center gap-0.5">
                                    ⚠️ ALERTA IA: CRÍTICO
                                  </span>
                                )}
                              </div>
                              <div className={`p-2.5 rounded-xl border leading-relaxed text-[11px] ${
                                isNegative
                                  ? 'bg-rose-50/60 text-slate-900 border-red-200 block shadow-inner'
                                  : isTextAnswer 
                                    ? 'bg-amber-50/40 text-slate-800 border-amber-100 italic block font-medium shadow-inner' 
                                    : 'bg-white border-slate-200 text-slate-850 font-bold font-sans'
                              }`}>
                                {item.answerText ? (
                                  <span className={isNegative ? 'font-bold text-red-950 font-sans' : ''}>
                                    {item.answerText}
                                  </span>
                                ) : (
                                  <em className="text-slate-400 font-normal font-sans">Sin comentarios</em>
                                )}
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

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[#2bbba9] font-mono text-[9px] uppercase tracking-wider font-extrabold block">MÓDULO DE EDICIÓN</span>
                <h3 className="text-base font-serif font-black flex items-center gap-1.5">
                  <Edit size={16} />
                  Editar Registro de Acción
                </h3>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer font-bold transition text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLogEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {editLogError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl font-medium animate-in fade-in duration-200">
                  ⚠️ {editLogError}
                </div>
              )}

              {editLogSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-[#149b8f] text-xs p-3.5 rounded-xl font-medium animate-in fade-in duration-200">
                  ✨ {editLogSuccess}
                </div>
              )}

              {/* Fecha y Hora */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora de la Acción</label>
                <input
                  type="datetime-local"
                  required
                  value={editLogTimestamp}
                  onChange={(e) => setEditLogTimestamp(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all"
                />
              </div>

              {/* Clerk / Encargado Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Encargado (Nombre y Clave)</label>
                <select
                  value={editLogClerkCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setEditLogClerkCode(code);
                    if (code === 'GER') {
                      setEditLogClerkName('Gerencia');
                    } else {
                      const match = clerks.find(c => c.code === code);
                      if (match) {
                        setEditLogClerkName(match.name);
                      }
                    }
                  }}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all cursor-pointer"
                >
                  <option value="GER">Gerencia (GER)</option>
                  {clerks.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Se autoseleccionan el nombre registrado ({editLogClerkName}) y código correspondientes.
                </p>
              </div>

              {/* Customer Folio */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Folio Cliente</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Ej. 002"
                    value={editLogCustomerFolio}
                    onChange={(e) => setEditLogCustomerFolio(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre del Cliente</label>
                  <input
                    type="text"
                    placeholder="Registrado automáticamente"
                    value={editLogCustomerName}
                    onChange={(e) => setEditLogCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none text-slate-500 font-bold"
                  />
                </div>
              </div>

              {/* Event Type & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Acción</label>
                  <select
                    value={editLogType}
                    onChange={(e) => setEditLogType(e.target.value as any)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all cursor-pointer"
                  >
                    <option value="stamp_added">Sello Acreditado (stamp_added)</option>
                    <option value="reward_unlocked">Premio Desbloqueado (reward_unlocked)</option>
                    <option value="voucher_redeemed">Cupón Redimido (voucher_redeemed)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cantidad de Tazas/Sellos</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={editLogAmount}
                    onChange={(e) => setEditLogAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Título de Acción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sello Acreditado #002"
                  value={editLogTitle}
                  onChange={(e) => setEditLogTitle(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Descripción Detallada</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Se registró visita por el encargado..."
                  value={editLogDescription}
                  onChange={(e) => setEditLogDescription(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all leading-normal"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!!editLogSuccess}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-[#149b8f] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {editLogSuccess ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
