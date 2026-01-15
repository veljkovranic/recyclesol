/**
 * ReferralBanner Component
 * 
 * Displays referral information and allows users to copy their referral link.
 * Shows short referral codes, earnings percentage, and stats.
 */

import React, { useState, useCallback } from 'react';
import { useReferral } from '@/hooks/useReferral';
import { shortenAddress } from '@/lib/solana';
import { REFERRAL_SHARE_PERCENTAGE, FEE_PERCENTAGE } from '@/lib/constants';

interface ReferralBannerProps {
  /** Display variant: 'compact' for inline banner, 'full' for detailed card, 'preview' for landing page */
  variant?: 'compact' | 'full' | 'preview';
  /** Additional CSS classes */
  className?: string;
}

export const ReferralBanner: React.FC<ReferralBannerProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { 
    referralLink, 
    referralCode, 
    copyReferralLink, 
    hasReferrer, 
    referrerAddress,
    stats,
    isLoading,
  } = useReferral();
  const [copied, setCopied] = useState(false);

  // Calculate display percentages
  const referralShareDisplay = Math.round(REFERRAL_SHARE_PERCENTAGE * 100); // 50%

  const handleCopy = useCallback(async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copyReferralLink]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PumpCleanup - Reclaim SOL',
          text: `Use my link to clean your Solana wallet and reclaim hidden SOL!`,
          url: referralLink,
        });
      } catch {
        // User cancelled or share failed, fall back to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }, [referralLink, handleCopy]);

  // Preview variant - non-functional for landing page
  if (variant === 'preview') {
    return (
      <div className={`bg-cleanup-card border border-cleanup-border rounded-2xl overflow-hidden ${className}`}>
        {/* Header */}
        <div className="px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">✨</span>
            <h3 className="text-white font-display font-bold text-xl">
              Earn <span className="text-cleanup-secondary">{referralShareDisplay}%</span> from referrals
            </h3>
            <span className="text-xl">✨</span>
          </div>
          <p className="text-cleanup-text-secondary text-sm">
            Share your link and earn when others use PumpCleanup
          </p>
        </div>

        {/* Referral Link Section */}
        <div className="px-6 pb-6">
          <div className="bg-cleanup-dark border border-cleanup-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-cleanup-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-cleanup-text-muted text-sm">Your referral link:</span>
            </div>

            <div className="flex items-stretch gap-2">
              {/* Link Display */}
              <div className="flex-1 bg-cleanup-card border border-cleanup-border rounded-xl px-4 py-3 flex items-center min-w-0">
                <span className="text-white/60 font-mono text-sm truncate">
                  https://pumpcleanup.com/CB3F13C43EC...
                </span>
              </div>

              {/* Share Button */}
              <button
                disabled
                className="w-11 h-11 bg-cleanup-hover rounded-xl flex items-center justify-center opacity-60 cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-cleanup-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>

              {/* Copy Button */}
              <button
                disabled
                className="w-11 h-11 bg-cleanup-hover rounded-xl flex items-center justify-center opacity-60 cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-cleanup-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {/* Tap to copy hint */}
            <p className="text-center text-cleanup-text-muted text-xs mt-4">
              Tap to copy link
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render functional variants if no wallet connected
  if (!referralCode && !isLoading) return null;

  // Compact variant - simple clickable banner
  if (variant === 'compact') {
    return (
      <button
        onClick={handleCopy}
        className={`w-full py-3.5 px-5 bg-gradient-to-r from-purple-600/90 to-purple-500/90 border border-purple-400/30 rounded-xl flex items-center justify-center gap-2 hover:from-purple-600 hover:to-purple-500 transition-all group ${className}`}
      >
        <span className="text-lg">🎁</span>
        <span className="text-white font-medium text-sm sm:text-base">
          Earn <span className="text-cleanup-secondary font-bold">{referralShareDisplay}%</span> from your referrals
        </span>
        <span className="text-white/80 mx-1">—</span>
        <span className="text-purple-200 hover:text-white transition-colors text-sm">
          {copied ? '✓ Copied!' : 'invite friends & earn SOL!'}
        </span>
      </button>
    );
  }

  // Full variant - detailed card with link display (matches screenshot design)
  return (
    <div className={`bg-cleanup-card border border-cleanup-border rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">✨</span>
          <h3 className="text-white font-display font-bold text-xl">
            Earn <span className="text-cleanup-secondary">{referralShareDisplay}%</span> from referrals
          </h3>
          <span className="text-xl">✨</span>
        </div>
        <p className="text-cleanup-text-secondary text-sm">
          Share your link and earn when others use PumpCleanup
        </p>
      </div>

      {/* Referral Link Section */}
      <div className="px-6 pb-6">
        <div className="bg-cleanup-dark border border-cleanup-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-cleanup-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-cleanup-text-muted text-sm">Your referral link:</span>
          </div>

          <div className="flex items-stretch gap-2">
            {/* Link Display */}
            <button
              onClick={handleCopy}
              className="flex-1 bg-cleanup-card border border-cleanup-border rounded-xl px-4 py-3 flex items-center min-w-0 hover:border-cleanup-primary/50 transition-colors cursor-pointer text-left"
            >
              {isLoading ? (
                <span className="text-cleanup-text-muted text-sm">Loading...</span>
              ) : (
                <span className="text-white font-mono text-sm truncate">
                  {referralLink || '...'}
                </span>
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-11 h-11 bg-cleanup-hover hover:bg-cleanup-border rounded-xl flex items-center justify-center transition-colors"
              title="Share"
            >
              <svg className="w-5 h-5 text-cleanup-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                copied 
                  ? 'bg-cleanup-secondary/20 text-cleanup-secondary' 
                  : 'bg-cleanup-hover hover:bg-cleanup-border text-cleanup-text-secondary'
              }`}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          {/* Tap to copy hint */}
          <p className="text-center text-cleanup-text-muted text-xs mt-4">
            {copied ? '✓ Copied to clipboard!' : 'Tap to copy link'}
          </p>
        </div>

        {/* Stats */}
        {(stats?.referralCount ?? 0) > 0 && (
          <div className="mt-4 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-lg font-bold font-display text-white">{stats?.referralCount ?? 0}</p>
              <p className="text-xs text-cleanup-text-muted">referrals</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-display text-cleanup-secondary">
                {stats?.totalEarningsSol?.toFixed(4) ?? '0.0000'} SOL
              </p>
              <p className="text-xs text-cleanup-text-muted">earned</p>
            </div>
          </div>
        )}
      </div>

      {/* Referred by indicator */}
      {hasReferrer && referrerAddress && (
        <div className="px-5 py-3 bg-cleanup-secondary/5 border-t border-cleanup-border">
          <p className="text-xs text-cleanup-text-muted text-center">
            You were referred by <span className="text-cleanup-secondary font-mono">{shortenAddress(referrerAddress)}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ReferralBanner;
