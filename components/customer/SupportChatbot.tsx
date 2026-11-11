"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Wrench, ShieldCheck, Video, Mic, MicOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { SPEECH_LOCALE_MAP, languageNames } from "@/lib/i18n/mapping";

export function SupportChatbot() {
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(() => [
    { role: "assistant", content: t("sup_bot_welcome") }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((prev) => [...prev, { role: "assistant", content: t("ai_voice_unsupported") }]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = SPEECH_LOCALE_MAP[locale] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((res: any) => res[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: t("sup_bot_welcome") }];
      }
      return prev;
    });
  }, [locale]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMsg }],
          pageContext: "/customer/dashboard",
          locale: locale
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: t("sup_bot_server_err") }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: t("sup_bot_conn_err") }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (text: string) => {
    setInput(text);
    // Use setTimeout to allow the state to update before sending
    setTimeout(() => {
      document.getElementById("chatbot-send-btn")?.click();
    }, 50);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? "bg-zinc-800 rotate-90" : "bg-blue-600 hover:bg-blue-700 hover:scale-110"}`}
        >
          {isOpen ? <X className="text-white w-6 h-6" /> : <MessageSquare className="text-white w-6 h-6" />}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] z-50 shadow-2xl flex flex-col border-border/50 animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-blue-600 rounded-t-xl text-white py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" /> 
              {t("sup_bot_title")}
            </CardTitle>
            <p className="text-xs text-blue-100 opacity-90">{t("sup_bot_subtitle")}</p>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white dark:bg-zinc-800 border border-border/50 shadow-sm rounded-bl-none"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-800 border border-border/50 shadow-sm rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
          </CardContent>
          
          <div className="px-4 pb-2 pt-2 bg-white dark:bg-zinc-950 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button onClick={() => handleQuickAction(t("sup_bot_q_dvr"))} className="text-xs bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-full flex items-center gap-1"><Wrench className="w-3 h-3 text-red-500"/> {t("sup_bot_pill_dvr")}</button>
            <button onClick={() => handleQuickAction(t("sup_bot_q_app"))} className="text-xs bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-full flex items-center gap-1"><Video className="w-3 h-3 text-blue-500"/> {t("sup_bot_pill_app")}</button>
            <button onClick={() => handleQuickAction(t("sup_bot_q_amc"))} className="text-xs bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500"/> {t("sup_bot_pill_amc")}</button>
          </div>

          <CardFooter className="p-3 bg-white dark:bg-zinc-950 border-t border-border">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex w-full items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t("sup_bot_placeholder")}
                className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                aria-label={t("ai_voice_input", { lang: languageNames[locale] || locale })}
                title={t("ai_voice_input", { lang: languageNames[locale] || locale })}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors border ${
                  isListening
                    ? "bg-red-500 text-white border-red-500 animate-pulse"
                    : "bg-muted/60 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                id="chatbot-send-btn"
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
