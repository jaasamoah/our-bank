import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createPublicSupportRequest } from '../services/api';

const PublicSupportWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      await createPublicSupportRequest({ name, email, subject, message });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setNotice('Thanks. Your request is with the telosbank team.');
    } catch {
      setNotice('We could not send that request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[min(calc(100vw-2rem),23rem)] rounded-3xl border border-blue-100 bg-white p-5 text-left shadow-2xl shadow-blue-950/20 sm:right-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-950">Talk to telosbank</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Leave a request and our team will follow up.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-700" aria-label="Close chat">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What can we help with?" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us a little more" rows={4} required className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            {notice && <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">{notice}</p>}
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60">
              {submitting ? 'Sending request' : 'Send request'}
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-xl shadow-blue-900/25 transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:right-8"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleLeftRightIcon className="h-6 w-6" />}
      </button>
    </>
  );
};

export default PublicSupportWidget;