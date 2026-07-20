import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Mic,
  MicOff,
  Send,
  Lightbulb,
  StopCircle,
  Bot,
  User as UserIcon,
  Loader2,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
} from 'lucide-react';
import { interviewService } from '@/services/interviewService';
import { companyService } from '@/services/companyService';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import type { Interview, Company } from '@/types';

// Minimal ambient type for the Web Speech API
interface SpeechRecognitionLike extends EventTarget {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export default function AIInterview() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedType, setSelectedType] = useState<'dsa' | 'hr' | 'system_design'>('dsa');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(!id);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('interviewai_voice_enabled') === 'true';
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Bootstrap: either load the active interview or load configuration settings.
  useEffect(() => {
    if (id) {
      setLoadingConfig(false);
      interviewService
        .get(id)
        .then((iv) => {
          setInterview(iv);
          prevLengthRef.current = iv.transcript.length;
        })
        .catch((err) => toast.error(err.message));
    } else {
      setLoadingConfig(true);
      companyService
        .list()
        .then(setCompanies)
        .catch(() => setCompanies([]))
        .finally(() => setLoadingConfig(false));
    }
  }, [id]);

  // Handle Speech Recognition (Speech to Text)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setVoiceSupported(true);
    const recognition: SpeechRecognitionLike = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  // Handle Speech Synthesis (Text to Speech) for new AI messages
  useEffect(() => {
    if (!interview || interview.status !== 'in_progress') return;
    const len = interview.transcript.length;
    if (len > prevLengthRef.current) {
      const lastEntry = interview.transcript[len - 1];
      if (lastEntry && lastEntry.speaker === 'ai' && voiceEnabled) {
        speakText(lastEntry.message);
      }
    }
    prevLengthRef.current = len;
  }, [interview?.transcript, voiceEnabled]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Remove code blocks from being spoken
      const cleanText = text.replace(/```[\s\S]*?```/g, '[code block omitted]');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find((v) => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    localStorage.setItem('interviewai_voice_enabled', String(next));
    if (!next && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    } else if (next && interview?.transcript?.length) {
      // Speak the last AI response if unmuting
      const lastAi = [...interview.transcript].reverse().find((t) => t.speaker === 'ai');
      if (lastAi) speakText(lastAi.message);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleStartInterview = async () => {
    setStarting(true);
    try {
      const iv = await interviewService.start(selectedType, selectedCompanyId || undefined);
      setInterview(iv);
      navigate(`/interview/${iv._id}`);
      
      // If voice enabled, speak the introductory message
      if (voiceEnabled && iv.transcript.length > 0) {
        speakText(iv.transcript[0].message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start interview');
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async (type: 'answer' | 'hint' = 'answer') => {
    if (!interview || (!input.trim() && type === 'answer')) return;
    setSending(true);
    try {
      const message = type === 'hint' ? 'Can I get a hint?' : input;
      const { interview: updated } = await interviewService.sendMessage(interview._id, message, type);
      setInterview(updated);
      setInput('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEnd = async () => {
    if (!interview) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      const ended = await interviewService.end(interview._id);
      toast.success('Interview complete — scoring your performance.');
      navigate(`/interview/${ended._id}/results`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to end interview');
    }
  };

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interview?.transcript?.length]);

  if (loadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-6 w-6 text-mint animate-spin" />
        <p className="text-sm text-ink-muted">Loading configuration…</p>
      </div>
    );
  }

  // Setup/Config Screen
  if (!id && !interview) {
    return (
      <div className="max-w-xl mx-auto space-y-6 py-6">
        <div>
          <h1 className="font-display text-2xl text-ink">AI Mock Interview</h1>
          <p className="text-sm text-ink-muted mt-1">Configure your mock interview session below.</p>
        </div>

        <Card className="space-y-6">
          <div className="space-y-3">
            <label className="label">Select Interview Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'dsa', name: 'Technical DSA', desc: 'Coding, algorithms & complexities' },
                { id: 'hr', name: 'HR & Behavioral', desc: 'Soft skills & situational questions' },
                { id: 'system_design', name: 'System Design', desc: 'Architecture, scaling & databases' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as any)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition-all ${
                    selectedType === t.id
                      ? 'border-mint bg-mint/5 text-ink'
                      : 'border-border bg-surface-raised text-ink-muted hover:border-border-hover'
                  }`}
                >
                  <span className={`text-xs font-semibold uppercase ${selectedType === t.id ? 'text-mint' : ''}`}>
                    {t.name}
                  </span>
                  <span className="text-xxs leading-relaxed mt-2">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="label">Target Company (Optional)</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="input text-sm"
            >
              <option value="">General (No company focus)</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised border border-border">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-ink">AI Voice (Text-to-Speech)</p>
              <p className="text-xxs text-ink-muted">Let the AI interviewer speak out loud</p>
            </div>
            <button
              onClick={toggleVoice}
              className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-colors ${
                voiceEnabled ? 'bg-mint/10 border-mint text-mint' : 'border-border text-ink-muted'
              }`}
            >
              {voiceEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
            </button>
          </div>

          <Button onClick={handleStartInterview} loading={starting} className="w-full py-2.5">
            <Sparkles className="h-4 w-4 mr-2" /> Start AI Interview
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl text-ink capitalize">{interview.type} Interview</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {interview.status === 'in_progress' ? 'Live — respond naturally, like a real interview' : 'Completed'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleVoice}
            className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-colors ${
              voiceEnabled ? 'bg-mint/10 border-mint/30 text-mint' : 'border-border text-ink-muted'
            }`}
            title={voiceEnabled ? 'Mute AI voice' : 'Unmute AI voice'}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {interview.status === 'in_progress' && (
            <Button variant="secondary" onClick={handleEnd}>
              <StopCircle className="h-4 w-4" /> End Interview
            </Button>
          )}
        </div>
      </div>

      <Card className="flex-1 overflow-y-auto !p-5 space-y-4 mb-4">
        {interview.transcript.map((entry, i) => (
          <div key={i} className={`flex gap-3 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                entry.speaker === 'ai' ? 'bg-signal/15 text-signal' : 'bg-mint/15 text-mint'
              }`}
            >
              {entry.speaker === 'ai' ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
            </div>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                entry.speaker === 'ai' ? 'bg-surface-raised text-ink' : 'bg-mint/10 text-ink border border-mint/20'
              }`}
            >
              {entry.message}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-signal/15 text-signal flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-surface-raised rounded-xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 text-ink-muted animate-spin" />
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </Card>

      {interview.status === 'in_progress' ? (
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend('answer');
                }
              }}
              placeholder="Explain your approach, or paste code…"
              rows={2}
              className="input resize-none flex-1"
            />
            {voiceSupported && (
              <button
                onClick={toggleListening}
                className={`h-11 w-11 shrink-0 rounded-lg flex items-center justify-center border transition-colors ${
                  listening
                    ? 'bg-difficulty-hard/10 border-difficulty-hard/40 text-difficulty-hard'
                    : 'border-border text-ink-muted hover:text-ink'
                }`}
                aria-label="Toggle voice input"
              >
                {listening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
              </button>
            )}
            <Button onClick={() => handleSend('answer')} loading={sending} className="h-11">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <button
            onClick={() => handleSend('hint')}
            disabled={sending}
            className="flex items-center gap-1.5 text-xs text-signal hover:underline disabled:opacity-50"
          >
            <Lightbulb className="h-3.5 w-3.5" /> Ask for a hint
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-ink-muted">
          This interview has ended.{' '}
          <button onClick={() => navigate(`/interview/${interview._id}/results`)} className="text-mint hover:underline">
            View results
          </button>
        </p>
      )}
    </div>
  );
}
