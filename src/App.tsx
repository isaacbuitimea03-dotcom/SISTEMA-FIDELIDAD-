import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, Sparkles, User, Sliders, RefreshCw, HelpCircle, Key, 
  Store, ChevronRight, CheckCircle2, Ticket, UserPlus, FileText, 
  Lock, Unlock, LogOut, LogIn, Calendar, Cake, Search, Mail, 
  Phone, Trash2, ArrowLeft, RotateCcw, Plus, Check, MessageSquare, Gift, Pencil
} from 'lucide-react';

import { 
  RegisteredCustomer, VisitRecord, ActivityLog, 
  UserSession, MerchantConfig, Survey, SurveyAnswer, Clerk,
  AppNotification
} from './types';
import { DEFAULT_MERCHANT_CONFIG } from './utils/rewards';
import { 
  generateInitialCustomers, 
  INITIAL_VISITS, 
  INITIAL_LOGS 
} from './utils/mockData';

// Import modular panels
import BirthdayTabPanel from './components/BirthdayTabPanel';
import MerchantReportsTabPanel from './components/MerchantReportsTabPanel';
import CustomerCard from './components/CustomerCard';
import ClientSurveyWizard from './components/ClientSurveyWizard';
import { MiCafecitoLogo } from './components/MiCafecitoLogo';
import CustomerNotificationCenter from './components/CustomerNotificationCenter';

import { 
  dbSaveCustomer, dbDeleteCustomer, dbSaveVisit, dbSaveLog, dbSaveConfig,
  dbSaveSurvey, dbSaveAnswer, dbSaveClerk, dbDeleteClerk,
  dbSaveNotification, dbDeleteNotification,
  subscribeToCollection, testConnection, db
} from './utils/firebase';
import { getDocs, collection, doc, deleteDoc } from 'firebase/firestore';

const INITIAL_SURVEYS: Survey[] = [];

const INITIAL_SURVEY_ANSWERS: SurveyAnswer[] = [];


export default function App() {
  // PERSISTENCE STORAGE KEYS
  const CUSTOMERS_KEY = 'cafecito_loyalty_customers_v3';
  const VISITS_KEY = 'cafecito_loyalty_visits_v3';
  const LOGS_KEY = 'cafecito_loyalty_logs_v3';
  const APP_CONFIG_KEY = 'cafecito_loyalty_config_v3';
  const SURVEYS_KEY = 'cafecito_loyalty_surveys_v4';
  const ANSWERS_KEY = 'cafecito_loyalty_survey_answers_v4';

  // 1. Core State
  const [consumers, setConsumers] = useState<RegisteredCustomer[]>(() => {
    const saved = localStorage.getItem(CUSTOMERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          let flag = 0;
          return parsed.map((c: any) => ({
            ...c,
            visitsHistory: (c.visitsHistory || []).map((v: any) => {
              let updatedClerkName = v.clerkName;
              let updatedClerkCode = v.clerkCode;
              if (v.clerkName === 'Arlett' || v.clerkName === 'ARLETT' || (v.clerkCode === 'C03' && v.clerkName?.includes('Arlett'))) {
                if (flag % 2 === 0) {
                  updatedClerkName = 'Noelia';
                  updatedClerkCode = 'C03';
                } else {
                  updatedClerkName = 'Jose Luis';
                  updatedClerkCode = 'CO1';
                }
                flag++;
              }
              return {
                ...v,
                clerkName: updatedClerkName,
                clerkCode: updatedClerkCode
              };
            })
          }));
        }
      } catch (e) {
        console.error('Error loading customers', e);
      }
    }
    return generateInitialCustomers();
  });

  const [visits, setVisits] = useState<VisitRecord[]>(() => {
    const saved = localStorage.getItem(VISITS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          let flag = 0;
          return parsed.map((v: any) => {
            let updatedClerkName = v.clerkName;
            let updatedClerkCode = v.clerkCode;
            if (v.clerkName === 'Arlett' || v.clerkName === 'ARLETT' || (v.clerkCode === 'C03' && v.clerkName?.includes('Arlett'))) {
              if (flag % 2 === 0) {
                updatedClerkName = 'Noelia';
                updatedClerkCode = 'C03';
              } else {
                updatedClerkName = 'Jose Luis';
                updatedClerkCode = 'CO1';
              }
              flag++;
            }
            return {
              ...v,
              clerkName: updatedClerkName,
              clerkCode: updatedClerkCode
            };
          });
        }
      } catch (e) {
        console.error('Error loading visits', e);
      }
    }
    return INITIAL_VISITS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(LOGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          let flag = 0;
          return parsed.map((l: any) => {
            let updatedClerkName = l.clerkName;
            let updatedClerkCode = l.clerkCode;
            let updatedDescription = l.description || '';
            if (l.clerkName === 'Arlett' || l.clerkName === 'ARLETT' || (l.clerkCode === 'C03' && l.clerkName?.includes('Arlett'))) {
              if (flag % 2 === 0) {
                updatedClerkName = 'Noelia';
                updatedClerkCode = 'C03';
              } else {
                updatedClerkName = 'Jose Luis';
                updatedClerkCode = 'CO1';
              }
              flag++;
            }
            // If description contains "Arlett" referring to the clerk
            if (updatedDescription.includes('encargado Arlett (C03)')) {
              updatedDescription = updatedDescription.replace('encargado Arlett (C03)', `encargado ${updatedClerkName} (${updatedClerkCode})`);
            } else if (updatedDescription.includes('encargado Arlett')) {
              updatedDescription = updatedDescription.replace('encargado Arlett', `encargado ${updatedClerkName}`);
            } else if (updatedDescription.includes('Autorizó: Arlett, C03')) {
              updatedDescription = updatedDescription.replace('Autorizó: Arlett, C03', `Autorizó: ${updatedClerkName}, ${updatedClerkCode}`);
            } else if (updatedDescription.includes('Autorizó: Arlett')) {
              updatedDescription = updatedDescription.replace('Autorizó: Arlett', `Autorizó: ${updatedClerkName}`);
            }
            return {
              ...l,
              clerkName: updatedClerkName,
              clerkCode: updatedClerkCode,
              description: updatedDescription
            };
          });
        }
      } catch (e) {
        console.error('Error loading logs', e);
      }
    }
    return INITIAL_LOGS;
  });

  const [config, setConfig] = useState<MerchantConfig>(() => {
    const saved = localStorage.getItem(APP_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.mainRewardTitle === 'Café o Bebida Gratis') {
          parsed.mainRewardTitle = '20% de Descuento';
        }
        parsed.stampsRequired = 8; // Guarantee 8 cups/stamps
        return parsed;
      } catch (e) {}
    }
    return DEFAULT_MERCHANT_CONFIG;
  });

  const [surveys, setSurveys] = useState<Survey[]>(() => {
    const saved = localStorage.getItem(SURVEYS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading surveys', e);
      }
    }
    return INITIAL_SURVEYS;
  });

  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswer[]>(() => {
    const saved = localStorage.getItem(ANSWERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading survey answers', e);
      }
    }
    return INITIAL_SURVEY_ANSWERS;
  });

  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);

  // Firestore real-time initialization and initial synchronization
  useEffect(() => {
    testConnection();

    const initSync = async () => {
      try {
        console.log('Starting intelligent two-way synchronization with Firebase Firestore...');

        // 1. Fetch cloud snapshots
        const [
          cloudCustomersSnap,
          cloudVisitsSnap,
          cloudLogsSnap,
          cloudConfigSnap,
          cloudSurveysSnap,
          cloudAnswersSnap,
          cloudClerksSnap
        ] = await Promise.all([
          getDocs(collection(db, 'customers')),
          getDocs(collection(db, 'visits')),
          getDocs(collection(db, 'logs')),
          getDocs(collection(db, 'config')),
          getDocs(collection(db, 'surveys')),
          getDocs(collection(db, 'surveyAnswers')),
          getDocs(collection(db, 'clerks'))
        ]);

        const cloudCustomers = cloudCustomersSnap.docs.map(d => d.data() as RegisteredCustomer);
        const cloudVisits = cloudVisitsSnap.docs.map(d => d.data() as VisitRecord);
        const cloudLogs = cloudLogsSnap.docs.map(d => d.data() as ActivityLog);
        const cloudConfigList = cloudConfigSnap.docs.map(d => d.data() as MerchantConfig);
        const cloudSurveys = cloudSurveysSnap.docs.map(d => d.data() as Survey);
        const cloudAnswers = cloudAnswersSnap.docs.map(d => d.data() as SurveyAnswer);
        const cloudClerks = cloudClerksSnap.docs.map(d => d.data() as Clerk);

        // 2. Perform safe multi-device merging

        // Customers Merge
        const mergedCustomersMap = new Map<string, RegisteredCustomer>();
        cloudCustomers.forEach(c => mergedCustomersMap.set(c.folio, c));

        for (const localC of consumers) {
          const cloudC = mergedCustomersMap.get(localC.folio);
          if (!cloudC) {
            // Local customer registered on this phone/device offline or during permissions failure. Sync to cloud!
            mergedCustomersMap.set(localC.folio, localC);
            await dbSaveCustomer(localC);
          } else {
            // Exists on both. Merge history array and take the maximum accrued counters
            const localHistory = localC.visitsHistory || [];
            const cloudHistory = cloudC.visitsHistory || [];
            const uniqueVisitIds = new Set<string>();
            const mergedHistory: any[] = [];
            
            [...cloudHistory, ...localHistory].forEach(v => {
              const vId = v.id || `${v.timestamp}_${v.stampsAdded}`;
              if (!uniqueVisitIds.has(vId)) {
                uniqueVisitIds.add(vId);
                mergedHistory.push(v);
              }
            });

            const localVouchers = localC.unlockedVouchers || [];
            const cloudVouchers = cloudC.unlockedVouchers || [];
            const uniqueVoucherIds = new Set<string>();
            const mergedVouchers: any[] = [];
            
            [...cloudVouchers, ...localVouchers].forEach(v => {
              if (!uniqueVoucherIds.has(v.id)) {
                uniqueVoucherIds.add(v.id);
                mergedVouchers.push(v);
              }
            });

            const mergedC: RegisteredCustomer = {
              folio: localC.folio,
              name: localC.name || cloudC.name,
              phone: localC.phone || cloudC.phone,
              email: localC.email || cloudC.email,
              birthday: localC.birthday || cloudC.birthday,
              currentStamps: Math.max(localC.currentStamps, cloudC.currentStamps),
              totalStampsEarned: Math.max(localC.totalStampsEarned, cloudC.totalStampsEarned),
              points: Math.max(localC.points, cloudC.points),
              unlockedVouchers: mergedVouchers,
              visitsHistory: mergedHistory
            };

            // If there's a difference, update cloud document to aggregate state
            if (
              JSON.stringify(mergedC.visitsHistory) !== JSON.stringify(cloudC.visitsHistory) ||
              mergedC.currentStamps !== cloudC.currentStamps ||
              mergedC.points !== cloudC.points ||
              mergedC.unlockedVouchers.length !== cloudC.unlockedVouchers.length
            ) {
              await dbSaveCustomer(mergedC);
            }
            mergedCustomersMap.set(localC.folio, mergedC);
          }
        }

        // Visits Merge
        const mergedVisitsMap = new Map<string, VisitRecord>();
        cloudVisits.forEach(v => mergedVisitsMap.set(v.id, v));
        for (const localV of visits) {
          if (!mergedVisitsMap.has(localV.id)) {
            mergedVisitsMap.set(localV.id, localV);
            await dbSaveVisit(localV);
          }
        }

        // Logs Merge
        const mergedLogsMap = new Map<string, ActivityLog>();
        cloudLogs.forEach(l => mergedLogsMap.set(l.id, l));
        for (const localL of logs) {
          if (!mergedLogsMap.has(localL.id)) {
            mergedLogsMap.set(localL.id, localL);
            await dbSaveLog(localL);
          }
        }

        // Config Merge
        let finalConfig = config;
        const cloudConfig = cloudConfigList.find(c => c.pin !== undefined);
        if (!cloudConfig) {
          await dbSaveConfig(config);
        } else {
          finalConfig = cloudConfig;
        }

        // Surveys Merge
        const mergedSurveysMap = new Map<string, Survey>();
        cloudSurveys.forEach(s => mergedSurveysMap.set(s.id, s));
        for (const localS of surveys) {
          if (!mergedSurveysMap.has(localS.id)) {
            mergedSurveysMap.set(localS.id, localS);
            await dbSaveSurvey(localS);
          } else {
            const cloudS = mergedSurveysMap.get(localS.id)!;
            if (localS.submissionsCount > cloudS.submissionsCount || localS.active !== cloudS.active) {
              const mergedS = { ...cloudS, ...localS };
              mergedSurveysMap.set(localS.id, mergedS);
              await dbSaveSurvey(mergedS);
            }
          }
        }

        // SurveyAnswers Merge
        const mergedAnswersMap = new Map<string, SurveyAnswer>();
        cloudAnswers.forEach(a => mergedAnswersMap.set(a.id, a));
        for (const localA of surveyAnswers) {
          if (!mergedAnswersMap.has(localA.id)) {
            mergedAnswersMap.set(localA.id, localA);
            await dbSaveAnswer(localA);
          }
        }

        // Clerks Merge
        const mergedClerksMap = new Map<string, Clerk>();
        cloudClerks.forEach(c => mergedClerksMap.set(c.code, c));
        for (const localClerk of CLERKS) {
          if (!mergedClerksMap.has(localClerk.code)) {
            mergedClerksMap.set(localClerk.code, localClerk);
            await dbSaveClerk(localClerk);
          }
        }

        // Fill state with synchronized, merged values
        setConsumers([...mergedCustomersMap.values()].sort((a, b) => a.folio.localeCompare(b.folio)));
        setVisits([...mergedVisitsMap.values()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setLogs([...mergedLogsMap.values()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setConfig(finalConfig);
        setSurveys([...mergedSurveysMap.values()]);
        setSurveyAnswers([...mergedAnswersMap.values()]);
        setCLERKS([...mergedClerksMap.values()]);

        console.log('Intelligent multi-device state merging with Firebase Firestore completed successfully.');
      } catch (err) {
        console.error('Initial multi-device synchronization failed:', err);
      }
    };

    initSync().then(() => {
      const unsubCustomers = subscribeToCollection<RegisteredCustomer>('customers', (data) => {
        if (data) {
          const sorted = [...data].sort((a, b) => a.folio.localeCompare(b.folio));
          setConsumers(sorted);
        }
      });

      const unsubVisits = subscribeToCollection<VisitRecord>('visits', (data) => {
        if (data) {
          const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setVisits(sorted);
        }
      });

      const unsubLogs = subscribeToCollection<ActivityLog>('logs', (data) => {
        if (data) {
          const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(sorted);
        }
      });

      const unsubConfig = subscribeToCollection<MerchantConfig>('config', (data) => {
        if (data && data.length > 0) {
          const mConfig = data[0];
          if (mConfig) setConfig(mConfig);
        }
      });

      const unsubSurveys = subscribeToCollection<Survey>('surveys', (data) => {
        if (data) {
          setSurveys(data);
        }
      });

      const unsubAnswers = subscribeToCollection<SurveyAnswer>('surveyAnswers', (data) => {
        if (data) {
          setSurveyAnswers(data);
        }
      });

      const unsubClerks = subscribeToCollection<Clerk>('clerks', (data) => {
        if (data) {
          setCLERKS(data);
        }
      });

      const unsubNotifications = subscribeToCollection<AppNotification>('notifications', (data) => {
        if (data) {
          const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(sorted);
        }
      });

      setIsFirebaseLoaded(true);

      return () => {
        unsubCustomers();
        unsubVisits();
        unsubLogs();
        unsubConfig();
        unsubSurveys();
        unsubAnswers();
        unsubClerks();
        unsubNotifications();
      };
    });
  }, []);

  // Sync wrappers that intercept state changes and push them to Firestore
  const syncSetConsumers = async (updater: React.SetStateAction<RegisteredCustomer[]>) => {
    let nextVal: RegisteredCustomer[];
    if (typeof updater === 'function') {
      nextVal = (updater as Function)(consumers);
    } else {
      nextVal = updater;
    }

    const oldKeys = new Set(consumers.map(c => c.folio));
    const newKeys = new Set(nextVal.map(c => c.folio));

    for (const c of consumers) {
      if (!newKeys.has(c.folio)) {
        try {
          await dbDeleteCustomer(c.folio);
        } catch (e) {
          console.error(e);
        }
      }
    }

    for (const c of nextVal) {
      try {
        await dbSaveCustomer(c);
      } catch (e) {
        console.error(e);
      }
    }

    setConsumers(nextVal);
  };

  const syncSetVisits = async (updater: React.SetStateAction<VisitRecord[]>) => {
    let nextVal: VisitRecord[];
    if (typeof updater === 'function') {
      nextVal = (updater as Function)(visits);
    } else {
      nextVal = updater;
    }

    const oldKeys = new Set(visits.map(v => v.id));
    const newKeys = new Set(nextVal.map(v => v.id));

    for (const v of visits) {
      if (!newKeys.has(v.id)) {
        try {
          await deleteDoc(doc(db, 'visits', v.id));
        } catch (e) {
          console.error(e);
        }
      }
    }

    for (const v of nextVal) {
      try {
        await dbSaveVisit(v);
      } catch (e) {
        console.error(e);
      }
    }

    setVisits(nextVal);
  };

  const syncSetLogs = async (updater: React.SetStateAction<ActivityLog[]>) => {
    let nextVal: ActivityLog[];
    if (typeof updater === 'function') {
      nextVal = (updater as Function)(logs);
    } else {
      nextVal = updater;
    }

    const oldKeys = new Set(logs.map(l => l.id));
    const newKeys = new Set(nextVal.map(l => l.id));

    for (const l of logs) {
      if (!newKeys.has(l.id)) {
        try {
          await deleteDoc(doc(db, 'logs', l.id));
        } catch (e) {
          console.error(e);
        }
      }
    }

    for (const l of nextVal) {
      try {
        await dbSaveLog(l);
      } catch (e) {
        console.error(e);
      }
    }

    setLogs(nextVal);
  };

  const syncSetSurveys = async (updater: React.SetStateAction<Survey[]>) => {
    let nextVal: Survey[];
    if (typeof updater === 'function') {
      nextVal = (updater as Function)(surveys);
    } else {
      nextVal = updater;
    }

    const oldKeys = new Set(surveys.map(s => s.id));
    const newKeys = new Set(nextVal.map(s => s.id));

    for (const s of surveys) {
      if (!newKeys.has(s.id)) {
        try {
          await deleteDoc(doc(db, 'surveys', s.id));
        } catch (e) {
          console.error(e);
        }
      }
    }

    for (const s of nextVal) {
      try {
        await dbSaveSurvey(s);
      } catch (e) {
        console.error(e);
      }
    }

    setSurveys(nextVal);
  };

  const syncSetCLERKS = async (updater: React.SetStateAction<Clerk[]>) => {
    let nextVal: Clerk[];
    if (typeof updater === 'function') {
      nextVal = (updater as Function)(CLERKS);
    } else {
      nextVal = updater;
    }

    const oldKeys = new Set(CLERKS.map(c => c.code));
    const newKeys = new Set(nextVal.map(c => c.code));

    for (const c of CLERKS) {
      if (!newKeys.has(c.code)) {
        try {
          await dbDeleteClerk(c.code);
        } catch (e) {
          console.error(e);
        }
      }
    }

    for (const c of nextVal) {
      try {
        await dbSaveClerk(c);
      } catch (e) {
        console.error(e);
      }
    }

    setCLERKS(nextVal);
  };

  const syncSetSurveyAnswers = async (updater: React.SetStateAction<SurveyAnswer[]>) => {
    let nextVal: SurveyAnswer[];
    if (typeof updater === 'function') {
      nextVal = (updater as Function)(surveyAnswers);
    } else {
      nextVal = updater;
    }

    const oldKeys = new Set(surveyAnswers.map(a => a.id));
    const newKeys = new Set(nextVal.map(a => a.id));

    for (const a of surveyAnswers) {
      if (!newKeys.has(a.id)) {
        try {
          await deleteDoc(doc(db, 'surveyAnswers', a.id));
        } catch (e) {
          console.error(e);
        }
      }
    }

    for (const a of nextVal) {
      try {
        await dbSaveAnswer(a);
      } catch (e) {
        console.error(e);
      }
    }

    setSurveyAnswers(nextVal);
  };

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(consumers));
  }, [consumers]);

  useEffect(() => {
    localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys));
  }, [surveys]);

  useEffect(() => {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(surveyAnswers));
  }, [surveyAnswers]);

  // Active Client Mode Routing check based on URL pathname (e.g. /fidelidad) or hash query to support independent link rendering
  const [isClientMode, setIsClientMode] = useState<boolean>(() => {
    const pName = window.location.pathname.toLowerCase();
    const hashVal = window.location.hash.toLowerCase();
    const queryVal = window.location.search.toLowerCase();
    return pName.includes('fidelidad') || pName.includes('cliente') || 
           hashVal.includes('fidelidad') || hashVal.includes('cliente') ||
           queryVal.includes('fidelidad') || queryVal.includes('cliente');
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const pName = window.location.pathname.toLowerCase();
      const hashVal = window.location.hash.toLowerCase();
      const queryVal = window.location.search.toLowerCase();
      const checkClient = pName.includes('fidelidad') || pName.includes('cliente') || 
                          hashVal.includes('fidelidad') || hashVal.includes('cliente') ||
                          queryVal.includes('fidelidad') || queryVal.includes('cliente');
      setIsClientMode(checkClient);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // UI Flow modes:
  // - 'ingreso': Main Admission Gateway choice (Lider / Gerente)
  // - 'sistema': Staff operations dashboard
  // - 'cliente_portal': Individual client looking up their own card
  const [portalMode, setPortalMode] = useState<'ingreso' | 'sistema' | 'cliente_portal'>('ingreso');
  const [userRole, setUserRole] = useState<'lider' | 'gerente' | null>(null);
  
  // Dashboard Tabs ('dashboard', 'clientes', 'registrar', 'cumpleanos', 'reportes')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'registrar' | 'cumpleanos' | 'reportes'>('dashboard');

  // Input states
  const [clientSearch, setClientSearch] = useState('');
  const [gerentePasswordInput, setGerentePasswordInput] = useState('');
  const [gerentePasswordError, setGerentePasswordError] = useState('');
  const [showGerentePasswordModal, setShowGerentePasswordModal] = useState(false);

  // Client Portal states
  const [clientPhoneInput, setClientPhoneInput] = useState('');
  const [clientBdayInput, setClientBdayInput] = useState('');
  const [clientPortalSession, setClientPortalSession] = useState<UserSession | null>(null);
  const [clientPortalError, setClientPortalError] = useState('');

  // Mobile app notifications push simulation state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeInAppNotification, setActiveInAppNotification] = useState<AppNotification | null>(null);

  const [appMountTime] = useState<number>(() => Date.now());
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isFirebaseLoaded || notifications.length === 0) return;

    // Filter only new notifications sent after this device/browser launched the app
    const brandNewNotifications = notifications.filter(n => {
      const isNew = new Date(n.timestamp).getTime() > appMountTime - 2000; // 2 seconds leeway
      const notYetNotified = !notifiedIdsRef.current.has(n.id);
      return isNew && notYetNotified;
    });

    if (brandNewNotifications.length === 0) return;

    // Grab the absolute latest one to trigger right now
    const latestNotification = brandNewNotifications[brandNewNotifications.length - 1];
    
    // Add all of these to the notified set so they don't fire again
    brandNewNotifications.forEach(n => notifiedIdsRef.current.add(n.id));

    // Check if it applies to everyone ('all') OR to this active customer's folio
    const forMe = isClientMode && clientPortalSession && (
      latestNotification.targetCustomerFolio === 'all' || 
      latestNotification.targetCustomerFolio === clientPortalSession.folio
    );

    if (forMe) {
      // 1. Trigger beautiful in-app popup/banner alert
      setActiveInAppNotification(latestNotification);

      // Play soft sound or beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      } catch (audioErr) {
        console.log('Audio feedback not supported or blocked by user input policy');
      }

      // 2. Trigger native browser push notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(latestNotification.title, {
          body: latestNotification.body,
          tag: latestNotification.id,
        });
      }
    }
  }, [notifications, clientPortalSession, isFirebaseLoaded, appMountTime]);

  // Sello Clientes active action modals
  const [stampingCustomerFolio, setStampingCustomerFolio] = useState<string | null>(null);
  const [selectedOverlayCustomer, setSelectedOverlayCustomer] = useState<RegisteredCustomer | null>(null);

  // Controlled Action States
  const [stampSelectedClerk, setStampSelectedClerk] = useState<{ code: string; label: string; name: string; pin: string } | null>(null);
  const [stampPinInput, setStampPinInput] = useState('');
  const [stampPinError, setStampPinError] = useState('');

  // Editing Client States
  const [editingCustomer, setEditingCustomer] = useState<RegisteredCustomer | null>(null);
  const [editFolio, setEditFolio] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editCurrentStamps, setEditCurrentStamps] = useState(0);
  const [editSelectedClerk, setEditSelectedClerk] = useState<{ code: string; label: string; name: string; pin: string } | null>(null);
  const [editPinInput, setEditPinInput] = useState('');
  const [editError, setEditError] = useState('');

  // Reverting Visit / Decrease Stamp State
  const [revertingCustomerFolio, setRevertingCustomerFolio] = useState<string | null>(null);
  const [revertSelectedClerk, setRevertSelectedClerk] = useState<{ code: string; label: string; name: string; pin: string } | null>(null);
  const [revertPinInput, setRevertPinInput] = useState('');
  const [revertPinError, setRevertPinError] = useState('');

  // Deleting Customer Account State
  const [deletingCustomerFolio, setDeletingCustomerFolio] = useState<string | null>(null);
  const [deleteSelectedClerk, setDeleteSelectedClerk] = useState<{ code: string; label: string; name: string; pin: string } | null>(null);
  const [deletePinInput, setDeletePinInput] = useState('');
  const [deletePinError, setDeletePinError] = useState('');

  // New Client Creation Form states
  const [regFolio, setRegFolio] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBirthday, setRegBirthday] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regPinInput, setRegPinInput] = useState('');

  // Stamp Rewards Congratulation state
  const [congratsRewardTitle, setCongratsRewardTitle] = useState<string | null>(null);

  // System alert block
  const [systemBannerAlert, setSystemBannerAlert] = useState<string | null>(null);

  // CLERKS LIST STATE (Fidelis requirements with secure PINs)
  const [CLERKS, setCLERKS] = useState<Clerk[]>(() => {
    const saved = localStorage.getItem('bistro_clerks_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      { code: 'CO1', label: 'JOSE LUIS(CO1)', name: 'Jose Luis', pin: '1111' },
      { code: 'CR02', label: 'DIANA(CR02)', name: 'Diana', pin: '2222' },
      { code: 'C03', label: 'NOELIA(C03)', name: 'Noelia', pin: '3333' },
      { code: 'CR04', label: 'AMAIRANI(CR04)', name: 'Amairani', pin: '4444' },
      { code: 'C05', label: 'GISELA(C05)', name: 'Gisela', pin: '5555' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('bistro_clerks_list', JSON.stringify(CLERKS));
  }, [CLERKS]);

  // Helper date formatter
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const today = new Date();
      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      
      const dayName = days[today.getDay()];
      const mName = months[today.getMonth()];
      const hours = String(today.getHours()).padStart(2, '0');
      const minutes = String(today.getMinutes()).padStart(2, '0');
      setCurrentTimeFormatted(`${dayName}, ${today.getDate()} de ${mName} de ${today.getFullYear()} • ${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute stats sizes
  const totalRegistered = consumers.length;
  const cardsLimit = 500;
  const cardsAvailable = Math.max(0, cardsLimit - totalRegistered);

  // Calculate birthday stats dynamically
  const getBirthdaysThisWeekCount = () => {
    let weekCount = 0;
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const todayMidnight = new Date(Date.UTC(todayYear, todayMonth, todayDay));
    
    consumers.forEach(c => {
      if (!c.birthday) return;
      const parts = c.birthday.split('-');
      if (parts.length < 3) return;
      const bMonth = parseInt(parts[1], 10) - 1;
      const bDay = parseInt(parts[2], 10);
      
      let bdayYear = todayYear;
      let nextBdayMidnight = new Date(Date.UTC(bdayYear, bMonth, bDay));
      if (nextBdayMidnight.getTime() < todayMidnight.getTime()) {
        bdayYear += 1;
        nextBdayMidnight = new Date(Date.UTC(bdayYear, bMonth, bDay));
      }
      
      const diffTime = nextBdayMidnight.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        weekCount++;
      }
    });
    return weekCount;
  };

  const getBirthdaysThisMonthCount = () => {
    let monthCount = 0;
    const targetMonth = new Date().getMonth(); // Dynamic current month index
    consumers.forEach(c => {
      if (!c.birthday) return;
      const parts = c.birthday.split('-');
      if (parts.length < 3) return;
      const bMonth = parseInt(parts[1], 10) - 1;
      if (bMonth === targetMonth) {
        monthCount++;
      }
    });
    return monthCount;
  };

  const birthdaysThisWeek = getBirthdaysThisWeekCount();
  const birthdaysThisMonth = getBirthdaysThisMonthCount();

  // Next available physical card sequential folios
  const getAvailableFolios = () => {
    const list: string[] = [];
    const assigned = new Set(consumers.map(c => c.folio));
    for (let i = 1; i <= 500; i++) {
      const option = String(i).padStart(3, '0');
      if (!assigned.has(option)) {
        list.push(option);
      }
    }
    return list;
  };

  // Reset next registration folio default
  useEffect(() => {
    const avs = getAvailableFolios();
    if (avs.length > 0) {
      setRegFolio(avs[0]);
    }
  }, [consumers]);

  // LOGIN OPERATIONS
  const handleGerenteLoginConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (gerentePasswordInput === 'BISTRO2026') {
      setUserRole('gerente');
      setPortalMode('sistema');
      setActiveTab('dashboard');
      setShowGerentePasswordModal(false);
      setGerentePasswordError('');
      setGerentePasswordInput('');
    } else {
      setGerentePasswordError('Clave incorrecta. Intenta nuevamente.');
    }
  };

  const handleLiderLogin = () => {
    setUserRole('lider');
    setPortalMode('sistema');
    setActiveTab('dashboard');
  };

  // CLIENT SYSTEM LOOKUP
  const handleClientLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = clientPhoneInput.replace(/\D/g, '');
    const clientFound = consumers.find(c => 
      c.phone.replace(/\D/g, '') === cleanPhone && c.birthday === clientBdayInput
    );

    if (clientFound) {
      const ses: UserSession = {
        id: clientFound.folio,
        folio: clientFound.folio,
        name: clientFound.name,
        email: clientFound.email,
        phone: clientFound.phone,
        birthday: clientFound.birthday,
        currentStamps: clientFound.currentStamps,
        totalStampsEarned: clientFound.totalStampsEarned,
        points: clientFound.points,
        unlockedVouchers: clientFound.unlockedVouchers || []
      };
      setClientPortalSession(ses);
      setClientPortalError('');
    } else {
      setClientPortalError('No se encontró ninguna tarjeta de fidelidad con los datos ingresados. Confirma con el área de caja.');
    }
  };

  // CLIENT SURVEY COMPLETION METHOD
  const handleClientSurveyComplete = (surveyId: string, answers: { questionId: string; questionText: string; answerText: string }[]) => {
    if (!clientPortalSession) return;
    const targetSurvey = surveys.find(s => s.id === surveyId);
    if (!targetSurvey) return;

    // 1. Create survey answer response
    const newAnswer: SurveyAnswer = {
      id: 'ans_' + Date.now(),
      surveyId,
      surveyTitle: targetSurvey.title,
      customerFolio: clientPortalSession.folio || '',
      customerName: clientPortalSession.name,
      timestamp: new Date().toISOString(),
      answers
    };

    // 2. Append to survey answers
    syncSetSurveyAnswers(prev => [newAnswer, ...prev]);

    // 3. Mark as answered to bypass check for next render
    localStorage.setItem(`answered_survey_${clientPortalSession.folio}_${surveyId}`, 'true');

    // 4. Increment submissionCount
    syncSetSurveys(prev => prev.map(s => s.id === surveyId ? { ...s, submissionsCount: s.submissionsCount + 1 } : s));

    // 5. Gift Voucher Reward if applicable
    if (targetSurvey.reward && targetSurvey.reward !== 'Sin recompensa') {
      const rewardId = 'survey_' + Date.now();
      const newVoucher = {
        id: 'vouch_srv_' + Date.now(),
        rewardId,
        title: `Premio Encuesta: ${targetSurvey.reward}`,
        code: 'ENCUESTA-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        isRedeemed: false,
        unlockedAt: new Date().toISOString()
      };

      syncSetConsumers(prev => prev.map(c => {
        if (c.folio === clientPortalSession.folio) {
          const updatedVouchers = [...(c.unlockedVouchers || []), newVoucher];
          // Sync session
          setClientPortalSession(prevSes => prevSes ? { ...prevSes, unlockedVouchers: updatedVouchers } : null);
          return {
            ...c,
            unlockedVouchers: updatedVouchers
          };
        }
        return c;
      }));
    }
  };

  // ADD STAMP ACTION (Clerk Required)
  const commitStampAddition = (clerkCode: string, clerkName: string) => {
    if (!stampingCustomerFolio) return;
    
    // Find client first in current state
    const targetCustomer = consumers.find(c => c.folio === stampingCustomerFolio);
    if (!targetCustomer) return;

    const updatedStamps = targetCustomer.currentStamps + 1;
    const updatedTotal = targetCustomer.totalStampsEarned + 1;
    
    let alertTrigger = false;
    let newVouchers = [...(targetCustomer.unlockedVouchers || [])];
    let resetStamps = updatedStamps;

    // Highlight stamp cap
    if (updatedStamps >= config.stampsRequired) {
      alertTrigger = true;
      resetStamps = 0; 
      newVouchers.push({
        id: 'cpx_' + Date.now(),
        rewardId: 'rm_main',
        title: config.mainRewardTitle,
        code: 'CUP-' + String(Math.floor(1000 + Math.random() * 9000)),
        isRedeemed: false,
        unlockedAt: new Date().toISOString()
      });
    }

    // Register visit record
    const record: VisitRecord = {
      id: 'vs_' + Date.now(),
      timestamp: new Date().toISOString(),
      stampsAdded: 1,
      clerkName,
      clerkCode,
      customerFolio: targetCustomer.folio,
      customerName: targetCustomer.name
    };

    // Register Action Log
    const logRecord: ActivityLog = {
      id: 'log_' + Date.now(),
      type: 'stamp_added',
      amount: 1,
      title: `Sello Acreditado #${targetCustomer.folio}`,
      description: `Se registró visita por el encargado ${clerkName} (${clerkCode}) para ${targetCustomer.name}.`,
      timestamp: new Date().toISOString(),
      clerkName,
      clerkCode,
      customerFolio: targetCustomer.folio
    };

    syncSetVisits(prevV => [record, ...prevV]);
    syncSetLogs(prevL => [logRecord, ...prevL]);

    if (alertTrigger) {
      setCongratsRewardTitle(config.mainRewardTitle);
    }

    setSystemBannerAlert(`¡Visita registrada con éxito por ${clerkName}!`);
    setTimeout(() => setSystemBannerAlert(null), 3000);

    syncSetConsumers(prev => {
      return prev.map(c => {
        if (c.folio === stampingCustomerFolio) {
          return {
            ...c,
            currentStamps: resetStamps,
            totalStampsEarned: updatedTotal,
            points: c.points + 100,
            unlockedVouchers: newVouchers,
            visitsHistory: [record, ...(c.visitsHistory || [])]
          };
        }
        return c;
      });
    });

    setStampingCustomerFolio(null);
  };

  const handleConfirmStampWithPin = () => {
    const matchedClerk = CLERKS.find(c => c.pin === stampPinInput) || 
                         (stampPinInput === 'BISTRO2026' ? { code: 'ADMIN', name: 'Gerente General', pin: 'BISTRO2026' } : null);

    if (matchedClerk) {
      commitStampAddition(matchedClerk.code, matchedClerk.name);
      setStampSelectedClerk(null);
      setStampPinInput('');
      setStampPinError('');
    } else {
      setStampPinError('La clave PIN de encargado es incorrecta.');
    }
  };

  // DECREASE / OVERRIDE STAMP ACTION WITH CLERK AUTH
  const handleDecreaseStampsWithAuth = (customerFolio: string, clerkCode: string, clerkName: string) => {
    const targetCustomer = consumers.find(c => c.folio === customerFolio);
    if (!targetCustomer || targetCustomer.currentStamps <= 0) return;

    const logRecord: ActivityLog = {
      id: 'log_' + Date.now(),
      type: 'stamp_added',
      amount: -1,
      title: `Sello Descontado #${targetCustomer.folio}`,
      description: `Se descontó 1 taza del cliente ${targetCustomer.name}. (Autorizó: ${clerkName}, ${clerkCode}).`,
      timestamp: new Date().toISOString(),
      clerkName,
      clerkCode,
      customerFolio: targetCustomer.folio
    };

    syncSetLogs(prevL => [logRecord, ...prevL]);

    setSystemBannerAlert(`Se descontó una taza de la cuenta de ${targetCustomer.name}`);
    setTimeout(() => setSystemBannerAlert(null), 3500);

    syncSetConsumers(prev => prev.map(c => {
      if (c.folio === customerFolio) {
        return {
          ...c,
          currentStamps: c.currentStamps - 1,
          points: Math.max(0, c.points - 100)
        };
      }
      return c;
    }));
  };

  // INITIALIZE PROCESSES FOR EDIT & CONTROL ACTIONS
  const handleStartEditCustomer = (customer: RegisteredCustomer) => {
    setEditingCustomer(customer);
    setEditFolio(customer.folio);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditEmail(customer.email);
    setEditBirthday(customer.birthday);
    setEditCurrentStamps(customer.currentStamps);
    setEditSelectedClerk(null);
    setEditPinInput('');
    setEditError('');
  };

  const handleStartRevertStamp = (customer: RegisteredCustomer) => {
    setRevertingCustomerFolio(customer.folio);
    setRevertSelectedClerk(null);
    setRevertPinInput('');
    setRevertPinError('');
  };

  const handleConfirmRevertStamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revertingCustomerFolio) return;

    const normalizedInput = revertPinInput.trim().toLowerCase();
    const matchedClerk = CLERKS.find(c => 
      c.pin.toLowerCase() === normalizedInput || 
      c.code.toLowerCase() === normalizedInput
    ) || (normalizedInput === 'bistro2026' ? { code: 'ADMIN', name: 'Gerente General', pin: 'BISTRO2026' } : null);

    if (!matchedClerk) {
      setRevertPinError('La clave PIN de seguridad ingresada es incorrecta o inválida.');
      return;
    }

    // Call actual decrease action
    handleDecreaseStampsWithAuth(revertingCustomerFolio, matchedClerk.code, matchedClerk.name);

    // Reset
    setRevertingCustomerFolio(null);
    setRevertSelectedClerk(null);
    setRevertPinInput('');
    setRevertPinError('');
  };

  const handleStartDeleteCustomer = (customer: RegisteredCustomer) => {
    setDeletingCustomerFolio(customer.folio);
    setDeleteSelectedClerk(null);
    setDeletePinInput('');
    setDeletePinError('');
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (!editFolio || !editFolio.trim()) {
      setEditError('El Folio de la Tarjeta es obligatorio.');
      return;
    }

    if (!editName || !editPhone || !editBirthday) {
      setEditError('Todos los campos requeridos (*) deben completarse.');
      return;
    }

    const normalizedInput = editPinInput.trim().toLowerCase();
    const matchedClerk = CLERKS.find(c => 
      c.pin.toLowerCase() === normalizedInput || 
      c.code.toLowerCase() === normalizedInput
    ) || (normalizedInput === 'bistro2026' ? { code: 'ADMIN', name: 'Gerente General', pin: 'BISTRO2026' } : null);

    if (!matchedClerk) {
      setEditError('La clave PIN de seguridad ingresada es incorrecta.');
      return;
    }

    const stampDiff = editCurrentStamps - editingCustomer.currentStamps;
    const logRecord: ActivityLog = {
      id: 'log_' + Date.now(),
      type: 'stamp_added',
      amount: stampDiff,
      title: `Edición de Cliente #${editFolio}`,
      description: `Modificación de datos del socio ${editingCustomer.name}. Tarjeta de folio #${editingCustomer.folio} a #${editFolio}. Tazas de café de: ${editingCustomer.currentStamps} a ${editCurrentStamps}. (Autorizó: ${matchedClerk.name} - ${matchedClerk.code}).`,
      timestamp: new Date().toISOString(),
      clerkName: matchedClerk.name,
      clerkCode: matchedClerk.code,
      customerFolio: editFolio
    };

    syncSetLogs(prevL => [logRecord, ...prevL]);

    // Update state (replaces any other customer with that folio to avoid duplication)
    syncSetConsumers(prev => {
      const filtered = prev.filter(c => c.folio !== editFolio || c.folio === editingCustomer.folio);
      return filtered.map(c => {
        if (c.folio === editingCustomer.folio) {
          return {
            ...c,
            folio: editFolio,
            name: editName,
            phone: editPhone,
            email: editEmail,
            birthday: editBirthday,
            currentStamps: editCurrentStamps
          };
        }
        return c;
      });
    });

    setSystemBannerAlert(`¡Tarjeta #${editFolio} editada con éxito por ${matchedClerk.name}!`);
    setTimeout(() => setSystemBannerAlert(null), 3000);

    // Reset editing state parameters
    setEditingCustomer(null);
    setEditSelectedClerk(null);
    setEditPinInput('');
    setEditError('');
  };

  // CLIENT REGISTRATION FORM ACTION
  const handleAddNewCustomerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFolio) {
      setRegError('Por favor selecciona un Número de Tarjeta físico disponible.');
      return;
    }
    if (!regName || !regPhone || !regBirthday) {
      setRegError('Todos los campos requeridos marcados con asterisco (*) deben completarse.');
      return;
    }

    // Verify duplication
    const phoneExists = consumers.some(c => c.phone.replace(/\D/g, '') === regPhone.replace(/\D/g, ''));
    if (phoneExists) {
      setRegError('Ya existe una tarjeta vinculada a este número de celular.');
      return;
    }

    const folioExists = consumers.some(c => c.folio === regFolio);
    if (folioExists) {
      setRegError('El folio físico número #' + regFolio + ' ya se encuentra asignado a un cliente.');
      return;
    }

    // PIN validation
    const normalizedInput = regPinInput.trim().toLowerCase();
    const matchedClerk = CLERKS.find(c => 
      c.pin.toLowerCase() === normalizedInput || 
      c.code.toLowerCase() === normalizedInput
    ) || (normalizedInput === 'bistro2026' ? { code: 'ADMIN', name: 'Gerente General', pin: 'BISTRO2026' } : null);

    if (!matchedClerk) {
      setRegError('La clave PIN de seguridad ingresada es incorrecta.');
      return;
    }

    const newCustomerObj: RegisteredCustomer = {
      folio: regFolio,
      name: regName,
      phone: regPhone,
      email: regEmail || `${regName.toLowerCase().replace(/\s+/g, '')}@cafecito.com`,
      birthday: regBirthday,
      currentStamps: 1, // Welcome gift stamp
      totalStampsEarned: 1,
      points: 100,
      unlockedVouchers: [],
      visitsHistory: []
    };

    syncSetConsumers(prev => [newCustomerObj, ...prev]);

    // Create registry activity log with approved clerk details
    const logRecord: ActivityLog = {
      id: 'log_' + Date.now(),
      type: 'customer_registered' as any,
      amount: 1,
      title: `Registro de Cliente #${regFolio}`,
      description: `Se realizó el registro del cliente ${regName} con el folio físico #${regFolio}. (Autorizó: ${matchedClerk.name} - ${matchedClerk.code}).`,
      timestamp: new Date().toISOString(),
      clerkName: matchedClerk.name,
      clerkCode: matchedClerk.code,
      customerFolio: regFolio
    };
    syncSetLogs(prevL => [logRecord, ...prevL]);

    // Reset Form
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegBirthday('');
    setRegError('');
    setRegPinInput('');
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setActiveTab('clientes');
    }, 2000);
  };

  // REMOVE CUSTOMER RECORD ACCOUNT VIA CODES
  const handleConfirmDeleteCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingCustomerFolio) return;

    const normalizedInput = deletePinInput.trim().toLowerCase();
    const matchedClerk = CLERKS.find(c => 
      c.pin.toLowerCase() === normalizedInput || 
      c.code.toLowerCase() === normalizedInput
    ) || (normalizedInput === 'bistro2026' ? { code: 'ADMIN', name: 'Gerente General', pin: 'BISTRO2026' } : null);

    if (!matchedClerk) {
      setDeletePinError('La clave PIN de seguridad ingresada es incorrecta.');
      return;
    }

    const targetCustomer = consumers.find(c => c.folio === deletingCustomerFolio);
    const targetName = targetCustomer ? targetCustomer.name : 'Socio';

    syncSetConsumers(prev => prev.filter(c => c.folio !== deletingCustomerFolio));
    
    const logRecord: ActivityLog = {
      id: 'log_' + Date.now(),
      type: 'voucher_redeemed' as any,
      amount: 0,
      title: `Tarjeta Eliminada #${deletingCustomerFolio}`,
      description: `Se eliminó del padrón el folio físico número #${deletingCustomerFolio} correspondido a: ${targetName}. (Autorizó: ${matchedClerk.name} - ${matchedClerk.code}).`,
      timestamp: new Date().toISOString(),
      clerkName: matchedClerk.name,
      clerkCode: matchedClerk.code,
      customerFolio: deletingCustomerFolio
    };
    syncSetLogs(prevL => [logRecord, ...prevL]);

    setSystemBannerAlert(`La tarjeta #${deletingCustomerFolio} ha sido eliminada permanentemente.`);
    setTimeout(() => setSystemBannerAlert(null), 3000);

    setDeletingCustomerFolio(null);
    setDeleteSelectedClerk(null);
    setDeletePinInput('');
    setDeletePinError('');
  };

  // LOGOUT
  const handleSystemLogOut = () => {
    setUserRole(null);
    setPortalMode('ingreso');
    setActiveTab('dashboard');
  };

  // Search filter lists
  const getFilteredCustomers = () => {
    if (!clientSearch.trim()) return consumers;
    const query = clientSearch.toLowerCase();
    return consumers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.folio.includes(query)
    );
  };

  const filteredCustomers = getFilteredCustomers();

  // Upcoming Birthdays list for Dashboard Display
  const getDashboardBirthdaysThisWeek = () => {
    const list: Array<{ customer: RegisteredCustomer; daysLeft: number; label: string }> = [];
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const todayMidnight = new Date(Date.UTC(todayYear, todayMonth, todayDay));
    
    consumers.forEach(c => {
      if (!c.birthday) return;
      const parts = c.birthday.split('-');
      if (parts.length < 3) return;
      const birthMonth = parseInt(parts[1], 10) - 1;
      const birthDay = parseInt(parts[2], 10);
      
      let bdayYear = todayYear;
      let nextBdayMidnight = new Date(Date.UTC(bdayYear, birthMonth, birthDay));
      if (nextBdayMidnight.getTime() < todayMidnight.getTime()) {
        bdayYear += 1;
        nextBdayMidnight = new Date(Date.UTC(bdayYear, birthMonth, birthDay));
      }
      
      const diffTime = nextBdayMidnight.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        list.push({
          customer: c,
          daysLeft: diffDays,
          label: `${birthDay} de ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][birthMonth]}`
        });
      }
    });

    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const dashboardUpcomingBdays = getDashboardBirthdaysThisWeek();

  // Find the first active unanswered survey for the logged-in client
  const activeClientSurvey = clientPortalSession
    ? surveys.find(s => s.active && localStorage.getItem(`answered_survey_${clientPortalSession.folio}_${s.id}`) !== 'true')
    : null;

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-slate-800 flex flex-col relative font-sans selection:bg-[#149b8f]/20 selection:text-[#149b8f] w-full max-w-full overflow-x-hidden touch-pan-y">
      
      {/* 🔔 FLOATING REALTIME PUSH NOTIFICATION POPUP */}
      <AnimatePresence>
        {activeInAppNotification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -45, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/50 flex gap-3.5 font-sans"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#149b8f] text-white flex items-center justify-center shrink-0 shadow-lg select-none">
              {activeInAppNotification.icon === 'coffee' && <Coffee size={20} />}
              {activeInAppNotification.icon === 'promo' && <Sparkles size={20} />}
              {activeInAppNotification.icon === 'cake' && <Cake size={20} />}
              {activeInAppNotification.icon === 'gift' && <Gift size={20} />}
              {activeInAppNotification.icon === 'alert' && <Coffee size={20} />}
            </div>
            <div className="flex-grow space-y-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#149b8f]">🔔 Alerta de Celular</span>
                <span className="text-[9px] text-slate-400 font-mono">Ahora mismo</span>
              </div>
              <h5 className="text-xs font-black leading-tight tracking-tight">{activeInAppNotification.title}</h5>
              <p className="text-[11px] text-slate-200 leading-normal">{activeInAppNotification.body}</p>
            </div>
            <button
              onClick={() => setActiveInAppNotification(null)}
              className="self-start text-xs text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isClientMode ? (
        /* ==================== CLIENT STANDALONE WEBSITE (Matching user photo exactly) ==================== */
        <div className="flex-grow min-h-screen bg-[#F6F9F8] text-slate-800 flex flex-col justify-between items-center px-4 py-12 pointer-events-auto z-10 w-full max-w-full overflow-x-hidden touch-pan-y">
          
          <div className="max-w-md w-full flex-grow flex flex-col justify-center items-center py-6">
            <AnimatePresence mode="wait">
              {!clientPortalSession ? (
                <motion.div
                  key="client-lookup-form"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full flex flex-col items-center space-y-6"
                >
                  {/* Brand header matching shared screenshot layout */}
                  <div className="flex flex-col items-center text-center space-y-3.5 mb-2">
                    {/* Circle Logo Graphic - beautiful official circle logo from user image */}
                    <MiCafecitoLogo size={110} className="shadow-lg rounded-full" />

                    <div className="space-y-1">
                      <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>Mi Cafecito</h1>
                      <p className="text-xs text-slate-500 font-sans tracking-wide">Consulta tu tarjeta de fidelidad</p>
                    </div>
                  </div>

                  {/* Form - matching mock illustration inputs exactly */}
                  <form onSubmit={handleClientLookupSubmit} className="w-full space-y-3.5 max-w-sm">
                    {/* Phone Cellular Number with Phone Icon on Left */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Phone size={17} className="stroke-[2.2]" />
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="Tu número de celular *"
                        value={clientPhoneInput}
                        onChange={(e) => setClientPhoneInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border text-slate-800 border-[#2bbba9]/30 focus:border-[#2bbba9] rounded-2xl pl-12 pr-4 py-4 text-sm font-sans font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm leading-none"
                      />
                    </div>

                    {/* Birthday Date Input with Calendar Icon on Left */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Calendar size={17} className="stroke-[2.2]" />
                      </div>
                      <input
                        type="date"
                        required
                        value={clientBdayInput}
                        onChange={(e) => setClientBdayInput(e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border text-slate-800 border-[#2bbba9]/30 focus:border-[#2bbba9] rounded-2xl pl-12 pr-4 py-4 text-sm font-sans font-medium outline-none transition-all shadow-sm leading-none"
                      />
                    </div>

                    {clientPortalError && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-red-50 text-red-700 hover:text-red-800 rounded-2xl text-xs font-bold border border-red-100 text-center leading-normal"
                      >
                        ⚠️ {clientPortalError}
                      </motion.div>
                    )}

                    {/* Highly responsive flat solid brand teal button exactly as shared image */}
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#2bbba9] hover:bg-[#20a392] active:bg-[#1b8c7c] text-white font-sans font-black rounded-2xl text-sm transition shadow-md shadow-teal-700/10 active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 uppercase tracking-wide mt-2"
                    >
                      <span className="font-bold text-sm">Ver mi tarjeta →</span>
                    </button>
                  </form>
                </motion.div>
              ) : (activeClientSurvey ? (
                <motion.div
                  key="client-survey-wizard-container"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full max-w-sm space-y-4"
                >
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 flex justify-between items-center shadow-sm text-xs text-slate-500 font-sans">
                    <span>Socio, <strong className="text-slate-800 font-bold">{clientPortalSession.name}</strong></span>
                    <button
                      onClick={() => {
                        setClientPortalSession(null);
                        setClientPhoneInput('');
                        setClientBdayInput('');
                      }}
                      className="text-[#2bbba9] hover:text-[#1b8c7c] font-black cursor-pointer text-xs uppercase"
                    >
                      Cerrar ✕
                    </button>
                  </div>

                  <ClientSurveyWizard
                    survey={activeClientSurvey}
                    customerName={clientPortalSession.name}
                    onComplete={(answers) => handleClientSurveyComplete(activeClientSurvey.id, answers)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="client-card-visible"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full max-w-sm space-y-5"
                >
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 flex justify-between items-center shadow-sm text-xs text-slate-500 font-sans">
                    <span>Bienvenido socio, <strong className="text-slate-800 font-bold">{clientPortalSession.name}</strong></span>
                    <button
                      onClick={() => {
                        setClientPortalSession(null);
                        setClientPhoneInput('');
                        setClientBdayInput('');
                      }}
                      className="text-[#2bbba9] hover:text-[#1b8c7c] font-black cursor-pointer text-xs uppercase"
                    >
                      Cerrar consulta ✕
                    </button>
                  </div>

                  <CustomerCard 
                    session={clientPortalSession}
                    config={config}
                    onReset={() => {
                      alert('Para redenciones o canjes de bebida de cortesía, por favor consulta directamente al cajero autorizado del Bistro de Mi Cafecito.');
                    }}
                  />

                  <CustomerNotificationCenter 
                    session={clientPortalSession} 
                    notifications={notifications} 
                  />

                  <p className="text-center text-xs text-slate-400 font-sans px-4 leading-normal">
                    Toca en el plástico virtual para girarlo y mostrar tu código QR al encargado del Bistro de Mi Cafecito. ¡Muchas gracias por tu visita!
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="text-center text-[11px] text-slate-400 font-sans font-semibold py-2">
            Fidelidad Mi Cafecito © 2026
          </div>

        </div>
      ) : (
        /* ==================== MERCHANT ADMINISTRATOR CONSOLE ==================== */
        <>
          {/* SUCCESS SYSTEM ACTION ALERT BANNER */}
          <AnimatePresence>
            {systemBannerAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#149b8f] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold font-sans"
              >
                <CheckCircle2 size={16} className="text-white shrink-0" />
                <span>{systemBannerAlert}</span>
              </motion.div>
            )}
          </AnimatePresence>

      {/* STAMPS CONGRATULATIONS CELEBRATION MODAL */}
      <AnimatePresence>
        {congratsRewardTitle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-7 max-w-md w-full text-center shadow-2xl space-y-4"
            >
              <div className="w-16 h-16 bg-teal-50 text-[#149b8f] rounded-full flex items-center justify-center mx-auto text-3xl">
                ☕🎉
              </div>
              <h3 className="text-2xl font-serif font-black text-slate-900">¡Premio Alcanzado!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                El cliente ha acumulado exitosamente las tazas de consumo requeridas. Se ha generado un cupón electrónico canjeable por un:
              </p>
              <div className="p-4 bg-teal-50/50 border border-teal-200/50 rounded-2xl">
                <span className="text-[10px] text-[#149b8f] font-mono tracking-widest font-black uppercase">Cortesia Otorgada</span>
                <p className="text-sm font-black text-slate-800 mt-1">{congratsRewardTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setCongratsRewardTitle(null)}
                className="w-full py-3 bg-[#149b8f] hover:bg-[#11847a] text-white font-sans font-bold text-sm rounded-xl cursor-pointer shadow-md shadow-teal-700/20 active:scale-95 transition-all text-center"
              >
                Cerrar e imprimir cupón
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECURED MULTI-MODAL AUTHORIZATION INTERFACES */}
      <AnimatePresence>
        {/* ACTION A: REGISTRAR VISITA (STAMPS CREDIT) */}
        {stampingCustomerFolio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-left space-y-4 border border-slate-100"
            >
              <div>
                <h3 className="text-base font-serif font-black text-slate-900">Registrar Consumo ☕</h3>
                <p className="text-xs text-slate-400 mt-0.5">Autoriza la acreditación de una taza de café para el programa de lealtad:</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block font-sans">Introducir Clave de Encargado *</label>
                  <input
                    type="password"
                    maxLength={10}
                    placeholder="Clave de 4 dígitos..."
                    value={stampPinInput}
                    onChange={(e) => {
                      setStampPinInput(e.target.value);
                      setStampPinError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#149b8f] rounded-xl px-4 py-2.5 font-sans text-center text-sm outline-none text-[#149b8f] font-bold tracking-widest"
                    autoFocus
                  />
                  {stampPinError && (
                    <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded text-center leading-normal">{stampPinError}</p>
                  )}
                </div>

                <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-3 text-[10px] text-slate-500 font-sans space-y-0.5">
                  <span className="block font-black text-[#149b8f] uppercase">Acceso Protegido</span>
                  <span>Introduce tu clave de seguridad asignada. El sistema identificará al personal de forma automática.</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setStampingCustomerFolio(null);
                      setStampPinInput('');
                      setStampPinError('');
                    }}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStampWithPin}
                    className="py-2.5 bg-[#149b8f] hover:bg-[#11847a] text-white rounded-xl font-black cursor-pointer text-center"
                  >
                    Firmar y Sumar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ACTION B: EDITAR DETALLES DEL SOCIO */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-left border border-slate-150 my-8 space-y-4"
            >
              <div>
                <span className="text-[9px] font-black tracking-widest text-[#149b8f] uppercase font-sans">Acción Controlada</span>
                <h3 className="text-lg font-serif font-black text-slate-950">Editar Datos del Socio</h3>
                <p className="text-xs text-slate-400">Modificando la cuenta del socio <strong className="text-[#149b8f]">{editingCustomer.name}</strong></p>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-650 text-xs font-bold leading-normal">
                  {editError}
                </div>
              )}

              <form onSubmit={handleUpdateCustomer} className="space-y-3.5 text-xs font-sans text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider block">Folio de Tarjeta *</label>
                    <input
                      type="text"
                      required
                      value={editFolio}
                      onChange={(e) => setEditFolio(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 outline-none transition-all font-mono font-bold text-center text-xs text-[#149b8f]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider block">Sello actual (Tazas) *</label>
                    <select
                      value={editCurrentStamps}
                      onChange={(e) => setEditCurrentStamps(parseInt(e.target.value))}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2 text-xs font-bold font-mono text-[#149b8f]"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(st => (
                        <option key={st} value={st}>{st} / 8 tazas</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider block">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 outline-none transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider block">Celular del Socio *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider block">Cumpleaños *</label>
                    <input
                      type="date"
                      required
                      value={editBirthday}
                      onChange={(e) => setEditBirthday(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider block">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 outline-none transition-all text-xs"
                  />
                </div>

                {/* SIGNATURE SAFEGUARD */}
                <div className="border-t border-dashed border-slate-200 pt-4 space-y-3 font-sans">
                  <div className="space-y-1">
                    <label className="text-[#149b8f] font-black uppercase tracking-widest text-[9px] block">💼 Clave de Autorización de Encargado *</label>
                    <input
                      type="password"
                      placeholder="Introduce tu PIN confidencial de encargado del Bistro"
                      value={editPinInput}
                      onChange={(e) => setEditPinInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-center tracking-widest text-[#149b8f] font-bold focus:border-[#149b8f] outline-none"
                      required
                    />
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-400 font-sans text-center">
                    El sistema detectará automáticamente qué personal autoriza la lealtad según el PIN confidencial ingresado.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-sans pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCustomer(null);
                      setEditSelectedClerk(null);
                      setEditPinInput('');
                      setEditError('');
                    }}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold cursor-pointer text-center"
                  >
                    Descartar Cambios
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-[#149b8f] hover:bg-[#11847a] text-white rounded-xl font-black cursor-pointer text-center shadow-md shadow-teal-700/10"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ACTION C: DESCONTAR SELLO AD-HOC */}
        {revertingCustomerFolio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-left space-y-4 border border-slate-100"
            >
              <div>
                <span className="text-[9px] font-black tracking-widest text-red-500 uppercase font-sans">Advertencia de Cargo</span>
                <h3 className="text-base font-serif font-black text-slate-900">¿Revertir última visita?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Se descontará 1 taza de café del registro del folio <strong className="text-slate-800">#{revertingCustomerFolio}</strong>.</p>
              </div>

              {revertPinError && (
                <p className="text-[10px] text-red-600 bg-red-50 border border-red-100 p-2 rounded-xl text-center font-bold font-sans leading-normal">{revertPinError}</p>
              )}

              <form onSubmit={handleConfirmRevertStamp} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Clave de Autorización</label>
                  <input
                    type="password"
                    placeholder="••••"
                    value={revertPinInput}
                    onChange={(e) => setRevertPinInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-2.5 text-center tracking-widest font-black outline-none focus:border-red-500 text-red-600 font-sans"
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 font-sans mt-1 text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Introduce tu PIN confidencial de encargado del Bistro. El sistema detectará automáticamente quién autoriza el descuento.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRevertingCustomerFolio(null);
                      setRevertSelectedClerk(null);
                      setRevertPinInput('');
                      setRevertPinError('');
                    }}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold text-center cursor-pointer"
                  >
                    Salir
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-center cursor-pointer shadow-md shadow-red-700/10"
                  >
                    Descontar Sello ☕
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ACTION D: ELIMINAR SOCIO DEFINITIVAMENTE */}
        {deletingCustomerFolio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-left space-y-4 border border-slate-100"
            >
              <div>
                <span className="text-[9px] font-black tracking-widest text-red-650 uppercase font-sans">Modo Pánico Irreversible</span>
                <h3 className="text-base font-serif font-black text-slate-950">¿Eliminar Cliente por Completo?</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Esta acción purgará el folio físico <strong className="text-red-500">#{deletingCustomerFolio}</strong> de la base de datos de lealtad, borrando sus visitas e historial.</p>
              </div>

              {deletePinError && (
                <p className="text-[10px] text-red-600 bg-red-100/50 border border-red-200 p-2 rounded-xl text-center font-bold font-sans leading-normal">{deletePinError}</p>
              )}

              <form onSubmit={handleConfirmDeleteCustomer} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Clave de Autorización de Supervisor</label>
                  <input
                    type="password"
                    placeholder="••••"
                    value={deletePinInput}
                    onChange={(e) => setDeletePinInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-2.5 text-center tracking-widest font-black outline-none focus:border-red-600 text-red-600 font-sans"
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-405 font-sans mt-1 text-center bg-slate-50 p-2 rounded-lg border border-slate-105">
                    El sistema detectará automáticamente quién autoriza la eliminación de la tarjeta según el PIN ingresado.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingCustomerFolio(null);
                      setDeleteSelectedClerk(null);
                      setDeletePinInput('');
                      setDeletePinError('');
                    }}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold text-center cursor-pointer"
                  >
                    Salir de pánico
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-red-600 hover:bg-red-750 text-white rounded-xl font-black text-center cursor-pointer shadow-md shadow-red-700/20"
                  >
                    Confirmar Purga ☠
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INDIVIDUAL FLIPPABLE DIGITAL CARD PREVIEW OVERLAY */}
      <AnimatePresence>
        {selectedOverlayCustomer && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-2 flex flex-col justify-center items-center gap-4 text-center"
            >
              <div className="flex justify-between w-full items-center text-white px-2">
                <span className="text-sm font-serif font-black flex items-center gap-1">
                  <Coffee size={16} /> Tarjeta de Fidelidad Digital
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOverlayCustomer(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Native digital cards emulator card */}
              <CustomerCard 
                session={{
                  id: selectedOverlayCustomer.folio,
                  folio: selectedOverlayCustomer.folio,
                  name: selectedOverlayCustomer.name,
                  email: selectedOverlayCustomer.email,
                  phone: selectedOverlayCustomer.phone,
                  birthday: selectedOverlayCustomer.birthday,
                  currentStamps: selectedOverlayCustomer.currentStamps,
                  totalStampsEarned: selectedOverlayCustomer.totalStampsEarned,
                  points: selectedOverlayCustomer.points,
                  unlockedVouchers: selectedOverlayCustomer.unlockedVouchers || []
                }}
                config={config}
                onReset={() => {
                  syncSetConsumers(prev => prev.map(c => {
                    if (c.folio === selectedOverlayCustomer.folio) {
                      return { ...c, currentStamps: 0, points: 0, unlockedVouchers: [] };
                    }
                    return c;
                  }));
                  setSelectedOverlayCustomer(prev => prev ? { ...prev, currentStamps: 0, points: 0, unlockedVouchers: [] } : null);
                  
                  // Reset Log
                  const logRecord: ActivityLog = {
                    id: 'log_' + Date.now(),
                    type: 'stamp_added',
                    amount: 0,
                    title: `Tarjeta Reseteada #${selectedOverlayCustomer.folio}`,
                    description: `Se reiniciaron los sellos acumulados de ${selectedOverlayCustomer.name}.`,
                    timestamp: new Date().toISOString(),
                    clerkName: 'Administrador',
                    clerkCode: 'GER',
                    customerFolio: selectedOverlayCustomer.folio
                  };
                  syncSetLogs(prevL => [logRecord, ...prevL]);
                }}
              />

              <p className="text-xs text-white/55 font-sans">
                Toca la tarjeta para ver el código QR trasero para acreditar consumos en caja.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ROLE AND GATEWAY ENTRY ADMISSION PORTAL (Screen 7) */}
      {portalMode === 'ingreso' && (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          
          {/* Main Logo card panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-150 shadow-xl space-y-6 flex flex-col justify-center relative"
          >
            {/* Top header icons brand - beautiful circle logo from user image */}
            <div className="mx-auto flex justify-center">
              <MiCafecitoLogo size={88} className="shadow-md rounded-full" />
            </div>

            <div className="space-y-0.5">
              <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900">Fidelidad</h1>
              <p className="text-xs text-[#149b8f] font-sans font-black tracking-widest uppercase">Mi Cafecito ⚙</p>
            </div>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Bienvenido al sistema controlador de sellos fidelidad de Mi Cafecito. Selecciona de qué forma deseas ingresar al sistema:
            </p>

            {/* Selector list */}
            <div className="space-y-2.5">
              
              {/* LIDER */}
              <button
                type="button"
                onClick={handleLiderLogin}
                className="w-full flex justify-between items-center bg-slate-50 hover:bg-slate-100 p-4 border border-slate-205 rounded-2xl transition hover:shadow-sm cursor-pointer text-left"
              >
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 font-sans">Ingresar como Líder</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Acceso estándar de caja y registros</p>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              {/* GERENTE */}
              <button
                type="button"
                onClick={() => setShowGerentePasswordModal(true)}
                className="w-full flex justify-between items-center bg-slate-50 hover:bg-[#149b8f]/5 p-4 border border-slate-205 rounded-2xl transition hover:shadow-sm cursor-pointer text-left"
              >
                <div>
                  <h4 className="text-xs font-black uppercase text-[#149b8f] font-sans">Ingresar como Gerente</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Apertura de Reportes + Auditorías de claves</p>
                </div>
                <Lock size={12} className="text-[#149b8f]" />
              </button>


            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[9px] text-slate-400 font-mono uppercase">
              <span>Caja / Mostrador</span>
              <span>v1.2 - 2026</span>
            </div>
          </motion.div>

          {/* PASSWORD LOCKED PASSCODE MODAL (Screen 6) */}
          <AnimatePresence>
            {showGerentePasswordModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-xs w-full text-left relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowGerentePasswordModal(false);
                      setGerentePasswordError('');
                      setGerentePasswordInput('');
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>

                  <h3 className="text-base font-serif font-black text-slate-900">Ingresa la clave de Gerente</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Digita el pin comercial para validar los permisos de auditorías estratégicas del Bistró:
                  </p>

                  <form onSubmit={handleGerenteLoginConfirm} className="mt-4 space-y-3 font-sans">
                    <input
                      type="password"
                      required
                      placeholder="Contraseña..."
                      value={gerentePasswordInput}
                      onChange={(e) => setGerentePasswordInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#149b8f] rounded-xl px-4 py-2.5 text-xs text-center outline-none leading-none tracking-widest text-[#149b8f]"
                    />

                    {gerentePasswordError && (
                      <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded text-center">{gerentePasswordError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer text-center"
                    >
                      Ingresar
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}


      {/* INDIVIDUAL CLIENT PORTAL GATE - FLIPPABLE PREVIEW */}
      {portalMode === 'cliente_portal' && (
        <div className="flex-1 flex flex-col justify-center items-center py-6 px-4">
          <div className="w-full max-w-sm mb-4">
            <button
              onClick={() => {
                setClientPortalSession(null);
                setPortalMode('ingreso');
                setClientPhoneInput('');
                setClientBdayInput('');
                setClientPortalError('');
              }}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft size={13} /> Regresar al Selector
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!clientPortalSession ? (
              <motion.div
                key="lookup"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl max-w-sm w-full text-left space-y-4"
              >
                <div>
                  <h3 className="text-lg font-serif font-black text-slate-900">Tarjeta de Lealtad</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingresa tu número de celular y fecha de nacimiento configurados con el cajero para verificar tu estatus de sellos acumulados:
                  </p>
                </div>

                <form onSubmit={handleClientLookupSubmit} className="space-y-3 font-sans text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold tracking-wider block text-[10px]">Número de Celular</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 6421151475"
                      value={clientPhoneInput}
                      onChange={(e) => setClientPhoneInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold tracking-wider block text-[10px]">Fecha de Cumpleaños</label>
                    <input
                      type="date"
                      required
                      value={clientBdayInput}
                      onChange={(e) => setClientBdayInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#149b8f]"
                    />
                  </div>

                  {clientPortalError && (
                    <p className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100 leading-normal">{clientPortalError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#149b8f] hover:bg-[#11847a] text-white font-sans font-extrabold rounded-xl transition shadow shadow-teal-700/10 cursor-pointer text-center"
                  >
                    Consultar Tarjeta Digital ☕
                  </button>
                </form>

                {/* Test Helper shortcuts */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">💡 Acceso de prueba rápida (click para rellenar de inmediato):</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button
                      onClick={() => {
                        setClientPhoneInput('6421138384');
                        setClientBdayInput('1998-08-07');
                      }}
                      className="p-2 border border-slate-200 hover:border-[#149b8f] rounded-xl text-left bg-slate-50 cursor-pointer hover:bg-white truncate"
                    >
                      <strong className="block text-slate-700">Dulce E.</strong>
                      <span>cel: 138384</span>
                    </button>
                    <button
                      onClick={() => {
                        setClientPhoneInput('6421151475');
                        setClientBdayInput('1996-06-12');
                      }}
                      className="p-2 border border-slate-200 hover:border-[#149b8f] rounded-xl text-left bg-slate-50 cursor-pointer hover:bg-white truncate"
                    >
                      <strong className="block text-slate-700">Tania Z.</strong>
                      <span>cel: 151475</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-sm space-y-4"
              >
                <div className="bg-white border rounded-2xl p-4 flex justify-between items-center shadow-sm text-xs text-slate-500 font-sans">
                  <span>Bienvenido socio, <strong>{clientPortalSession.name}</strong></span>
                  <button
                    onClick={() => setClientPortalSession(null)}
                    className="text-red-500 hover:text-red-650 font-bold"
                  >
                    Cerrar Sesión
                  </button>
                </div>

                <CustomerCard 
                  session={clientPortalSession}
                  config={config}
                  onReset={() => {
                    alert('Operación restringida. Por favor, realiza los canjes con el cajero o administrador de Mi Cafecito.');
                  }}
                />

                <CustomerNotificationCenter 
                  session={clientPortalSession} 
                  notifications={notifications} 
                />

                <p className="text-center text-xs text-slate-400">
                  Haz clic en el plástico virtual para girarlo y mostrar tu QR holográfico en la barra del Bistró. ¡Gracias por tu visita!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}


      {/* MAIN STAFF & ADMIN WORKING CONSOLE (Lider & Gerente Roles) */}
      {portalMode === 'sistema' && (
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* STATIC SIDEBAR DESIGN EXACTLY FROM IMAGE captures */}
          <aside className="w-full md:w-64 bg-white border-r border-slate-205 flex flex-col justify-between shrink-0 font-sans p-5 relative z-40">
            <div className="space-y-6">
              
              {/* Header Box Brand Group */}
              <div className="flex items-center gap-3">
                <MiCafecitoLogo size={42} className="shadow-sm rounded-full shrink-0" />
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900 leading-none">Fidelidad</h2>
                  <p className="text-[10px] text-slate-400 tracking-widest font-black uppercase mt-0.5">Mi Cafecito</p>
                </div>
              </div>

              {/* Dynamic Role Indicator Badge */}
              <div className="bg-[#149b8f]/5 rounded-2xl p-3 flex justify-between items-center text-xs border border-[#149b8f]/10 leading-none shadow-inner">
                <span className="text-slate-500 font-medium font-sans">Sesión como:</span>
                <span className="font-bold text-[#149b8f] uppercase tracking-wider">
                  {userRole === 'gerente' ? '👑 Gerente' : '💼 Líder'}
                </span>
              </div>

              {/* VERTICAL MENU OPTIONS LIST */}
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <Sliders size={15} /> },
                  { id: 'clientes', label: 'Clientes', icon: <User size={15} /> },
                  { id: 'registrar', label: 'Registrar', icon: <UserPlus size={15} /> },
                  { id: 'cumpleanos', label: 'Cumpleaños', icon: <Cake size={15} />, count: birthdaysThisWeek },
                  { id: 'reportes', label: 'Reportes', icon: <FileText size={15} />, lock: userRole !== 'gerente' }
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.lock) {
                          setGerentePasswordError('');
                          setGerentePasswordInput('');
                          setShowGerentePasswordModal(true);
                        } else {
                          setActiveTab(item.id as any);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold font-sans transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-[#149b8f] text-white shadow-md shadow-teal-700/10'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>

                      {/* Display Alert circular counts */}
                      {item.count !== undefined && item.count > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white font-mono text-[9px] font-black flex items-center justify-center animate-pulse">
                          {item.count}
                        </span>
                      )}

                      {/* Display Manager lock icon */}
                      {item.lock && (
                        <span className="ml-auto text-slate-400 hover:text-[#149b8f]">
                          <Lock size={11} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

            </div>

            {/* Sidebar bottom cards widget layout (Exact image replica "Tarjetas / Tarjetas 001 - 500") */}
            <div className="space-y-4 pt-5 border-t border-slate-100 mt-6 md:mt-0">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-sans text-slate-500 space-y-1 shadow-inner">
                <div className="flex gap-2 items-center">
                  <Coffee size={14} className="text-[#149b8f]" />
                  <span className="font-extrabold text-slate-800">Tarjetas de Control</span>
                </div>
                <p className="text-[10px] text-slate-400">Tarjetas asignadas 001 — 500 disponibles</p>
                <div className="pt-2">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    <span>Asignadas: {totalRegistered}</span>
                    <span>Límite: {cardsLimit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1 overflow-hidden border border-slate-300">
                    <div 
                      className="h-full bg-gradient-to-r from-[#149b8f] to-teal-400 rounded-full" 
                      style={{ width: `${(totalRegistered / cardsLimit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* LOGOUT SECURE DISCONNECT BUTTON */}
              <button
                type="button"
                onClick={handleSystemLogOut}
                className="w-full py-2.5 bg-red-50 hover:bg-red-150 border border-red-100 rounded-2xl text-red-650 hover:text-red-750 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all uppercase tracking-wider"
              >
                <LogOut size={13} />
                Bloquear Consola 🔒
              </button>
            </div>
          </aside>

          {/* RIGHT CENTRAL WORKSPACE LAYOUT PANELS */}
          <main className="flex-1 p-5 md:p-8 flex flex-col justify-start max-w-5xl mx-auto w-full gap-6">
            
            {/* 1. PORTAL VIEW TABS: DASHBOARD SCREEN (Screen 4 and 5) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 text-left">
                
                {/* Header view label segment */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <h1 className="text-3xl font-serif font-black tracking-tight text-slate-950">Dashboard</h1>
                    <p className="text-xs text-slate-400 font-mono font-medium">{currentTimeFormatted}</p>
                  </div>

                  {/* Quick Shortcut registration button Top-Right */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('registrar')}
                    className="px-4.5 py-2 bg-[#149b8f] hover:bg-[#11847a] text-white font-sans font-extrabold text-xs rounded-2xl shadow-md shadow-teal-700/10 cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus size={13} className="stroke-[3]" />
                    <span>Nuevo Cliente</span>
                  </button>
                </div>

                {/* Grid 4 cards layout (Screen 4) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Clientes Registrados', value: totalRegistered, icon: <User size={18} />, color: 'bg-[#149b8f]/5 text-[#149b8f] border-[#149b8f]/15' },
                    { label: 'Tarjetas Disponibles', value: cardsAvailable, icon: <Coffee size={18} />, color: 'bg-slate-50 text-slate-700 border-slate-200' },
                    { label: 'Cumpleaños esta Semana', value: birthdaysThisWeek, icon: <Gift size={18} />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
                    { label: 'Cumpleaños este Mes', value: birthdaysThisMonth, icon: <Calendar size={18} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
                  ].map((met, idx) => (
                    <div key={idx} className={`border rounded-2xl p-4 flex items-center justify-between shadow-sm bg-white ${met.color}`}>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black font-sans">{met.label}</p>
                        <h3 className="text-2xl font-serif font-black text-slate-900 mt-1.5">{met.value}</h3>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border shrink-0 shadow-inner">
                        {met.icon}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Banner: Cumpleaños Próximos alerts (Screen 4 and 5) */}
                <div className="bg-[#149b8f]/5 border border-[#149b8f]/20 rounded-2xl p-5 space-y-3 shadow-inner">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Gift size={14} className="text-[#149b8f]" />
                    Cumpleaños Próximos ({birthdaysThisWeek} clientes esta semana)
                  </h3>

                  {dashboardUpcomingBdays.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay cumpleaños programados en los próximos 7 días.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {dashboardUpcomingBdays.map(({ customer, daysLeft, label }) => {
                        const countdownBadgeColor = daysLeft <= 2 
                          ? 'bg-red-500 hover:bg-red-400 text-white' 
                          : 'bg-[#149b8f] hover:bg-teal-600 text-white';

                        return (
                          <div key={customer.folio} className="bg-white border border-[#149b8f]/10 rounded-xl p-3 flex justify-between items-center text-xs shadow-sm">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] bg-cyan-50 border border-cyan-150 text-cyan-800 font-bold px-1.5 py-0.5 rounded">
                                  #{customer.folio}
                                </span>
                                <span className="font-black text-slate-800 truncate max-w-[120px]">{customer.name}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">Aniversario: {label}</p>
                            </div>

                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${countdownBadgeColor}`}>
                              {daysLeft === 0 ? '¡Hoy! 🥳' : `En ${daysLeft} días`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* List: Últimos Registros list */}
                <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-sm space-y-3.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 block border-b border-slate-100 pb-1.5">
                    Últimos Clientes Registrados
                  </h3>
                  
                  <div className="divide-y divide-slate-100">
                    {consumers.slice(0, 5).map(cust => (
                      <div key={cust.folio} className="py-3 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded border border-slate-205 shadow-inner">
                            #{cust.folio}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-800">{cust.name}</h4>
                            <p className="text-[10px] text-slate-400">{cust.phone}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[#149b8f] font-bold bg-[#149b8f]/5 px-2 py-0.5 rounded border border-[#149b8f]/10 text-[10px]">
                            {cust.currentStamps}/8 tazas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}


            {/* 2. PORTAL VIEW TABS: CLIENTS LIST SCREEN (Screen 1) */}
            {activeTab === 'clientes' && (
              <div className="space-y-6 text-left">
                
                {/* Header segment */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <h1 className="text-3xl font-serif font-black tracking-tight text-slate-950">Clientes</h1>
                    <p className="text-xs text-[#149b8f] font-sans font-bold uppercase tracking-wider">{totalRegistered} de 500 tarjetas asignadas</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('registrar')}
                    className="px-4.5 py-2 bg-[#149b8f] hover:bg-[#11847a] text-white font-sans font-extrabold text-xs rounded-2xl shadow shadow-teal-700/10 cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={13} className="stroke-[3]" />
                    <span>Nuevo Cliente</span>
                  </button>
                </div>

                {/* Search Text Input Box */}
                <div className="relative font-sans text-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por número de celular, folio físico o nombre..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full bg-white border border-slate-205 focus:border-[#149b8f] rounded-2xl pl-9 pr-4 py-3 outline-none transition shadow-sm font-sans"
                  />
                </div>

                {/* CLAY CARD DIRECTORY GRID */}
                {filteredCustomers.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-8 text-center text-slate-400 italic">
                    Ningún cliente coincide con la búsqueda activa.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredCustomers.map(cust => (
                      <div 
                        key={cust.folio} 
                        className="bg-white border border-slate-205 rounded-2.5xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-5 relative group"
                      >
                        {/* Control actions toolbar */}
                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-50 border border-slate-150 rounded-xl p-0.5 z-20">
                          {/* Edit Pencil Action */}
                          <button
                            type="button"
                            onClick={() => handleStartEditCustomer(cust)}
                            className="text-slate-400 hover:text-[#149b8f] rounded p-1 hover:bg-white transition cursor-pointer"
                            title="Editar Datos de Cliente"
                          >
                            <Pencil size={11} />
                          </button>
                          {/* Delete Trash Action */}
                          <button
                            type="button"
                            onClick={() => handleStartDeleteCustomer(cust)}
                            className="text-slate-400 hover:text-red-500 rounded p-1 hover:bg-white transition cursor-pointer"
                            title="Eliminar Cuenta"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                        {/* Top customer header cards */}
                        <div className="space-y-3">
                          <div className="flex gap-2.5 items-center">
                            <span className="font-mono text-xs font-black bg-cyan-50 border border-cyan-150 text-cyan-800 py-1 px-2.5 rounded-xl z-10 shadow-sm leading-none">
                              #{cust.folio}
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-900 group-hover:text-[#149b8f] transition text-sm">{cust.name}</h4>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>🎂 {cust.birthday ? new Date(cust.birthday + 'T00:00:00').toLocaleDateString('es-MX', {day:'numeric', month:'long'}) : 'Sin fecha'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Contact Details info rows */}
                          <div className="space-y-1.5 text-xs text-slate-500 font-sans border-t border-slate-100 pt-3">
                            <p className="flex items-center gap-2">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{cust.phone}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail size={12} className="text-slate-400 shrink-0 select-all" />
                              <span className="truncate">{cust.email}</span>
                            </p>
                          </div>

                          {/* Coffee Stamps Progress Tracker Cups Row matches photos exactly! */}
                          <div className="border-t border-slate-100/80 pt-3 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 tracking-wider uppercase font-black">
                              <span>Sello de visita</span>
                              <span className="text-[#149b8f] font-bold font-mono">{cust.currentStamps}/8 tazas</span>
                            </div>

                            {/* Aligned Coffee Stamps Row (8 cups count) */}
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 p-2.5 rounded-2xl shadow-inner">
                              <div className="flex-1 flex gap-1.5 justify-between">
                                {Array.from({ length: 8 }).map((_, stIdx) => {
                                  const isFilledStam = stIdx < cust.currentStamps;
                                  return (
                                    <div 
                                      key={stIdx} 
                                      className={`w-7 h-7 rounded-full flex items-center justify-center transition border ${
                                        isFilledStam 
                                          ? 'bg-teal-50 border-teal-200 text-[#149b8f]' 
                                          : 'bg-white border-slate-200 text-slate-300'
                                      }`}
                                    >
                                      <Coffee size={14} className={isFilledStam ? 'fill-teal-500/10 stroke-[2.5]' : 'stroke-[2]'} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive actions for cashiers */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2.5">
                          {/* Main visit registration action */}
                          <button
                            type="button"
                            onClick={() => setStampingCustomerFolio(cust.folio)}
                            className="flex-1 py-2.5 bg-[#149b8f] hover:bg-[#11847a] text-white text-xs font-bold font-sans rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Coffee size={13} />
                            <span>Registrar visita</span>
                          </button>

                          {/* Reset stamps / decrease override item */}
                          <button
                            type="button"
                            onClick={() => handleStartRevertStamp(cust)}
                            className="w-10 h-10 bg-white border border-slate-200 hover:border-red-500 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
                            title="Descontar 1 taza (Corregir error)"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>

                        {/* Virtual loyal view overlay modal click */}
                        <button
                          type="button"
                          onClick={() => setSelectedOverlayCustomer(cust)}
                          className="w-full text-center text-[10px] text-[#149b8f] font-sans font-black uppercase tracking-widest mt-1 hover:underline cursor-pointer block border-t border-dashed border-slate-150 pt-2"
                        >
                          💳 Ver tarjeta de lealtad digital
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* 3. PORTAL VIEW TABS: REGISTRATION NEW FOLIO FORM (Screen 8) */}
            {activeTab === 'registrar' && (
              <div className="space-y-6 text-left max-w-lg mx-auto w-full">
                
                <div className="space-y-0.5">
                  <h1 className="text-3xl font-serif font-black tracking-tight text-slate-950">Registrar Cliente</h1>
                  <p className="text-xs text-[#149b8f] font-sans font-bold uppercase tracking-wider">{cardsAvailable} tarjetas físicas disponibles</p>
                </div>

                <div className="bg-white border border-slate-205 rounded-2.5xl p-6 shadow-sm space-y-4">
                  
                  {regError && (
                    <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-600 text-xs font-bold leading-normal">
                      {regError}
                    </div>
                  )}

                  {regSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-800 text-xs font-black shadow-sm text-center flex items-center justify-center gap-2 animate-bounce">
                      <CheckCircle2 size={16} />
                      <span>¡Cliente de Cafecito registrado con éxito! Redirigiendo...</span>
                    </div>
                  )}

                  <form onSubmit={handleAddNewCustomerFormSubmit} className="space-y-4 text-xs font-sans">
                    
                    {/* select physical sequenced folio range */}
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold uppercase tracking-wider block">Número de Tarjeta (Físico) *</label>
                      <select
                        value={regFolio}
                        onChange={(e) => setRegFolio(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 hover:bg-slate-100/50 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#149b8f] transition-all font-mono font-bold text-[#149b8f]"
                      >
                        {getAvailableFolios().map(fol => (
                          <option key={fol} value={fol}>Folio físico #{fol}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400">Selecciona un folio de tarjeta física disponible del 001 al 500.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold uppercase tracking-wider block">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ejemplo: Arlett Zazueta, Dulce Escalante..."
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold uppercase tracking-wider block">Celular del Cliente *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10 dígitos numéricos (ej: 6421138384)"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold uppercase tracking-wider block">Correo Electrónico (Opcional)</label>
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold uppercase tracking-wider block">Fecha de Cumpleaños *</label>
                      <input
                        type="date"
                        required
                        value={regBirthday}
                        onChange={(e) => setRegBirthday(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 focus:bg-white focus:border-[#149b8f] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-mono"
                      />
                      <p className="text-[10px] text-slate-400">Requerido para generar las alertas en el portal de cumpleaños.</p>
                    </div>

                    {/* SIGNATURE SAFEGUARD */}
                    <div className="border-t border-dashed border-slate-200 pt-4 space-y-3 font-sans">
                      <div className="space-y-1">
                        <label className="text-[#149b8f] font-black uppercase tracking-widest text-[9px] block">💼 Clave de Autorización de Encargado *</label>
                        <input
                          type="password"
                          placeholder="Introduce tu PIN confidencial de encargado del Bistro"
                          value={regPinInput}
                          onChange={(e) => setRegPinInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-2 text-xs text-center tracking-widest text-[#149b8f] font-bold focus:border-[#149b8f] outline-none"
                          required
                        />
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-400 font-sans text-center">
                        El sistema detectará automáticamente qué personal autoriza el registro de este cliente según el PIN confidencial ingresado.
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setRegPinInput('');
                          setRegError('');
                          setActiveTab('clientes');
                        }}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-center"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={regSuccess}
                        className="flex-1 py-3 bg-[#149b8f] hover:bg-[#11847a] text-white font-extrabold rounded-xl transition shadow shadow-teal-700/10 cursor-pointer text-center"
                      >
                        Registrar Cliente
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}


            {/* 4. PORTAL VIEW TABS: BIRTHDAYS SECTION (Screen 2 and 3) */}
            {activeTab === 'cumpleanos' && (
              <div className="space-y-6 text-left">
                <div className="space-y-0.5">
                  <h1 className="text-3xl font-serif font-black tracking-tight text-slate-950">Cumpleaños</h1>
                  <p className="text-xs text-[#149b8f] font-sans font-bold uppercase tracking-wider">
                    {birthdaysThisWeek} cumpleaños esta semana • {birthdaysThisMonth} este mes
                  </p>
                </div>

                {/* Sub Tab Panel rendered */}
                <BirthdayTabPanel customers={consumers} />
              </div>
            )}


            {/* 5. PORTAL VIEW TABS: ADMINISTRATIVE REPORTS PANEL (Screen 9, 10, 11, 12) */}
            {activeTab === 'reportes' && (
              <div className="space-y-6 text-left">
                <div className="space-y-0.5">
                  <h1 className="text-3xl font-serif font-black tracking-tight text-slate-950">Reportes</h1>
                  <p className="text-xs text-slate-400 font-mono font-medium">Consola gerencial de auditorías registradas</p>
                </div>

                {/* Secure auth safeguard before rendering panel */}
                {userRole !== 'gerente' ? (
                  <div className="bg-white border rounded-2xl p-6 text-center space-y-4 font-sans text-xs">
                    <p className="font-bold text-red-600">Acceso Restringido. Rol de Gerencia requerido.</p>
                    <button
                      onClick={() => setShowGerentePasswordModal(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                    >
                      Ingresar contraseña gerente
                    </button>
                  </div>
                ) : (
                  <MerchantReportsTabPanel 
                    customers={consumers} 
                    setCustomers={syncSetConsumers}
                    visits={visits} 
                    setVisits={syncSetVisits}
                    logs={logs} 
                    setLogs={syncSetLogs}
                    onResetAllData={() => {
                      if (confirm('¿Estás seguro de que deseas reiniciar todos los datos de visitas y logs históricos? Las cuentas de clientes permanecerán a salvo.')) {
                        syncSetVisits([]);
                        syncSetLogs([]);
                        
                        // Default Log
                        const logRecord: ActivityLog = {
                          id: 'log_' + Date.now(),
                          type: 'voucher_redeemed' as any,
                          amount: 0,
                          title: 'Sistema Reiniciado',
                          description: 'Se realizó una purga general de visitas y actividad por comando de gerencia.',
                          timestamp: new Date().toISOString(),
                          clerkName: 'Gerente',
                          clerkCode: 'GER'
                        };
                        syncSetLogs([logRecord]);
                      }
                    }}
                    surveys={surveys}
                    setSurveys={syncSetSurveys}
                    surveyAnswers={surveyAnswers}
                    clerks={CLERKS}
                    setClerks={syncSetCLERKS}
                    notifications={notifications}
                    onSaveNotification={dbSaveNotification}
                    onDeleteNotification={dbDeleteNotification}
                  />
                )}
              </div>
            )}

          </main>
        </div>
      )}
        </>
      )}

    </div>
  );
}
