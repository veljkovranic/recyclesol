/**
 * Referral API Routes
 * 
 * Endpoints for managing referral codes and tracking.
 * 
 * Endpoints:
 * - POST /api/referral/code - Get or create a referral code for a wallet
 * - GET /api/referral/resolve/:code - Resolve a code to wallet address
 * - GET /api/referral/stats/:code - Get stats for a referral code
 * - POST /api/referral/record - Record a successful referral
 */

import { Router, Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import {
  getOrCreateCode,
  resolveCode,
  getStats,
  getStatsByWallet,
  recordReferral,
  getGlobalStats,
  getReferralLink,
} from '../services/referralService';

const router = Router();

/**
 * Validates a Solana wallet address
 */
function isValidWallet(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/referral/code
 * Get or create a referral code for a wallet address
 * 
 * Body: { walletAddress: string }
 * Returns: { code, referralLink, stats }
 */
router.post('/code', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !isValidWallet(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const record = getOrCreateCode(walletAddress);
    const stats = getStats(record.code);

    res.json({
      success: true,
      data: {
        code: record.code,
        referralLink: getReferralLink(record.code),
        stats: {
          referralCount: record.referralCount,
          totalEarningsSol: record.totalEarningsLamports / 1e9,
        },
      },
    });
  } catch (error: any) {
    console.error('[Referral API] Error creating code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create referral code',
    });
  }
});

/**
 * GET /api/referral/resolve/:code
 * Resolve a referral code to a wallet address
 * 
 * Params: code (can be short code or full wallet address)
 * Returns: { walletAddress }
 */
router.get('/resolve/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing referral code',
      });
    }

    const walletAddress = resolveCode(code);

    if (!walletAddress) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or unknown referral code',
      });
    }

    res.json({
      success: true,
      data: {
        walletAddress,
        code: code.toUpperCase(),
      },
    });
  } catch (error: any) {
    console.error('[Referral API] Error resolving code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve referral code',
    });
  }
});

/**
 * GET /api/referral/stats/:identifier
 * Get stats for a referral code or wallet address
 * 
 * Params: identifier (code or wallet address)
 * Returns: { code, referralCount, totalEarningsSol, referralLink }
 */
router.get('/stats/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Missing identifier',
      });
    }

    // Try as code first, then as wallet address
    let stats = getStats(identifier);
    
    if (!stats && isValidWallet(identifier)) {
      stats = getStatsByWallet(identifier);
    }

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'No referral data found',
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[Referral API] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral stats',
    });
  }
});

/**
 * POST /api/referral/record
 * Record a successful referral (called after transaction confirms)
 * 
 * Body: {
 *   referrerCode: string,
 *   referredWallet: string,
 *   earningsLamports: number
 * }
 */
router.post('/record', async (req: Request, res: Response) => {
  try {
    const { referrerCode, referredWallet, earningsLamports } = req.body;

    if (!referrerCode || !referredWallet || earningsLamports === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: referrerCode, referredWallet, earningsLamports',
      });
    }

    if (!isValidWallet(referredWallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid referred wallet address',
      });
    }

    const recorded = recordReferral(referrerCode, referredWallet, earningsLamports);

    if (!recorded) {
      return res.status(400).json({
        success: false,
        error: 'Failed to record referral (invalid code or self-referral)',
      });
    }

    res.json({
      success: true,
      data: {
        recorded: true,
        earningsSol: earningsLamports / 1e9,
      },
    });
  } catch (error: any) {
    console.error('[Referral API] Error recording referral:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record referral',
    });
  }
});

/**
 * GET /api/referral/global
 * Get global referral statistics
 */
router.get('/global', async (req: Request, res: Response) => {
  try {
    const stats = getGlobalStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[Referral API] Error getting global stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get global stats',
    });
  }
});

export { router as referralRouter };

