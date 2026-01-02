/**
 * Recent Cleanups API Routes
 * 
 * - GET /api/recent-cleanups - Get recent cleanup records
 * - GET /api/stats - Get summary statistics
 * - POST /api/report-cleanup - Report a successful cleanup (from frontend)
 */

import { Router, Request, Response } from 'express';
import { getCachedData, getRecentPayouts, getStats, reportCleanup } from '../services/cleanupCache';
import PostHogClient from '../posthog';

// Initialize PostHog client (may be null if not configured)
let posthog: ReturnType<typeof PostHogClient> | null = null;
try {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog = PostHogClient();
  }
} catch (e) {
  // PostHog not configured
}

export const recentCleanupsRouter = Router();

/**
 * GET /api/recent-cleanups
 * 
 * Returns recent cleanup records (no RPC calls, just stored data)
 */
recentCleanupsRouter.get('/recent-cleanups', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const payouts = getRecentPayouts(limit);
    const stats = getStats();

    res.json({
      success: true,
      data: {
        payouts,
        totalSolReclaimed: stats.totalSolReclaimed,
        totalAccountsClosed: stats.totalAccountsClosed,
        totalCleanups: stats.totalCleanups,
      },
    });
  } catch (error) {
    console.error('[API] Error in /recent-cleanups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent cleanups',
    });
  }
});

/**
 * GET /api/stats
 * 
 * Returns summary statistics
 */
recentCleanupsRouter.get('/stats', (req: Request, res: Response) => {
  const stats = getStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * POST /api/report-cleanup
 * 
 * Report a successful cleanup from the frontend.
 * Called after a user successfully reclaims SOL.
 * 
 * Body: {
 *   wallet: string,
 *   accountsClosed: number,
 *   solReclaimed: number,
 *   feePaid: number,
 *   signature: string
 * }
 */
recentCleanupsRouter.post('/report-cleanup', (req: Request, res: Response) => {
  try {
    const { wallet, accountsClosed, solReclaimed, feePaid, signature } = req.body;

    // Validate required fields
    if (!wallet || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: wallet, signature',
      });
    }

    // Validate types
    if (typeof accountsClosed !== 'number' || typeof solReclaimed !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'accountsClosed and solReclaimed must be numbers',
      });
    }

    // Report the cleanup
    const result = reportCleanup({
      wallet,
      accountsClosed: accountsClosed || 0,
      solReclaimed: solReclaimed || 0,
      feePaid: feePaid || 0,
      signature,
    });

    // Track in PostHog if available
    if (posthog) {
      posthog.capture({
        distinctId: wallet,
        event: 'cleanup_reported',
        properties: {
          accountsClosed,
          solReclaimed,
          feePaid,
          signature,
          duplicate: result.duplicate,
        },
      });
    }

    res.json({
      success: true,
      data: {
        recorded: !result.duplicate,
        duplicate: result.duplicate || false,
      },
    });
  } catch (error) {
    console.error('[API] Error in /report-cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record cleanup',
    });
  }
});
