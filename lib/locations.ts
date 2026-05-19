export interface LocationNode {
  name: string;
  served: boolean;
  slug?: string;
  children?: LocationNode[];
}

export const RAJASTHAN_LOCATIONS: LocationNode[] = [
  {
    name: "Jaipur",
    served: true,
    slug: "jaipur",
    children: [
      { name: "Jaipur City", served: true, slug: "jaipur" },
      { name: "Chomu", served: false },
      { name: "Kotputli", served: false },
      { name: "Phulera", served: false },
    ]
  },
  {
    name: "Jodhpur",
    served: true, // We serve Jodhpur now
    slug: "jodhpur",
    children: [
      { name: "Jodhpur City", served: true, slug: "jodhpur" },
      { name: "Phalodi", served: false },
      { name: "Bilara", served: false },
      { name: "Piparcity", served: false },
    ]
  },
  {
    name: "Kota",
    served: true,
    slug: "kota",
    children: [
      { name: "Kota City", served: true, slug: "kota" },
      { name: "Ramganj Mandi", served: false },
      { name: "Itawa", served: false },
    ]
  },
  {
    name: "Ajmer",
    served: true,
    slug: "ajmer",
    children: [
      { name: "Ajmer City", served: true, slug: "ajmer" },
      { name: "Beawar", served: false },
      { name: "Kishangarh", served: false },
      { name: "Pushkar", served: false },
    ]
  },
  {
    name: "Udaipur",
    served: false,
    children: [
      { name: "Udaipur City", served: false },
      { name: "Fatehnagar", served: false },
      { name: "Salumbar", served: false },
    ]
  },
  {
    name: "Bikaner",
    served: false,
    children: [
      { name: "Bikaner City", served: false },
      { name: "Nokha", served: false },
      { name: "Deshnoke", served: false },
    ]
  },
  {
    name: "Alwar",
    served: false,
    children: [
      { name: "Alwar City", served: false },
      { name: "Bhiwadi", served: false },
      { name: "Rajgarh", served: false },
    ]
  },
  {
    name: "Sikar",
    served: false,
    children: [
      { name: "Sikar City", served: false },
      { name: "Khatushyamji", served: false },
      { name: "Neem Ka Thana", served: false },
    ]
  },
  {
    name: "Bhilwara",
    served: false,
    children: [
      { name: "Bhilwara City", served: false },
      { name: "Shahpura", served: false },
      { name: "Mandalgarh", served: false },
    ]
  },
  {
    name: "Pali",
    served: false,
    children: [
      { name: "Pali City", served: false },
      { name: "Sojat", served: false },
      { name: "Bali", served: false },
    ]
  },
  // Add an "Other Districts" catch-all to prevent massive list while still allowing waitlist
  {
    name: "Other Districts",
    served: false,
    children: [
      { name: "Enter Pincode Instead", served: false },
    ]
  }
];
