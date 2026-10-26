import {
  AirVent,
  ArrowUpDown,
  Ban,
  Bath,
  BatteryCharging,
  Cctv,
  CigaretteOff,
  Clock,
  CookingPot,
  DoorOpen,
  Drill,
  Droplet,
  Droplets,
  Dumbbell,
  FireExtinguisher,
  Fence,
  Flower2,
  Gauge,
  Clapperboard,
  Hammer,
  Heart,
  House,
  KeyRound,
  LampCeiling,
  LayoutGrid,
  Mars,
  PartyPopper,
  PawPrint,
  PhoneCall,
  PlugZap,
  Receipt,
  ShieldCheck,
  Shirt,
  SquareParking,
  Sun,
  ThermometerSun,
  Trash2,
  UserX,
  Users,
  Venus,
  VolumeX,
  Warehouse,
  Waves,
  Wifi,
  Zap,
  BrickWall,
  createLucideIcon,
  type LucideIcon,
} from "lucide-react";

const ShowerCubicle = createLucideIcon("ShowerCubicle", [
  ["path", { key: "center", d: "M12 22V11.5" }],
  ["path", { key: "top", d: "m2.5 6 9.5 5.5L21.5 6" }],
  ["path", { key: "walls", d: "M2.5 6v11L12 22l9.5-5V6" }],
  ["path", { key: "pipe", d: "M5.5 10V5a2.5 2.5 0 0 1 2.5-2.5h1" }],
  ["path", { key: "showerhead", d: "M9 2.5a1.5 1.5 0 1 1 3 0v1h2a1 1 0 0 1 0 2h-4" }],
  ["path", { key: "control", d: "M4.5 10.5h2" }],
]);

const BuiltInKitchen = createLucideIcon("BuiltInKitchen", [
  ["rect", { key: "upper-cabinets", x: "2.5", y: "3", width: "19", height: "5", rx: "0.5" }],
  ["path", { key: "upper-dividers", d: "M8.5 3v5M15.5 3v5M1.5 10.5h21" }],
  ["rect", { key: "lower-cabinets", x: "2.5", y: "13", width: "19", height: "8", rx: "0.5" }],
  ["path", { key: "lower-dividers", d: "M8.5 13v8M15.5 13v8M2.5 17h6M8.5 17h7M15.5 17h6" }],
  ["path", { key: "handles", d: "M6.5 5.5v.01M13.5 5.5v.01M5.5 15v.01M12 15v.01M19 15v.01M5.5 19v.01M19 19v.01" }],
]);

export interface PropertyFeatureIconItem {
  label: string;
  icon: LucideIcon;
  prohibited?: boolean;
}

export interface PropertyFeatureIconGroup {
  title: string;
  description: string;
  items: PropertyFeatureIconItem[];
}

export const propertyFeatureIconGroups: PropertyFeatureIconGroup[] = [
  {
    title: "What this place offers",
    description: "Features and amenities available at the property.",
    items: [
      { label: "Borehole", icon: Drill },
      { label: "Water heater", icon: ThermometerSun },
      { label: "Solar panel", icon: Sun },
      { label: "Swimming pool", icon: Waves },
      { label: "Generator", icon: PlugZap },
      { label: "Air conditioning", icon: AirVent },
      { label: "CCTV", icon: Cctv },
      { label: "Wi-Fi", icon: Wifi },
      { label: "Parking space", icon: SquareParking },
      { label: "Inverter", icon: BatteryCharging },
      { label: "Wardrobes", icon: Shirt },
      { label: "En-suite bathroom", icon: Bath },
      { label: "Bathtub", icon: Bath },
      { label: "Shower cubicle", icon: ShowerCubicle },
      { label: "Store room", icon: Warehouse },
      { label: "Gym", icon: Dumbbell },
      { label: "Balcony", icon: DoorOpen },
      { label: "Garden", icon: Flower2 },
      { label: "24-hour security", icon: ShieldCheck },
      { label: "24-hour electricity supply", icon: Zap },
      { label: "POP ceiling", icon: LampCeiling },
      { label: "Elevator", icon: ArrowUpDown },
      { label: "Boys’ quarters (BQ)", icon: House },
      { label: "Fitted kitchen", icon: BuiltInKitchen },
      { label: "Fenced compound", icon: Fence },
      { label: "Fire extinguisher", icon: FireExtinguisher },
      { label: "Interlocked compound", icon: BrickWall },
      { label: "Cinema", icon: Clapperboard },
      { label: "Intercom system", icon: PhoneCall },
      { label: "Tiled floors", icon: LayoutGrid },
      { label: "Running water", icon: Droplets },
      { label: "Personal prepaid meter", icon: Gauge },
    ],
  },
  {
    title: "House rules",
    description: "Restrictions and visitor policies for the property.",
    items: [
      { label: "No pets allowed", icon: PawPrint, prohibited: true },
      { label: "No noise", icon: VolumeX },
      { label: "Female only", icon: Venus },
      { label: "Men only", icon: Mars },
      { label: "Married couples only", icon: Heart },
      { label: "No cooking in rooms", icon: CookingPot, prohibited: true },
      { label: "No subletting", icon: KeyRound, prohibited: true },
      { label: "No parties or events", icon: PartyPopper, prohibited: true },
      { label: "No unauthorized alterations", icon: Hammer, prohibited: true },
      { label: "No unauthorized visitors", icon: UserX },
      { label: "No roommate allowed", icon: Users, prohibited: true },
      { label: "Visitation time applies", icon: Clock },
      { label: "Visitors not allowed", icon: Users, prohibited: true },
      { label: "No smoking", icon: CigaretteOff },
    ],
  },
  {
    title: "Bills & fees",
    description: "Utilities and recurring charges to consider.",
    items: [
      { label: "Electric bill", icon: Zap },
      { label: "Water bill", icon: Droplet },
      { label: "Waste disposal fee", icon: Trash2 },
      { label: "Security fee", icon: ShieldCheck },
      { label: "Service charge", icon: Receipt },
    ],
  },
];

const normalizeFeatureLabel = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]/g, "");

const propertyFeatureByLabel = new Map(
  propertyFeatureIconGroups.flatMap((group) =>
    group.items.map((item) => [normalizeFeatureLabel(item.label), item]),
  ),
);

const featureLabelAliases = new Map([
  ["mariedcouplesonly", "marriedcouplesonly"],
  ["noloudmusicorexcessivenoise", "nonoise"],
  ["noexcessivenoise", "nonoise"],
  ["nosmokinginsidetheproperty", "nosmoking"],
  ["visitorsarenotallowed", "visitorsnotallowed"],
  ["unauthorizedvisitorsnotallowed", "nounauthorizedvisitors"],
  ["interlock", "interlockedcompound"],
  ["hometheater", "cinema"],
]);

export const getPropertyFeatureItem = (label: string) => {
  const normalizedLabel = normalizeFeatureLabel(label);
  const canonicalLabel =
    featureLabelAliases.get(normalizedLabel) ?? normalizedLabel;
  return propertyFeatureByLabel.get(canonicalLabel);
};

export const getPropertyFeatureIcon = (label: string) =>
  getPropertyFeatureItem(label)?.icon;

export { Ban };