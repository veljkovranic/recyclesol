/**
 * useReferral Hook
 * 
 * Manages the referral system for PumpCleanup:
 * - Detects referral codes from URL parameters (supports short codes)
 * - Resolves short codes to wallet addresses via API
 * - Stores referrer in localStorage (persists across sessions)
 * - Fetches short referral codes for sharing
 * - Tracks referral statistics
 * 
 * IMPORTANT: On mobile, wallet deeplinks open the dApp in an in-app browser
 * with separate localStorage. We keep the ?ref= param in the URL until
 * the wallet is connected to ensure referrals survive the deeplink flow.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  REFERRAL_STORAGE_KEY,
  REFERRAL_PARAM,
  REFERRAL_SHARE_PERCENTAGE,
  FEE_PERCENTAGE,
  API_BASE_URL,
} from '@/lib/constants';
import { isValidPublicKey } from '@/lib/solana';

// ============================================================================
// TYPES
// ============================================================================

export interface ReferralStats {
  referralCount: number;
  totalEarningsSol: number;
}

export interface UseReferralReturn {
  /** The referrer's wallet address (if any) */
  referrer: PublicKey | null;
  /** The referrer's wallet address as string */
  referrerAddress: string | null;
  /** The referrer's short code (if any) */
  referrerCode: string | null;
  /** Whether user was referred by someone */
  hasReferrer: boolean;
  /** The current user's referral link (with short code) */
  referralLink: string;
  /** The current user's short referral code */
  referralCode: string | null;
  /** Copy referral link to clipboard */
  copyReferralLink: () => Promise<boolean>;
  /** Clear stored referrer */
  clearReferrer: () => void;
  /** Referral share percentage (what referrers earn) */
  referralSharePercent: number;
  /** Effective referrer fee amount as percentage of total reclaimed */
  referrerFeePercent: number;
  /** User's referral stats (null if not loaded) */
  stats: ReferralStats | null;
  /** Whether stats are loading */
  isLoading: boolean;
  /** Record a referral earning (call after successful tx) */
  recordReferralEarning: (earningsLamports: number) => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Checks if running in browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Gets the referrer from localStorage
 */
function getStoredReferrer(): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Stores the referrer in localStorage
 */
function storeReferrer(address: string): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, address);
  } catch {
    console.warn('Failed to store referrer in localStorage');
  }
}

/**
 * Clears the referrer from localStorage
 */
function clearStoredReferrer(): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    console.warn('Failed to clear referrer from localStorage');
  }
}

/**
 * Gets referrer from URL parameters
 */
function getReferrerFromUrl(): string | null {
  if (!isBrowser) return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get(REFERRAL_PARAM);
    if (ref && isValidPublicKey(ref)) {
      return ref;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if URL has a referral parameter
 */
function hasUrlReferralParam(): boolean {
  if (!isBrowser) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has(REFERRAL_PARAM);
  } catch {
    return false;
  }
}

/**
 * Removes referral param from URL without page reload
 */
function cleanUrlReferralParam(): void {
  if (!isBrowser) return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has(REFERRAL_PARAM)) {
      url.searchParams.delete(REFERRAL_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // Ignore URL manipulation errors
  }
}

export function useReferral(): UseReferralReturn {
  const { publicKey, connected } = useWallet();
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);
  const [referrerCode, setReferrerCode] = useState<string | null>(null);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [myReferralLink, setMyReferralLink] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasCleanedUrl = useRef(false);
  const hasFetchedCode = useRef(false);

  // Parse referrer as PublicKey
  const referrer = useMemo(() => {
    if (!referrerAddress) return null;
    try {
      return new PublicKey(referrerAddress);
    } catch {
      return null;
    }
  }, [referrerAddress]);

  // Check if user has a valid referrer (and it's not themselves)
  const hasReferrer = useMemo(() => {
    if (!referrer) return false;
    if (publicKey && referrer.equals(publicKey)) return false;
    return true;
  }, [referrer, publicKey]);

  // Calculate referral earnings percentages
  const referralSharePercent = REFERRAL_SHARE_PERCENTAGE * 100; // e.g., 50
  const referrerFeePercent = FEE_PERCENTAGE * REFERRAL_SHARE_PERCENTAGE * 100; // e.g., 10% (20% fee * 50%)

  /**
   * Resolve a referral code (short code or wallet) to a wallet address via API
   */
  const resolveReferralCode = useCallback(async (code: string): Promise<string | null> => {
    // If it's already a valid wallet address, use it directly
    if (isValidPublicKey(code)) {
      return code;
    }

    // Otherwise, try to resolve via API
    try {
      const response = await fetch(`${API_BASE_URL}/api/referral/resolve/${code}`);
      const data = await response.json();
      if (data.success && data.data?.walletAddress) {
        return data.data.walletAddress;
      }
    } catch (error) {
      console.error('[Referral] Failed to resolve code:', error);
    }
    return null;
  }, []);

  /**
   * Fetch or create a short referral code for the connected wallet
   */
  const fetchMyReferralCode = useCallback(async () => {
    if (!publicKey || hasFetchedCode.current) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/referral/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setMyCode(data.data.code);
        setMyReferralLink(data.data.referralLink);
        setStats(data.data.stats);
        hasFetchedCode.current = true;
        console.log('[Referral] Got short code:', data.data.code);
      }
    } catch (error) {
      console.error('[Referral] Failed to fetch referral code:', error);
      // Fallback to wallet address in path format if API fails
      if (isBrowser) {
        const baseUrl = window.location.origin;
        setMyReferralLink(`${baseUrl}/${publicKey.toBase58()}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Initialize referrer from URL or localStorage on mount
  // IMPORTANT: We do NOT clean the URL here - we wait until wallet connects
  // This ensures referrals survive mobile deeplink flows where the wallet app
  // opens the dApp in its own in-app browser (with separate localStorage)
  useEffect(() => {
    const initReferrer = async () => {
      // First check URL for referrer (highest priority - handles deeplink flow)
      const urlReferrer = getReferrerFromUrl();
      
      if (urlReferrer) {
        // Resolve code to wallet address
        const walletAddress = await resolveReferralCode(urlReferrer);
        
        if (walletAddress) {
          storeReferrer(walletAddress);
          setReferrerAddress(walletAddress);
          setReferrerCode(urlReferrer.toUpperCase());
          console.log('[Referral] Referrer set from URL:', urlReferrer, '->', walletAddress);
        }
        // DON'T clean URL yet - wait for wallet connection
      } else {
        // No URL param - check localStorage for existing referrer
        const storedReferrer = getStoredReferrer();
        if (storedReferrer) {
          // Check if it's already a wallet address
          if (isValidPublicKey(storedReferrer)) {
            setReferrerAddress(storedReferrer);
            console.log('[Referral] Referrer loaded from storage (wallet):', storedReferrer);
          } else {
            // It's a short code - resolve it via API
            console.log('[Referral] Resolving short code from storage:', storedReferrer);
            const walletAddress = await resolveReferralCode(storedReferrer);
            if (walletAddress) {
              // Update storage with the resolved wallet address
              storeReferrer(walletAddress);
              setReferrerAddress(walletAddress);
              setReferrerCode(storedReferrer.toUpperCase());
              console.log('[Referral] Resolved code to wallet:', storedReferrer, '->', walletAddress);
            }
          }
        }
      }
    };

    initReferrer();
  }, [resolveReferralCode]);

  // Fetch short code when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchMyReferralCode();
    } else {
      // Reset when disconnected
      hasFetchedCode.current = false;
      setMyCode(null);
      setMyReferralLink('');
      setStats(null);
    }
  }, [connected, publicKey, fetchMyReferralCode]);

  // Clean URL after wallet connects (referral survived the deeplink flow)
  // This keeps the URL clean after the user has successfully connected
  useEffect(() => {
    if (connected && hasUrlReferralParam() && !hasCleanedUrl.current) {
      // Small delay to ensure localStorage is synced
      const timer = setTimeout(() => {
        cleanUrlReferralParam();
        hasCleanedUrl.current = true;
        console.log('[Referral] Cleaned URL param after wallet connection');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [connected]);

  // Clear referrer if it's the user's own wallet (self-referral prevention)
  useEffect(() => {
    if (publicKey && referrerAddress && publicKey.toBase58() === referrerAddress) {
      console.log('[Referral] Clearing self-referral');
      clearStoredReferrer();
      setReferrerAddress(null);
      setReferrerCode(null);
      // Also clean URL if it had the self-referral
      if (hasUrlReferralParam()) {
        cleanUrlReferralParam();
      }
    }
  }, [publicKey, referrerAddress]);

  /**
   * Copy referral link to clipboard
   */
  const copyReferralLink = useCallback(async (): Promise<boolean> => {
    if (!myReferralLink) return false;
    try {
      await navigator.clipboard.writeText(myReferralLink);
      return true;
    } catch {
      console.error('Failed to copy referral link');
      return false;
    }
  }, [myReferralLink]);

  /**
   * Clear stored referrer
   */
  const clearReferrer = useCallback(() => {
    clearStoredReferrer();
    setReferrerAddress(null);
    setReferrerCode(null);
  }, []);

  /**
   * Record a referral earning (call after successful transaction)
   */
  const recordReferralEarning = useCallback(async (earningsLamports: number) => {
    if (!referrerCode || !publicKey) return;

    try {
      await fetch(`${API_BASE_URL}/api/referral/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerCode,
          referredWallet: publicKey.toBase58(),
          earningsLamports,
        }),
      });
      console.log('[Referral] Recorded earning:', earningsLamports / 1e9, 'SOL');
    } catch (error) {
      console.error('[Referral] Failed to record earning:', error);
    }
  }, [referrerCode, publicKey]);

  return {
    referrer,
    referrerAddress,
    referrerCode,
    hasReferrer,
    referralLink: myReferralLink,
    referralCode: myCode,
    copyReferralLink,
    clearReferrer,
    referralSharePercent,
    referrerFeePercent,
    stats,
    isLoading,
    recordReferralEarning,
  };
}

export default useReferral;

