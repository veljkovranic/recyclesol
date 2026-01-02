/**
 * ScannerPanel Component
 * 
 * Main dashboard for Recycle Sol when wallet is connected.
 * Closes empty token accounts to reclaim SOL.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { shortenAddress } from '@/lib/solana';
import { useWalletRentScanner, usePumpCleanup } from '@/hooks';
import { FEE_PERCENTAGE } from '@/lib/constants';
import AccountsList from './AccountsList';
import ReclaimButton from './ReclaimButton';
import ProgressIndicator from './ProgressIndicator';
import SessionStats from './SessionStats';
import Confetti from './Confetti';
import Toast from './Toast';

// Minimum SOL needed for transaction fees
const MIN_SOL_FOR_FEES = 0.00005;

export const ScannerPanel: React.FC = () => {
  const { publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [sponsorEligible, setSponsorEligible] = useState<boolean | null>(null);
  const [sponsorCheckDone, setSponsorCheckDone] = useState(false);
  const lastWalletAddress = useRef<string | null>(null);
  
  const {
    isScanning,
    hasScanned,
    error: scanError,
    closeableAccounts,
    closeableCount,
    frozenCount,
    scan,
    reset: resetScanner,
  } = useWalletRentScanner();

  const {
    reclaim,
    progress,
    isReclaiming,
    lastResult,
    sessionStats,
    reset: resetReclaimer,
    feeEnabled,
    getExplorerLink,
    sponsorInfo,
    checkSponsor,
  } = usePumpCleanup();

  // All closeable accounts are empty (no balance)
  const emptyAccounts = closeableAccounts;

  // Calculate totals
  const emptyTotalSol = emptyAccounts.reduce((sum, a) => sum + a.rentSol, 0);

  // Detect wallet changes and rescan
  useEffect(() => {
    const currentAddress = publicKey?.toBase58() || null;
    
    if (currentAddress && lastWalletAddress.current && currentAddress !== lastWalletAddress.current) {
      console.log('Wallet changed from', lastWalletAddress.current, 'to', currentAddress);
      resetScanner();
      resetReclaimer();
      setSelectedAccounts(new Set());
      setSponsorEligible(null);
      setSponsorCheckDone(false);
      setTimeout(() => scan(), 100);
    }
    
    lastWalletAddress.current = currentAddress;
  }, [publicKey, resetScanner, resetReclaimer, scan]);

  // Fetch SOL balance when wallet connects
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) {
        setSolBalance(null);
        return;
      }
      try {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / 1e9);
      } catch (err) {
        console.error('Failed to fetch SOL balance:', err);
        setSolBalance(null);
      }
    };
    
    fetchBalance();
  }, [publicKey, connection]);

  // Auto-scan when wallet connects
  useEffect(() => {
    if (!hasScanned && !isScanning && publicKey) {
      scan();
    }
  }, [publicKey]);

  // Select all accounts when scan completes
  useEffect(() => {
    if (hasScanned && emptyAccounts.length > 0 && !isScanning) {
      setSelectedAccounts(new Set(emptyAccounts.map(a => a.address.toBase58())));
      if (closeableCount > 0) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [hasScanned, isScanning, emptyAccounts]);

  // Check sponsor eligibility when user has low balance and recoverable accounts
  useEffect(() => {
    const checkSponsorEligibility = async () => {
      if (!sponsorInfo.enabled || !hasScanned || emptyAccounts.length === 0) {
        setSponsorCheckDone(false);
        setSponsorEligible(null);
        return;
      }

      const hasLowBalance = solBalance !== null && solBalance < MIN_SOL_FOR_FEES;
      if (!hasLowBalance) {
        setSponsorCheckDone(true);
        setSponsorEligible(null);
        return;
      }

      const totalLamports = emptyAccounts.reduce((sum, a) => sum + a.rentLamports, 0);
      
      const result = await checkSponsor(totalLamports);
      setSponsorCheckDone(true);
      
      if (result && result.needsSponsorship && result.canSponsor) {
        setSponsorEligible(true);
        console.log('[ScannerPanel] Sponsor will cover gas fees');
      } else {
        setSponsorEligible(false);
        console.log('[ScannerPanel] Not eligible for sponsorship:', result?.reason);
      }
    };

    checkSponsorEligibility();
  }, [sponsorInfo.enabled, hasScanned, emptyAccounts, solBalance, checkSponsor]);

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '' });
  }, []);

  const handleToggleAccount = useCallback((address: string) => {
    setSelectedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(address)) {
        next.delete(address);
      } else {
        next.add(address);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedAccounts(new Set(emptyAccounts.map(a => a.address.toBase58())));
  }, [emptyAccounts]);

  const handleDeselectAll = useCallback(() => {
    setSelectedAccounts(new Set());
  }, []);

  const handleReclaim = async () => {
    if (selectedAccountsList.length > 0) {
      const result = await reclaim(selectedAccountsList);
      
      if (result?.error === 'cancelled') {
        showToast('Transaction cancelled');
        return;
      }
      
      if (result?.success) {
        resetScanner();
        setSelectedAccounts(new Set());
      }
    }
  };

  const handleNewScan = () => {
    resetReclaimer();
    scan();
  };

  // Calculate totals based on SELECTED accounts only
  const selectedAccountsList = emptyAccounts.filter(a => selectedAccounts.has(a.address.toBase58()));
  const selectedTotalSol = selectedAccountsList.reduce((sum, a) => sum + a.rentSol, 0);
  const feeAmount = feeEnabled ? selectedTotalSol * FEE_PERCENTAGE : 0;
  const userReceives = selectedTotalSol - feeAmount;

  const hasEnoughSol = solBalance === null || solBalance >= MIN_SOL_FOR_FEES || sponsorEligible === true;

  const showSuccessScreen = (lastResult?.success || (lastResult?.accountsClosed ?? 0) > 0) && 
    (progress.status === 'success' || progress.status === 'partial_success');
  const isPartialSuccess = progress.status === 'partial_success';

  return (
    <section className={`w-full max-w-4xl mx-auto px-4 ${showSuccessScreen ? 'flex-1 flex flex-col justify-center' : 'py-8'}`}>
      <Confetti show={showConfetti} />

      {isReclaiming && <ProgressIndicator progress={progress} />}

      {/* Success Result */}
      {showSuccessScreen && (
        <div className={`${isPartialSuccess ? 'bg-recycle-warning/10 border-recycle-warning' : 'bg-recycle-success/10 border-recycle-success'} border-2 rounded-2xl p-8 shadow-eco`}>
          <div className="flex flex-col items-center justify-center gap-3 mb-6">
            <div className={`w-16 h-16 rounded-full ${isPartialSuccess ? 'bg-recycle-warning/20' : 'bg-recycle-success/20'} flex items-center justify-center`}>
              <span className="text-3xl">{isPartialSuccess ? '⚠️' : '♻️'}</span>
            </div>
            <h3 className={`text-3xl font-bold ${isPartialSuccess ? 'text-recycle-warning' : 'text-recycle-success'} font-display`}>
              {isPartialSuccess ? 'Partial Success!' : 'SOL Recycled!'} 
            </h3>
            <p className={`text-4xl font-bold ${isPartialSuccess ? 'text-recycle-warning' : 'text-recycle-success'} font-display`}>
              {(lastResult?.solKept ?? 0).toFixed(4)} SOL
            </p>
            {isPartialSuccess && lastResult?.error && (
              <p className="text-sm text-recycle-warning/80">{lastResult.error}</p>
            )}
            {feeEnabled && !isPartialSuccess && (
              <p className="text-sm text-recycle-text-muted">({(lastResult?.feePaid ?? 0).toFixed(4)} SOL service fee)</p>
            )}
          </div>

          {lastResult?.signatures && lastResult.signatures.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-recycle-text-muted mb-3">View on Explorer:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {lastResult.signatures.map((sig, i) => (
                  <a key={sig} href={getExplorerLink(sig)} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-recycle-primary hover:underline font-mono">
                    TX {i + 1}: {shortenAddress(sig, 4)}
                  </a>
                ))}
              </div>
            </div>
          )}

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`♻️ Just recycled ${(lastResult?.solKept ?? 0).toFixed(4)} SOL with @recyclesol!\n\nClean wallet, recovered value. Try it yourself 👇`)}&url=${encodeURIComponent('https://recyclesol.com')}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-6 w-full py-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-eco"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </a>

          <button onClick={() => disconnect()}
            className="mt-3 w-full py-4 bg-white border-2 border-recycle-border rounded-xl font-medium text-recycle-text hover:bg-recycle-bg-alt transition-colors">
            Try Another Wallet
          </button>
        </div>
      )}

      {/* Error Result */}
      {lastResult?.error && lastResult.error !== 'cancelled' && progress.status === 'error' && (
        <div className="bg-recycle-error/10 border-2 border-recycle-error rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-recycle-error/20 flex items-center justify-center">
              <span className="text-xl">✕</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-recycle-error font-display">Transaction Failed</h3>
              <p className="text-recycle-text-secondary text-sm">{lastResult.error}</p>
            </div>
          </div>
          <button onClick={handleNewScan}
            className="mt-4 w-full py-4 bg-white border-2 border-recycle-border rounded-xl font-medium text-recycle-text hover:bg-recycle-bg-alt transition-colors">
            Try Again
          </button>
        </div>
      )}

      <Toast show={toast.show} message={toast.message} onHide={hideToast} type="info" duration={2500} />

      {/* Main Scan/Results Area */}
      {!isReclaiming && progress.status !== 'success' && progress.status !== 'partial_success' && progress.status !== 'error' && (
        <>
          {/* Scan Button */}
          {!hasScanned && (
            <button onClick={scan} disabled={isScanning}
              className="w-full py-5 bg-recycle-primary text-white font-bold rounded-xl text-lg font-display hover:bg-recycle-primary-dark transition-all shadow-eco-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
              {isScanning ? (
                <><span className="animate-spin">♻️</span>Scanning Your Wallet...</>
              ) : (
                <>
                  <span>♻️</span>
                  Scan for Recyclable SOL
                </>
              )}
            </button>
          )}

          {scanError && (
            <div className="bg-recycle-error/10 border-2 border-recycle-error rounded-xl p-4 mt-4">
              <p className="text-recycle-error text-sm">{scanError}</p>
            </div>
          )}

          {/* Scan Results */}
          {hasScanned && !scanError && !isScanning && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white border-2 border-recycle-border rounded-xl p-3 sm:p-5 overflow-hidden shadow-eco">
                  <p className="text-recycle-text-muted text-[10px] sm:text-xs uppercase tracking-wide mb-1 sm:mb-2">Balance</p>
                  <p className="text-lg sm:text-2xl font-bold font-display text-recycle-text truncate">
                    {solBalance !== null ? `${solBalance.toFixed(4)}` : '...'}
                  </p>
                  <p className="text-recycle-text-muted text-[10px] sm:text-xs">SOL</p>
                </div>
                <div className="bg-white border-2 border-recycle-primary rounded-xl p-3 sm:p-5 overflow-hidden shadow-eco">
                  <p className="text-recycle-text-muted text-[10px] sm:text-xs uppercase tracking-wide mb-1 sm:mb-2">Recyclable</p>
                  <p className="text-lg sm:text-2xl font-bold font-display text-recycle-primary truncate">
                    {(emptyTotalSol * (1 - FEE_PERCENTAGE)).toFixed(4)}
                  </p>
                  <p className="text-recycle-text-muted text-[10px] sm:text-xs">SOL</p>
                </div>
                <div className="hidden sm:block bg-white border-2 border-recycle-border rounded-xl p-3 sm:p-5 shadow-eco">
                  <p className="text-recycle-text-muted text-[10px] sm:text-xs uppercase tracking-wide mb-1 sm:mb-2">Accounts</p>
                  <p className="text-lg sm:text-2xl font-bold font-display text-recycle-text">
                    {emptyAccounts.length}
                  </p>
                  <p className="text-recycle-text-muted text-[10px] sm:text-xs">to recycle</p>
                </div>
              </div>

              {/* Main Content Card */}
              <div className="bg-white border-2 border-recycle-border rounded-2xl overflow-hidden shadow-eco">
                {emptyAccounts.length > 0 ? (
                  <>
                    {/* Low SOL Status Messages */}
                    {solBalance !== null && solBalance < MIN_SOL_FOR_FEES && (
                      <>
                        {!sponsorCheckDone && sponsorInfo.enabled && (
                          <div className="mx-5 mt-5 bg-recycle-secondary/10 border-2 border-recycle-secondary rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl animate-spin">♻️</span>
                              <div>
                                <h4 className="text-recycle-secondary font-semibold text-sm">Checking Fee Sponsorship...</h4>
                                <p className="text-xs text-recycle-text-secondary">
                                  You have low SOL balance. Checking if we can cover your fees.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {sponsorCheckDone && sponsorEligible === true && (
                          <div className="mx-5 mt-5 bg-recycle-success/10 border-2 border-recycle-success rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🌱</span>
                              <div>
                                <h4 className="text-recycle-success font-semibold text-sm">Gas Fees Sponsored!</h4>
                                <p className="text-xs text-recycle-text-secondary">
                                  We&apos;ll cover the transaction fees for you. Recycle your SOL for free!
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {(sponsorCheckDone && sponsorEligible === false) || (!sponsorInfo.enabled) ? (
                          <div className="mx-5 mt-5 bg-recycle-warning/10 border-2 border-recycle-warning rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">⚠️</span>
                              <div>
                                <h4 className="text-recycle-warning font-semibold text-sm">Insufficient SOL for Fees</h4>
                                <p className="text-xs text-recycle-text-secondary">
                                  You have {solBalance.toFixed(4)} SOL. You need at least ~0.00005 SOL for transaction fees.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}

                    {/* Account List */}
                    <AccountsList
                      accounts={emptyAccounts}
                      selectedAccounts={selectedAccounts}
                      onToggleAccount={handleToggleAccount}
                      onSelectAll={handleSelectAll}
                      onDeselectAll={handleDeselectAll}
                    />

                    {/* Action Button */}
                    <div className="p-5 border-t-2 border-recycle-border">
                      <ReclaimButton
                        onClick={handleReclaim}
                        disabled={isReclaiming || selectedAccounts.size === 0 || !hasEnoughSol}
                        isLoading={isReclaiming}
                        solAmount={userReceives}
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-recycle-success/10 flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <h4 className="text-lg font-semibold text-recycle-text mb-2 font-display">Wallet is Clean!</h4>
                    <p className="text-recycle-text-muted text-sm">
                      No recyclable accounts found. Your wallet is already optimized!
                    </p>
                  </div>
                )}
              </div>

              {/* Frozen accounts notice */}
              {frozenCount > 0 && (
                <p className="text-recycle-secondary text-xs text-center">
                  ❄️ {frozenCount} frozen accounts excluded (cannot be recycled)
                </p>
              )}
            </div>
          )}
        </>
      )}

      {(sessionStats.reclaimCount > 0 || sessionStats.totalAccountsClosed > 0) && (
        <SessionStats stats={sessionStats} />
      )}
    </section>
  );
};

export default ScannerPanel;
