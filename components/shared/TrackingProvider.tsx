"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Global Tracking Utility
 * Dispatches events to both GA4 and Meta Pixel simultaneously.
 */
export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window === "undefined") return;

  // 1. Google Analytics 4
  if (window.gtag && GA_ID) {
    window.gtag("event", eventName, params);
  }

  // 2. Meta Pixel
  if (window.fbq && META_PIXEL_ID) {
    window.fbq("trackCustom", eventName, params);
    
    // Standard Lead Mapping
    if (eventName === "generate_lead") {
      window.fbq("track", "Lead", {
        content_name: params.property_type,
        content_category: params.technology_choice,
        value: params.estimated_value || 0,
        currency: "INR"
      });
    }
  }
};

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export function TrackingProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views on route change
  useEffect(() => {
    if (pathname && window.gtag && GA_ID) {
      window.gtag("config", GA_ID, {
        page_path: pathname + searchParams.toString(),
      });
    }
    if (pathname && window.fbq && META_PIXEL_ID) {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  if (!GA_ID && !META_PIXEL_ID) return null;

  return (
    <>
      {/* ───────────────────────────────────────────────────────────────────────
          GOOGLE ANALYTICS 4
          ─────────────────────────────────────────────────────────────────────── */}
      {GA_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script
            id="gtag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          META PIXEL
          ─────────────────────────────────────────────────────────────────────── */}
      {META_PIXEL_ID && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Vitals → GA4
// Called automatically by Next.js instrumentation when LCP/CLS/INP/FCP/TTFB
// are measured. Sends them as GA4 events visible in GA4 → Explore → Free Form.
// ─────────────────────────────────────────────────────────────────────────────
export function reportWebVitals(metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}) {
  if (typeof window === 'undefined') return;
  if (!window.gtag || !GA_ID) return;

  window.gtag('event', metric.name, {
    event_category:  'Web Vitals',
    event_label:     metric.id,
    // CLS is a 0–1 float; ×1000 converts to integer for GA4 storage
    value:           Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true,
    metric_rating:   metric.rating,
    metric_delta:    Math.round(metric.delta),
  });
}
