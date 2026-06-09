import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, ArrowLeft, MessageSquare, Gift, Sparkles, HelpCircle, Ticket } from 'lucide-react';
import { Survey } from '../types';

interface ClientSurveyWizardProps {
  survey: Survey;
  customerName: string;
  onComplete: (answers: { questionId: string; questionText: string; answerText: string }[]) => void;
}

export default function ClientSurveyWizard({ 
  survey, 
  customerName, 
  onComplete 
}: ClientSurveyWizardProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tempAnswers, setTempAnswers] = useState<Record<string, string>>({});
  const [showFinishedSplash, setShowFinishedSplash] = useState(false);

  // Ensure questions array is safe
  const SafeQuestions = survey.questions && survey.questions.length > 0 
    ? survey.questions 
    : [{
        id: 'legacy_q1',
        text: survey.question || '¿Qué te pareció nuestro servicio?',
        type: 'multiple' as const,
        options: survey.options || ['Bueno', 'Regular', 'Malo']
      }];

  const currentQuestion = SafeQuestions[currentIdx];
  const totalQuestions = SafeQuestions.length;

  const currentAnswer = tempAnswers[currentQuestion.id] || '';

  // Helpers to count words for open answers
  const countWords = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === '') return 0;
    const words = trimmed.split(/\s+/);
    return words.length;
  };

  const wordCount = currentQuestion.type === 'open' ? countWords(currentAnswer) : 0;
  const isWordLimitExceeded = wordCount > 100;

  const isNextDisabled = () => {
    if (!currentAnswer.trim()) return true;
    if (currentQuestion.type === 'open' && isWordLimitExceeded) return true;
    return false;
  };

  const handleSelectOption = (opt: string) => {
    setTempAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: opt
    }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTempAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: e.target.value
    }));
  };

  const handleNext = () => {
    if (isNextDisabled()) return;
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Last question completed, show dynamic success confirmation first
      setShowFinishedSplash(true);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleFinishAndRevealCard = () => {
    const formattedAnswers = SafeQuestions.map(q => ({
      questionId: q.id,
      questionText: q.text,
      answerText: tempAnswers[q.id] || ''
    }));
    onComplete(formattedAnswers);
  };

  return (
    <div id="survey-wizard-container" className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-md font-sans">
      <AnimatePresence mode="wait">
        {!showFinishedSplash ? (
          <motion.div
            key="wizard-steps"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Header / Survey title & Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                <span className="text-[#2bbba9] flex items-center gap-1">
                  <Sparkles size={11} className="animate-spin text-[#2bbba9]" />
                  Encuesta Mi Cafecito
                </span>
                <span>Pregunta {currentIdx + 1} de {totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center">
                <h3 className="text-base font-serif font-extrabold text-slate-900 line-clamp-1">{survey.title}</h3>
                {survey.reward && survey.reward !== 'Sin recompensa' && (
                  <span className="bg-[#2bbba9]/10 text-[#1b8c7c] border border-[#2bbba9]/20 font-sans text-[9px] font-black uppercase rounded-lg px-2 py-0.5 whitespace-nowrap">
                    🎁 Premia
                  </span>
                )}
              </div>
              
              {/* Progress Indicator line */}
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-[#2bbba9] to-[#20a392] transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Body */}
            <div className="space-y-4 py-2">
              <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest block">PREGUNTA:</span>
              <h4 className="text-sm font-bold text-slate-800 leading-snug">
                {currentQuestion.text}
              </h4>

              {/* Input Types */}
              {currentQuestion.type === 'multiple' ? (
                <div className="space-y-2 pt-1">
                  {currentQuestion.options?.map((opt, optIdx) => {
                    const isSelected = currentAnswer === opt;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all duration-150 flex justify-between items-center cursor-pointer ${
                          isSelected 
                            ? 'bg-[#2bbba9]/5 border-[#2bbba9] text-[#1b8c7c] shadow-sm font-bold scale-[1.01]' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50 hover:border-slate-300'
                        }`}
                      >
                        <span className="pr-4">{opt}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#2bbba9] flex items-center justify-center text-white shrink-0">
                            <Check size={12} className="stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <textarea
                    rows={4}
                    value={currentAnswer}
                    onChange={handleTextChange}
                    maxLength={1000}
                    placeholder="Escribe tu respuesta abierta aquí (sé sincero, tus comentarios nos ayudan muchísimo a mejorar)..."
                    className={`w-full bg-slate-50 hover:bg-slate-100/30 focus:bg-white border rounded-2xl p-4 text-xs font-medium outline-none transition-all leading-relaxed ${
                      isWordLimitExceeded 
                        ? 'border-red-400 focus:border-red-500 text-red-700' 
                        : 'border-slate-200 focus:border-[#2bbba9] text-slate-800'
                    }`}
                  />
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 italic">Límite de longitud: Max 100 palabras</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                      isWordLimitExceeded 
                        ? 'bg-red-50 text-red-650' 
                        : wordCount > 80 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-slate-100 text-slate-500'
                    }`}>
                      {wordCount} / 100 palabras
                    </span>
                  </div>
                  {isWordLimitExceeded && (
                    <p className="text-[10px] text-red-600 font-bold leading-normal pt-1">
                      ⚠️ Has excedido las 100 palabras autorizadas. Por favor, sé más conciso para poder registrar tu respuesta.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {currentIdx > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft size={13} /> Regresar
                </button>
              )}
              
              <button
                type="button"
                onClick={handleNext}
                disabled={isNextDisabled()}
                className={`flex-1 py-3 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isNextDisabled()
                    ? 'bg-slate-100 text-slate-400 border border-slate-205 cursor-not-allowed'
                    : 'bg-[#2bbba9] hover:bg-[#20a392] text-white'
                }`}
              >
                <span>{currentIdx === totalQuestions - 1 ? 'Finalizar Encuesta' : 'Siguiente Pregunta'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="wizard-finished-splash"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center space-y-6 py-4"
          >
            {/* Splash Logo */}
            <div className="mx-auto w-[68px] h-[68px] bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
              <Check size={36} className="stroke-[3] text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-serif font-black text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                ¡Muchas gracias, {customerName}!
              </h3>
              <p className="text-xs text-slate-500 leading-normal max-w-[280px] mx-auto">
                Tus respuestas han sido procesadas correctamente. Tus valiosos comentarios nos ayudan a ofrecerte siempre la mejor experiencia.
              </p>
            </div>

            {/* Voucher Reward Display Card */}
            {survey.reward && survey.reward !== 'Sin recompensa' ? (
              <div className="bg-[#2bbba9]/5 border border-[#2bbba9]/25 rounded-2xl p-4 max-w-[280px] mx-auto space-y-2 relative overflow-hidden flex flex-col items-center">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#2bbba9]/10 rounded-full blur-xl" />
                <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-[#2bbba9]/10 rounded-full blur-xl" />
                
                <div className="w-8 h-8 rounded-full bg-[#2bbba9] flex items-center justify-center text-white text-sm">
                  <Gift size={16} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#1b8c7c] uppercase font-bold tracking-widest block">RECOMPENSA DE FIDELIDAD</span>
                  <span className="text-xs font-extrabold text-[#11847a]">CUPÓN DESBLOQUEADO</span>
                  <h4 className="text-sm font-black text-slate-800 tracking-wide pt-1">{survey.reward}</h4>
                </div>
                <div className="w-full border-t border-[#2bbba9]/10 border-dashed my-1.5" />
                <p className="text-[10px] text-slate-400 font-sans leading-tight">
                  Se ha añadido automáticamente un nuevo ticket de cupón digital en la sección "Cupones" de tu tarjeta virtual.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 max-w-[280px] mx-auto text-[11px] text-slate-550 flex items-center gap-2 justify-center italic">
                <Ticket size={14} className="text-slate-400 shrink-0" />
                <span>Opinión registrada con éxito sin premio.</span>
              </div>
            )}

            {/* CTA to reveal card */}
            <button
              onClick={handleFinishAndRevealCard}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold rounded-2xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer max-w-[280px] mx-auto block"
            >
              🎉 Ver mi Tarjeta de Cliente
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
