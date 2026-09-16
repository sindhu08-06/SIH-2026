import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  Award,
  Users,
  Building2,
  ShieldCheck,
  Eye,
  Info,
} from 'lucide-react';
import { AccessibleQuestion, getAccessibleQuestions } from '../../data/accessibleSkillQuestions';
import { Language } from '../../types';

interface AccessibleSkillQuizProps {
  trade: string;
  workerName?: string;
  initialLang?: Language;
  onComplete: (scorePercentage: number, passed: boolean) => void;
  onCancel?: () => void;
}

export const AccessibleSkillQuiz: React.FC<AccessibleSkillQuizProps> = ({
  trade,
  workerName = 'Artisan',
  initialLang = 'hi',
  onComplete,
  onCancel,
}) => {
  // Mode: 'voice_visual' (default for low literacy) or 'assisted_offline' (Sanstha Sahayak verification)
  const [examMode, setExamMode] = useState<'voice_visual' | 'assisted_sanstha'>('voice_visual');
  const [selectedLang, setSelectedLang] = useState<'hi' | 'mr' | 'en'>(
    initialLang === 'mr' ? 'mr' : initialLang === 'en' ? 'en' : 'hi'
  );

  const questions = getAccessibleQuestions(trade);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Assisted In-Person Sanstha Mode State
  const [sansthaOfficerName, setSansthaOfficerName] = useState('Shri Ramesh Jadhav (Ward 14 Sanstha Sahayak)');
  const [sansthaOfficeName, setSansthaOfficeName] = useState('Pune Central Urban Workers Primary Co-op Society');
  const [practicalOralNotes, setPracticalOralNotes] = useState('Worker demonstrated practical wiring on board in co-op workshop. Correctly identified phase vs neutral, wore insulated shoes, zero safety errors.');
  const [oralPassConfirmed, setOralPassConfirmed] = useState(true);

  const currentQ = questions[currentIndex];
  const selectedOption = answers[currentQ.id];
  const isAnswered = selectedOption !== undefined;
  const isCorrect = selectedOption === currentQ.correctIndex;

  // Web Speech Synthesis (Read Aloud)
  const speakQuestion = (q: AccessibleQuestion, langCode: 'hi' | 'mr' | 'en') => {
    if (!('speechSynthesis' in window)) {
      setVoiceNotice('Voice narration is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = q.audioPromptText[langCode] || q.audioPromptText.hi;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Pick best voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetTag = langCode === 'hi' ? 'hi-IN' : langCode === 'mr' ? 'mr-IN' : 'en-IN';
    const foundVoice = voices.find((v) => v.lang.includes(targetTag) || v.lang.startsWith(langCode));
    if (foundVoice) {
      utterance.voice = foundVoice;
    }
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceNotice(
        langCode === 'mr'
          ? 'प्रश्न ऐकत आहे...'
          : langCode === 'hi'
          ? 'सवाल सुनाया जा रहा है...'
          : 'Reading question aloud...'
      );
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceNotice(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setVoiceNotice(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceNotice(null);
    }
  };

  // Auto-play audio when question changes in voice mode
  useEffect(() => {
    if (examMode === 'voice_visual') {
      const timer = setTimeout(() => {
        speakQuestion(currentQ, selectedLang);
      }, 350);
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [currentIndex, selectedLang, examMode]);

  // Voice recognition (Speech to Answer)
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Microphone speech-to-text not available on this device. Please tap the picture card.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang === 'mr' ? 'mr-IN' : selectedLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice(
          selectedLang === 'mr'
            ? 'ऐकत आहे... "एक", "दोन" किंवा "तीन" बोला'
            : selectedLang === 'hi'
            ? 'सुन रहे हैं... "पहला", "दूसरा" या "तीसरा" बोलें'
            : 'Listening... Speak "Option 1", "Option 2", or "Option 3"'
        );
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setIsListening(false);
        setVoiceNotice(`Detected: "${transcript}"`);

        // Check for 1, 2, 3 or keywords
        if (
          transcript.includes('1') ||
          transcript.includes('एक') ||
          transcript.includes('पहला') ||
          transcript.includes('one') ||
          transcript.includes('first')
        ) {
          handleSelectOption(0);
        } else if (
          transcript.includes('2') ||
          transcript.includes('दोन') ||
          transcript.includes('दूसरा') ||
          transcript.includes('two') ||
          transcript.includes('second')
        ) {
          handleSelectOption(1);
        } else if (
          transcript.includes('3') ||
          transcript.includes('तीन') ||
          transcript.includes('तीसरा') ||
          transcript.includes('three') ||
          transcript.includes('third')
        ) {
          handleSelectOption(2);
        } else {
          setVoiceNotice(`Could not match "${transcript}". Please tap the picture directly.`);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      setVoiceNotice('Microphone error. Please tap the card.');
    }
  };

  const handleSelectOption = (optIdx: number) => {
    stopSpeaking();
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
  };

  // Calculate final score
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

  const handleFinishQuiz = () => {
    stopSpeaking();
    if (examMode === 'assisted_sanstha') {
      // In assisted mode, Sanstha Sahayak confirms practical competency
      onComplete(100, true);
    } else {
      const passed = scorePercentage >= 66;
      onComplete(scorePercentage, passed);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-5">
      {/* Mode Switcher: Voice-Visual or Sanstha In-Person Verification */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-teal-100 text-teal-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900">
              {trade} Trade Competency Check
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Designed for all literacy levels • Audio read-aloud & visual picture cards
          </p>
        </div>

        {/* Exam Delivery Pathway Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setExamMode('voice_visual');
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              examMode === 'voice_visual'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice & Picture Mode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setExamMode('assisted_sanstha');
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              examMode === 'assisted_sanstha'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Sanstha Helpdesk (In-Person)</span>
          </button>
        </div>
      </div>

      {/* VOICE & VISUAL PICTURE MODE */}
      {examMode === 'voice_visual' && (
        <div className="space-y-4">
          {/* Language Selector & Audio Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900">Voice Language:</span>
              <div className="flex gap-1">
                {(['mr', 'hi', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      setSelectedLang(l);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                      selectedLang === l
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {l === 'mr' ? 'मराठी' : l === 'hi' ? 'हिंदी' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Read Aloud & Voice Input buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speakQuestion(currentQ, selectedLang);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-white text-teal-800 border border-teal-300 hover:bg-teal-50'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-teal-700" />}
                <span>{isSpeaking ? 'Stop Voice' : 'Read Aloud (ऐका)'}</span>
              </button>

              <button
                type="button"
                onClick={startListening}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isListening
                    ? 'bg-amber-500 text-white animate-ping'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                }`}
                title="Speak your answer (Number 1, 2, or 3)"
              >
                <Mic className={`w-4 h-4 ${isListening ? 'text-white' : 'text-slate-600'}`} />
                <span>{isListening ? 'Listening...' : 'Speak Answer'}</span>
              </button>
            </div>
          </div>

          {/* Voice Prompt Notification Toast */}
          {voiceNotice && (
            <div className="p-2.5 rounded-xl bg-slate-900 text-teal-300 text-xs flex items-center gap-2 animate-fade-in font-medium">
              <Info className="w-4 h-4 shrink-0 text-teal-400" />
              <span>{voiceNotice}</span>
            </div>
          )}

          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <div className="flex gap-1.5">
              {questions.map((q, idx) => {
                const isAns = answers[q.id] !== undefined;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      setCurrentIndex(idx);
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentIndex === idx
                        ? 'bg-teal-700 text-white ring-2 ring-teal-400'
                        : isAns
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Question Card with Large Clear Typography & Audio Button */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white space-y-3 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {currentQ.conceptTag}
                </span>
                <h4 className="text-base sm:text-lg font-black text-white leading-snug">
                  {selectedLang === 'mr'
                    ? currentQ.questionMarathi
                    : selectedLang === 'hi'
                    ? currentQ.questionHindi
                    : currentQ.question}
                </h4>
                {selectedLang !== 'en' && (
                  <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-700/60">
                    {currentQ.question}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => speakQuestion(currentQ, selectedLang)}
                className="p-2.5 rounded-xl bg-teal-600/80 hover:bg-teal-500 text-white shrink-0 shadow transition cursor-pointer"
                title="Tap to listen again"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Visual Picture / Icon Answer Cards (Large, Tap-Friendly Targets) */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span>Tap the correct picture below:</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.visualOptions.map((opt, optIdx) => {
                const isThisChosen = selectedOption === optIdx;
                const isThisTheCorrectAnswer = optIdx === currentQ.correctIndex;

                let borderStyle = 'border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50';
                if (isAnswered) {
                  if (isThisChosen && isCorrect) {
                    borderStyle = 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400 shadow-sm';
                  } else if (isThisChosen && !isCorrect) {
                    borderStyle = 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 shadow-sm';
                  } else if (isThisTheCorrectAnswer) {
                    borderStyle = 'border-emerald-300 bg-emerald-50/50';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-4 rounded-2xl border-2 text-left transition flex items-center justify-between gap-4 cursor-pointer active:scale-[0.99] ${borderStyle}`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Big Visual Icon Indicator */}
                      <span className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 shadow-2xs border border-slate-200">
                        {opt.icon}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          {opt.text}
                        </div>
                        {opt.badge && (
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              optIdx === currentQ.correctIndex
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAnswered && isThisChosen && (
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${
                            isCorrect ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        >
                          {isCorrect ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                      )}
                      {!isAnswered && (
                        <span className="text-xs font-bold text-slate-400 border border-slate-300 rounded-full w-6 h-6 flex items-center justify-center">
                          {optIdx + 1}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation in Selected Language after answering */}
          {isAnswered && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-950 mb-0.5">
                  {isCorrect ? 'Correct! Adheres to Safety Protocol' : 'Verified Cooperative Safety Standard:'}
                </div>
                <div className="text-slate-700 leading-relaxed">
                  {selectedLang === 'mr'
                    ? currentQ.explanation.mr
                    : selectedLang === 'hi'
                    ? currentQ.explanation.hi
                    : currentQ.explanation.en}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => {
                stopSpeaking();
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
            >
              Previous Question
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={answeredCount < totalQuestions}
                onClick={handleFinishQuiz}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit & Verify Score ({scorePercentage}%)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ASSISTED OFFLINE SANSTHA / COOPERATIVE HELPDESK MODE */}
      {examMode === 'assisted_sanstha' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <Building2 className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-teal-950 text-sm">
                  Primary Cooperative Society (Sanstha Sahayak) Assisted Verification
                </h4>
                <p className="text-teal-800 text-[11px] leading-relaxed mt-1">
                  For artisans who cannot read or operate smartphones comfortably. The worker visits their local Ward or Taluka Cooperative Sanstha office, where a designated Sahayak conducts an oral and hands-on tool demonstration.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Conducting Sanstha Officer / Mentor Artisan *
              </label>
              <input
                type="text"
                value={sansthaOfficerName}
                onChange={(e) => setSansthaOfficerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                placeholder="Name of Sanstha Representative"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Primary Society / Federation Branch Office *
              </label>
              <input
                type="text"
                value={sansthaOfficeName}
                onChange={(e) => setSansthaOfficeName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                placeholder="Cooperative Branch / Ward Office"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Oral Interview & Practical Tool Demonstration Notes *
            </label>
            <textarea
              rows={3}
              value={practicalOralNotes}
              onChange={(e) => setPracticalOralNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
              placeholder="Record worker's practical demonstration results..."
            />
          </div>

          {/* Practical Checkpoint Badges */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 text-xs">Standard Practical Checkpoints Tested:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-emerald-800 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Identified Phase, Neutral & Earth wires correctly</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Demonstrated zero-power safety check with neon tester</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Knows mandated wire gauges for high-power geyser/AC</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pledged to wear insulated safety footwear on all jobs</span>
              </div>
            </div>
          </div>

          {/* Officer Attestation */}
          <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 cursor-pointer">
            <input
              type="checkbox"
              checked={oralPassConfirmed}
              onChange={(e) => setOralPassConfirmed(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 mt-0.5"
            />
            <div>
              <div className="font-bold text-teal-950 text-xs">Sanstha Sahayak Officer Endorsement</div>
              <div className="text-[11px] text-teal-800 mt-0.5">
                I hereby attest that artisan <strong>{workerName}</strong> has appeared in person at our cooperative office and passed the practical oral skill inspection in Marathi/Hindi.
              </div>
            </div>
          </label>

          <div className="flex gap-2 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              type="button"
              disabled={!oralPassConfirmed || !sansthaOfficerName.trim()}
              onClick={handleFinishQuiz}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-98 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approve & Certify Worker via Sanstha Sahayak Route</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
