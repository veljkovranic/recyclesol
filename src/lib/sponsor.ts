/**
 * Sponsor API Client
 * 
 * Handles communication with the backend sponsor wallet service.
 * When users have insufficient SOL for fees but have recoverable accounts,
 * the sponsor wallet can pay for their transaction fees.
 */

// Backend API URL - defaults to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// ============================================================================
// TYPES
// ============================================================================

export interface SponsorCheckResult {
  needsSponsorship: boolean;
  canSponsor: boolean;
  sponsorWallet: string | null;
  userBalanceLamports: number;
  estimatedFeeLamports?: number;
  reason?: string;
}

export interface SponsorSignResult {
  signedTransaction: string; // base64 encoded
  sponsorWallet: string;
  estimatedFeeLamports: number;
}

export interface SponsorStatus {
  enabled: boolean;
  publicKey: string | null;
  dailySpent: number;
  dailyLimit: number;
  perTxLimit: number;
  balanceLamports: number;
  balanceSol: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Check sponsor service status
 */
export async function getSponsorStatus(): Promise<SponsorStatus | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sponsor/status`);
    const data = await response.json();
    
    if (!data.success) {
      console.warn('[Sponsor] Status check failed:', data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('[Sponsor] Failed to get status:', error);
    return null;
  }
}

/**
 * Check if a user qualifies for gas sponsorship
 */
export async function checkSponsorEligibility(
  userWallet: string,
  recoverableAmountLamports: number,
  estimatedFeeLamports?: number
): Promise<SponsorCheckResult | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sponsor/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userWallet,
        recoverableAmountLamports,
        estimatedFeeLamports: estimatedFeeLamports || 5000,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.warn('[Sponsor] Eligibility check failed:', data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('[Sponsor] Failed to check eligibility:', error);
    return null;
  }
}

/**
 * Sign a transaction with the sponsor wallet as fee payer
 * 
 * @param transactionBase64 - The serialized transaction (base64)
 * @param userWallet - The user's wallet address
 * @param recoverableAmountLamports - Total lamports being recovered
 * @returns The partially signed transaction (sponsor signed, needs user signature)
 */
export async function signWithSponsor(
  transactionBase64: string,
  userWallet: string,
  recoverableAmountLamports: number
): Promise<SponsorSignResult | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sponsor/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction: transactionBase64,
        userWallet,
        recoverableAmountLamports,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.warn('[Sponsor] Sign request failed:', data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('[Sponsor] Failed to sign transaction:', error);
    return null;
  }
}

/**
 * Check if sponsor service is available (quick check)
 */
export async function isSponsorAvailable(): Promise<boolean> {
  try {
    const status = await getSponsorStatus();
    return status?.enabled ?? false;
  } catch {
    return false;
  }
}

// ============================================================================
// CLEANUP REPORTING
// ============================================================================

/**
 * Report a successful cleanup to the backend
 * This is used for tracking recent cleanups without RPC calls
 */
export async function reportCleanup(data: {
  wallet: string;
  accountsClosed: number;
  solReclaimed: number;
  feePaid: number;
  signature: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/report-cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.warn('[Sponsor] Report cleanup failed:', result.error);
      return false;
    }
    
    console.log('[Sponsor] Cleanup reported successfully');
    return true;
  } catch (error) {
    console.error('[Sponsor] Failed to report cleanup:', error);
    return false;
  }
}

