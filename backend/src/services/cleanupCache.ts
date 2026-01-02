/**
 * Cleanup Cache Service
 * 
 * Stores cleanup records reported by the frontend.
 * NO RPC calls - all data comes from successful cleanup reports.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PayoutEntry {
  wallet: string;
  accountsClosed: number;
  solReclaimed: number;
  feePaid: number;
  signature: string;
  timestamp: number; // Unix timestamp in seconds
}

export interface CacheData {
  payouts: PayoutEntry[];
  totalSolReclaimed: number;
  totalAccountsClosed: number;
  totalCleanups: number;
  lastUpdated: number;
}

// Persistent storage file path
const STORAGE_FILE = path.join(__dirname, '../../.cleanup-data.json');

interface StorageData {
  payouts: PayoutEntry[];
  totalSolReclaimed: number;
  totalAccountsClosed: number;
  seenSignatures: Set<string>;
}

// In-memory cache
let storageData: StorageData = {
  payouts: [],
  totalSolReclaimed: 0,
  totalAccountsClosed: 0,
  seenSignatures: new Set(),
};

/**
 * Load storage from disk
 */
function loadStorage(): void {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      
      storageData = {
        payouts: parsed.payouts || [],
        totalSolReclaimed: parsed.totalSolReclaimed || 0,
        totalAccountsClosed: parsed.totalAccountsClosed || 0,
        seenSignatures: new Set(parsed.seenSignatures || []),
      };
      
      console.log(`[CleanupCache] Loaded ${storageData.payouts.length} cleanups, ${storageData.totalSolReclaimed.toFixed(4)} SOL total`);
    } else {
      console.log('[CleanupCache] No existing data file, starting fresh');
    }
  } catch (e) {
    console.error('[CleanupCache] Failed to load storage:', e);
  }
}

/**
 * Save storage to disk
 */
function saveStorage(): void {
  try {
    const dataToSave = {
      payouts: storageData.payouts.slice(-100), // Keep last 100 for display
      totalSolReclaimed: storageData.totalSolReclaimed,
      totalAccountsClosed: storageData.totalAccountsClosed,
      seenSignatures: Array.from(storageData.seenSignatures).slice(-500), // Keep last 500 sigs
    };
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(dataToSave, null, 2));
  } catch (e) {
    console.error('[CleanupCache] Failed to save storage:', e);
  }
}

// Load on startup
loadStorage();

/**
 * Report a successful cleanup
 * Called by the frontend after a successful reclaim
 */
export function reportCleanup(entry: {
  wallet: string;
  accountsClosed: number;
  solReclaimed: number;
  feePaid: number;
  signature: string;
}): { success: boolean; duplicate?: boolean } {
  // Check for duplicate
  if (storageData.seenSignatures.has(entry.signature)) {
    console.log(`[CleanupCache] Duplicate signature ignored: ${entry.signature.slice(0, 8)}...`);
    return { success: true, duplicate: true };
  }
  
  // Add to storage
  const payout: PayoutEntry = {
    wallet: entry.wallet,
    accountsClosed: entry.accountsClosed,
    solReclaimed: entry.solReclaimed,
    feePaid: entry.feePaid,
    signature: entry.signature,
    timestamp: Math.floor(Date.now() / 1000),
  };
  
  storageData.payouts.unshift(payout); // Add to front (most recent first)
  storageData.totalSolReclaimed += entry.solReclaimed;
  storageData.totalAccountsClosed += entry.accountsClosed;
  storageData.seenSignatures.add(entry.signature);
  
  // Keep payouts list manageable
  if (storageData.payouts.length > 100) {
    storageData.payouts = storageData.payouts.slice(0, 100);
  }
  
  // Persist to disk
  saveStorage();
  
  console.log(`[CleanupCache] Recorded cleanup: ${entry.wallet.slice(0, 8)}... | ${entry.accountsClosed} accounts | ${entry.solReclaimed.toFixed(4)} SOL`);
  
  return { success: true };
}

/**
 * Get cached data for API responses
 */
export function getCachedData(): CacheData {
  return {
    payouts: storageData.payouts,
    totalSolReclaimed: storageData.totalSolReclaimed,
    totalAccountsClosed: storageData.totalAccountsClosed,
    totalCleanups: storageData.seenSignatures.size,
    lastUpdated: Date.now(),
  };
}

/**
 * Get recent payouts (for display)
 */
export function getRecentPayouts(limit: number = 10): PayoutEntry[] {
  return storageData.payouts.slice(0, limit);
}

/**
 * Get stats
 */
export function getStats(): {
  totalSolReclaimed: number;
  totalAccountsClosed: number;
  totalCleanups: number;
} {
  return {
    totalSolReclaimed: storageData.totalSolReclaimed,
    totalAccountsClosed: storageData.totalAccountsClosed,
    totalCleanups: storageData.seenSignatures.size,
  };
}
