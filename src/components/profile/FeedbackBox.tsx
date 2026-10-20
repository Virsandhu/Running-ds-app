import React, { useState } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { audioService } from '../../services/audioService';

// FormSubmit relays the message to this inbox; the first submission sends a one-time activation email
const FEEDBACK_ENDPOINT = 'https://formsubmit.co/ajax/vir.53.2028@doonschool.com';
const MAX_LENGTH = 2000;

type SendStatus = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

export const FeedbackBox: React.FC = () => {
  const { currentUser } = useZoneRush();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SendStatus>({ kind: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !currentUser) return;
    setStatus({ kind: 'sending' });

    try {
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `ZoneRush feedback from ${currentUser.fullName}`,
          _template: 'table',
          _captcha: 'false',
          // "name" and "email" identify the sender; replying to the email goes to them
          name: currentUser.fullName,
          email: currentUser.email,
          username: currentUser.username,
          runner_id: currentUser.id,
          sent_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          message: text,
        }),
      });
      const data: { success?: string | boolean; message?: string } = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) !== 'true') {
        throw new Error(data.message || 'Could not send feedback. Please try again.');
      }
      audioService.playTick();
      setMessage('');
      setStatus({ kind: 'sent' });
    } catch (err: unknown) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not send feedback.' });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#FC5200]">rate_review</span>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">Send Feedback</span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed font-sans -mt-1">
        Found a bug or have an idea? Your message goes straight to the ZoneRush developer, along with your name and email.
      </p>

      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          if (status.kind !== 'sending') setStatus({ kind: 'idle' });
        }}
        maxLength={MAX_LENGTH}
        rows={4}
        placeholder="Type your feedback here…"
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#FC5200] focus:ring-1 focus:ring-[#FC5200] transition-all bg-slate-50/50 resize-y"
      />

      {status.kind === 'sent' && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Thanks! Your feedback has been sent.</span>
        </div>
      )}
      {status.kind === 'error' && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{status.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-metric text-slate-400">
          {message.length}/{MAX_LENGTH}
        </span>
        <button
          type="submit"
          disabled={!message.trim() || status.kind === 'sending'}
          className="px-5 h-10 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white font-metric text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-[16px] ${status.kind === 'sending' ? 'animate-spin' : ''}`}>
            {status.kind === 'sending' ? 'progress_activity' : 'send'}
          </span>
          <span>{status.kind === 'sending' ? 'Sending' : 'Send'}</span>
        </button>
      </div>
    </form>
  );
};
