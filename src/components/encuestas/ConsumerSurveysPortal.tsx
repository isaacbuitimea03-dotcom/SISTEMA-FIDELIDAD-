import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, ArrowRight, ArrowLeft, MessageSquare, Gift, Sparkles, 
  HelpCircle, Ticket, Phone, User, Calendar, ClipboardCheck, ArrowLeftRight
} from 'lucide-react';
import { Survey, SurveyAnswer, UserSession, RegisteredCustomer } from '../../types';
import { MiCafecitoLogo } from '../MiCafecitoLogo';

interface ConsumerSurveysPortalProps {
  surveys: Survey[];
  customers: RegisteredCustomer[];
  onSaveAnswer: (answer: SurveyAnswer) => Promise<void>;
  onUpdateSurvey: (survey: Survey) => Promise<void>;
  onBackToGateway: () => void;
}

export default function ConsumerSurveysPortal({
  surveys,
  customers,
  onSaveAnswer,
  onUpdateSurvey,
  onBackToGateway
}: ConsumerSurveysPortalProps) {
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  
  // Identifying fields
  const [participantName, setParticipantName] = useState('');
  const [participantPhone, setParticipantPhone] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [identificationError, setIdentificationError] = useState('');
  const [isIdentified, setIsIdentified] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<RegisteredCustomer | null>(null);

  // Completed surveys lookup state (using localStorage to avoid querying API over and over, persists after restart)
  const [completedSurveys, setCompletedSurveys] = useState<Record<string, boolean>>(() => {
    const res: Record<string, boolean> = {};
    try {
      surveys.forEach(s => {
        const completed = localStorage.getItem(`completed_survey_${s.id}`) === 'true' ||
                          Object.keys(localStorage).some(k => k.endsWith(`_${s.id}`) && localStorage.getItem(k) === 'true');
        if (completed) {
          res[s.id] = true;
        }
      });
    } catch (e) {
      console.error(e);
    }
    return res;
  });

  // Answering state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tempAnswers, setTempAnswers] = useState<Record<string, string>>({});
  const [showFinishedSplash, setShowFinishedSplash] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAnimatingLogo, setIsAnimatingLogo] = useState(false);

  // Active surveys list (filtering out ones already completed in this browser/device)
  const activeSurveys = surveys.filter(s => s.active && !s.deleted && !completedSurveys[s.id]);

  const handleSelectSurvey = (srv: Survey) => {
    setSelectedSurvey(srv);
    // Reset wizard
    setParticipantName('');
    setParticipantPhone('');
    setIsGuest(false);
    setIdentificationError('');
    setIsIdentified(false);
    setMatchedCustomer(null);
    setCurrentIdx(0);
    setTempAnswers({});
    setShowFinishedSplash(false);
    setIsAnimatingLogo(false);
  };

  const handleIdentificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIdentificationError('');

    if (isGuest) {
      if (!participantName.trim()) {
        setIdentificationError('Por favor ingresa tu nombre para continuar.');
        return;
      }
      setIsIdentified(true);
      return;
    }

    // Try to match registered consumer
    const phoneNo = participantPhone.replace(/\D/g, '');
    if (phoneNo.length < 10) {
      setIdentificationError('Por favor ingresa un número de celular válido de 10 dígitos.');
      return;
    }

    const found = customers.find(c => c.phone.replace(/\D/g, '') === phoneNo);
    if (!found) {
      setIdentificationError('No encontramos una tarjeta de fidelidad asociada a este celular. Por favor regístrate en caja o continúa como invitado.');
      return;
    }

    // Check if they already completed this survey (either on this page or the client portal page)
    const isAlreadyCompleted = localStorage.getItem(`answered_survey_${found.folio}_${selectedSurvey?.id}`) === 'true';
    if (isAlreadyCompleted) {
      setIdentificationError(`Hola ${found.name}, ya has respondido a esta encuesta anteriormente. ¡Muchas gracias por tu participación!`);
      return;
    }

    setMatchedCustomer(found);
    setParticipantName(found.name);
    setIsIdentified(true);
  };

  // Safe questions handler
  const questionsList = selectedSurvey?.questions && selectedSurvey.questions.length > 0
    ? selectedSurvey.questions
    : selectedSurvey
      ? [{
          id: 'legacy_q1',
          text: selectedSurvey.question || '¿Qué te pareció nuestro servicio?',
          type: 'multiple' as const,
          options: selectedSurvey.options || ['Bueno', 'Regular', 'Malo']
        }]
      : [];

  const currentQuestion = questionsList[currentIdx];
  const totalQuestions = questionsList.length;
  const currentAnswer = currentQuestion ? (tempAnswers[currentQuestion.id] || '') : '';

  // Helpers to count words for open answers
  const countWords = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === '') return 0;
    return trimmed.split(/\s+/).length;
  };

  const wordCount = currentQuestion && currentQuestion.type === 'open' ? countWords(currentAnswer) : 0;
  const isWordLimitExceeded = wordCount > 100;

  const isNextDisabled = () => {
    if (!currentAnswer.trim()) return true;
    if (currentQuestion.type === 'open' && isWordLimitExceeded) return true;
    return false;
  };

  const handleSelectOption = (opt: string) => {
    if (!currentQuestion) return;
    setTempAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: opt
    }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentQuestion) return;
    setTempAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: e.target.value
    }));
  };

  const handleNext = async () => {
    if (isNextDisabled() || submitting) return;
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setSubmitting(true);
      // Last step: Save answers
      await handlePublishAnswers();
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handlePublishAnswers = async () => {
    if (!selectedSurvey) return;
    try {
      const answersArray = questionsList.map(q => ({
        questionId: q.id,
        questionText: q.text,
        answerText: tempAnswers[q.id] || ''
      }));

      const newAnswer: SurveyAnswer = {
        id: 'ans_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        surveyId: selectedSurvey.id,
        surveyTitle: selectedSurvey.title,
        customerFolio: matchedCustomer ? matchedCustomer.folio : 'Invitado',
        customerName: matchedCustomer ? matchedCustomer.name : (participantName.trim() || 'Consumidor Invitado'),
        timestamp: new Date().toISOString(),
        answers: answersArray
      };

      // Save to Database
      await onSaveAnswer(newAnswer);

      // Increment submissions count check
      const updatedSurvey: Survey = {
        ...selectedSurvey,
        submissionsCount: (selectedSurvey.submissionsCount || 0) + 1
      };
      await onUpdateSurvey(updatedSurvey);

      // Save in localStorage so user avoids repeating
      localStorage.setItem(`answered_survey_${matchedCustomer?.folio || 'guest'}_${selectedSurvey.id}`, 'true');
      localStorage.setItem(`completed_survey_${selectedSurvey.id}`, 'true');
      
      setCompletedSurveys(prev => ({
        ...prev,
        [selectedSurvey.id]: true
      }));

      // Launch Logo Animation representation and after 2.5 seconds show appreciation
      setIsAnimatingLogo(true);
      setTimeout(() => {
        setIsAnimatingLogo(false);
        setShowFinishedSplash(true);
      }, 2500);

    } catch (err) {
      console.error('Error saving survey response: ', err);
      alert('Ocurrió un error al registrar las respuestas. Por favor intenta de nuevo.');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#F6F9F8] min-h-screen flex flex-col justify-between items-center px-4 py-8 pointer-events-auto z-10">
      
      {/* Upper header */}
      <div className="w-full max-w-sm flex items-center justify-center pb-4 border-b border-slate-200 mb-4 select-none">
        <span className="text-[10px] font-mono bg-indigo-150/50 text-indigo-805 px-3 py-1 rounded-full font-black tracking-wider flex items-center gap-1.5">
          💬 PORTAL DE ENCUESTAS EN VIVO
        </span>
      </div>

      <div className="w-full max-w-sm flex-1 flex flex-col justify-center py-4">
        
        <AnimatePresence mode="wait">
          {!selectedSurvey ? (
            /* SCREEN 1: SURVEY SELECTION */
            <motion.div
              key="survey-select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Branding heading */}
              <div className="flex flex-col items-center text-center space-y-3">
                <MiCafecitoLogo size={96} className="shadow-lg rounded-full" />
                <div className="space-y-0.5">
                  <h1 className="text-2xl font-serif font-black text-slate-950">
                    Opinión del Consumidor
                  </h1>
                  <p className="text-xs text-slate-500 font-sans leading-relaxed px-4">
                    Ayúdanos a mejorar respondiendo nuestras encuestas de Mi Cafecito para calificar tu experiencia de servicio.
                  </p>
                </div>
              </div>

              {/* Grid of active surveys */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-sans font-black tracking-widest text-[#149b8f] uppercase block mb-1">
                  Encuestas Disponibles ({activeSurveys.length})
                </span>

                {activeSurveys.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center italic text-slate-400 text-xs">
                    No hay encuestas ni campañas activas configuradas en este momento. Vuelve más tarde.
                  </div>
                ) : (
                  activeSurveys.map(srv => {
                    const questionsCount = srv.questions ? srv.questions.length : 1;
                    return (
                      <button
                        key={srv.id}
                        onClick={() => handleSelectSurvey(srv)}
                        className="w-full bg-white border border-slate-200 hover:border-[#149b8f]/50 p-4 rounded-2xl text-left transition hover:shadow-md cursor-pointer flex justify-between items-start gap-3 relative overflow-hidden group shadow-sm"
                      >
                        <div className="space-y-1.5 flex-1 pr-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm group-hover:text-[#149b8f] transition">
                              {srv.title}
                            </span>
                            <span className="bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded px-1.5 py-0.5">
                              {questionsCount} {questionsCount === 1 ? 'pregunta' : 'preguntas'}
                            </span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 font-bold text-slate-400 group-hover:bg-[#149b8f] group-hover:text-white transition flex items-center justify-center shrink-0">
                          <ArrowRight size={14} className="stroke-[2.5]" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : !isIdentified ? (
            /* SCREEN 2: GUEST OR CUSTOMER IDENTIFICATION */
            <motion.div
              key="survey-identify"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5"
            >
              <div className="space-y-1 text-center">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#149b8f]">ENCUESTA SELECCIONADA</span>
                <h3 className="text-base font-serif font-black text-slate-900 leading-tight">
                  {selectedSurvey.title}
                </h3>
                <p className="text-xs text-slate-400 leading-normal pt-1">
                  Identifícate para poder registrar las respuestas de manera segura y validar tu participación.
                </p>
              </div>

              {/* Form selection */}
              <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 flex text-xs font-bold font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setIsGuest(false);
                    setIdentificationError('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    !isGuest 
                      ? 'bg-[#149b8f] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Socio Mi Cafecito 💳
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGuest(true);
                    setIdentificationError('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isGuest 
                      ? 'bg-[#149b8f] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Responder como Invitado 👤
                </button>
              </div>

              <form onSubmit={handleIdentificationSubmit} className="space-y-3.5">
                {isGuest ? (
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-500 font-bold block mb-1">Escribe tu nombre:</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos Ramos"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100/50 rounded-xl pl-10 pr-3 py-3 text-xs outline-none focus:border-[#149b8f]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-550 font-bold block mb-1">Número de celular del socio:</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone size={15} />
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="Ej. 6441234567"
                        value={participantPhone}
                        onChange={(e) => setParticipantPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100/50 rounded-xl pl-10 pr-3 py-3 text-xs outline-none focus:border-[#149b8f]"
                      />
                    </div>
                  </div>
                )}

                {identificationError && (
                  <p className="text-[10px] text-red-650 font-bold leading-normal text-center">
                    ⚠️ {identificationError}
                  </p>
                )}

                <div className="flex gap-2 pt-1 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSurvey(null)}
                    className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#149b8f] hover:bg-[#11847a] text-white font-bold rounded-xl text-xs uppercase"
                  >
                    Iniciar Encuesta →
                  </button>
                </div>
              </form>
            </motion.div>
          ) : isAnimatingLogo ? (
            /* SCREEN: LOGO ANIMATION SUCCESS TRANSITION STATE */
            <motion.div
              key="survey-logo-anim"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col items-center justify-center space-y-6 text-center py-12"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.12, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="rounded-full overflow-hidden shadow-2xl relative z-10 bg-white p-1"
                >
                  <MiCafecitoLogo size={110} />
                </motion.div>
                
                {/* Pulsating ripples or glowing rings */}
                <span className="absolute -inset-4 bg-[#149b8f]/10 rounded-full animate-ping z-0" />
                <span className="absolute -inset-8 bg-[#149b8f]/5 rounded-full animate-pulse z-0" style={{ animationDuration: '3s' }} />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-serif font-black text-slate-800 flex items-center justify-center gap-1.5">
                  <Sparkles size={16} className="text-[#149b8f] animate-spin" style={{ animationDuration: '6s' }} />
                  Procesando Respuestas
                  <Sparkles size={16} className="text-[#149b8f] animate-spin" style={{ animationDuration: '6s' }} />
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Guardando tu valiosa retroalimentación para seguir mejorando la experiencia de <strong>Mi Cafecito</strong>...
                </p>
              </div>

              {/* Progress bar line loader */}
              <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ translateX: '-100%' }}
                  animate={{ translateX: '100%' }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5, 
                    ease: "easeInOut" 
                  }}
                  className="h-full bg-gradient-to-r from-transparent via-[#149b8f] to-transparent w-full"
                />
              </div>
            </motion.div>
          ) : !showFinishedSplash ? (
            /* SCREEN 3: ACTIVE QUESTIONS WIZARD */
            <motion.div
              key="survey-questions-flow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5"
            >
              {/* Header Progress status */}
              <div className="space-y-1.5 pb-2 border-b border-slate-100">
                <div className="flex justify-between items-center text-[9px] text-[#149b8f] font-mono font-bold uppercase">
                  <span>Campañas Mi Cafecito</span>
                  <span>Pregunta {currentIdx + 1} de {totalQuestions}</span>
                </div>
                <h3 className="text-sm font-serif font-black text-slate-900 leading-tight">
                  {selectedSurvey.title}
                </h3>
                {/* Progress bar line */}
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-[#149b8f] transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Identif info tag banner */}
              <div className="bg-[#149b8f]/5 border border-[#149b8f]/10 p-2 rounded-xl text-[10px] text-slate-600 flex items-center justify-between">
                <span>Participante: <strong>{participantName}</strong></span>
                {matchedCustomer ? (
                  <span className="bg-emerald-150/40 text-[#149b8f] font-extrabold px-1.5 py-0.5 rounded uppercase">SOCIO LIGADO</span>
                ) : (
                  <span className="bg-slate-150 text-slate-500 font-semibold px-1 py-0.5 rounded uppercase">INVITADO</span>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-3.5 py-1">
                <span className="text-slate-400 font-mono text-[9px] uppercase font-bold tracking-widest block font-extrabold">PREGUNTA ACTUAL:</span>
                <h4 className="text-sm font-bold text-slate-800 leading-normal">
                  {currentQuestion?.text}
                </h4>

                {/* Question Input styles */}
                {currentQuestion?.type === 'multiple' ? (
                  <div className="space-y-2 pt-1">
                    {currentQuestion.options?.map((opt, oIdx) => {
                      const isSelected = currentAnswer === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(opt)}
                          className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold border transition-all flex justify-between items-center cursor-pointer ${
                            isSelected 
                              ? 'bg-[#149b8f]/5 border-[#149b8f] text-[#11847a] shadow-sm font-bold' 
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/40'
                          }`}
                        >
                          <span className="pr-4">{opt}</span>
                          {isSelected && (
                            <div className="w-4.5 h-4.5 rounded-full bg-[#149b8f] flex items-center justify-center text-white shrink-0">
                              <Check size={11} className="stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1 text-xs">
                    <textarea
                      rows={4}
                      value={currentAnswer}
                      onChange={handleTextChange}
                      maxLength={800}
                      placeholder="Escribe tu sincera respuesta abierta aquí..."
                      className={`w-full bg-slate-50 focus:bg-white border rounded-xl p-3 text-xs outline-none transition-all leading-relaxed ${
                        isWordLimitExceeded ? 'border-red-400 text-red-700' : 'border-slate-200 focus:border-[#149b8f]'
                      }`}
                    />
                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>Límite: Max 100 palabras</span>
                      <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${isWordLimitExceeded ? 'bg-red-50 text-red-650' : 'bg-slate-100 text-slate-500'}`}>
                        {wordCount} / 100 palabras
                      </span>
                    </div>
                    {isWordLimitExceeded && (
                      <p className="text-[9.5px] text-red-500 font-bold leading-normal">
                        ⚠️ Tu mensaje excede de las 100 palabras recomendadas.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {currentIdx > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Anterior
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isNextDisabled() || submitting}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isNextDisabled() || submitting
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-[#149b8f] hover:bg-[#11847a] text-white shadow-sm'
                  }`}
                >
                  <span>{submitting ? 'Enviando...' : (currentIdx === totalQuestions - 1 ? 'Enviar Respuestas' : 'Siguiente')}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          ) : (
            /* SCREEN 4: SUCCESS THEMED APPRECIATION SCREEN (NO REWARDS) */
            <motion.div
              key="survey-finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 pt-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm"
            >
              <div className="mx-auto w-14 h-14 bg-[#149b8f]/10 rounded-full flex items-center justify-center text-[#149b8f] shadow-inner font-extrabold">
                <ClipboardCheck size={28} className="stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-serif font-black text-slate-900 leading-tight">
                  ¡Gracias por tu apoyo, {participantName}!
                </h3>
                <p className="text-xs text-slate-500 leading-normal max-w-[280px] mx-auto px-1">
                  Hemos registrado tus respuestas con satisfacción. Tus valiosos comentarios nos ayudan a seguir refinando la calidad y el servicio de Mi Cafecito.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-[285px] mx-auto text-[11px] text-slate-600 font-medium flex items-center justify-center gap-2">
                <Check size={14} className="text-[#149b8f] shrink-0" />
                <span>Tu participación ha sido registrada correctamente.</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSurvey(null)}
                className="w-full max-w-[285px] py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition active:scale-95"
              >
                Volver a Encuestas Activas
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <div className="mt-4 text-[9.5px] text-slate-400 font-mono text-center">
        <span>© 2026 Mi Cafecito Portal de Encuestas • Sanidad y Lealtad</span>
      </div>

    </div>
  );
}
