export type Role = "donor" | "hospital" | "fractionator";
export interface Profile {
  id: string;
  role: Role;
  name: string;
  email: string;
  city: string;
  blood_group: string;
  age: number;
  organization: string;
  license_number: string;
  status: string;
  review_note?: string;
}
export interface Camp {
  id: string;
  title: string;
  city: string;
  address: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  kind: string;
  status: string;
  organization?: string;
}
export interface Booking {
  id: string;
  camp_id: string;
  status: string;
  title: string;
  city: string;
  address: string;
  starts_at: string;
  ends_at: string;
  kind: string;
  camp_status: string;
  organization?: string;
  donor_name?: string;
  blood_group?: string;
}
export interface Donation {
  id: string;
  donated_at: string;
  kind: string;
  status: string;
  reference: string;
  organization: string;
  donor_name?: string;
}
export interface Claim {
  id: string;
  reward_id: string;
  status: string;
  created_at: string;
  year: number;
  name?: string;
}
export interface Reward {
  id: string;
  title: string;
  tier: string;
  description: string;
  kind: string;
  enabled: boolean;
  provider?: string;
  details?: string;
}
export interface PlasmaRequest {
  id: string;
  title: string;
  city: string;
  litres: number;
  required_by: string;
  requirements: string;
  status: string;
  organization?: string;
}
export interface Response {
  id: string;
  request_id: string;
  status: string;
  message: string;
  title?: string;
  organization?: string;
  city?: string;
}
export interface Dashboard {
  profile: Profile | null;
  identity?: { id: string; name: string; email: string };
  isAdmin: boolean;
  rewardCatalog: Reward[];
  camps?: Camp[];
  bookings?: Booking[];
  donations?: Donation[];
  claims?: Claim[];
  requests?: PlasmaRequest[];
  responses?: Response[];
  rewards?: {
    tier: string;
    count: number;
    plasma: number;
    next: number | null;
    remaining: number | null;
    windowStart: string;
  };
}
export const roleNames: Record<Role, string> = {
  donor: "Blood donor",
  hospital: "Hospital",
  fractionator: "Plasma fractionator",
};
export const tierNames: Record<string, string> = {
  welcome: "Welcome",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  plasma_elite: "Plasma Elite",
};
export const tierRank: Record<string, number> = {
  welcome: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  plasma_elite: 4,
};
export const date = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const time = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
