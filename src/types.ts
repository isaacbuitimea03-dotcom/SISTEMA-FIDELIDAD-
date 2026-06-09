export interface UserSession {
  id: string;
  folio?: string; // Folio between "000" and "500"
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  currentStamps: number;
  totalStampsEarned: number;
  points: number;
  unlockedVouchers: Voucher[];
}

export interface VisitRecord {
  id: string;
  timestamp: string;
  stampsAdded: number;
  clerkName: string;
  clerkCode: string;
  customerFolio: string;
  customerName: string;
}

export interface RegisteredCustomer {
  folio: string; // "000" to "500"
  name: string;
  phone: string;
  email: string;
  birthday: string; // "YYYY-MM-DD"
  currentStamps: number;
  totalStampsEarned: number;
  points: number;
  unlockedVouchers: Voucher[];
  visitsHistory: VisitRecord[];
}

export interface ActivityLog {
  id: string;
  type: 'stamp_added' | 'reward_unlocked' | 'voucher_redeemed';
  amount: number;
  title: string;
  description: string;
  timestamp: string;
  clerkName?: string;
  clerkCode?: string;
  customerFolio?: string;
}

export interface RewardOption {
  id: string;
  title: string;
  description: string;
  costInStamps?: number;
  costInPoints?: number;
  category: 'coffee' | 'food' | 'dessert' | 'special';
  image: string;
}

export interface Voucher {
  id: string;
  rewardId: string;
  title: string;
  code: string;
  isRedeemed: boolean;
  unlockedAt: string;
  redeemedAt?: string;
}

export interface MerchantConfig {
  pin: string;
  shopName: string;
  brandColor: string;
  stampsRequired: number;
  mainRewardTitle: string;
}
