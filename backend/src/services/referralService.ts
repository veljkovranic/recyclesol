/**
 * Referral Service
 * 
 * Manages referral codes, wallet mappings, and tracking statistics.
 * Uses a JSON file for persistent storage (simple, no database required).
 * 
 * Features:
 * - Generate short, memorable referral codes
 * - Map codes to wallet addresses
 * - Track referral usage and earnings
 * - Prevent self-referrals
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface ReferralRecord {
  /** The short referral code */
  code: string;
  /** The wallet address this code belongs to */
  walletAddress: string;
  /** When the code was created */
  createdAt: string;
  /** Number of successful referrals */
  referralCount: number;
  /** Total SOL earned from referrals (in lamports) */
  totalEarningsLamports: number;
  /** List of referred wallet addresses */
  referredWallets: string[];
}

export interface ReferralStats {
  code: string;
  walletAddress: string;
  referralCount: number;
  totalEarningsSol: number;
  referralLink: string;
}

interface ReferralStorage {
  /** Map of code -> ReferralRecord */
  byCode: Record<string, ReferralRecord>;
  /** Map of walletAddress -> code (for quick lookup) */
  byWallet: Record<string, string>;
  /** Global stats */
  stats: {
    totalReferrals: number;
    totalEarningsLamports: number;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const STORAGE_FILE = process.env.REFERRAL_STORAGE_PATH || 
  path.join(__dirname, '../../data/referrals.json');

const BASE_URL = process.env.BASE_URL || 'https://pumpcleanup.com';

// Code generation settings
const CODE_LENGTH = 6;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: 0,O,1,I

// ============================================================================
// STORAGE
// ============================================================================

let storage: ReferralStorage = {
  byCode: {},
  byWallet: {},
  stats: {
    totalReferrals: 0,
    totalEarningsLamports: 0,
  },
};

/**
 * Ensures the data directory exists
 */
function ensureDataDir(): void {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Loads referral data from disk
 */
function loadStorage(): void {
  try {
    ensureDataDir();
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      storage = JSON.parse(data);
      console.log(`[Referral] Loaded ${Object.keys(storage.byCode).length} referral codes`);
    }
  } catch (error) {
    console.error('[Referral] Failed to load storage:', error);
  }
}

/**
 * Saves referral data to disk
 */
function saveStorage(): void {
  try {
    ensureDataDir();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
  } catch (error) {
    console.error('[Referral] Failed to save storage:', error);
  }
}

// Load on startup
loadStorage();

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Generates a random referral code
 */
function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/**
 * Generates a unique code that doesn't exist yet
 */
function generateUniqueCode(): string {
  let code = generateCode();
  let attempts = 0;
  while (storage.byCode[code] && attempts < 100) {
    code = generateCode();
    attempts++;
  }
  return code;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Gets or creates a referral code for a wallet address
 */
export function getOrCreateCode(walletAddress: string): ReferralRecord {
  // Check if wallet already has a code
  const existingCode = storage.byWallet[walletAddress];
  if (existingCode && storage.byCode[existingCode]) {
    return storage.byCode[existingCode];
  }

  // Generate new code
  const code = generateUniqueCode();
  const record: ReferralRecord = {
    code,
    walletAddress,
    createdAt: new Date().toISOString(),
    referralCount: 0,
    totalEarningsLamports: 0,
    referredWallets: [],
  };

  // Store
  storage.byCode[code] = record;
  storage.byWallet[walletAddress] = code;
  saveStorage();

  console.log(`[Referral] Created new code ${code} for wallet ${walletAddress.slice(0, 8)}...`);
  return record;
}

/**
 * Resolves a referral code to a wallet address
 */
export function resolveCode(code: string): string | null {
  // Normalize code (uppercase, trim)
  const normalizedCode = code.toUpperCase().trim();
  
  const record = storage.byCode[normalizedCode];
  if (record) {
    return record.walletAddress;
  }
  
  // Also check if it's a raw wallet address (backward compatibility)
  // Solana addresses are 32-44 chars base58
  if (code.length >= 32 && code.length <= 44) {
    return code;
  }
  
  return null;
}

/**
 * Gets the referral code for a wallet (if exists)
 */
export function getCodeForWallet(walletAddress: string): string | null {
  return storage.byWallet[walletAddress] || null;
}

/**
 * Records a successful referral
 */
export function recordReferral(
  referrerCode: string,
  referredWallet: string,
  earningsLamports: number
): boolean {
  const normalizedCode = referrerCode.toUpperCase().trim();
  const record = storage.byCode[normalizedCode];
  
  if (!record) {
    console.warn(`[Referral] Unknown referral code: ${referrerCode}`);
    return false;
  }

  // Prevent self-referral
  if (record.walletAddress === referredWallet) {
    console.warn(`[Referral] Self-referral blocked for ${referredWallet.slice(0, 8)}...`);
    return false;
  }

  // Prevent duplicate referrals (same wallet can only be referred once)
  if (record.referredWallets.includes(referredWallet)) {
    console.log(`[Referral] Wallet already referred: ${referredWallet.slice(0, 8)}...`);
    // Still count the earnings though
  } else {
    record.referredWallets.push(referredWallet);
    record.referralCount++;
    storage.stats.totalReferrals++;
  }

  record.totalEarningsLamports += earningsLamports;
  storage.stats.totalEarningsLamports += earningsLamports;
  
  saveStorage();
  
  console.log(`[Referral] Recorded referral: ${normalizedCode} earned ${earningsLamports / 1e9} SOL from ${referredWallet.slice(0, 8)}...`);
  return true;
}

/**
 * Gets stats for a referral code
 */
export function getStats(code: string): ReferralStats | null {
  const normalizedCode = code.toUpperCase().trim();
  const record = storage.byCode[normalizedCode];
  
  if (!record) {
    return null;
  }

  return {
    code: record.code,
    walletAddress: record.walletAddress,
    referralCount: record.referralCount,
    totalEarningsSol: record.totalEarningsLamports / 1e9,
    referralLink: `${BASE_URL}?ref=${record.code}`,
  };
}

/**
 * Gets stats for a wallet address
 */
export function getStatsByWallet(walletAddress: string): ReferralStats | null {
  const code = storage.byWallet[walletAddress];
  if (!code) {
    return null;
  }
  return getStats(code);
}

/**
 * Gets global referral statistics
 */
export function getGlobalStats() {
  return {
    totalCodes: Object.keys(storage.byCode).length,
    totalReferrals: storage.stats.totalReferrals,
    totalEarningsSol: storage.stats.totalEarningsLamports / 1e9,
  };
}

/**
 * Gets the full referral link for a code
 * Uses path format: pumpcleanup.com/XXXXXX
 */
export function getReferralLink(code: string): string {
  return `${BASE_URL}/${code}`;
}

