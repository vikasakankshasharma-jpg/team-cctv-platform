"use client";

import { usePathname } from "next/navigation";

const WA_NUMBER = "919772699395";
const WA_MESSAGE = encodeURIComponent(
  "Hi CCTVQuotation Team! 👋 I'd like a free quotation for CCTV installation at my property. Please help me."
);
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

/**
 * WhatsAppFloat — sticky bottom-right WhatsApp button.
 * Hidden on /wizard pages to keep users focused on the quote flow.
 */
export function WhatsAppFloat() {
  const pathname = usePathname();

  // Hide during wizard and on admin/partner/salesperson portals
  const hideOn = ["/wizard", "/admin", "/partner", "/salesperson", "/onboarding", "/platform", "/quote", "/installer", "/for-installers"];
  if (hideOn.some((p) => pathname.startsWith(p))) return null;

  return (
    <aside aria-label="WhatsApp Support">
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="whatsapp-float"
        id="whatsapp-float-btn"
      >
        {/* Animated pulse ring */}
        <span className="whatsapp-float__ring" aria-hidden="true" />
        <span className="whatsapp-float__ring whatsapp-float__ring--delay" aria-hidden="true" />

        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="white"
          className="whatsapp-float__icon"
          aria-hidden="true"
        >
          <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.8L.5 31.5l7.94-2.08A15.45 15.45 0 0016 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.2a13.7 13.7 0 01-7-1.93l-.5-.3-5.18 1.36 1.37-5.04-.33-.52A13.72 13.72 0 1116 28.7zm7.52-10.27c-.41-.2-2.43-1.2-2.81-1.34-.37-.14-.64-.2-.91.2s-1.04 1.34-1.28 1.62c-.23.27-.47.3-.88.1a11.15 11.15 0 01-3.28-2.02 12.3 12.3 0 01-2.27-2.82c-.24-.41-.03-.63.18-.84.18-.18.41-.47.61-.71.2-.23.27-.4.41-.67.14-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.68-.91-.69h-.78c-.27 0-.71.1-1.08.5a3.94 3.94 0 00-1.23 2.94c0 1.73 1.26 3.41 1.44 3.64.17.24 2.49 3.8 6.03 5.33.84.36 1.5.58 2.01.74.85.27 1.62.23 2.23.14.68-.1 2.1-.86 2.39-1.69.3-.83.3-1.55.21-1.69-.08-.14-.35-.24-.76-.44z" />
        </svg>

        {/* Tooltip label */}
        <span className="whatsapp-float__label" aria-hidden="true">Chat with us</span>


      <style jsx>{`
        .whatsapp-float {
          position: fixed;
          bottom: 88px; /* above mobile sticky bar */
          left: 16px;
          z-index: 49;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: #25d366;
          border-radius: 50%;
          box-shadow: 0 4px 24px rgba(37, 211, 102, 0.45);
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        @media (min-width: 768px) {
          .whatsapp-float {
            bottom: 28px;
            left: 28px;
            width: 60px;
            height: 60px;
          }
        }
        .whatsapp-float:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 8px 32px rgba(37, 211, 102, 0.55);
        }
        .whatsapp-float:hover .whatsapp-float__label {
          opacity: 1; visibility: visible;
          transform: translateX(8px);
          pointer-events: auto;
        }

        /* Pulse rings */
        .whatsapp-float__ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #25d366;
          opacity: 0; visibility: hidden;
          animation: wa-pulse 2.5s ease-out infinite;
        }
        .whatsapp-float__ring--delay {
          animation-delay: 1.25s;
        }
        @keyframes wa-pulse {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.75); opacity: 0; visibility: hidden; }
        }

        .whatsapp-float__icon {
          width: 30px;
          height: 30px;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

        /* Tooltip */
        .whatsapp-float__label {
          position: absolute;
          left: calc(100% + 12px);
          white-space: nowrap;
          background: #1a1a1a;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 6px 12px;
          border-radius: 20px;
          opacity: 0; visibility: hidden;
          transform: translateX(0);
          transition: opacity 0.2s ease, transform 0.2s ease;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
      </a>
    </aside>
  );
}
