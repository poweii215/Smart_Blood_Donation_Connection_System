import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Calendar,
  HeartPulse,
  AlertTriangle,
  Award,
  Loader2,
  ClipboardList,
  FileText,
  Utensils,
  HelpCircle,
} from "lucide-react";
import { chatbotService } from "../services/chatbot.service";
import { authService } from "../services/auth.service";
import { getLanguageForUser, useI18n } from "../utils/userSettings";

const suggestionSets = {
  vi: [
    { text: "Quy trình đăng ký hiến máu ra sao?", icon: ClipboardList },
    { text: "Tôi cần chuẩn bị gì trước khi hiến máu?", icon: Utensils },
    { text: "Khi đến hiến máu cần mang giấy tờ gì?", icon: FileText },
    { text: "Lịch hẹn của tôi khi nào?", icon: Calendar },
    { text: "Tôi có đủ điều kiện hiến máu không?", icon: HeartPulse },
    { text: "Khi nào tôi được hiến lại?", icon: Calendar },
    { text: "Bệnh viện đang cần nhóm máu nào?", icon: AlertTriangle },
    { text: "Sau khi hiến máu cần lưu ý gì?", icon: HeartPulse },
    { text: "Nếu chưa biết nhóm máu thì sao?", icon: HelpCircle },
    { text: "Các trạng thái lịch hẹn có ý nghĩa gì?", icon: ClipboardList },
    { text: "Thông tin bệnh viện ở đâu?", icon: FileText },
    { text: "Điểm nhân đạo và huy hiệu của tôi?", icon: Award },
  ],
  en: [
    { text: "How do I register to donate blood?", icon: ClipboardList },
    { text: "What should I prepare before donating?", icon: Utensils },
    { text: "What documents should I bring?", icon: FileText },
    { text: "When is my appointment?", icon: Calendar },
    { text: "Am I eligible to donate blood?", icon: HeartPulse },
    { text: "When can I donate again?", icon: Calendar },
    { text: "Which blood types does the hospital need?", icon: AlertTriangle },
    { text: "What should I do after donation?", icon: HeartPulse },
    { text: "What if I do not know my blood type?", icon: HelpCircle },
    { text: "What do appointment statuses mean?", icon: ClipboardList },
    { text: "Where is the hospital information?", icon: FileText },
    { text: "What are my humanitarian points and badges?", icon: Award },
  ],
};

export default function SmartAssistant() {
  const user = authService.getCurrentUser();
  const tr = useI18n(user);
  const lang = getLanguageForUser(user);
  const defaultSuggestions = suggestionSets[lang] || suggestionSets.vi;
  const [messages, setMessages] = useState([
    {
      sender: "BOT",
      message: tr("assistantWelcome"),
    },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState(
    defaultSuggestions.map((s) => s.text),
  );
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setSuggestions(defaultSuggestions.map((s) => s.text));
  }, [lang]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [history, serverSuggestions] = await Promise.all([
          chatbotService.getHistory().catch(() => []),
          chatbotService.getSuggestions().catch(() => []),
        ]);
        if (history.length > 0) setMessages(history);
        if (serverSuggestions.length > 0 && lang === "vi")
          setSuggestions(serverSuggestions);
      } catch (err) {
        console.error(err);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text = input) => {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { sender: "USER", message }]);
    setLoading(true);
    try {
      const res = await chatbotService.ask(message);
      setMessages((prev) => [
        ...prev,
        { sender: "BOT", message: res.answer, intent: res.intent },
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail || tr("assistantError");
      setMessages((prev) => [...prev, { sender: "BOT", message: detail }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestionIcon = (text) => {
    const lower = text.toLowerCase();
    if (
      lower.includes("quy trình") ||
      lower.includes("trạng thái") ||
      lower.includes("register") ||
      lower.includes("status")
    )
      return ClipboardList;
    if (
      lower.includes("giấy tờ") ||
      lower.includes("bệnh viện") ||
      lower.includes("document") ||
      lower.includes("hospital")
    )
      return FileText;
    if (
      lower.includes("chuẩn bị") ||
      lower.includes("ăn") ||
      lower.includes("uống") ||
      lower.includes("prepare") ||
      lower.includes("eat") ||
      lower.includes("drink")
    )
      return Utensils;
    if (
      lower.includes("lịch") ||
      lower.includes("khi nào") ||
      lower.includes("appointment") ||
      lower.includes("when")
    )
      return Calendar;
    if (
      lower.includes("điều kiện") ||
      lower.includes("sau khi hiến") ||
      lower.includes("eligible") ||
      lower.includes("after donation")
    )
      return HeartPulse;
    if (
      lower.includes("cần") ||
      lower.includes("máu") ||
      lower.includes("need") ||
      lower.includes("blood")
    )
      return AlertTriangle;
    if (
      lower.includes("điểm") ||
      lower.includes("huy hiệu") ||
      lower.includes("point") ||
      lower.includes("badge")
    )
      return Award;
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
            <h1 className="text-3xl font-black tracking-tight">
              {tr("smartAssistantTitle")}
            </h1>
            <p className="mt-1 text-sm text-red-50">{tr("assistantDesc")}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex h-[calc(100vh-220px)] min-h-[560px] flex-col assistant-card rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-black text-slate-900">
              {tr("dataDrivenChatbot")}
            </h2>
            <p className="text-sm text-slate-500">{tr("noExternalAi")}</p>
          </div>

          <div className="assistant-chat-scroll flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 pr-3">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "USER";
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-red-600 text-white rounded-br-lg"
                        : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-lg"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.message}</p>
                    {!isUser && msg.sender === "BOT" && (
                      <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500">
                        💬 Nếu cần thêm thông tin chi tiết, vui lòng liên hệ
                        bệnh viện hoặc nhân viên y tế.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-3xl rounded-bl-lg border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 px-5 py-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />{" "}
                  {tr("checkingData")}
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
                placeholder={tr("askQuestion")}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-slate-700 outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Send className="h-4 w-4" /> {tr("send")}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2">
          <div className="assistant-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-600" />
              <h3 className="font-black text-slate-900">
                {tr("quickQuestions")}
              </h3>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {suggestions.map((text) => {
                const Icon = suggestionIcon(text);
                return (
                  <button
                    key={text}
                    type="button"
                    onClick={() => sendMessage(text)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    {text}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm text-red-800">
            <h3 className="mb-2 font-black">{tr("whereSmart")}</h3>
            <p className="leading-relaxed">{tr("smartAssistantExplanation")}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
