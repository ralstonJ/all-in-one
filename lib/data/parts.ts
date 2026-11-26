/**
 * Mock value of auto spare parts used on jobs in 2026 (Jan..Nov), at cost.
 * Values are whole dirhams (AED). Body shop parts follow the mid-year collision peak;
 * EV / HV components grow through the year in line with the HV bay workload.
 */

export const PARTS_CURRENCY = "AED";
export const PARTS_YEAR = 2026;
export const PARTS_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

export type PartsCategory = {
  category: string;
  /** Workshop area that mostly consumes it. */
  area: "Body Shop" | "Mechanical" | "EV & High Voltage";
  monthly: number[];
};

export const PARTS_CATEGORIES: PartsCategory[] = [
  {
    category: "Panels & body parts",
    area: "Body Shop",
    monthly: [4120, 3680, 3390, 3150, 3520, 4480, 4890, 4310, 3640, 3380, 3960],
  },
  {
    category: "Paint & refinish consumables",
    area: "Body Shop",
    monthly: [1480, 1310, 1220, 1140, 1290, 1620, 1760, 1580, 1330, 1210, 1430],
  },
  {
    category: "Mechanical parts",
    area: "Mechanical",
    monthly: [2260, 2410, 2790, 2630, 2380, 2210, 2320, 2540, 2690, 2980, 2810],
  },
  {
    category: "Brakes, filters & fluids",
    area: "Mechanical",
    monthly: [910, 960, 1080, 1030, 950, 890, 930, 1010, 1060, 1170, 1120],
  },
  {
    category: "Electrical & ADAS",
    area: "Mechanical",
    monthly: [830, 870, 920, 990, 1060, 1140, 1050, 980, 960, 1010, 1040],
  },
  {
    category: "EV & HV components",
    area: "EV & High Voltage",
    monthly: [620, 690, 780, 860, 970, 1120, 1260, 1410, 1530, 1720, 1890],
  },
  {
    category: "Tyres & batteries",
    area: "Mechanical",
    monthly: [740, 710, 790, 820, 880, 960, 990, 870, 810, 840, 930],
  },
];

export type TopPart = {
  part: string;
  category: string;
  qty: number;
  value: number; // year to date
};

export const TOP_PARTS: TopPart[] = [
  { part: "Front bumper cover (assorted)", category: "Panels & body parts", qty: 142, value: 5864 },
  { part: "Headlamp assembly (LED)", category: "Panels & body parts", qty: 96, value: 5280 },
  { part: "HV battery module", category: "EV & HV components", qty: 14, value: 4620 },
  { part: "2K clear coat & hardener", category: "Paint & refinish consumables", qty: 410, value: 3198 },
  { part: "Windscreen with ADAS bracket", category: "Electrical & ADAS", qty: 38, value: 2812 },
  { part: "Brake pads & rotors (axle set)", category: "Brakes, filters & fluids", qty: 264, value: 2640 },
  { part: "Radiator & condenser", category: "Mechanical parts", qty: 71, value: 2485 },
  { part: "Door shell", category: "Panels & body parts", qty: 44, value: 2376 },
  { part: "On-board charger", category: "EV & HV components", qty: 11, value: 2145 },
  { part: "Clutch kit", category: "Mechanical parts", qty: 39, value: 1911 },
];
