/**
 * RecentPayouts Component
 * 
 * Displays recent successful recycles from users.
 * Fetches data from the backend API cache.
 */

import React, { useState, useEffect } from 'react';
import { shortenAddress } from '@/lib/solana';

interface PayoutEntry {
  wallet: string;
  accountsClosed: number;
  reward: number;
  signature: string;
  date: Date;
}

interface ApiPayoutEntry {
  wallet: string;
  accountsClosed: number;
  reward: number;
  signature: string;
  timestamp: number;
}

// ============================================================================
// GLOBAL CACHE (fallback + local cache of API response)
// ============================================================================
let cachedPayouts: PayoutEntry[] | null = null;
let cachedTotalSol: number = 0;
let cacheTimestamp: number = 0;
let fetchPromise: Promise<PayoutEntry[]> | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute local cache

// Backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getCachedTotalSolReclaimed(): number {
  return cachedTotalSol;
}

async function fetchPayoutsFromApi(): Promise<PayoutEntry[]> {
  if (cachedPayouts && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return cachedPayouts;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/recent-cleanups`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      
      if (!json.success || !json.data) {
        throw new Error('Invalid API response');
      }

      const payouts: PayoutEntry[] = json.data.payouts.map((p: ApiPayoutEntry) => ({
        wallet: p.wallet,
        accountsClosed: p.accountsClosed,
        reward: p.reward,
        signature: p.signature,
        date: new Date(p.timestamp * 1000),
      }));

      cachedPayouts = payouts;
      cachedTotalSol = json.data.totalSolReclaimed || 0;
      cacheTimestamp = Date.now();

      return payouts;
    } catch (error) {
      console.error('[RecentPayouts] API fetch failed:', error);
      return cachedPayouts || [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RecentPayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutEntry[]>(cachedPayouts || []);
  const [loading, setLoading] = useState(!cachedPayouts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedPayouts && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      setPayouts(cachedPayouts);
      setLoading(false);
      return;
    }

    fetchPayoutsFromApi()
      .then(data => {
        setPayouts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch payouts:', err);
        setError('Failed to load');
        setLoading(false);
      });
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getExplorerLink = (signature: string) => {
    return `https://solscan.io/tx/${signature}`;
  };

  if (loading) {
    return (
      <section className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-recycle-border rounded-2xl p-8 shadow-eco">
          <div className="flex items-center justify-center gap-3 text-recycle-text-secondary">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading recent activity...
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.error('RecentPayouts error:', error);
  }

  const totalSolReclaimed = payouts.reduce((sum, p) => sum + (p.reward), 0);

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold font-display text-recycle-text flex items-center gap-2">
          <img src="/logo.svg" alt="" className="w-6 h-6 rounded" />
          Recent Recycles
        </h3>
        {payouts.length > 0 && (
          <div className="bg-recycle-success/10 border-2 border-recycle-success/20 rounded-lg px-4 py-2">
            <span className="text-xs text-recycle-text-secondary">Total Recycled: </span>
            <span className="text-recycle-success font-bold">{totalSolReclaimed.toFixed(4)} SOL</span>
          </div>
        )}
      </div>
      
      {payouts.length === 0 ? (
        <div className="bg-white border-2 border-recycle-border rounded-2xl p-8 text-center shadow-eco">
          <p className="text-recycle-text-muted">
            {error ? 'Could not load activity' : 'No recycles yet. Be the first!'}
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-recycle-border rounded-2xl overflow-hidden overflow-x-auto shadow-eco">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-2 md:gap-4 px-4 md:px-6 py-4 border-b-2 border-recycle-border text-xs text-recycle-text-muted uppercase tracking-wider bg-recycle-bg">
            <div>Wallet</div>
            <div>Recycled</div>
            <div>Transaction</div>
            <div className="text-right">Date</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-recycle-border">
            {payouts.map((payout) => (
              <div 
                key={payout.signature}
                className="grid grid-cols-4 gap-2 md:gap-4 px-4 md:px-6 py-4 hover:bg-recycle-bg-alt transition-colors items-center"
              >
                <div className="text-sm">
                  <span className="bg-recycle-bg px-2.5 py-1.5 rounded-lg text-recycle-text font-mono text-xs border border-recycle-border">
                    <span className="hidden md:inline">{shortenAddress(payout.wallet, 3)}</span>
                    <span className="md:hidden">{shortenAddress(payout.wallet, 2)}</span>
                  </span>
                </div>
                <div className="text-recycle-primary font-semibold text-sm">
                  {payout.reward.toFixed(4)} SOL
                </div>
                <div>
                  <a
                    href={getExplorerLink(payout.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-recycle-secondary text-sm hover:underline"
                  >
                    <span className="text-recycle-success">✓</span>
                    <span className="hidden md:inline font-mono text-xs">{shortenAddress(payout.signature, 4)}</span>
                    <span className="md:hidden text-xs">View</span>
                  </a>
                </div>
                <div className="hidden md:block text-recycle-text-muted text-xs text-right">
                  {formatDate(payout.date)}
                </div>
                <div className="md:hidden text-right text-recycle-text-muted text-xs">
                  {payout.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default RecentPayouts;
