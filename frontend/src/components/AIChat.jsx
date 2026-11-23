import React, { useState } from 'react';
import { stockAPI } from '../services/api';
import { Bot, Send, RefreshCw, BookOpen } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'What is the current trend for ^NSEI?',
  'Explain RSI (14) in simple terms.',
  'How does MACD measure momentum?',
  'Compare SMA 20 and SMA 50 signals.',
];

export const AIChat = ({ symbol = '^NSEI' }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: `Welcome to the BULLSIGHT Market Assistant. Ask about observed price action, technical indicators (RSI, MACD, SMA 20/50), or next-session ML inference status for ${symbol}.`,
      time: 'Ready',
      sources: ['Technical Indicator Engine', 'Market Price Feed'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await stockAPI.askAIChat(textToSend, symbol);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources || [],
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Live market data or AI assistant response is currently unavailable. Please retry.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bull-card p-5 sm:p-6 flex flex-col h-[560px] justify-between space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[rgba(125,160,255,0.16)]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4D8DFF]/15 border border-[#4D8DFF]/30 text-[#38D9F5] flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFF] font-display">BULLSIGHT Market Assistant</h3>
            <p className="text-[11px] text-[#7B8AA8] font-mono">Quantitative &amp; Technical Indicator Insights</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-[#31E981]">{symbol}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-[#10182B] text-[#AAB7D0] border border-[rgba(125,160,255,0.16)] hover:text-[#38D9F5] hover:border-[#38D9F5]/40 transition-all text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#4D8DFF] to-[#38D9F5] text-[#070B1A] font-semibold rounded-br-none shadow-blueGlow'
                  : 'bg-[#10182B] text-[#F8FAFF] border border-[rgba(125,160,255,0.18)] rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[rgba(125,160,255,0.14)] text-[10px] text-[#7B8AA8] flex flex-wrap items-center gap-1.5 font-mono">
                  <BookOpen className="w-3 h-3 text-[#31E981] shrink-0" />
                  <span>Sources: {msg.sources.join(' · ')}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#10182B] border border-[rgba(125,160,255,0.18)] rounded-2xl p-3 text-xs text-[#AAB7D0] flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#38D9F5]" />
              <span>Analyzing technical summary for {symbol}...</span>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 pt-2 border-t border-[rgba(125,160,255,0.16)]"
      >
        <input
          type="text"
          placeholder="Ask about price trends, RSI, MACD, or moving averages..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 bg-[#10182B] border border-[rgba(125,160,255,0.2)] rounded-xl px-3.5 py-2.5 text-xs text-[#F8FAFF] placeholder-[#7B8AA8] focus:outline-none focus:border-[#38D9F5] transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A] font-bold hover:shadow-bullGlow disabled:opacity-50 transition-all flex items-center justify-center"
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
