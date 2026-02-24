
export interface Voice {
  id: string;
  label: string;
  gender?: 'male' | 'female' | 'other';
  isFavorite?: boolean;
  isCustom?: boolean;
}

export interface UsageEntry {
  timestamp: number;
  chars: number;
}

export interface AudioPart {
  partNumber: number;
  url: string;
  blob: Blob;
  text: string;
}

export interface UsageStats {
  today: { chars: number; cost: number };
  week: { chars: number; cost: number };
  total: { chars: number; cost: number };
}

export interface SubscriptionInfo {
  character_count: number;
  character_limit: number;
  remaining_characters: number;
  reset_at_unix: number;
  status: string;
  tier: string;
}

export interface ApiUsageResponse {
  character_stats_by_day: {
    unix_timestamp: number;
    character_count: number;
  }[];
}

export interface UserInfo {
  email: string;
  subscription: SubscriptionInfo;
}

export interface AdminKey {
  id: string;
  key: string;
  label: string;
  email?: string;
  firstName?: string;
  isValid?: boolean;
  subscription?: SubscriptionInfo;
  voicesCount?: number;
  historyCount?: number;
}
