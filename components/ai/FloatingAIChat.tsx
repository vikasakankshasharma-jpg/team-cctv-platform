"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import { ChatInterface } from "./ChatInterface";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || "unknown";

  const [proactiveMessage, setProactiveMessage] = useState<string | undefined>(undefined);
  const [hasTriggeredProactive, setHasTriggeredProactive] = useState(false);

  useEffect(() => {
    // Idle Detection Logic
    let idleTimer: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      // If we haven't triggered it yet, start a new timer (e.g., 20 seconds for demo)
      if (!hasTriggeredProactive && !isOpen) {
        idleTimer = setTimeout(() => {
          if (pathname.includes("wizard")) {
            setProactiveMessage("I noticed you're exploring the Quotation Wizard. Do you need help picking the right cameras?");
          } else {
            setProactiveMessage("I see you've been lingering here. Can I answer any questions about our products?");
          }
          setIsOpen(true);
          setHasTriggeredProactive(true);
        }, 20000); 
      }
    };

    // Listen for activity
    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keypress", resetIdleTimer);
    window.addEventListener("scroll", resetIdleTimer);
    
    resetIdleTimer();

    return () => {
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keypress", resetIdleTimer);
      window.removeEventListener("scroll", resetIdleTimer);
      clearTimeout(idleTimer);
    };
  }, [hasTriggeredProactive, isOpen, pathname]);

  return (
    <motion.div 
      className="fixed bottom-[110px] lg:bottom-8 right-4 md:right-8 z-[100] flex flex-col items-end"
    >
      {/* The Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-80 md:w-96 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          <ChatInterface pageContext={pathname} initialMessage={proactiveMessage} />
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 pointer-events-none" />
        ) : (
          <MessageSquare className="w-6 h-6 pointer-events-none" />
        )}
      </button>
    </motion.div>
  );
}
