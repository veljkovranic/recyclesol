/**
 * Gas Sponsorship API Routes
 * 
 * Endpoints for sponsoring transaction fees when users have
 * insufficient balance but have recoverable accounts.
 * 
 * Flow:
 * 1. Frontend checks if user needs sponsorship (/api/sponsor/check)
 * 2. Frontend sends unsigned transaction (/api/sponsor/sign)
 * 3. Backend signs as fee payer and returns partially signed tx
 * 4. Frontend gets user signature and submits to network
 */

import { Router, Request, Response } from 'express';
import { 
  Transaction, 
  VersionedTransaction,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import {
  initializeSponsorWallet,
  getSponsorKeypair,
  getSponsorPublicKey,
  canSponsor,
  recordSponsorship,
  getSponsorStats,
  checkBalance,
} from '../services/sponsorWallet';

const router = Router();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// Initialize sponsor wallet on module load
const sponsorEnabled = initializeSponsorWallet();

/**
 * GET /api/sponsor/status
 * Check if gas sponsorship is available
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const stats = getSponsorStats();
    const balance = await checkBalance();
    
    res.json({
      success: true,
      data: {
        ...stats,
        balanceLamports: balance,
        balanceSol: balance / LAMPORTS_PER_SOL,
      },
    });
  } catch (error: any) {
    console.error('[SponsorAPI] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sponsor status',
    });
  }
});

/**
 * POST /api/sponsor/check
 * Check if a user qualifies for gas sponsorship
 * 
 * Body: {
 *   userWallet: string,
 *   recoverableAmountLamports: number,
 *   estimatedFeeLamports: number
 * }
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { userWallet, recoverableAmountLamports, estimatedFeeLamports } = req.body;

    if (!userWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userWallet',
      });
    }

    // Sponsorship requires user to have recoverable accounts
    if (!recoverableAmountLamports || recoverableAmountLamports <= 0) {
      return res.json({
        success: true,
        data: {
          needsSponsorship: false,
          canSponsor: false,
          userBalanceLamports: 0,
          reason: 'No recoverable accounts - sponsorship not applicable',
        },
      });
    }

    // Check user's current balance
    let userBalance = 0;
    try {
      const pubkey = new PublicKey(userWallet);
      userBalance = await connection.getBalance(pubkey);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const estimatedFee = estimatedFeeLamports || 5000; // Default ~0.000005 SOL
    
    // Sponsorship is ONLY for users with exactly 0 SOL balance
    // Users with any balance (even less than fee) should not get sponsorship
    const hasZeroBalance = userBalance === 0;
    const needsSponsorship = hasZeroBalance;

    if (!needsSponsorship) {
      return res.json({
        success: true,
        data: {
          needsSponsorship: false,
          userBalanceLamports: userBalance,
          reason: userBalance > 0 
            ? 'User has SOL balance - sponsorship only available for wallets with exactly 0 SOL'
            : 'User has sufficient balance',
        },
      });
    }

    // Check if we can sponsor (user has 0 SOL AND has recoverable accounts)
    const sponsorCheck = canSponsor(estimatedFee, recoverableAmountLamports);

    res.json({
      success: true,
      data: {
        needsSponsorship: true,
        canSponsor: sponsorCheck.allowed,
        sponsorWallet: getSponsorPublicKey(),
        userBalanceLamports: userBalance,
        estimatedFeeLamports: estimatedFee,
        reason: sponsorCheck.reason,
      },
    });
  } catch (error: any) {
    console.error('[SponsorAPI] Check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check sponsorship eligibility',
    });
  }
});

/**
 * POST /api/sponsor/sign
 * Sign a transaction as fee payer
 * 
 * Body: {
 *   transaction: string (base64 encoded serialized transaction),
 *   userWallet: string,
 *   recoverableAmountLamports: number
 * }
 * 
 * Returns: {
 *   signedTransaction: string (base64 encoded partially signed transaction)
 * }
 */
router.post('/sign', async (req: Request, res: Response) => {
  try {
    const { transaction, userWallet, recoverableAmountLamports } = req.body;

    if (!transaction || !userWallet || !recoverableAmountLamports) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: transaction, userWallet, recoverableAmountLamports',
      });
    }

    const sponsorKeypair = getSponsorKeypair();
    if (!sponsorKeypair) {
      return res.status(503).json({
        success: false,
        error: 'Gas sponsorship is not available',
      });
    }

    // Decode the transaction
    let tx: Transaction;
    try {
      const buffer = Buffer.from(transaction, 'base64');
      tx = Transaction.from(buffer);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction format',
      });
    }

    // Estimate fee (simple heuristic: 5000 lamports per signature)
    const estimatedFee = 5000 * (tx.signatures.length + 1);

    // Verify sponsorship is allowed
    const sponsorCheck = canSponsor(estimatedFee, recoverableAmountLamports);
    if (!sponsorCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: sponsorCheck.reason,
      });
    }

    // Get fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;

    // Set sponsor as fee payer
    tx.feePayer = sponsorKeypair.publicKey;

    // Sign with sponsor wallet
    tx.partialSign(sponsorKeypair);

    // Record the sponsorship
    recordSponsorship(estimatedFee);

    // Serialize and return
    const signedTxBase64 = tx.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    console.log(`[SponsorAPI] Signed transaction for ${userWallet}, recoverable: ${recoverableAmountLamports / LAMPORTS_PER_SOL} SOL`);

    res.json({
      success: true,
      data: {
        signedTransaction: signedTxBase64,
        sponsorWallet: sponsorKeypair.publicKey.toBase58(),
        estimatedFeeLamports: estimatedFee,
      },
    });
  } catch (error: any) {
    console.error('[SponsorAPI] Sign error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign transaction',
    });
  }
});

export { router as sponsorGasRouter };

