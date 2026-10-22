import {
  ArrowUpDown,
  Bath,
  Ban,
  BatteryCharging,
  Camera,
  CarFront,
  Clock3,
  CookingPot,
  Droplet,
  Droplets,
  Dumbbell,
  Fence,
  Gauge,
  Heater,
  House,
  Layers,
  Mars,
  PanelsTopLeft,
  PawPrint,
  Phone,
  PlugZap,
  Receipt,
  Recycle,
  ShieldCheck,
  Shirt,
  Sun,
  TreePine,
  UsersRound,
  Venus,
  VolumeX,
  Waves,
  Wifi,
  Wind,
  Zap,
  Cigarette,
  PartyPopper,
  Hammer,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";

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
      { label: "Borehole", icon: Droplets },
      { label: "Water heater", icon: Heater },
      { label: "Solar panel", icon: Sun },
      { label: "Swimming pool", icon: Waves },
      { label: "Generator", icon: Zap },
      { label: "Air conditioning", icon: Wind },
      { label: "CCTV", icon: Camera },
      { label: "Wi-Fi", icon: Wifi },
      { label: "Parking space", icon: CarFront },
      { label: "Inverter", icon: BatteryCharging },
      { label: "Wardrobes", icon: Shirt },
      { label: "En-suite bathroom", icon: Bath },
      { label: "Gym", icon: Dumbbell },
      { label: "Balcony", icon: PanelsTopLeft },
      { label: "Garden", icon: TreePine },
      { label: "24-hour security", icon: ShieldCheck },
      { label: "24-hour electricity supply", icon: PlugZap },
      { label: "POP ceiling", icon: Layers },
      { label: "Elevator", icon: ArrowUpDown },
      { label: "Boys’ quarters (BQ)", icon: House },
      { label: "Fitted kitchen", icon: CookingPot },
      { label: "Fenced compound", icon: Fence },
      { label: "Intercom system", icon: Phone },
      { label: "Tiled floors", icon: Layers },
      { label: "Running water", icon: Droplet },
      { label: "Personal prepaid meter", icon: Gauge },
    ],
  },
  {
    title: "House rules",
    description: "Restrictions and visitor policies for the property.",
    items: [
      { label: "No pets allowed", icon: PawPrint, prohibited: true },
      { label: "No noise", icon: VolumeX, prohibited: true },
      { label: "Female only", icon: Venus, prohibited: true },
      { label: "Men only", icon: Mars, prohibited: true },
      { label: "Married couples only", icon: UsersRound, prohibited: true },
      { label: "No cooking in rooms", icon: CookingPot, prohibited: true },
      { label: "No subletting", icon: House, prohibited: true },
      { label: "No parties or events", icon: PartyPopper, prohibited: true },
      { label: "No unauthorized alterations", icon: Hammer, prohibited: true },
      { label: "No unauthorized visitors", icon: UserRoundX, prohibited: true },
      { label: "Visitation time applies", icon: Clock3 },
      { label: "Visitors not allowed", icon: UserRoundX, prohibited: true },
      { label: "No smoking", icon: Cigarette, prohibited: true },
    ],
  },
  {
    title: "Bills & fees",
    description: "Utilities and recurring charges to consider.",
    items: [
      { label: "Electric bill", icon: Zap },
      { label: "Water bill", icon: Droplet },
      { label: "Waste disposal fee", icon: Recycle },
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
