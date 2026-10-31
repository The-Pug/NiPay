// Adapter: gives the designed screens (UserWalletHub, TopUp, MoveMoney, History, Kyc, Disputes) REAL data.
// Everything here comes from the phone's own state (lib/device) or the bank server (/api). Nothing is baked in.
import React, { createContext, useContext, useMemo } from 'react';
import { useDevice, get, set, spendable, addTopupPoints, checkPin, syncNow, refreshWallet } from '../lib/device';
import { api } from '../lib/api';
import { fetchRules } from '../lib/actions';
import { errText } from '../ui';
import type { PaymentRecord, UserWallet } from '../types';

// the designed screens use /user/... names; the real router uses short hash routes
const ROUTES: Record<string, string> = {
  '/user/home': '/', '/user/pay-connect': '/pay', '/user/receive': '/receive', '/user/topup': '/topup',
  '/user/move-money': '/move', '/user/history': '/history', '/user/report-appeal': '/report', '/user/settings': '/more', '/user/signup': '/profile',
};
type Result = { success: boolean; error?: string };

export interface OfflinePaymentContextType {
  wallet: UserWallet;
  payments: PaymentRecord[];
  isOnline: boolean;
  navigateTo: (route: string) => void;
  syncOfflineQueue: () => Promise<string>;
  topUpSendBucket: (amount: number, pin: string) => Promise<Result>;
  sweepToBank: (amount: number) => Promise<Result>;
  submitAppeal: (reason: string, kind: string) => Promise<Result>;
}

const Ctx = createContext<OfflinePaymentContextType | null>(null);

export const OfflinePaymentProvider: React.FC<React.PropsWithChildren<{ online: boolean }>> = ({ children, online }) => {
  const d = useDevice();
  const value = useMemo<OfflinePaymentContextType>(() => {
    const s = d.server ?? {};
    const unsyncedRecv = d.received.filter((x) => !x.synced).length;
    const wallet: UserWallet = {
      id: s.id ?? '', name: d.name, phone: d.phone, bankName: s.bank, region: s.region, kycStatus: s.kyc_status ?? 'PENDING',
      mainAccountBalance: s.main_balance ?? 0, sendBucketPoints: spendable().length, receiveBucketPoints: (s.receive_bucket ?? 0) + unsyncedRecv,
      sendLimit: s.send_limit ?? null, receiveLimit: s.receive_limit ?? null, topupFee: s.topup_fee ?? 0,
      trustScore: d.trust?.score ?? null, lastSyncedAt: d.lastSync ? new Date(d.lastSync).toLocaleString() : 'never',
      daysUntilRenewal: s.days_until_renewal ?? null, gracePeriodDays: s.grace_days ?? null, offlineSuspended: !!s.offline_suspended,
    };
    // settled history from the bank + payments still waiting on this phone
    const pend = (list: typeof d.sent, direction: 'sent' | 'received'): PaymentRecord[] =>
      Object.values(list.filter((x) => !x.synced).reduce((a: Record<string, PaymentRecord>, x) => {
        const k = direction + x.ref;
        (a[k] ??= { id: x.ref, amount: 0, counterpartyName: x.peerName, timestamp: new Date(x.ts).toLocaleString(), status: 'pending', direction, transportMethod: x.transport || 'qr', pointIds: [] }).amount++;
        a[k].pointIds!.push(x.pid);
        return a;
      }, {}));
    const settled: PaymentRecord[] = d.history.map((h: any) => ({
      id: String(h.id), amount: h.amount, counterpartyName: h.counterparty, timestamp: new Date(h.when).toLocaleString(),
      status: h.status === 'paid' ? 'paid' : h.status === 'held' ? 'held' : h.status === 'refused' ? 'refused' : 'pending',
      direction: h.direction, transportMethod: h.transport || 'qr', heldReason: h.reason,
    }));
    const navigateTo = (r: string) => { location.hash = '#' + (ROUTES[r] ?? r); };
    return {
      wallet, payments: [...pend(d.sent, 'sent'), ...pend(d.received, 'received'), ...settled], isOnline: online, navigateTo,
      syncOfflineQueue: async () => { const r = await syncNow(); await refreshWallet(); return r.message; },
      topUpSendBucket: async (amount, pin) => {
        if (!checkPin(pin)) return { success: false, error: 'Wrong PIN.' };
        try {
          const r = await api('/wallet/topup', { body: { amount, pin, unsynced_spent: get().sent.filter((x) => !x.synced).length }, token: d.token });
          addTopupPoints(r.points); set({ server: r.wallet }); await fetchRules();
          return { success: true };
        } catch (e) { return { success: false, error: errText(e) }; }
      },
      sweepToBank: async (amount) => {
        try { const w = await api('/wallet/move-to-main', { body: { amount }, token: d.token }); set({ server: w }); return { success: true }; }
        catch (e) { return { success: false, error: errText(e) }; }
      },
      submitAppeal: async (reason, kind) => {
        try { await api('/appeals', { body: { reason: `[${kind}] ${reason}`, documents: [] }, token: d.token }); return { success: true }; }
        catch (e) { return { success: false, error: errText(e) }; }
      },
    };
  }, [d, online]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useOfflinePayment = (): OfflinePaymentContextType => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOfflinePayment outside provider');
  return c;
};
