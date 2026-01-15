/**
 * HeroSection Component
 * 
 * Professional landing page hero inspired by rpcfast.com
 * Clean design with clear value proposition and CTA.
 */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
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
      {/* Landing Page Header */}
      {/* <header className="w-full py-4 px-4 md:px-8 border-b border-cleanup-border/50 backdrop-blur-xl bg-cleanup-dark/90 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-all">
            <img 
              src="/logo.svg" 
              alt="PumpCleanup" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl"
            />
            <span className="font-display text-lg sm:text-xl font-bold text-white">
              PumpCleanup
            </span>
          </Link>
          <nav className="flex items-center gap-4 lg:gap-6">
            <Link 
              href="/blog" 
              className="text-sm text-cleanup-text-secondary hover:text-white transition-colors hidden lg:block"
            >
              Blog
            </Link>
            <Link 
              href="/faq" 
              className="text-sm text-cleanup-text-secondary hover:text-white transition-colors hidden lg:block"
            >
              FAQ
            </Link>
            <WalletMultiButton className="!bg-cleanup-card !border !border-cleanup-border !rounded-xl !py-2 !px-3 lg:!py-2.5 lg:!px-5 !text-white hover:!bg-cleanup-hover hover:!border-cleanup-primary !transition-all !font-medium !text-xs lg:!text-sm">
              Reclaim Your SOL Now
            </WalletMultiButton>
          </nav>
        </div>
      </header> */}

      {/* Floating Social Links */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Telegram */}
        <a
          href="https://t.me/+ZQKhA2sHZAlkNWRk"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-cleanup-card/90 backdrop-blur-sm border border-cleanup-border rounded-xl flex items-center justify-center text-cleanup-text-secondary hover:text-white hover:border-cleanup-primary/50 transition-all"
          title="Join Telegram"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </a>

        {/* X (Twitter) */}
        <a
          href="https://twitter.com/pumpcleanup"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-cleanup-card/90 backdrop-blur-sm border border-cleanup-border rounded-xl flex items-center justify-center text-cleanup-text-secondary hover:text-white hover:border-cleanup-primary/50 transition-all"
          title="Follow on X"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>

        {/* GitHub */}
        <a
          href="https://github.com/veljkovranic/pump-cleanup"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-cleanup-card/90 backdrop-blur-sm border border-cleanup-border rounded-xl flex items-center justify-center text-cleanup-text-secondary hover:text-white hover:border-cleanup-primary/50 transition-all"
          title="View on GitHub"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>

      <section className="flex-1 flex flex-col items-center justify-center text-center pt-12 md:pt-20 pb-6 md:pb-8 px-4 relative">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cleanup-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cleanup-secondary/10 rounded-full blur-[100px]" />
        </div>

        {/* Badge */}
       

        {/* Main Headline */}
        <h1 className="relative font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl leading-tight">
          <span className="text-white">Your Solana Wallet is Leaking </span>
          <span className="gradient-text">SOL</span>
          <span className="text-white">.</span>
          <br />
          <span className="text-white">We'll Help You </span>
          <span className="gradient-text">Reclaim</span>
          <span className="text-white">.</span>
        </h1>

        {/* Subtitle */}
        <p className="relative text-lg md:text-xl text-cleanup-text-secondary mb-8 max-w-2xl leading-relaxed">
          Every leftover slot in your Solana wallet holds about <span className="text-cleanup-primary font-semibold">0.002 SOL</span> you can&apos;t use.
          Selling your coins doesn&apos;t bring it back. We clean up those empty leftovers so you get your SOL back instantly - often enough for a full meal 🍕 or more.
        </p>

        {/* CTA Area */}
        {!showScanner ? (
          <div className="relative flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <WalletMultiButton 
                className="!text-white !font-bold !py-6 !px-16 !rounded-2xl !text-2xl hover:!opacity-90 !transition-all !shadow-2xl hover:!shadow-3xl hover:!scale-105"
                style={{ background: 'linear-gradient(135deg, #9945FF 0%, #4f8fff 50%, #00d4aa 100%)', boxShadow: '0 20px 40px rgba(153, 69, 255, 0.4)', fontSize: '18px !important',
                  padding: '20px 46px;' }}
              >
                Reclaim Your SOL Now
              </WalletMultiButton>
              <button
                onClick={() => setShowScanner(true)}
                className="py-3 px-6 rounded-xl font-medium text-cleanup-text-secondary hover:text-white transition-all text-sm border border-cleanup-border/50 hover:border-cleanup-primary/50 bg-white/5 hover:bg-white/10"
              >
                Scan Your Wallet Address
              </button>
            </div>
            <p className="text-cleanup-text-muted text-sm mt-2">
              ✅ Non-custodial & secure. We never access your funds.
            </p>
            <p className="text-cleanup-text-muted text-sm">
              🔓 Fully open source —{' '}
              <a 
                href="https://github.com/veljkovranic/pump-cleanup" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cleanup-primary hover:text-cleanup-secondary underline underline-offset-2 transition-colors"
              >
                view the code on GitHub
              </a>
            </p>
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
                className="flex-1 bg-cleanup-card border border-cleanup-border rounded-xl px-5 py-4 text-white placeholder-cleanup-text-muted focus:outline-none focus:border-cleanup-primary transition-colors"
                disabled={isScanning}
              />
              <button
                onClick={handleScan}
                disabled={isScanning || !address.trim()}
                className="px-6 py-4 bg-gradient-to-r from-cleanup-primary to-cleanup-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? '...' : 'Scan'}
              </button>
            </div>

            {/* Connect Wallet option */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-cleanup-text-muted text-sm">or</span>
              <WalletMultiButton 
                className="!text-white !font-bold !py-6 !px-16 !rounded-2xl !text-2xl hover:!opacity-90 !transition-all !shadow-2xl hover:!shadow-3xl hover:!scale-105"
                style={{ background: 'linear-gradient(135deg, #9945FF 0%, #4f8fff 50%, #00d4aa 100%)', boxShadow: '0 20px 40px rgba(153, 69, 255, 0.4)', fontSize: '18px !important',
                  padding: '20px 46px;' }}
              >
                Reclaim Your SOL Now
              </WalletMultiButton>            </div>

            {error && (
              <p className="text-cleanup-error text-sm mb-3">{error}</p>
            )}

            {/* Result inline */}
            {scanResult && !isScanning && (
              <div className="bg-cleanup-card border border-cleanup-border rounded-xl p-5">
                {accountCount > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-cleanup-border">
                      <span className="text-cleanup-text-secondary text-sm">Reclaimable SOL:</span>
                      <span className="text-2xl font-bold text-cleanup-secondary font-display">
                        {(totalSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL
                      </span>
                    </div>
                    
                    {scanResult.isTruncated && (
                      <div className="bg-cleanup-warning/10 border border-cleanup-warning/30 rounded-lg p-3 mb-4">
                        <p className="text-cleanup-warning text-sm text-center">
                          Found {scanResult.totalCloseableCount} accounts! Showing first 100.
                          <br />
                          <span className="opacity-80">Estimated total: {(scanResult.estimatedTotalSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL</span>
                        </p>
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-2">
                      <p className="text-cleanup-text-muted text-xs mb-2">
                        {scanResult.isTruncated ? `Showing ${accountCount} of ${scanResult.totalCloseableCount}` : `${accountCount} closeable accounts`}:
                      </p>
                      {scanResult.closeableAccounts.slice(0, 20).map((account) => (
                        <div 
                          key={account.address.toBase58()} 
                          className="flex items-center justify-between text-sm py-2 px-3 bg-cleanup-dark/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-cleanup-text-muted">📭</span>
                            <span className="text-cleanup-text-secondary font-mono text-xs">{shortenAddress(account.mint, 4)}</span>
                          </div>
                          <span className="text-cleanup-secondary font-semibold">
                            +{(account.rentSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL
                          </span>
                        </div>
                      ))}
                      {accountCount > 20 && (
                        <p className="text-cleanup-text-muted text-xs text-center pt-2">
                          +{accountCount - 20} more accounts...
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-cleanup-text-muted text-center py-4">
                    No closeable accounts found in this wallet.
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
