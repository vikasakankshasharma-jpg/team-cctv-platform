import { unstable_cache } from "next/cache";
import { getCachedProducts, getCachedAddons } from "./cached-catalog";
import { getCachedAdminSettings } from "./cached-settings";
import { calculatePricing } from "./pricing-engine";
import type { ConfiguratorSelection } from "@/types";

export interface PackagePricingItem {
  brandKey: "cpplus" | "hik" | "prama";
  brandName: string;
  tag: string;
  tagColor: string;
  cameraCount: number;
  price: number;
  emi: number;
  resolution: string;
  desc: string;
  features: string[];
  recommended?: boolean;
}

export type DynamicPackageMap = Record<
  "home" | "shop" | "office",
  Record<number, Record<"cpplus" | "hik" | "prama", PackagePricingItem>>
>;

// Safe canonical fallbacks strictly adhering to baseline catalog minimums
const FALLBACK_PACKAGES: DynamicPackageMap = {
  home: {
    2: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Setup",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 2,
        resolution: "2.4MP Full HD",
        price: 11499,
        emi: 649,
        desc: "Essential security for entry gates, porch, or living room with night vision.",
        features: ["2x Weatherproof Night-Vision Cameras", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Ultra HD",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 2,
        resolution: "3K / 5MP Clarity",
        price: 13999,
        emi: 799,
        desc: "High clarity coverage for vehicle number plates and visitor face capture.",
        features: ["2x High-Clarity Smart IR Cameras", "4-Channel Smart Turbo DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 2,
        resolution: "24/7 Color Night",
        price: 14999,
        emi: 849,
        desc: "Vivid color imaging even in pitch-black night conditions. BIS-certified.",
        features: ["2x Full-Color Night Vision Cameras", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    4: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Complete Setup",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 4,
        resolution: "2.4MP Full HD",
        price: 17999,
        emi: 999,
        desc: "Complete perimeter coverage for front gate, backyard, staircase, and driveway.",
        features: ["4x Weatherproof Night-Vision Cameras", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Ultra HD",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 4,
        resolution: "3K / 5MP Clarity",
        price: 20999,
        emi: 1199,
        desc: "Crystal-clear recognition with smart motion alerts direct to your smartphone.",
        features: ["4x High-Clarity Smart IR / Audio Cams", "4-Channel Smart Turbo DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 4,
        resolution: "24/7 Color Night",
        price: 22999,
        emi: 1299,
        desc: "Full vivid color recording 24/7 with domestic BIS compliance.",
        features: ["4x True-Color Night Vision Cameras", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    8: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Full Perimeter",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 8,
        resolution: "2.4MP Full HD",
        price: 31999,
        emi: 1799,
        desc: "Complete boundary surveillance for large independent villas and duplexes.",
        features: ["8x Weatherproof Night-Vision Cameras", "8-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Pro Perimeter",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 8,
        resolution: "3K / 5MP Clarity",
        price: 36999,
        emi: 2099,
        desc: "Comprehensive 8-point smart surveillance with audio & night clarity.",
        features: ["8x High Clarity Smart IR Cameras", "8-Channel Smart Turbo DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA Pro ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 8,
        resolution: "24/7 Color Night",
        price: 39999,
        emi: 2299,
        desc: "Zero dark spots. Daytime color clarity preserved even under pitch black.",
        features: ["8x True-Color 24/7 Night Cameras", "8-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    16: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Enterprise",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 16,
        resolution: "2.4MP Full HD",
        price: 62999,
        emi: 3499,
        desc: "Multi-story building coverage with centralized multi-channel DVR monitoring.",
        features: ["16x Night-Vision Weatherproof Cams", "16-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Enterprise",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 16,
        resolution: "3K / 5MP Clarity",
        price: 71999,
        emi: 3999,
        desc: "Heavy-duty 16-channel coverage for estates, factories, and commercial spaces.",
        features: ["16x High Clarity Smart IR Cameras", "16-Channel Smart Turbo DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA Enterprise",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 16,
        resolution: "24/7 Color Night",
        price: 76999,
        emi: 4299,
        desc: "Industrial-grade BIS-certified 16-camera full perimeter security setup.",
        features: ["16x Full-Color 24/7 Night Cameras", "16-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    }
  },
  shop: {
    2: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Retail Lite",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 2,
        resolution: "2.4MP Full HD",
        price: 11999,
        emi: 679,
        desc: "Cash drawer & customer entrance monitoring for small retail shops and booths.",
        features: ["2x Indoor/Outdoor HD Cameras", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Ultra HD",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 2,
        resolution: "3K / 5MP Clarity",
        price: 14499,
        emi: 829,
        desc: "Sharp cash counter and billing screen capture with audio recording.",
        features: ["2x High Clarity Audio Cameras", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 2,
        resolution: "24/7 Color Night",
        price: 15499,
        emi: 879,
        desc: "24/7 color recording for shop shutters, entrance, and cash registers.",
        features: ["2x 24/7 Full Color Cameras", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    4: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Retail Pro",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 4,
        resolution: "2.4MP Full HD",
        price: 18499,
        emi: 1029,
        desc: "Complete 4-point coverage for billing counter, aisles, stockroom, and shopfront.",
        features: ["4x Indoor Dome + Outdoor Bullet Cams", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Ultra HD",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 4,
        resolution: "3K / 5MP Clarity",
        price: 21499,
        emi: 1229,
        desc: "High clarity billing and customer face detection with instant smartphone alerts.",
        features: ["4x 3K High-Clarity Audio Cams", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 4,
        resolution: "24/7 Color Night",
        price: 23499,
        emi: 1329,
        desc: "Night-shutter illumination and full-color evidence even in pitch-black storefronts.",
        features: ["4x True-Color 24/7 Night Cams", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    8: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Supermarket",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 8,
        resolution: "2.4MP Full HD",
        price: 32999,
        emi: 1849,
        desc: "Multi-aisle, inventory rack, and entrance tracking for supermarkets and restaurants.",
        features: ["8x HD Surveillance Cameras", "8-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Supermarket Pro",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 8,
        resolution: "3K / 5MP Clarity",
        price: 37999,
        emi: 2149,
        desc: "High-resolution retail loss-prevention setup with multi-camera smartphone view.",
        features: ["8x 3K High-Clarity Audio Cams", "8-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA Pro ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 8,
        resolution: "24/7 Color Night",
        price: 40999,
        emi: 2349,
        desc: "Zero-blindspot commercial color surveillance for showrooms and restaurants.",
        features: ["8x 24/7 Full Color Cameras", "8-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    16: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Showroom Enterprise",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 16,
        resolution: "2.4MP Full HD",
        price: 64999,
        emi: 3599,
        desc: "Comprehensive retail department store setup with central display monitoring.",
        features: ["16x Weatherproof HD Cameras", "16-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Showroom Pro",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 16,
        resolution: "3K / 5MP Clarity",
        price: 73999,
        emi: 4099,
        desc: "Enterprise 16-channel surveillance for jewelry showrooms and shopping complexes.",
        features: ["16x 3K Ultra Clarity Cameras", "16-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA Showroom Enterprise",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 16,
        resolution: "24/7 Color Night",
        price: 78999,
        emi: 4399,
        desc: "Full-color 24/7 recording across 16 commercial points with BIS compliance.",
        features: ["16x True-Color 24/7 Cameras", "16-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    }
  },
  office: {
    2: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Office Lite",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 2,
        resolution: "2.4MP Full HD",
        price: 11999,
        emi: 679,
        desc: "Reception lobby and staff entrance monitoring for small offices and clinics.",
        features: ["2x Indoor Ceiling Dome Cameras", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Ultra HD",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 2,
        resolution: "3K / 5MP Clarity",
        price: 14499,
        emi: 829,
        desc: "Clear face recognition and staff entry timestamps with audio recording.",
        features: ["2x High Clarity Audio Domes", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 2,
        resolution: "24/7 Color Night",
        price: 15499,
        emi: 879,
        desc: "Professional color video for modern office interiors and reception desks.",
        features: ["2x 24/7 Full Color Domes", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    4: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Office Pro",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 4,
        resolution: "2.4MP Full HD",
        price: 18499,
        emi: 1029,
        desc: "Complete 4-point setup: Reception, main floor, server corner, and manager cabin.",
        features: ["4x HD Indoor Ceiling Domes", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Ultra HD",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 4,
        resolution: "3K / 5MP Clarity",
        price: 21499,
        emi: 1229,
        desc: "High clarity office surveillance with built-in voice and smartphone live access.",
        features: ["4x 3K Audio Ceiling Domes", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA ColorPro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 4,
        resolution: "24/7 Color Night",
        price: 23499,
        emi: 1329,
        desc: "24/7 full color office monitoring with multi-user access for founders and HR.",
        features: ["4x True-Color Ceiling Domes", "4-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    8: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Corporate Floor",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 8,
        resolution: "2.4MP Full HD",
        price: 32999,
        emi: 1849,
        desc: "Complete floor coverage for cubicles, meeting rooms, corridors, and entrance.",
        features: ["8x HD Indoor Ceiling Domes", "8-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Corporate Pro",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 8,
        resolution: "3K / 5MP Clarity",
        price: 37999,
        emi: 2149,
        desc: "High-resolution corporate security with real-time employee attendance view.",
        features: ["8x 3K High-Clarity Audio Domes", "8-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA Corporate Pro",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 8,
        resolution: "24/7 Color Night",
        price: 40999,
        emi: 2349,
        desc: "True-color office floor security with secure multi-admin remote logins.",
        features: ["8x 24/7 Color Ceiling Domes", "8-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    },
    16: {
      cpplus: {
        brandKey: "cpplus",
        brandName: "CP PLUS Corporate Multi-Floor",
        tag: "India's #1 Brand",
        tagColor: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
        cameraCount: 16,
        resolution: "2.4MP Full HD",
        price: 64999,
        emi: 3599,
        desc: "Multi-floor corporate office security with centralized security guard display.",
        features: ["16x HD Ceiling Dome Cams", "16-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      },
      hik: {
        brandKey: "hik",
        brandName: "HIKVISION Ultra HD Multi-Floor",
        tag: "World #1 Leader",
        tagColor: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
        cameraCount: 16,
        resolution: "3K / 5MP Clarity",
        price: 73999,
        emi: 4099,
        desc: "High clarity multi-department surveillance with centralized DVR recording.",
        features: ["16x 3K Audio Ceiling Domes", "16-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"],
        recommended: true
      },
      prama: {
        brandKey: "prama",
        brandName: "PRAMA ColorPro Multi-Floor",
        tag: "Make In India 🇮🇳",
        tagColor: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
        cameraCount: 16,
        resolution: "24/7 Color Night",
        price: 78999,
        emi: 4399,
        desc: "Domestic BIS-certified 16-channel corporate video security system.",
        features: ["16x 24/7 Full Color Domes", "16-Channel Smart DVR", "CCTV Cabling (15m Free Labor/Cam)", "Complete Fitting & Mobile Live App"]
      }
    }
  }
};

/**
 * Dynamically computes lowest-cost baseline package prices directly from active catalog items.
 * Evaluates lowest compatible category items (Copper-Coated cable, lowest unit price cameras, DVR).
 * Cached with 1-hour interval revalidation tag `["catalog-packages"]`.
 */
export const getDynamicPackageCatalog = unstable_cache(
  async (): Promise<DynamicPackageMap> => {
    try {
      const [products, addons, settings] = await Promise.all([
        getCachedProducts(),
        getCachedAddons(),
        getCachedAdminSettings(),
      ]);

      if (!products || products.length === 0) {
        return FALLBACK_PACKAGES;
      }

      // Clone fallback template and dynamically patch computed totals from active inventory
      const result: DynamicPackageMap = JSON.parse(JSON.stringify(FALLBACK_PACKAGES));
      const propertyTypes: Array<"home" | "shop" | "office"> = ["home", "shop", "office"];
      const camCounts = [2, 4, 8, 16];
      const brands: Array<{ key: "cpplus" | "hik" | "prama"; pref: string }> = [
        { key: "cpplus", pref: "CP PLUS" },
        { key: "hik", pref: "Hikvision" },
        { key: "prama", pref: "Prama" },
      ];

      for (const prop of propertyTypes) {
        for (const count of camCounts) {
          for (const b of brands) {
            try {
              const quality = b.key === "cpplus" ? "good" : "very_clear";
              const selection: ConfiguratorSelection = {
                camera_count: count,
                picture_quality: quality,
                technology: "HD",
                plan_type: "budget", // Cheapest variant setup with compatible Copper-Coated wiring
                brand_preference: b.pref,
                recording_days: 0, // Baseline hardware setup without storage
                selected_addons: [],
                cabling_done: false,
                property_type: prop,
              };

              const calc = calculatePricing({
                selection,
                products,
                addons,
                settings,
                cablingDone: false,
              });

              if (calc && calc.total_payable && calc.total_payable > 0) {
                const targetPrice = Math.round(calc.total_payable);
                const targetEmi = Math.round((targetPrice / 12) * 0.42);

                if (result[prop]?.[count]?.[b.key]) {
                  result[prop][count][b.key].price = targetPrice;
                  result[prop][count][b.key].emi = targetEmi;
                }
              }
            } catch (err) {
              // Silently preserve safe fallback on individual calculation error
            }
          }
        }
      }

      return result;
    } catch (err) {
      console.error("Error evaluating dynamic package pricing:", err);
      return FALLBACK_PACKAGES;
    }
  },
  ["catalog-dynamic-packages"],
  {
    revalidate: 3600, // 1 hour interval check
    tags: ["catalog-packages", "products", "settings"],
  }
);
