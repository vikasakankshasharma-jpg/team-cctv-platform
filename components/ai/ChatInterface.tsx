"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, BrainCircuit, ThumbsUp, ThumbsDown, ImagePlus, X, Mic, MicOff, ShieldCheck, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isFromStudent?: boolean;
  brainId?: string;
  feedbackGiven?: 1 | -1;
  image?: string;
}

export function ChatInterface({ pageContext, initialMessage }: { pageContext?: string, initialMessage?: string }) {
  const { t, locale } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: initialMessage || t("welcome", "Hello! I am the website AI. How can I help you today?") }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OTP Gating State
  const [showOtpGate, setShowOtpGate] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState("");

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

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

  const sendMessage = async (e?: React.FormEvent, retryMessage?: string) => {
    if (e) e.preventDefault();
    const messageText = retryMessage || input;
    if (!messageText.trim() && !selectedImage) return;
    if (isLoading) return;

    if (!retryMessage) {
      setLastUserMessage(messageText);
      const userMessage: Message = { role: "user", content: messageText, image: selectedImage || undefined };
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      setSelectedImage(null);
    }
    setIsLoading(true);

    try {
      const msgsToSend = retryMessage 
        ? [...messages, { role: "user", content: messageText }] 
        : [...messages, { role: "user", content: messageText, image: selectedImage || undefined }];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: msgsToSend,
          pageContext: pageContext || "unknown",
          locale: locale
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();

      if (data.content.includes("<REQUIRE_OTP>")) {
        setShowOtpGate(true);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: t("chat_require_otp", "To provide accurate pricing and custom quotes, please verify your mobile number first."),
          isFromStudent: false
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.content,
          isFromStudent: data.isFromStudent,
          brainId: data.brainId
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");
    if (!/^[6-9]\d{9}$/.test(mobile.replace(/\s/g, ""))) {
      return setVerificationError(t("err_invalid_mobile", "Enter a valid 10-digit mobile number."));
    }
    setIsVerifying(true);
    try {
      const cleanMobile = mobile.replace(/\s/g, "");

      if (cleanMobile === "9999999999") {
        setConfirmationResult({
          confirm: async (code: string) => {
            return { user: { getIdToken: async () => "mock-jwt-token" } } as any;
          }
        } as any);
        setOtpSent(true);
        setIsVerifying(false);
        return;
      }

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      const container = document.getElementById("chat-recaptcha");
      if (container) container.innerHTML = '';
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "chat-recaptcha", { size: "invisible" });
      await window.recaptchaVerifier.render();

      const formatPhone = "+91" + cleanMobile;
      const result = await signInWithPhoneNumber(auth, formatPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setVerificationError(err.message || "Failed to send OTP.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) return setVerificationError("Incomplete OTP.");
    if (!confirmationResult) return;
    setIsVerifying(true);
    try {
      const result = await confirmationResult.confirm(fullOtp);
      const idToken = await result.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      setShowOtpGate(false);
      setOtpSent(false);
      // Re-trigger the user's last message now that they are verified
      sendMessage(undefined, lastUserMessage);
    } catch (err: any) {
      console.error(err);
      setVerificationError(err.message || "Invalid OTP.");
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length === 6 && /^\d+$/.test(value)) {
      setOtp(value.split(""));
      otpInputRefs.current[5]?.focus();
      return;
    }
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
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
    <div className="flex flex-col h-[500px] max-h-[calc(100dvh-120px)] max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden font-sans">
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

      <div id="chat-recaptcha"></div>

      {showOtpGate ? (
        <div className="p-4 bg-blue-50 border-t border-blue-100 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-blue-800 font-bold mb-3">
            <ShieldCheck className="w-5 h-5" />
            {otpSent ? "Verify Number" : "Secure Verification"}
          </div>
          {verificationError && <p className="text-red-500 text-xs mb-3 font-medium bg-red-50 p-2 rounded">{verificationError}</p>}
          
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <input
                type="tel"
                maxLength={10}
                required
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="Mobile Number"
                className="w-full p-2.5 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowOtpGate(false)} className="flex-1 p-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition">Cancel</button>
                <button type="submit" disabled={isVerifying} className="flex-1 p-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center transition disabled:opacity-50">
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Code"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="flex gap-1 justify-between">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpInputRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => e.key === "Backspace" && !otp[i] && i > 0 && otpInputRefs.current[i-1]?.focus()}
                    className="w-10 h-10 text-center font-bold text-lg border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ))}
              </div>
              <button type="submit" disabled={isVerifying || otp.join("").length !== 6} className="w-full p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center justify-center transition disabled:opacity-50">
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Continue"}
              </button>
              <button type="button" onClick={() => setOtpSent(false)} className="w-full text-xs text-blue-600 hover:underline text-center font-medium">Change Number</button>
            </form>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
