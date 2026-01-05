/**
 * HeroSection Component
 * 
 * Eco-friendly landing page hero for Recycle Sol.
 * Clean design with recycling theme and trust-building elements.
 */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { PublicKey } from '@solana/web3.js';
import { scanWalletForCloseableAccounts, ScanResult, shortenAddress } from '@/lib/solana';
import { FEE_PERCENTAGE } from '@/lib/constants';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

// Rate limiting cache
const RATE_LIMIT_MS = 5 * 60 * 1000;
const scanCache = new Map<string, { result: ScanResult; timestamp: number }>();

// Logo component using logo.svg
const RecycleIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <Image src="/logo.svg" alt="Recycle Sol" width={40} height={40} className={className} />
);

export const HeroSection: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [address, setAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    if (!address.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(address.trim());
    } catch {
      setError('Invalid Solana address');
      return;
    }

    const walletAddress = pubkey.toBase58();
    const cached = scanCache.get(walletAddress);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - cached.timestamp)) / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      setScanResult(cached.result);
      setError(`Using cached result. Refresh available in ${minutes}m ${seconds}s`);
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await scanWalletForCloseableAccounts(pubkey);
      setScanResult(result);
      scanCache.set(walletAddress, { result, timestamp: now });
    } catch (err: any) {
      setError(err?.message || 'Failed to scan wallet');
    } finally {
      setIsScanning(false);
    }
  }, [address]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScanning) {
      handleScan();
    }
  };

  const totalSol = scanResult?.totalReclaimableSol || 0;
  const accountCount = scanResult?.closeableAccounts.length || 0;

  return (
    <>
      <section className="flex-1 flex flex-col items-center justify-center text-center py-12 md:py-20 px-4 relative">
        {/* Subtle eco pattern background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none eco-pattern" />

        {/* Main Headline */}
        <h1 className="relative font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl leading-tight text-recycle-text">
          <span>Your Wallet Has </span>
          <span className="text-recycle-primary">Locked SOL</span>
          <span>.</span>
          <br />
          <span>Let&apos;s </span>
          <span className="text-recycle-primary">Recycle</span>
          <span> It.</span>
        </h1>

        {/* Subtitle */}
        <p className="relative text-lg md:text-xl text-recycle-text-secondary mb-8 max-w-2xl leading-relaxed">
          Every token account on Solana locks ~<span className="text-recycle-primary font-semibold">0.002 SOL</span> as rent. 
          When you sell tokens, this SOL stays trapped. We help you close empty accounts and get your SOL back—clean wallet, recovered value.
        </p>

        {/* CTA Area */}
        {!showScanner ? (
          <div className="relative flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <WalletMultiButton 
                className="!bg-recycle-primary !text-white !font-bold !py-5 !px-12 !rounded-2xl !text-lg hover:!bg-recycle-primary-dark !transition-all !shadow-eco-lg hover:!shadow-eco-xl hover:!scale-[1.02]"
              >
                ♻️ Recycle Your SOL
              </WalletMultiButton>
              <button
                onClick={() => setShowScanner(true)}
                className="py-3 px-6 rounded-xl font-medium text-recycle-text-secondary hover:text-recycle-primary transition-all text-sm border-2 border-recycle-border hover:border-recycle-primary bg-white hover:bg-recycle-bg-alt"
              >
                Preview Any Wallet First
              </button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 text-sm text-recycle-text-muted">
              <span className="flex items-center gap-2">
                <span className="text-recycle-success">✓</span>
                Non-custodial
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-2">
                <span className="text-recycle-success">✓</span>
                <a 
                  href="https://github.com/veljkovranic/pump-cleanup" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-recycle-primary underline underline-offset-2 transition-colors"
                >
                  Open source
                </a>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-2">
                <span className="text-recycle-success">✓</span>
                10% fee only on recovered SOL
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-xl">
            {/* Search Box */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter wallet address..."
                className="flex-1 bg-white border-2 border-recycle-border rounded-xl px-5 py-4 text-recycle-text placeholder-recycle-text-muted focus:outline-none focus:border-recycle-primary transition-colors shadow-eco"
                disabled={isScanning}
              />
              <button
                onClick={handleScan}
                disabled={isScanning || !address.trim()}
                className="px-6 py-4 bg-recycle-primary text-white font-semibold rounded-xl hover:bg-recycle-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-eco"
              >
                {isScanning ? '...' : 'Scan'}
              </button>
            </div>

            {/* Connect Wallet option */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-recycle-text-muted text-sm">or</span>
              <WalletMultiButton 
                className="!bg-recycle-primary !text-white !font-bold !py-4 !px-8 !rounded-xl !text-base hover:!bg-recycle-primary-dark !transition-all !shadow-eco"
              >
                ♻️ Connect & Recycle
              </WalletMultiButton>
            </div>

            {error && (
              <p className="text-recycle-error text-sm mb-3">{error}</p>
            )}

            {/* Result inline */}
            {scanResult && !isScanning && (
              <div className="bg-white border-2 border-recycle-border rounded-xl p-5 shadow-eco">
                {accountCount > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-recycle-border">
                      <span className="text-recycle-text-secondary text-sm">Reclaimable SOL:</span>
                      <span className="text-2xl font-bold text-recycle-primary font-display">
                        {(totalSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL
                      </span>
                    </div>
                    
                    {scanResult.isTruncated && (
                      <div className="bg-recycle-warning/10 border border-recycle-warning/30 rounded-lg p-3 mb-4">
                        <p className="text-recycle-warning text-sm text-center">
                          Found {scanResult.totalCloseableCount} accounts! Showing first 100.
                          <br />
                          <span className="opacity-80">Estimated total: {(scanResult.estimatedTotalSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL</span>
                        </p>
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-2">
                      <p className="text-recycle-text-muted text-xs mb-2">
                        {scanResult.isTruncated ? `Showing ${accountCount} of ${scanResult.totalCloseableCount}` : `${accountCount} recyclable accounts`}:
                      </p>
                      {scanResult.closeableAccounts.slice(0, 20).map((account) => (
                        <div 
                          key={account.address.toBase58()} 
                          className="flex items-center justify-between text-sm py-2 px-3 bg-recycle-bg rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-recycle-primary">♻️</span>
                            <span className="text-recycle-text-secondary font-mono text-xs">{shortenAddress(account.mint, 4)}</span>
                          </div>
                          <span className="text-recycle-primary font-semibold">
                            +{(account.rentSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL
                          </span>
                        </div>
                      ))}
                      {accountCount > 20 && (
                        <p className="text-recycle-text-muted text-xs text-center pt-2">
                          +{accountCount - 20} more accounts...
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-recycle-text-muted text-center py-4">
                    ✨ This wallet is already clean—no recyclable accounts found.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};

export default HeroSection;
