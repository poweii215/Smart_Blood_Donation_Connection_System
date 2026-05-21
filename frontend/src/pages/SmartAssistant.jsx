import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, Calendar, HeartPulse, AlertTriangle, Award, Loader2 } from 'lucide-react';
import { chatbotService } from '../services/chatbot.service';

const defaultSuggestions = [
  { text: 'Lịch hẹn của tôi khi nào?', icon: Calendar },
  { text: 'Tôi có đủ điều kiện hiến máu không?', icon: HeartPulse },
  { text: 'Khi nào tôi được hiến lại?', icon: Calendar },
  { text: 'Bệnh viện đang cần nhóm máu nào?', icon: AlertTriangle },
  { text: 'Điểm nhân đạo và huy hiệu của tôi?', icon: Award },
];

export default function SmartAssistant() {
  const [messages, setMessages] = useState([
    {
      sender: 'BOT',
      message:
        'Xin chào, mình là Smart Assistant của SBDCs. Mình có thể trả lời dựa trên dữ liệu thật của bệnh viện như lịch hẹn, điều kiện hiến, thời gian đủ điều kiện và tình trạng khẩn cấp kho máu.',
    },
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState(defaultSuggestions.map((s) => s.text));
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [history, serverSuggestions] = await Promise.all([
          chatbotService.getHistory().catch(() => []),
          chatbotService.getSuggestions().catch(() => []),
        ]);
        if (history.length > 0) setMessages(history);
        if (serverSuggestions.length > 0) setSuggestions(serverSuggestions);
      } catch (err) {
        console.error(err);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text = input) => {
    const message = text.trim();
    if (!message || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'USER', message }]);
    setLoading(true);
    try {
      const res = await chatbotService.ask(message);
      setMessages((prev) => [...prev, { sender: 'BOT', message: res.answer, intent: res.intent }]);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Smart Assistant hiện chưa phản hồi được. Vui lòng thử lại.';
      setMessages((prev) => [...prev, { sender: 'BOT', message: detail }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestionIcon = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('lịch') || lower.includes('khi nào')) return Calendar;
    if (lower.includes('điều kiện')) return HeartPulse;
    if (lower.includes('cần') || lower.includes('máu')) return AlertTriangle;
    if (lower.includes('điểm') || lower.includes('huy hiệu')) return Award;
    return Sparkles;
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="rounded-3xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white shadow-lg shadow-red-100">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Bot className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Smart Assistant</h1>
            <p className="mt-1 text-sm text-red-50">
              Trợ lý tự động trả lời dựa trên lịch hẹn, kho máu, hồ sơ donor và dữ liệu Hospital.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-[620px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-black text-slate-900">Data-driven Rule-based Chatbot</h2>
            <p className="text-sm text-slate-500">Không dùng AI bên ngoài; câu trả lời lấy từ database nội bộ.</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'USER';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-red-600 text-white rounded-br-lg'
                        : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-lg'
                    }`}
                  >
                    <p>{msg.message}</p>
                    {msg.intent && !isUser && (
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Intent: {msg.intent}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-3xl rounded-bl-lg border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra dữ liệu...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t border-slate-100 p-4"
          >
            <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-red-300 focus-within:bg-white">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-slate-700 outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Send className="h-4 w-4" /> Gửi
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-600" />
              <h3 className="font-black text-slate-900">Câu hỏi nhanh</h3>
            </div>
            <div className="space-y-3">
              {suggestions.map((text) => {
                const Icon = suggestionIcon(text);
                return (
                  <button
                    key={text}
                    type="button"
                    onClick={() => sendMessage(text)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    {text}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm text-red-800">
            <h3 className="mb-2 font-black">Smart ở đâu?</h3>
            <p className="leading-relaxed">
              Bot nhận diện intent đơn giản, sau đó truy vấn dữ liệu thật như appointment, blood inventory, emergency mode,
              reliability score và last donation date để trả lời cho Donor.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
