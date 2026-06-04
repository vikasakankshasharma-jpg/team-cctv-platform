"use client";

import React, { useState } from "react";
import { Send, Bot, User, BrainCircuit, ThumbsUp, ThumbsDown, ImagePlus, X, Mic, MicOff } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  isFromStudent?: boolean;
  brainId?: string;
  feedbackGiven?: 1 | -1;
  image?: string;
}

export function ChatInterface({ pageContext, initialMessage }: { pageContext?: string, initialMessage?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: initialMessage || "Hello! I am the website AI. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
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
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;
    if (isLoading) return;

    const userMessage: Message = { role: "user", content: input, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          pageContext: pageContext || "unknown"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.content,
        isFromStudent: data.isFromStudent,
        brainId: data.brainId
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (msgIndex: number, rating: 1 | -1) => {
    const msg = messages[msgIndex];
    if (!msg.brainId || msg.feedbackGiven) return;

    // Optimistic UI update
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages[msgIndex] = { ...msg, feedbackGiven: rating };
      return newMessages;
    });

    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainId: msg.brainId, rating })
      });
    } catch (error) {
      console.error("Failed to send feedback", error);
    }
  };

  return (
    <div className="flex flex-col h-[500px] max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden font-sans">
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">Website Assistant</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-br-none" 
                : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-none"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {msg.role === "user" ? (
                  <User className="w-3 h-3 opacity-70" />
                ) : (
                  msg.isFromStudent ? (
                     <span title="Answered from Brain Cache (Student AI)"><BrainCircuit className="w-3 h-3 text-green-500" /></span>
                  ) : (
                     <span title="Generated by Master AI"><Bot className="w-3 h-3 text-blue-500" /></span>
                  )
                )}
                <span className="text-xs opacity-70">
                  {msg.role === "user" ? "You" : (msg.isFromStudent ? "Student AI" : "Master AI")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.image && (
                <img src={msg.image} alt="User upload" className="mt-2 rounded-lg max-w-full h-auto max-h-48 object-cover" />
              )}
              {msg.role === "assistant" && msg.brainId && (
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100/10">
                  <button 
                    onClick={() => handleFeedback(i, 1)}
                    disabled={!!msg.feedbackGiven}
                    className={`p-1 rounded transition-colors ${msg.feedbackGiven === 1 ? 'text-green-500' : 'text-gray-400 hover:text-green-500 hover:bg-gray-100 disabled:opacity-50'}`}
                    title="Good answer"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleFeedback(i, -1)}
                    disabled={!!msg.feedbackGiven}
                    className={`p-1 rounded transition-colors ${msg.feedbackGiven === -1 ? 'text-red-500' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 disabled:opacity-50'}`}
                    title="Bad answer"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm p-3 rounded-2xl rounded-bl-none">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="px-3 pt-2 bg-white relative inline-block">
          <div className="relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Upload Image"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <button 
          type="button"
          onClick={toggleListening}
          className={`p-2 rounded-full transition-colors shrink-0 ${isListening ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
          title="Voice Input"
        >
          {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
        </button>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
        />
        <button 
          type="submit" 
          disabled={(!input.trim() && !selectedImage) || isLoading}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
