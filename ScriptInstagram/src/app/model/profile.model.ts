export interface StringListEntry {
  href: string;
  value: string;
  timestamp?: number;
}

export interface RawProfileBucket {
  title?: string;
  string_list_data?: StringListEntry[];
}

export type RawFollowersPayload = RawProfileBucket[];

export interface RawFollowingPayload {
  relationships_following: RawProfileBucket[];
}

export interface ProfileHandle {
  username: string;
  url: string;
  timestamp?: number;
}

export interface ComparisonResult {
  followers: ProfileHandle[];
  following: ProfileHandle[];
  fans: ProfileHandle[];
  perros: ProfileHandle[];
  mutuals: number;
}
