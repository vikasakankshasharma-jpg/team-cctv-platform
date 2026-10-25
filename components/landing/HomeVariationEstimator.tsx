"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  CreditCard, 
  Check, 
  ArrowRight, 
  Building2, 
  Store, 
  Home as HomeIcon,
  ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

interface BrandReference {
  name: string;
  tag: string;
  tagColor: string;
  resolution: string;
  emiRef: string;
  startingRef: string;
  desc: string;
  features: string[];
  recommended?: boolean;
}

// Derived strictly from TEAM CCTV Price Engine & Master Catalog Lowest Variations
const VARIATION_REFERENCES: Record<"home" | "shop" | "office", Record<number, Record<"cpplus" | "hik" | "prama", BrandReference>>> = {
  home: {
    2: {
      cpplus: {
        name: "CP PLUS Smart Setup",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹649 / mo*",
        startingRef: "From ~₹11,499*",
        desc: "Essential security for entry gates, porch, or living room with night vision.",
        features: ["2x Weatherproof Night-Vision Cameras", "Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        name: "HIKVISION Ultra HD",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹799 / mo*",
        startingRef: "From ~₹13,999*",
        desc: "High clarity coverage for vehicle number plates and visitor face capture.",
        features: ["2x Ultra-Clarity Smart IR Cameras", "Turbo DVR with WD Purple Storage", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        name: "PRAMA ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹849 / mo*",
        startingRef: "From ~₹14,999*",
        desc: "Vivid color imaging even in pitch-black night conditions. BIS-certified.",
        features: ["2x Full-Color Night Vision Cameras", "Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    4: {
      cpplus: {
        name: "CP PLUS Complete Setup",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹999 / mo*",
        startingRef: "From ~₹17,999*",
        desc: "360° coverage for front gate, backyard, staircase, and driveway.",
        features: ["4x Weatherproof Night-Vision Cameras", "4-Channel Smart DVR + Storage", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        name: "HIKVISION Ultra HD",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹1,199 / mo*",
        startingRef: "From ~₹20,999*",
        desc: "Crystal-clear recognition with smart motion alerts direct to your smartphone.",
        features: ["4x Ultra-Clarity Smart IR / Audio Cams", "Turbo DVR with WD Purple Storage", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        name: "PRAMA ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹1,299 / mo*",
        startingRef: "From ~₹22,999*",
        desc: "Full vivid color recording 24/7 with domestic BIS compliance.",
        features: ["4x True-Color Night Vision Cameras", "Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    8: {
      cpplus: {
        name: "CP PLUS Full Perimeter",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹1,799 / mo*",
        startingRef: "From ~₹31,999*",
        desc: "Complete boundary surveillance for large independent villas and duplexes.",
        features: ["8x Weatherproof Night-Vision Cameras", "8-Channel DVR with Surveillance HDD", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        name: "HIKVISION Pro Perimeter",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹2,099 / mo*",
        startingRef: "From ~₹36,999*",
        desc: "Comprehensive 8-point smart surveillance with audio & night clarity.",
        features: ["8x High Clarity Smart IR Cameras", "Turbo DVR with 2TB HDD", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        name: "PRAMA Pro ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹2,299 / mo*",
        startingRef: "From ~₹39,999*",
        desc: "Zero dark spots. Daytime color clarity preserved even under pitch black.",
        features: ["8x True-Color 24/7 Night Cameras", "8Ch Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    16: {
      cpplus: {
        name: "CP PLUS Enterprise",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹3,499 / mo*",
        startingRef: "From ~₹62,999*",
        desc: "Multi-story building coverage with centralized multi-channel DVR monitoring.",
        features: ["16x Night-Vision Weatherproof Cams", "16-Channel DVR + High Capacity HDD", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        name: "HIKVISION Enterprise",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹3,999 / mo*",
        startingRef: "From ~₹71,999*",
        desc: "Industrial-grade security network with remote multi-device streaming.",
        features: ["16x High Clarity Smart IR Cameras", "16-Channel DVR + Enterprise HDD", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        name: "PRAMA Enterprise",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹4,499 / mo*",
        startingRef: "From ~₹79,999*",
        desc: "Full complex color surveillance designed for commercial residential campus.",
        features: ["16x Full-Color Night Cameras", "16-Channel DVR + Enterprise Storage", "Free Cable Pulling Labor (15m/cam)", "Complete Fitting & Mobile Live App"]
      }
    }
  },
  shop: {
    2: {
      cpplus: {
        name: "CP PLUS Retail Setup",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹699 / mo*",
        startingRef: "From ~₹11,999*",
        desc: "Billing counter and entrance monitoring with audio support.",
        features: ["2x Compact High-Resolution Cameras", "Smart DVR + Continuous Recording", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"]
      },
      hik: {
        name: "HIKVISION Cash Counter Pro",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹849 / mo*",
        startingRef: "From ~₹14,499*",
        desc: "Sharp currency denomination and customer transaction verification.",
        features: ["2x High Clarity Cameras with Built-in Mic", "Turbo DVR with Surveillance HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"],
        recommended: true
      },
      prama: {
        name: "PRAMA Retail Eye",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹899 / mo*",
        startingRef: "From ~₹15,499*",
        desc: "Color recording even with store shutter pulled down at night.",
        features: ["2x True-Color 24/7 Night Cameras", "Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"]
      }
    },
    4: {
      cpplus: {
        name: "CP PLUS Retail Quad",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹1,049 / mo*",
        startingRef: "From ~₹18,499*",
        desc: "Billing desk, product aisles, stockroom, and store front.",
        features: ["4x Store Surveillance Cameras", "4-Channel Smart DVR + HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"]
      },
      hik: {
        name: "HIKVISION Retail Quad Pro",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹1,249 / mo*",
        startingRef: "From ~₹21,999*",
        desc: "Complete shop coverage with sharp cash tracking and audio recording.",
        features: ["4x Ultra-Clarity Audio Cameras", "Turbo DVR with WD Purple HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"],
        recommended: true
      },
      prama: {
        name: "PRAMA Retail Quad Color",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹1,349 / mo*",
        startingRef: "From ~₹23,999*",
        desc: "24/7 Color footage ensuring store safety after closing hours.",
        features: ["4x True-Color Night Cameras", "Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"]
      }
    },
    8: {
      cpplus: {
        name: "CP PLUS Showroom Setup",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹1,849 / mo*",
        startingRef: "From ~₹32,999*",
        desc: "Extensive multi-aisle and warehouse retail establishment coverage.",
        features: ["8x Showroom Grade Cameras", "8-Channel DVR with HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"]
      },
      hik: {
        name: "HIKVISION Showroom Ultra",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹2,149 / mo*",
        startingRef: "From ~₹37,999*",
        desc: "High clarity coverage across showroom floor, cash counters, and stock gates.",
        features: ["8x Ultra Clarity Audio Cameras", "Turbo DVR with Surveillance HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"],
        recommended: true
      },
      prama: {
        name: "PRAMA Showroom Color",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹2,399 / mo*",
        startingRef: "From ~₹41,999*",
        desc: "Night-time color surveillance with high deterrence against break-ins.",
        features: ["8x Full-Color Night Cameras", "8Ch Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"]
      }
    },
    16: {
      cpplus: {
        name: "CP PLUS Mall / Supermarket",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹3,599 / mo*",
        startingRef: "From ~₹64,999*",
        desc: "Comprehensive supermarket coverage with central monitoring station view.",
        features: ["16x Dome & Bullet Cameras", "16-Channel DVR + Surveillance Drive", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"]
      },
      hik: {
        name: "HIKVISION Mall / Supermarket",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹4,099 / mo*",
        startingRef: "From ~₹73,999*",
        desc: "High-density retail surveillance with facial clarity across checkouts.",
        features: ["16x High Clarity Audio Cameras", "16-Channel DVR + Enterprise HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"],
        recommended: true
      },
      prama: {
        name: "PRAMA Supermarket Color",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹4,599 / mo*",
        startingRef: "From ~₹81,999*",
        desc: "Vivid color night recording across extensive retail premises.",
        features: ["16x True Color Night Cameras", "16-Channel DVR + Enterprise HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile Live View on Store Phone"]
      }
    }
  },
  office: {
    2: {
      cpplus: {
        name: "CP PLUS Office Base",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹699 / mo*",
        startingRef: "From ~₹12,499*",
        desc: "Reception lobby and server room surveillance with mobile live access.",
        features: ["2x Indoor Ceiling Dome Cameras", "Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"]
      },
      hik: {
        name: "HIKVISION Office Clarity",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹849 / mo*",
        startingRef: "From ~₹14,999*",
        desc: "Staff desk & reception monitoring with integrated audio capture.",
        features: ["2x High Clarity Audio Cameras", "Turbo DVR with WD Purple HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"],
        recommended: true
      },
      prama: {
        name: "PRAMA Office Guard",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹899 / mo*",
        startingRef: "From ~₹15,999*",
        desc: "Continuous color night visibility for office premises after hours.",
        features: ["2x True Color Cameras", "Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"]
      }
    },
    4: {
      cpplus: {
        name: "CP PLUS Office Quad",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹1,099 / mo*",
        startingRef: "From ~₹18,999*",
        desc: "Covers reception, workstation bay, accounts cabin, and entry door.",
        features: ["4x Office Grade Cameras", "4-Channel Smart DVR + HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"]
      },
      hik: {
        name: "HIKVISION Office Quad Pro",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹1,299 / mo*",
        startingRef: "From ~₹22,499*",
        desc: "Executive-grade surveillance with sharp text/screen capture and audio.",
        features: ["4x Ultra-Clarity Audio Domes/Bullets", "Turbo DVR with Surveillance HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"],
        recommended: true
      },
      prama: {
        name: "PRAMA Office Quad Color",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹1,399 / mo*",
        startingRef: "From ~₹24,499*",
        desc: "24/7 color vigilance for office security & employee safety.",
        features: ["4x True-Color Night Cameras", "Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"]
      }
    },
    8: {
      cpplus: {
        name: "CP PLUS Floor Setup",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹1,899 / mo*",
        startingRef: "From ~₹33,999*",
        desc: "Entire floor coverage: corridors, meeting rooms, pantry, and cabins.",
        features: ["8x Business Surveillance Cameras", "8-Channel DVR with HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"]
      },
      hik: {
        name: "HIKVISION Corporate 8",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹2,199 / mo*",
        startingRef: "From ~₹38,999*",
        desc: "Corporate security network with dual audio-visual evidence capture.",
        features: ["8x Ultra Clarity Cameras", "Turbo DVR with 2TB Storage", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"],
        recommended: true
      },
      prama: {
        name: "PRAMA Corporate Color",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹2,449 / mo*",
        startingRef: "From ~₹42,999*",
        desc: "Unmatched night-time color clarity across all commercial zones.",
        features: ["8x Full-Color Night Cameras", "8Ch Smart DVR with Storage", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"]
      }
    },
    16: {
      cpplus: {
        name: "CP PLUS Factory / Facility",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        resolution: "2MP Full HD",
        emiRef: "Starting ₹3,699 / mo*",
        startingRef: "From ~₹65,999*",
        desc: "Complete industrial warehouse, gate, loading bay, and factory coverage.",
        features: ["16x Weatherproof Heavy-Duty Cameras", "16-Channel DVR + Enterprise HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"]
      },
      hik: {
        name: "HIKVISION Factory / Facility",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        resolution: "3K / 5MP Clarity",
        emiRef: "Starting ₹4,199 / mo*",
        startingRef: "From ~₹74,999*",
        desc: "Industrial network with perimeter vehicle detection & gate logging.",
        features: ["16x High Clarity Smart IR Cameras", "16-Channel DVR + Enterprise HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"],
        recommended: true
      },
      prama: {
        name: "PRAMA Industrial Color",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        resolution: "24/7 Color Night",
        emiRef: "Starting ₹4,699 / mo*",
        startingRef: "From ~₹83,999*",
        desc: "Color night surveillance for industrial yards and perimeter fences.",
        features: ["16x True-Color 24/7 Night Cameras", "16-Channel DVR + Enterprise HDD", "Free Cable Pulling Labor (15m/cam)", "Mobile & Desktop Live View"]
      }
    }
  }
};

export function HomeVariationEstimator() {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState<"home" | "shop" | "office">("home");
  const [cameraCount, setCameraCount] = useState<number>(4);

  const currentGroup = VARIATION_REFERENCES[propertyType][cameraCount] || VARIATION_REFERENCES.home[4];

  const handleStartExactQuote = (brandKey?: string) => {
    const brandParam = brandKey ? `&brand=${brandKey}` : "";
    router.push(`/wizard?property=${propertyType}&cameras=${cameraCount}${brandParam}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200/80 dark:border-zinc-800 text-left relative z-20">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Multi-Brand Variation Explorer</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Explore Multiple Variations for Your Site
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">
            Compare brand packages with EMI references. Get your exact tailored quotation in under 2 minutes.
          </p>
        </div>

        {/* Property Selector Pills - Full width 3-cols on mobile, auto on desktop */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl text-xs font-bold w-full sm:w-auto border border-slate-200/50 dark:border-zinc-700/50">
          <button
            type="button"
            onClick={() => setPropertyType("home")}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all cursor-pointer ${
              propertyType === "home"
                ? "bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Home / Villa</span>
            <span className="sm:hidden">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setPropertyType("shop")}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all cursor-pointer ${
              propertyType === "shop"
                ? "bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Shop / Retail</span>
            <span className="sm:hidden">Shop</span>
          </button>

          <button
            type="button"
            onClick={() => setPropertyType("office")}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all cursor-pointer ${
              propertyType === "office"
                ? "bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Office / Factory</span>
            <span className="sm:hidden">Office</span>
          </button>
        </div>
      </div>

      {/* Camera Count Bar - Balanced 2x2 grid on mobile, row on desktop */}
      <div className="py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full">
        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 sm:mr-2">
          Required Cameras:
        </span>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {[2, 4, 8, 16].map((count) => {
            const isSelected = cameraCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => setCameraCount(count)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-2 cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs"
                    : "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                }`}
              >
                <span>{count} Cameras</span>
                {count === 4 && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-black uppercase">
                    Popular
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Brand Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        
        {/* CP Plus Card */}
        <motion.div 
          layout 
          className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 p-5 bg-white dark:bg-zinc-800/40 flex flex-col justify-between transition-all group shadow-xs hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${currentGroup.cpplus.tagColor}`}>
                {currentGroup.cpplus.tag}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{currentGroup.cpplus.resolution}</span>
            </div>
            
            <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {currentGroup.cpplus.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-4 leading-relaxed font-medium">
              {currentGroup.cpplus.desc}
            </p>

            {/* Price Benchmark Box */}
            <div className="bg-slate-50 dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-750 mb-4 shadow-2xs">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Indicative Pricing</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{currentGroup.cpplus.startingRef}</span>
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1.5">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span><strong>{currentGroup.cpplus.emiRef}</strong> on EMI</span>
              </div>
            </div>

            {/* Feature Bullets */}
            <ul className="text-xs text-slate-600 dark:text-zinc-300 space-y-2 mb-5 font-medium">
              {currentGroup.cpplus.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleStartExactQuote("cpplus")}
            className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-slate-900 dark:bg-zinc-700 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
          >
            <span>Get Exact Quote for My Site</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Hikvision Card (Recommended) */}
        <motion.div 
          layout 
          className="rounded-2xl border-2 border-blue-600 p-5 bg-blue-50/20 dark:bg-blue-950/20 flex flex-col justify-between shadow-lg relative group mt-4 md:mt-0"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
              Recommended 🌟
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 mt-1">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${currentGroup.hik.tagColor}`}>
                {currentGroup.hik.tag}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{currentGroup.hik.resolution}</span>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {currentGroup.hik.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-4 leading-relaxed font-medium">
              {currentGroup.hik.desc}
            </p>

            {/* Price Benchmark Box */}
            <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 mb-4 shadow-2xs">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Indicative Pricing</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{currentGroup.hik.startingRef}</span>
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1.5">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span><strong>{currentGroup.hik.emiRef}</strong> on EMI</span>
              </div>
            </div>

            {/* Feature Bullets */}
            <ul className="text-xs text-slate-700 dark:text-zinc-300 space-y-2 mb-5 font-medium">
              {currentGroup.hik.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleStartExactQuote("hikvision")}
            className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-98 cursor-pointer"
          >
            <span>Get Exact Quote for My Site</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Prama Card */}
        <motion.div 
          layout 
          className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 bg-white dark:bg-zinc-800/40 flex flex-col justify-between transition-all group shadow-xs hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${currentGroup.prama.tagColor}`}>
                {currentGroup.prama.tag}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{currentGroup.prama.resolution}</span>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {currentGroup.prama.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-4 leading-relaxed font-medium">
              {currentGroup.prama.desc}
            </p>

            {/* Price Benchmark Box */}
            <div className="bg-slate-50 dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-750 mb-4 shadow-2xs">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Indicative Pricing</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{currentGroup.prama.startingRef}</span>
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1.5">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span><strong>{currentGroup.prama.emiRef}</strong> on EMI</span>
              </div>
            </div>

            {/* Feature Bullets */}
            <ul className="text-xs text-slate-600 dark:text-zinc-300 space-y-2 mb-5 font-medium">
              {currentGroup.prama.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleStartExactQuote("prama")}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-zinc-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
          >
            <span>Get Exact Quote for My Site</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </div>

      {/* Trust & Guarantee Strip below cards */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-zinc-400">
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Every package includes Hardware, 18% GST Bill, Cabling Labor & Mobile View Setup.</span>
        </div>
        <button
          type="button"
          onClick={() => handleStartExactQuote()}
          className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline flex items-center gap-1 self-end sm:self-auto cursor-pointer"
        >
          <span>Calculate Exact Quote for My Property →</span>
        </button>
      </div>

    </div>
  );
}
