/**
 * Sponsor Wallet Service
 * 
 * Manages the sponsor wallet that pays for gas fees when users
 * have insufficient balance but have recoverable accounts.
 * 
 * SECURITY NOTES:
 * - The sponsor wallet private key should be stored securely (env var)
 * - Set spending limits to prevent abuse
 * - Monitor balance and alert when low
 */

import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as bs58 from 'bs58';

// Environment variables
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

// Spending limits
const MAX_SPONSOR_PER_TX_LAMPORTS = 10000; // ~0.00001 SOL max per transaction (just gas)
const MAX_DAILY_SPONSOR_LAMPORTS = 100000000; // 0.1 SOL max per day
const MIN_RECOVERABLE_SOL = 0.01; // Only sponsor if user can recover at least this much

// Daily spending tracker
let dailySpent = 0;
let lastResetDate = new Date().toDateString();

// Sponsor wallet instance
let sponsorKeypair: Keypair | null = null;
let connection: Connection | null = null;

/**
 * Initialize the sponsor wallet from environment variable
 */
export function initializeSponsorWallet(): boolean {
  if (!SPONSOR_PRIVATE_KEY) {
    console.warn('[SponsorWallet] SPONSOR_PRIVATE_KEY not set - gas sponsorship disabled');
    return false;
  }

  try {
    // Support both base58 and JSON array formats
    let secretKey: Uint8Array;
    
    if (SPONSOR_PRIVATE_KEY.startsWith('[')) {
      // JSON array format
      const parsed = JSON.parse(SPONSOR_PRIVATE_KEY);
      secretKey = Uint8Array.from(parsed);
    } else {
      // Base58 format
      secretKey = bs58.decode(SPONSOR_PRIVATE_KEY);
    }

    sponsorKeypair = Keypair.fromSecretKey(secretKey);
    connection = new Connection(RPC_ENDPOINT, 'confirmed');
    
    console.log('[SponsorWallet] Initialized with address:', sponsorKeypair.publicKey.toBase58());
    
    // Check initial balance
    checkBalance();
    
    return true;
  } catch (error) {
    console.error('[SponsorWallet] Failed to initialize:', error);
    return false;
  }
}

/**
 * Check and log sponsor wallet balance
 */
export async function checkBalance(): Promise<number> {
  if (!sponsorKeypair || !connection) {
    return 0;
  }

  try {
    const balance = await connection.getBalance(sponsorKeypair.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log(`[SponsorWallet] Balance: ${solBalance.toFixed(4)} SOL`);
    
    if (solBalance < 0.01) {
      console.warn('[SponsorWallet] ⚠️ LOW BALANCE - Please top up the sponsor wallet!');
    }
    
    return balance;
  } catch (error) {
    console.error('[SponsorWallet] Failed to check balance:', error);
    return 0;
  }
}

/**
 * Get the sponsor wallet keypair (for signing)
 */
export function getSponsorKeypair(): Keypair | null {
  return sponsorKeypair;
}

/**
 * Get sponsor wallet public key
 */
export function getSponsorPublicKey(): string | null {
  return sponsorKeypair?.publicKey.toBase58() || null;
}

/**
 * Check if sponsorship is available and within limits
 */
export function canSponsor(estimatedFee: number, recoverableAmount: number): { 
  allowed: boolean; 
  reason?: string;
} {
  // Reset daily counter if new day
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailySpent = 0;
    lastResetDate = today;
    console.log('[SponsorWallet] Daily spending counter reset');
  }

  if (!sponsorKeypair) {
    return { allowed: false, reason: 'Sponsor wallet not configured' };
  }

  if (estimatedFee > MAX_SPONSOR_PER_TX_LAMPORTS) {
    return { allowed: false, reason: 'Transaction fee exceeds per-tx limit' };
  }

  if (dailySpent + estimatedFee > MAX_DAILY_SPONSOR_LAMPORTS) {
    return { allowed: false, reason: 'Daily sponsorship limit reached' };
  }

  if (recoverableAmount < MIN_RECOVERABLE_SOL * LAMPORTS_PER_SOL) {
    return { allowed: false, reason: `Recoverable amount below minimum (${MIN_RECOVERABLE_SOL} SOL)` };
  }

  return { allowed: true };
}

/**
 * Record that a sponsorship was used
 */
export function recordSponsorship(amount: number): void {
  dailySpent += amount;
  console.log(`[SponsorWallet] Sponsored ${amount} lamports. Daily total: ${dailySpent}`);
}

/**
 * Get sponsorship stats
 */
export function getSponsorStats(): {
  enabled: boolean;
  publicKey: string | null;
  dailySpent: number;
  dailyLimit: number;
  perTxLimit: number;
} {
  return {
    enabled: !!sponsorKeypair,
    publicKey: getSponsorPublicKey(),
    dailySpent,
    dailyLimit: MAX_DAILY_SPONSOR_LAMPORTS,
    perTxLimit: MAX_SPONSOR_PER_TX_LAMPORTS,
  };
}

// Export constants for documentation
export const SPONSOR_LIMITS = {
  MAX_PER_TX: MAX_SPONSOR_PER_TX_LAMPORTS,
  MAX_DAILY: MAX_DAILY_SPONSOR_LAMPORTS,
  MIN_RECOVERABLE: MIN_RECOVERABLE_SOL,
};

