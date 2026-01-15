/**
 * Solana Wallet Scanner
 * 
 * Scans a wallet for closeable token accounts and calculates reclaimable SOL.
 * Adapted from the main PumpCleanup project.
 */

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

// ============================================================================
// CONFIGURATION
// ============================================================================

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

// ============================================================================
// TYPES
// ============================================================================

export interface ScanResult {
  /** Total number of token accounts found */
  totalAccounts: number;
  /** Number of closeable accounts (empty balance) */
  closeableCount: number;
  /** Total SOL that can be reclaimed */
  totalReclaimableSol: number;
  /** Number of frozen accounts (cannot be closed) */
  frozenAccounts: number;
  /** Whether the scan succeeded */
  success: boolean;
  /** Error message if scan failed */
  error?: string;
}

// ============================================================================
// CONNECTION
// ============================================================================

let connectionInstance: Connection | null = null;

function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(RPC_ENDPOINT, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return connectionInstance;
}

// ============================================================================
// DAS API (QuickNode optimization)
// ============================================================================

async function tryDASTokenAccounts(walletAddress: string): Promise<any[] | null> {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'das-tokens',
        method: 'getTokenAccounts',
        params: { owner: walletAddress },
      }),
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.error) return null;
    
    return data.result?.token_accounts || null;
  } catch {
    return null;
  }
}

// ============================================================================
// SCANNING LOGIC
// ============================================================================

/**
 * Validates if a string is a valid Solana public key.
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts potential Solana addresses from text.
 * Solana addresses are base58 encoded and typically 32-44 characters.
 */
export function extractSolanaAddress(text: string): string | null {
  // Solana addresses are base58: alphanumeric without 0, O, I, l
  // Typically 32-44 characters
  const base58Regex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
  const matches = text.match(base58Regex);
  
  if (!matches) return null;
  
  // Return the first valid Solana address found
  for (const match of matches) {
    if (isValidSolanaAddress(match)) {
      return match;
    }
  }
  
  return null;
}

/**
 * Scans a wallet for closeable token accounts.
 * Returns the count of closeable accounts and total reclaimable SOL.
 */
export async function scanWallet(walletAddress: string): Promise<ScanResult> {
  // Validate address
  if (!isValidSolanaAddress(walletAddress)) {
    return {
      totalAccounts: 0,
      closeableCount: 0,
      totalReclaimableSol: 0,
      frozenAccounts: 0,
      success: false,
      error: 'Invalid Solana address',
    };
  }

  const connection = getConnection();
  const pubkey = new PublicKey(walletAddress);
  
  console.log(`[Scanner] Scanning wallet: ${walletAddress}`);
  
  let closeableCount = 0;
  let totalReclaimableLamports = 0;
  let totalAccountsFound = 0;
  let frozenAccounts = 0;

  try {
    // Try DAS API first (single call for all tokens)
    const dasAccounts = await tryDASTokenAccounts(walletAddress);
    
    let allAccounts: any[] = [];

    if (dasAccounts && dasAccounts.length > 0) {
      console.log(`[Scanner] Using DAS API (1 call)`);
      allAccounts = dasAccounts.map((acc: any) => {
        const isToken2022 = acc.program_id === TOKEN_2022_PROGRAM_ID.toBase58() || 
                            acc.program_id === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        
        return {
          pubkey: new PublicKey(acc.address),
          account: {
            lamports: acc.lamports || 2039280,
            data: {
              parsed: {
                info: {
                  mint: acc.mint,
                  state: acc.frozen ? 'frozen' : 'initialized',
                  tokenAmount: {
                    amount: acc.amount || '0',
                    decimals: acc.decimals || 0,
                    uiAmount: acc.delegated_amount ? parseFloat(acc.amount) / Math.pow(10, acc.decimals || 0) : 0,
                  },
                },
              },
            },
          },
          programId: isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
        };
      });
    } else {
      // Fallback: Standard RPC with parallel fetching
      console.log(`[Scanner] Using standard RPC (2 parallel calls)`);
      const [splAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }, 'confirmed')
          .catch(() => ({ value: [] })),
        connection.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_2022_PROGRAM_ID }, 'confirmed')
          .catch(() => ({ value: [] })),
      ]);

      allAccounts = [
        ...splAccounts.value.map(a => ({ ...a, programId: TOKEN_PROGRAM_ID })),
        ...token2022Accounts.value.map(a => ({ ...a, programId: TOKEN_2022_PROGRAM_ID })),
      ];
    }

    totalAccountsFound = allAccounts.length;
    console.log(`[Scanner] Found ${totalAccountsFound} token accounts`);

    for (const { account } of allAccounts) {
      try {
        const parsedData = account.data.parsed;
        const info = parsedData.info;
        const tokenAmount = info.tokenAmount;

        const uiAmount = tokenAmount.uiAmount || 0;
        const rawAmount = tokenAmount.amount || '0';

        // Skip frozen accounts
        if (info.state === 'frozen') {
          frozenAccounts++;
          continue;
        }

        // Only count empty accounts (zero balance)
        const isEmpty = uiAmount === 0 || rawAmount === '0';
        
        if (isEmpty) {
          closeableCount++;
          totalReclaimableLamports += account.lamports;
        }
      } catch {
        // Skip accounts we can't parse
      }
    }

    const totalReclaimableSol = totalReclaimableLamports / LAMPORTS_PER_SOL;

    console.log(`[Scanner] Scan complete: ${closeableCount} closeable, ${totalReclaimableSol.toFixed(4)} SOL`);

    return {
      totalAccounts: totalAccountsFound,
      closeableCount,
      totalReclaimableSol,
      frozenAccounts,
      success: true,
    };
  } catch (error) {
    console.error('[Scanner] Scan failed:', error);
    return {
      totalAccounts: 0,
      closeableCount: 0,
      totalReclaimableSol: 0,
      frozenAccounts: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

