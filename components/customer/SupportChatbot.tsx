"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Wrench, ShieldCheck, Video } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I am your AI Tech Support Assistant. Is your CCTV system giving you trouble, or do you have a question about your AMC plan?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          locale: "en"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am having trouble connecting to the support server right now." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
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
              Smart Support
            </CardTitle>
            <p className="text-xs text-blue-100 opacity-90">AI Technician trained on TEAM CCTV manuals</p>
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
            <button onClick={() => handleQuickAction("Why is my DVR beeping?")} className="text-xs bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-full flex items-center gap-1"><Wrench className="w-3 h-3 text-red-500"/> DVR Beeping</button>
            <button onClick={() => handleQuickAction("Can't view cameras on my phone")} className="text-xs bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-full flex items-center gap-1"><Video className="w-3 h-3 text-blue-500"/> App Offline</button>
            <button onClick={() => handleQuickAction("How do I renew my AMC?")} className="text-xs bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500"/> AMC Renewal</button>
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
                placeholder="Ask a technical question..."
                className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
              <button
                id="chatbot-send-btn"
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors"
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
