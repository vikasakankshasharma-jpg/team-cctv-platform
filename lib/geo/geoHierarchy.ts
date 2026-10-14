/**
 * @file lib/geo/geoHierarchy.ts
 * @description Administrative Geo Hierarchy Engine: State -> District -> Tehsil -> PINCODE (Active vs Inactive).
 * 
 * Provides:
 * 1. 4-tier Indian administrative territorial structure
 * 2. Active vs Inactive status tracking at individual PIN and bulk-Tehsil levels
 * 3. Demand score and waitlist lead aggregation
 * 4. High-speed lookup and fallback resolution
 */

export type PincodeStatus = "active" | "inactive";
export type HierarchyStatus = "active" | "inactive" | "partial";

export interface PincodeItem {
  pincode: string;
  name: string;
  status: PincodeStatus;
  tehsil: string;
  district: string;
  state: string;
  waitlist_count: number;
  demand_score: number;
  last_updated?: string;
  updated_by?: string;
}

export interface TehsilItem {
  name: string;
  status: HierarchyStatus;
  active_count: number;
  total_count: number;
  waitlist_count: number;
  demand_score: number;
  pincodes: PincodeItem[];
}

export interface DistrictItem {
  name: string;
  state: string;
  status: HierarchyStatus;
  active_count: number;
  total_count: number;
  waitlist_count: number;
  demand_score: number;
  tehsils: TehsilItem[];
}

export interface StateItem {
  name: string;
  status: HierarchyStatus;
  active_count: number;
  total_count: number;
  waitlist_count: number;
  demand_score: number;
  districts: DistrictItem[];
}

export interface HierarchySummary {
  total_states: number;
  total_districts: number;
  total_tehsils: number;
  total_pincodes: number;
  active_pincodes: number;
  inactive_pincodes: number;
  total_waitlist_leads: number;
}

/**
 * Baseline Core Launch Active Pincodes in Jaipur Urban Hub.
 * These are guaranteed active by default for immediate 24-48h site installation.
 */
export const CORE_ACTIVE_PINCODES = new Set<string>([
  "302001", // Jaipur GPO / M.I. Road / C-Scheme / Pink City Central
  "302002", // Tripolia Bazar / Johari Bazar / Chandpole / Walled City
  "302003", // Shastri Nagar / Subhash Nagar / Pani Pech
  "302004", // Raja Park / Adarsh Nagar / Tilak Nagar / Jawahar Nagar
  "302005", // Bapu Nagar / Gandhi Nagar / Tonk Phatak
  "302006", // Bani Park / Station Road / Sindhi Camp
  "302012", // Khatipura / Hanuman Nagar / Jhotwara Road
  "302015", // Gopalpura Bypass / Mahesh Nagar / Tonk Road
  "302016", // Pratap Nagar / Haldi Ghati Marg
  "302017", // Malviya Nagar / Jawahar Circle / Apex Circle
  "302018", // Civil Lines / Sodala / Ram Nagar
  "302019", // Mansarovar / VT Road / Madhyam Marg / Shipra Path
  "302020", // Vaishali Nagar / Chitrakoot / Amrapali Circle
  "302021", // Nirman Nagar / Shyam Nagar / Kings Road
  "302028", // Amer Town (Urban gateway)
  "302029", // Sanganer Town / Airport Area
  "302032", // Kalwar Road / Jhotwara Industrial
  "302034", // Mansarovar Extension / Dholai / Patrakar Colony
  "302039", // V.K.I. Area / Vishwakarma Industrial Area / Murlipura
  "302041", // Sirsi Road / Bindayaka / Kanakpura
]);

/**
 * Default Seed Administrative Structure.
 * Pre-populated with actual Indian revenue tehsils and postal classifications.
 */
export interface SeedPinDefinition {
  pincode: string;
  name: string;
  defaultStatus: PincodeStatus;
}

export interface SeedTehsilDefinition {
  name: string;
  pincodes: SeedPinDefinition[];
}

export interface SeedDistrictDefinition {
  name: string;
  tehsils: SeedTehsilDefinition[];
}

export interface SeedStateDefinition {
  name: string;
  districts: SeedDistrictDefinition[];
}

export const BASELINE_GEO_HIERARCHY: SeedStateDefinition[] = [
  {
    name: "Rajasthan",
    districts: [
      {
        name: "Jaipur",
        tehsils: [
          {
            name: "Jaipur Urban",
            pincodes: [
              { pincode: "302001", name: "Jaipur G.P.O. / M.I. Road / C-Scheme", defaultStatus: "active" },
              { pincode: "302002", name: "Tripolia / Johari Bazar / Walled City", defaultStatus: "active" },
              { pincode: "302003", name: "Shastri Nagar / Subhash Nagar", defaultStatus: "active" },
              { pincode: "302004", name: "Raja Park / Adarsh Nagar / Jawahar Nagar", defaultStatus: "active" },
              { pincode: "302005", name: "Bapu Nagar / Gandhi Nagar / Tonk Phatak", defaultStatus: "active" },
              { pincode: "302006", name: "Bani Park / Station Road / Sindhi Camp", defaultStatus: "active" },
              { pincode: "302012", name: "Khatipura / Hanuman Nagar", defaultStatus: "active" },
              { pincode: "302015", name: "Gopalpura Bypass / Mahesh Nagar", defaultStatus: "active" },
              { pincode: "302016", name: "Pratap Nagar / Haldi Ghati Marg", defaultStatus: "active" },
              { pincode: "302017", name: "Malviya Nagar / Jawahar Circle", defaultStatus: "active" },
              { pincode: "302018", name: "Civil Lines / Sodala / Ram Nagar", defaultStatus: "active" },
              { pincode: "302019", name: "Mansarovar / VT Road / Madhyam Marg", defaultStatus: "active" },
              { pincode: "302020", name: "Vaishali Nagar / Chitrakoot", defaultStatus: "active" },
              { pincode: "302021", name: "Nirman Nagar / Shyam Nagar / Kings Road", defaultStatus: "active" },
              { pincode: "302034", name: "Mansarovar Ext / Patrakar Colony", defaultStatus: "active" },
              { pincode: "302039", name: "V.K.I. Area / Vishwakarma Industrial", defaultStatus: "active" },
              { pincode: "302041", name: "Sirsi Road / Bindayaka / Kanakpura", defaultStatus: "active" },
            ],
          },
          {
            name: "Sanganer",
            pincodes: [
              { pincode: "302029", name: "Sanganer Town / Airport Area", defaultStatus: "active" },
              { pincode: "302033", name: "Sitapura Industrial Area / RIICO", defaultStatus: "inactive" },
              { pincode: "303902", name: "Sanganer Rural / Vatika Road", defaultStatus: "inactive" },
              { pincode: "303904", name: "Shivdaspura / Tonk Road", defaultStatus: "inactive" },
            ],
          },
          {
            name: "Amer",
            pincodes: [
              { pincode: "302028", name: "Amer Town / Maota Lake Perimeter", defaultStatus: "active" },
              { pincode: "303101", name: "Achrol / Delhi Highway", defaultStatus: "inactive" },
              { pincode: "303104", name: "Kukas / RIICO Industrial Area", defaultStatus: "inactive" },
            ],
          },
          {
            name: "Jhotwara",
            pincodes: [
              { pincode: "302032", name: "Kalwar Road / Jhotwara Industrial", defaultStatus: "active" },
              { pincode: "302013", name: "Peepla Bharatsingh / Hathoj", defaultStatus: "inactive" },
            ],
          },
          {
            name: "Chomu",
            pincodes: [
              { pincode: "303702", name: "Chomu Mandi / Court Road", defaultStatus: "inactive" },
              { pincode: "303704", name: "Morija / Chomu Suburb", defaultStatus: "inactive" },
            ],
          },
          {
            name: "Chaksu",
            pincodes: [
              { pincode: "303901", name: "Chaksu Town / Mandi", defaultStatus: "inactive" },
              { pincode: "303903", name: "Chaksu Rural / Kotkhawada", defaultStatus: "inactive" },
            ],
          },
          {
            name: "Bassi",
            pincodes: [
              { pincode: "303301", name: "Bassi Central / Railway Station", defaultStatus: "inactive" },
              { pincode: "303302", name: "Kanota / Agra Road", defaultStatus: "inactive" },
            ],
          },
          {
            name: "Kotputli",
            pincodes: [
              { pincode: "303108", name: "Kotputli Central / Highway", defaultStatus: "inactive" },
            ],
          },
          {
            name: "Jamwa Ramgarh",
            pincodes: [
              { pincode: "303109", name: "Jamwa Ramgarh Dam / Town", defaultStatus: "inactive" },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Fast in-memory lookup index for PIN -> Hierarchy mapping
 */
export const PIN_METADATA_INDEX = new Map<string, {
  name: string;
  defaultStatus: PincodeStatus;
  tehsil: string;
  district: string;
  state: string;
}>();

// Build index once at module load
for (const state of BASELINE_GEO_HIERARCHY) {
  for (const district of state.districts) {
    for (const tehsil of district.tehsils) {
      for (const pin of tehsil.pincodes) {
        PIN_METADATA_INDEX.set(pin.pincode, {
          name: pin.name,
          defaultStatus: pin.defaultStatus,
          tehsil: tehsil.name,
          district: district.name,
          state: state.name,
        });
      }
    }
  }
}

/**
 * Checks whether a pincode is active by default.
 */
export function isPincodeActiveByDefault(pincode: string): boolean {
  if (CORE_ACTIVE_PINCODES.has(pincode)) return true;
  const meta = PIN_METADATA_INDEX.get(pincode);
  return meta?.defaultStatus === "active";
}

/**
 * Resolves static administrative hierarchy for a pincode if known.
 */
export function resolveStaticHierarchy(pincode: string) {
  return PIN_METADATA_INDEX.get(pincode) || null;
}

/**
 * Computes status for any aggregate node based on active counts.
 */
export function computeAggregateStatus(activeCount: number, totalCount: number): HierarchyStatus {
  if (totalCount === 0) return "inactive";
  if (activeCount === totalCount) return "active";
  if (activeCount > 0) return "partial";
  return "inactive";
}

/**
 * Computes demand score from traffic impressions, intent leads, and confirmed leads.
 */
export function calculateDemandScore(impressions: number, intentLeads: number, confirmedLeads: number): number {
  return Math.round(((impressions * 0.2) + (intentLeads * 0.5) + (confirmedLeads * 0.8)) * 10) / 10;
}
