'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[#2a1b1b] blur-[140px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#1e2230] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.06),transparent_40%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-5 pb-6 pt-10">
        <header className="mb-6">
          <h1 className="mt-2 font-display text-3xl text-zinc-100">
            Ta Convocado?
          </h1>
          <p className="mt-3 max-w-xl text-sm text-zinc-400">
            Um chatbot para consultar se um jogador esta convocado, pre-convocado
            ou fora da selecao.
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 text-zinc-400">
              Digite uma mensagem para iniciar a conversa.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                  {m.role === 'user' ? 'voce' : 'assistente'}
                </p>
                <div
                  className={
                    m.role === 'user'
                      ? 'ml-auto w-fit max-w-[90%] rounded-2xl border border-zinc-700/60 bg-zinc-900/70 px-4 py-3 text-zinc-100 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)]'
                      : 'mr-auto w-fit max-w-[90%] rounded-2xl border border-zinc-800/80 bg-zinc-950/70 px-4 py-3 text-zinc-200 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)]'
                  }
                >
                  <div className="space-y-3 text-sm leading-relaxed">
                    {m.parts.map((part, i) => {
                      if (part.type === 'text') {
                        return <p key={i}>{part.text}</p>;
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex items-center gap-3 rounded-full border border-zinc-800/70 bg-zinc-950/70 px-4 py-2 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.9)]"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre a convocacao de um jogador..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? 'Enviando' : 'Enviar'}
          </button>
        </form>

        <div className="mt-6 border-t border-dashed border-zinc-800/70" />
      </div>
    </div>
  );
}
