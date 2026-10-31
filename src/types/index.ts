export interface UserWallet {
  id: string; name: string; phone: string; bankName?: string; region?: string;
  kycStatus: string;
  mainAccountBalance: number; sendBucketPoints: number; receiveBucketPoints: number;
  sendLimit: number | null; receiveLimit: number | null; topupFee: number;
  trustScore: number | null; lastSyncedAt: string;
  daysUntilRenewal: number | null; gracePeriodDays: number | null; offlineSuspended: boolean;
}

export interface PaymentRecord {
  id: string; amount: number; counterpartyName: string; timestamp: string;
  status: 'pending' | 'paid' | 'held' | 'refused';
  direction: 'sent' | 'received'; transportMethod: string;
  pointIds?: string[]; heldReason?: string;
}
