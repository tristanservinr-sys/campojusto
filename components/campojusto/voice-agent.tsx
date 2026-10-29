'use client';
import { createElement, useEffect, useState } from 'react';
import { MessageCircle, RotateCcw } from 'lucide-react';

const AGENT_ID = 'agent_7701m64pv4r2e1pvf18txwqdy00c';
const SCRIPT_ID = 'campojusto-elevenlabs-widget';
const SCRIPT_URL = 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.22.2';

export default function VoiceAgent() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const ready = () => {
      window.customElements.whenDefined('elevenlabs-convai').then(() => {
        if (active) { clearTimeout(timer); setStatus('ready'); }
      });
    };
    const fail = () => { if (active) setStatus('error'); };
    if (window.customElements.get('elevenlabs-convai')) {
      setStatus('ready');
      return;
    }
    setStatus('loading');
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (attempt && script) { script.remove(); script = null; }
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.addEventListener('load', ready);
      script.addEventListener('error', fail);
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', ready);
      script.addEventListener('error', fail);
      ready();
    }
    timer = setTimeout(fail, 20000);
    return () => {
      active = false;
      clearTimeout(timer);
      script?.removeEventListener('load', ready);
      script?.removeEventListener('error', fail);
    };
  }, [attempt]);

  return <>
    {status === 'ready' && createElement('elevenlabs-convai', {
      'agent-id': AGENT_ID,
      'action-text': 'Asistente CampoJusto',
      'start-call-text': 'Hablar',
      'end-call-text': 'Terminar',
      'expand-text': 'Abrir asistente',
      'listening-text': 'Te escucho…',
      'speaking-text': 'Hablando…',
      'dismissible': 'true',
    })}
    {status === 'error' && <button className="agent-retry" onClick={() => setAttempt(n => n + 1)} aria-label="Reintentar cargar el asistente de CampoJusto"><MessageCircle size={18}/><span>Reintentar asistente</span><RotateCcw size={14}/></button>}
  </>;
}
