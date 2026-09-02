import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createComplaint } from '../services/api';

const SupportWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setNotice('');
    try {
      await createComplaint({ subject, message });
      setSubject('');
      setMessage('');
      setNotice('Your request has been sent to our support team.');
    } catch {
      setNotice('We could not send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-40 w-[min(calc(100vw-2rem),22rem)] rounded-2xl border border-slate-100 bg-white p-5 shadow-xl sm:right-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Contact support</p>
              <p className="mt-1 text-xs text-slate-500">Tell us how we can help.</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close support">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue" rows={4} required className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            {notice && <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">{notice}</p>}
            <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {submitting ? 'Sending…' : 'Send request'}
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-700/25 transition hover:bg-brand-800 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:right-8"
        aria-label={open ? 'Close support' : 'Contact support'}
      >
        {open ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleLeftRightIcon className="h-6 w-6" />}
      </button>
    </>
  );
};

export default SupportWidget;