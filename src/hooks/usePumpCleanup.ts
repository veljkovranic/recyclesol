/**
 * usePumpCleanup Hook
 * 
 * Handles the reclaim operation - closing token accounts and reclaiming rent.
 * This hook manages:
 * - Transaction building and batching
 * - Wallet signing flow
 * - Progress tracking and status updates
 * - Fee calculation and transfer
 * - Session statistics
 * 
 * The reclaim process:
 * 1. Build transactions to close accounts (batched for efficiency)
 * 2. Request wallet signature
 * 3. Submit transactions to the network
 * 4. Track and report results
 */

import { useState, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  createCloseAccountTransactions,
  CloseableAccount,
  getExplorerUrl,
} from '@/lib/solana';
import {
  FEE_PERCENTAGE,
  FEE_RECIPIENT,
  FEE_ENABLED,
  SOLANA_NETWORK,
  STATUS_UPDATE_DELAY,
  REFERRAL_SHARE_PERCENTAGE,
} from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export type ReclaimStatus =
  | 'idle'
  | 'preparing'
  | 'awaiting_signature'
  | 'submitting'
  | 'confirming'
  | 'success'
  | 'error'
  | 'partial_success';

export interface ReclaimProgress {
  /** Current status of the reclaim operation */
  status: ReclaimStatus;
  /** Human-readable message about current status */
  message: string;
  /** Current transaction number (1-indexed) */
  currentTx: number;
  /** Total number of transactions */
  totalTx: number;
  /** Progress percentage (0-100) */
  percentage: number;
}

export interface ReclaimResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Number of accounts successfully closed */
  accountsClosed: number;
  /** Total lamports reclaimed */
  lamportsReclaimed: number;
  /** Total SOL reclaimed */
  solReclaimed: number;
  /** SOL kept by user (after fees) */
  solKept: number;
  /** Fee paid */
  feePaid: number;
  /** Transaction signatures */
  signatures: string[];
  /** Error message if operation failed */
  error?: string;
}

export interface SessionStats {
  /** Total SOL reclaimed this session */
  totalSolReclaimed: number;
  /** Total accounts closed this session */
  totalAccountsClosed: number;
  /** Number of successful reclaim operations */
  reclaimCount: number;
}

export interface ReclaimOptions {
  /** Custom destination for rent refund */
  customDestination?: string;
  /** Referrer wallet address (gets a share of the fee) */
  referrer?: string;
}

export interface UsePumpCleanupReturn {
  /** Execute the reclaim operation */
  reclaim: (accounts: CloseableAccount[], options?: ReclaimOptions) => Promise<ReclaimResult | null>;
  /** Current progress of the reclaim operation */
  progress: ReclaimProgress;
  /** Whether a reclaim is in progress */
  isReclaiming: boolean;
  /** Result of the last reclaim operation */
  lastResult: ReclaimResult | null;
  /** Session statistics */
  sessionStats: SessionStats;
  /** Reset the state */
  reset: () => void;
  /** Fee percentage as a number (0-1) */
  feePercentage: number;
  /** Whether fee collection is enabled */
  feeEnabled: boolean;
  /** Get explorer URL for a signature */
  getExplorerLink: (signature: string) => string;
}

// ============================================================================
// INITIAL STATES
// ============================================================================

const initialProgress: ReclaimProgress = {
  status: 'idle',
  message: '',
  currentTx: 0,
  totalTx: 0,
  percentage: 0,
};

const initialStats: SessionStats = {
  totalSolReclaimed: 0,
  totalAccountsClosed: 0,
  reclaimCount: 0,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

// Minimum SOL needed for transaction fees
const MIN_SOL_FOR_FEES = 0.00005;

// Maximum retry attempts for simulation failures
const MAX_SIMULATION_RETRIES = 2;

// Delay between retries (ms)
const RETRY_DELAY = 1500;
const SPONSOR_THRESHOLD_LAMPORTS = Math.floor(MIN_SOL_FOR_FEES * 1e9);
const SPONSOR_DEFAULT_FEE_LAMPORTS = 5000;

async function getEstimatedFeeLamports(
  connection: Connection,
  transaction: Transaction
): Promise<number> {
  try {
    const feeForMessage = await connection.getFeeForMessage(transaction.compileMessage());
    if (feeForMessage?.value != null) {
      return feeForMessage.value;
    }
  } catch (error) {
    console.warn('[PumpCleanup] Failed to estimate fee:', error);
  }

  return SPONSOR_DEFAULT_FEE_LAMPORTS;
}

async function checkSponsorshipEligibility({
  userWallet,
  recoverableAmountLamports,
  estimatedFeeLamports,
}: {
  userWallet: string;
  recoverableAmountLamports: number;
  estimatedFeeLamports: number;
}): Promise<{
  needsSponsorship: boolean;
  canSponsor: boolean;
  reason?: string;
}> {
  const response = await fetch('/api/sponsor/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userWallet,
      recoverableAmountLamports,
      estimatedFeeLamports,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || 'Failed to check gas sponsorship');
  }

  return {
    needsSponsorship: payload.data?.needsSponsorship ?? false,
    canSponsor: payload.data?.canSponsor ?? false,
    reason: payload.data?.reason,
  };
}

async function requestSponsorSignature({
  transaction,
  userWallet,
  recoverableAmountLamports,
}: {
  transaction: Transaction;
  userWallet: string;
  recoverableAmountLamports: number;
}): Promise<Transaction> {
  const serializedTx = transaction
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString('base64');

  const response = await fetch('/api/sponsor/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction: serializedTx,
      userWallet,
      recoverableAmountLamports,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload?.data?.signedTransaction) {
    throw new Error(payload?.error || 'Failed to sign transaction for sponsorship');
  }

  return Transaction.from(Buffer.from(payload.data.signedTransaction, 'base64'));
}

/**
 * Checks if an error is a wallet simulation failure that can be retried
 */
function isSimulationError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  const name = error?.name?.toLowerCase() || '';
  
  return (
    message.includes('simulation failed') ||
    message.includes('simulate') ||
    message.includes('blockhash not found') ||
    message.includes('block height exceeded') ||
    message.includes('transaction expired') ||
    message.includes('unable to simulate') ||
    message.includes('method not found') ||
    message.includes('methodnotfound') ||
    // Solflare-specific error patterns
    name.includes('walletsigntransactionerror') ||
    message.includes('user rejected') === false && message.includes('failed to sign')
  );
}

/**
 * Checks if user explicitly rejected the transaction
 */
function isUserRejection(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('user cancelled') ||
    message.includes('cancelled') ||
    message.includes('rejected the request')
  );
}

export function usePumpCleanup(): UsePumpCleanupReturn {
  const { publicKey, signAllTransactions, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [progress, setProgress] = useState<ReclaimProgress>(initialProgress);
  const [lastResult, setLastResult] = useState<ReclaimResult | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>(initialStats);

  // Parse fee recipient once
  const feeRecipientPubkey = useMemo(() => {
    if (!FEE_ENABLED || !FEE_RECIPIENT) return undefined;
    try {
      return new PublicKey(FEE_RECIPIENT);
    } catch {
      console.warn('Invalid fee recipient address:', FEE_RECIPIENT);
      return undefined;
    }
  }, []);

  /**
   * Updates progress state with a delay for visual feedback.
   */
  const updateProgress = useCallback((update: Partial<ReclaimProgress>) => {
    setProgress(prev => ({ ...prev, ...update }));
  }, []);

  /**
   * Executes the reclaim operation - closes accounts and reclaims rent.
   * 
   * Flow:
   * 1. Validate wallet and accounts
   * 2. Build close transactions (batched)
   * 3. Add fee transaction if enabled (with referral split if applicable)
   * 4. Sign all transactions via wallet
   * 5. Submit each transaction sequentially
   * 6. Track results and update stats
   */
  const reclaim = useCallback(
    async (accounts: CloseableAccount[], options?: ReclaimOptions): Promise<ReclaimResult | null> => {
      // Parse custom destination if provided
      let destinationPubkey: PublicKey | undefined;
      if (options?.customDestination) {
        try {
          destinationPubkey = new PublicKey(options.customDestination);
          console.log('[PumpCleanup] Using custom destination:', options.customDestination);
        } catch {
          console.warn('Invalid custom destination, using default');
        }
      }

      // Parse referrer if provided
      let referrerPubkey: PublicKey | undefined;
      if (options?.referrer) {
        try {
          referrerPubkey = new PublicKey(options.referrer);
          console.log('[PumpCleanup] Using referrer:', options.referrer);
        } catch {
          console.warn('Invalid referrer address, ignoring');
        }
      }
      // Validate prerequisites
      if (!publicKey) {
        setLastResult({
          success: false,
          accountsClosed: 0,
          lamportsReclaimed: 0,
          solReclaimed: 0,
          solKept: 0,
          feePaid: 0,
          signatures: [],
          error: 'Wallet not connected',
        });
        return null;
      }

      if (!signAllTransactions && !signTransaction) {
        setLastResult({
          success: false,
          accountsClosed: 0,
          lamportsReclaimed: 0,
          solReclaimed: 0,
          solKept: 0,
          feePaid: 0,
          signatures: [],
          error: 'Wallet does not support transaction signing',
        });
        return null;
      }

      if (accounts.length === 0) {
        setLastResult({
          success: false,
          accountsClosed: 0,
          lamportsReclaimed: 0,
          solReclaimed: 0,
          solKept: 0,
          feePaid: 0,
          signatures: [],
          error: 'No accounts to close',
        });
        return null;
      }

      try {
        // STEP 1: Preparing transactions
        updateProgress({
          status: 'preparing',
          message: 'Preparing transactions...',
          currentTx: 0,
          totalTx: 0,
          percentage: 5,
        });

        await new Promise(r => setTimeout(r, STATUS_UPDATE_DELAY));

        // Calculate totals for result tracking
        const totalLamports = accounts.reduce((sum, acc) => sum + acc.rentLamports, 0);
        const totalSol = totalLamports / 1e9;
        const feeLamports = FEE_ENABLED ? Math.floor(totalLamports * FEE_PERCENTAGE) : 0;
        const feeSol = feeLamports / 1e9;
        const userLamports = totalLamports - feeLamports;
        const userSol = userLamports / 1e9;

        // Build transactions with fee options
        const transactions = await createCloseAccountTransactions(
          accounts,
          publicKey,
          FEE_ENABLED ? {
            feeRecipient: feeRecipientPubkey,
            feePercentage: FEE_PERCENTAGE,
            referrer: referrerPubkey,
            referralShare: REFERRAL_SHARE_PERCENTAGE,
          } : undefined,
          destinationPubkey // Custom destination for rent refund
        );

        updateProgress({
          totalTx: transactions.length,
          percentage: 10,
        });

        const userBalanceLamports = await connection.getBalance(publicKey);
        // Sponsorship is ONLY for users with exactly 0 SOL balance AND who have stuff to recover
        const hasZeroBalance = userBalanceLamports === 0;
        const hasRecoverableAccounts = totalLamports > 0;
        const shouldCheckSponsorship = hasZeroBalance && hasRecoverableAccounts;
        let transactionsToSign = transactions;
        let useSponsorFlow = false;

        if (shouldCheckSponsorship && transactions.length > 0) {
          updateProgress({
            status: 'preparing',
            message: 'Checking fee sponsorship...',
            percentage: 12,
          });

          const feeEstimate = await getEstimatedFeeLamports(connection, transactions[0]);
          const estimatedFeeLamports = Math.max(feeEstimate, SPONSOR_THRESHOLD_LAMPORTS);

          const sponsorCheck = await checkSponsorshipEligibility({
            userWallet: publicKey.toBase58(),
            recoverableAmountLamports: totalLamports,
            estimatedFeeLamports,
          });

          if (!sponsorCheck.needsSponsorship) {
            transactionsToSign = transactions;
          } else if (!sponsorCheck.canSponsor) {
            const userMessage = sponsorCheck.reason || 'Gas sponsorship is not available';
            updateProgress({
              status: 'error',
              message: userMessage,
              percentage: 0,
            });
            return {
              success: false,
              accountsClosed: 0,
              lamportsReclaimed: 0,
              solReclaimed: 0,
              solKept: 0,
              feePaid: 0,
              signatures: [],
              error: userMessage,
            };
          } else {
            useSponsorFlow = true;
            updateProgress({
              status: 'preparing',
              message: 'Requesting sponsored transactions...',
              percentage: 14,
            });

            const sponsoredTransactions: Transaction[] = [];
            for (const transaction of transactions) {
              const sponsoredTransaction = await requestSponsorSignature({
                transaction,
                userWallet: publicKey.toBase58(),
                recoverableAmountLamports: totalLamports,
              });
              sponsoredTransactions.push(sponsoredTransaction);
            }
            transactionsToSign = sponsoredTransactions;
          }
        }

        let signedTransactions: Transaction[] = [];

        // Sign transactions - with retry loop for handling wallet simulation failures (common with Solflare)
        let retryCount = 0;
        let currentTransactions = transactionsToSign;

        while (retryCount <= MAX_SIMULATION_RETRIES) {
          updateProgress({
            status: 'awaiting_signature',
            message: retryCount > 0 
              ? `Retrying... Please sign ${currentTransactions.length} transaction${currentTransactions.length > 1 ? 's' : ''} in your wallet...`
              : `Please sign ${currentTransactions.length} transaction${currentTransactions.length > 1 ? 's' : ''} in your wallet...`,
            percentage: 15,
          });

          try {
            if (signAllTransactions) {
              // Preferred: Sign all transactions at once
              signedTransactions = await signAllTransactions(currentTransactions);
            } else if (signTransaction) {
              // Fallback: Sign transactions one by one
              signedTransactions = [];
              for (const tx of currentTransactions) {
                const signed = await signTransaction(tx);
                signedTransactions.push(signed);
              }
            } else {
              throw new Error('No signing method available');
            }
            
            // If we get here, signing succeeded
            break;
          } catch (error: any) {
            // Check if user explicitly rejected
            if (isUserRejection(error)) {
              console.log('[PumpCleanup] User rejected transaction');
              updateProgress(initialProgress);
              return {
                success: false,
                accountsClosed: 0,
                lamportsReclaimed: 0,
                solReclaimed: 0,
                solKept: 0,
                feePaid: 0,
                signatures: [],
                error: 'cancelled',
              };
            }
            
            // Check if this is a simulation error we can retry
            if (isSimulationError(error) && retryCount < MAX_SIMULATION_RETRIES) {
              retryCount++;
              console.log(`[PumpCleanup] Simulation failed, retrying (${retryCount}/${MAX_SIMULATION_RETRIES})...`, error?.message);
              
              updateProgress({
                status: 'preparing',
                message: `Wallet simulation failed, refreshing transaction (attempt ${retryCount + 1})...`,
                percentage: 12,
              });
              
              // Wait before retrying
              await new Promise(r => setTimeout(r, RETRY_DELAY));
              
              // Rebuild transactions with fresh blockhash
              try {
                currentTransactions = await createCloseAccountTransactions(
                  accounts,
                  publicKey,
                  FEE_ENABLED ? {
                    feeRecipient: feeRecipientPubkey,
                    feePercentage: FEE_PERCENTAGE,
                    referrer: referrerPubkey,
                    referralShare: REFERRAL_SHARE_PERCENTAGE,
                  } : undefined,
                  destinationPubkey
                );

                if (useSponsorFlow) {
                  const sponsoredTransactions: Transaction[] = [];
                  for (const transaction of currentTransactions) {
                    const sponsoredTransaction = await requestSponsorSignature({
                      transaction,
                      userWallet: publicKey.toBase58(),
                      recoverableAmountLamports: totalLamports,
                    });
                    sponsoredTransactions.push(sponsoredTransaction);
                  }
                  currentTransactions = sponsoredTransactions;
                }
              } catch (rebuildError: any) {
                console.error('[PumpCleanup] Failed to rebuild transactions:', rebuildError);
                throw new Error('Failed to refresh transaction. Please try again.');
              }
              
              continue;
            }
            
            // Non-retryable error or max retries exceeded
            console.log('[PumpCleanup] Signing failed:', error?.message);
            
            // Provide a more helpful error message for simulation failures
            let userMessage = 'Transaction signing failed';
            if (isSimulationError(error)) {
              userMessage = 'Wallet simulation failed. Some accounts may have already been closed. Please rescan your wallet.';
            }
            
            updateProgress({
              status: 'error',
              message: userMessage,
              percentage: 0,
            });
            
            return {
              success: false,
              accountsClosed: 0,
              lamportsReclaimed: 0,
              solReclaimed: 0,
              solKept: 0,
              feePaid: 0,
              signatures: [],
              error: userMessage,
            };
          }
        }

        // If we exhausted all retries without success
        if (!signedTransactions || signedTransactions.length === 0) {
          const userMessage = 'Transaction signing failed after multiple attempts. Please rescan your wallet and try again.';
          updateProgress({
            status: 'error',
            message: userMessage,
            percentage: 0,
          });
          return {
            success: false,
            accountsClosed: 0,
            lamportsReclaimed: 0,
            solReclaimed: 0,
            solKept: 0,
            feePaid: 0,
            signatures: [],
            error: userMessage,
          };
        }

        // STEP 2: Submit transactions
        updateProgress({
          status: 'submitting',
          message: 'Submitting transactions...',
          percentage: 25,
        });

        const signatures: string[] = [];
        const confirmedSignatures: string[] = [];
        let accountsClosedSoFar = 0;
        let failedTransactions = 0;
        let lastError: string | null = null;

        for (let i = 0; i < signedTransactions.length; i++) {
          const tx = signedTransactions[i];
          // Fee is now bundled into each transaction, not separate
          const isFeeTransaction = false;

          updateProgress({
            status: 'submitting',
            message: `Submitting transaction ${i + 1} of ${signedTransactions.length}...`,
            currentTx: i + 1,
            percentage: 25 + Math.floor((i / signedTransactions.length) * 50),
          });

          try {
            let signature: string;
            
            // Try sending with preflight first, fall back to skipping preflight on simulation failure
            try {
              signature = await connection.sendRawTransaction(tx.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
              });
            } catch (preflightError: any) {
              // If preflight fails with simulation error, retry with skipPreflight
              const preflightMsg = preflightError?.message?.toLowerCase() || '';
              if (preflightMsg.includes('simulation') || preflightMsg.includes('preflight')) {
                console.log(`[PumpCleanup] Preflight failed for tx ${i + 1}, retrying with skipPreflight...`);
                signature = await connection.sendRawTransaction(tx.serialize(), {
                  skipPreflight: true,
                  preflightCommitment: 'confirmed',
                });
              } else {
                throw preflightError;
              }
            }

            signatures.push(signature);

            // Wait for confirmation
            updateProgress({
              status: 'confirming',
              message: `Confirming transaction ${i + 1}...`,
              percentage: 25 + Math.floor(((i + 0.5) / signedTransactions.length) * 50),
            });

            const confirmation = await connection.confirmTransaction(signature, 'confirmed');

            if (confirmation.value.err) {
              console.error(`Transaction ${i + 1} failed on-chain:`, confirmation.value.err);
              failedTransactions++;
              lastError = `Transaction ${i + 1} failed on-chain`;
            } else {
              // Transaction confirmed successfully
              confirmedSignatures.push(signature);
              if (!isFeeTransaction) {
              // Count closed accounts (each tx except fee tx closes accounts)
              const accountsInThisBatch = Math.min(
                10, // MAX_ACCOUNTS_PER_TX
                accounts.length - accountsClosedSoFar
              );
              accountsClosedSoFar += accountsInThisBatch;
              }
            }
          } catch (error: any) {
            console.error(`Transaction ${i + 1} failed:`, error);
            failedTransactions++;
            
            // Try to extract more detailed error message
            let errorMessage = error?.message || 'Unknown error';
            
            // Handle SendTransactionError with logs
            if (error?.logs) {
              console.error('Transaction logs:', error.logs);
              const logErrors = error.logs.filter((log: string) => 
                log.toLowerCase().includes('error') || log.toLowerCase().includes('failed')
              );
              if (logErrors.length > 0) {
                errorMessage = logErrors.join('; ');
              }
            }
            
            // Check for simulation failure
            if (errorMessage.includes('Simulation failed') || errorMessage.includes('simulation failed')) {
              // Parse the simulation error for a cleaner message
              if (errorMessage.includes('Attempt to debit')) {
                errorMessage = 'Account may have already been closed or has insufficient rent';
              } else if (errorMessage.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds to complete transaction';
          }
        }

            lastError = errorMessage;
            
            // If this is the first transaction and it failed, we should stop
            if (i === 0 && confirmedSignatures.length === 0) {
              throw new Error(errorMessage);
            }
          }
        }

        // Determine final result based on what actually succeeded
        const hasConfirmedTransactions = confirmedSignatures.length > 0;
        const allSucceeded = failedTransactions === 0 && hasConfirmedTransactions;
        const partialSuccess = hasConfirmedTransactions && failedTransactions > 0;

        // Calculate actual amounts based on confirmed transactions
        const actualAccountsClosed = accountsClosedSoFar;
        const actualLamports = Math.floor(totalLamports * (actualAccountsClosed / accounts.length));
        const actualSol = actualLamports / 1e9;
        const actualFee = FEE_ENABLED ? actualSol * FEE_PERCENTAGE : 0;
        const actualUserSol = actualSol - actualFee;

        if (!hasConfirmedTransactions) {
          // Complete failure - no transactions confirmed
          const result: ReclaimResult = {
            success: false,
            accountsClosed: 0,
            lamportsReclaimed: 0,
            solReclaimed: 0,
            solKept: 0,
            feePaid: 0,
            signatures: [],
            error: lastError || 'All transactions failed',
          };

          setLastResult(result);
          updateProgress({
            status: 'error',
            message: lastError || 'All transactions failed',
            percentage: 0,
          });

          return result;
        }

        // At least some transactions succeeded
        const result: ReclaimResult = {
          success: allSucceeded,
          accountsClosed: actualAccountsClosed,
          lamportsReclaimed: actualLamports,
          solReclaimed: actualSol,
          solKept: actualUserSol,
          feePaid: actualFee,
          signatures: confirmedSignatures,
          error: partialSuccess ? `${failedTransactions} transaction(s) failed` : undefined,
        };

        setLastResult(result);

        // Update session stats only for actual success
        if (actualAccountsClosed > 0) {
        setSessionStats(prev => ({
            totalSolReclaimed: prev.totalSolReclaimed + actualUserSol,
            totalAccountsClosed: prev.totalAccountsClosed + actualAccountsClosed,
          reclaimCount: prev.reclaimCount + 1,
        }));
        }

        updateProgress({
          status: partialSuccess ? 'partial_success' : 'success',
          message: partialSuccess 
            ? `Partial success: ${actualAccountsClosed} accounts closed, ${failedTransactions} failed`
            : `Success! Reclaimed ${actualUserSol.toFixed(4)} SOL`,
          currentTx: signedTransactions.length,
          percentage: 100,
        });

        return result;
      } catch (error: any) {
        console.error('Reclaim operation failed:', error);

        const result: ReclaimResult = {
          success: false,
          accountsClosed: 0,
          lamportsReclaimed: 0,
          solReclaimed: 0,
          solKept: 0,
          feePaid: 0,
          signatures: [],
          error: error?.message || 'Unknown error occurred',
        };

        setLastResult(result);
        updateProgress({
          status: 'error',
          message: `Error: ${error?.message || 'Unknown error'}`,
          percentage: 0,
        });

        return result;
      }
    },
    [publicKey, signAllTransactions, signTransaction, connection, feeRecipientPubkey, updateProgress]
  );

  /**
   * Resets the state to initial values.
   */
  const reset = useCallback(() => {
    setProgress(initialProgress);
    setLastResult(null);
  }, []);

  /**
   * Gets an explorer URL for a transaction signature.
   */
  const getExplorerLink = useCallback((signature: string): string => {
    return getExplorerUrl(signature, 'tx', SOLANA_NETWORK);
  }, []);

  const isReclaiming = progress.status !== 'idle' && 
                     progress.status !== 'success' && 
                     progress.status !== 'error' &&
                     progress.status !== 'partial_success';

  return {
    reclaim,
    progress,
    isReclaiming,
    lastResult,
    sessionStats,
    reset,
    feePercentage: FEE_PERCENTAGE,
    feeEnabled: FEE_ENABLED,
    getExplorerLink,
  };
}

export default usePumpCleanup;
