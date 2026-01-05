/**
 * Header Component
 * 
 * Clean, trustworthy navigation header for Recycle Sol.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export const Header: React.FC = () => {
  const { disconnect, connected } = useWallet();

  const handleLogoClick = async () => {
    if (connected) {
      await disconnect();
    }
    window.location.href = '/';
  };

  return (
    <header className="w-full py-4 px-4 md:px-8 border-b border-recycle-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={handleLogoClick} 
          className="flex items-center gap-2 sm:gap-3 text-left hover:opacity-80 transition-all group"
        >
          <Image src="/logo.svg" alt="Recycle Sol" width={36} height={36} className="w-8 h-8 sm:w-9 sm:h-9" />
          <div className="flex flex-col">
            <h1 className="font-display text-lg sm:text-xl font-bold text-recycle-text">
              Recycle Sol
            </h1>
            <p className="text-xs text-recycle-text-muted hidden sm:block">
              Click to disconnect
            </p>
          </div>
        </button>

        {/* Nav + Wallet */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link 
            href="/blog" 
            className="text-sm text-recycle-text-secondary hover:text-recycle-primary transition-colors hidden lg:block"
          >
            Learn
          </Link>
          <Link 
            href="/faq" 
            className="text-sm text-recycle-text-secondary hover:text-recycle-primary transition-colors hidden lg:block"
          >
            FAQ
          </Link>
          <Link 
            href="/about" 
            className="text-sm text-recycle-text-secondary hover:text-recycle-primary transition-colors hidden lg:block"
          >
            About
          </Link>
          <WalletMultiButton className="!bg-recycle-primary !border-none !rounded-xl !py-2 !px-3 lg:!py-2.5 lg:!px-5 !text-white hover:!bg-recycle-primary-dark !transition-all !font-medium !text-xs lg:!text-sm !shadow-eco" />
        </div>
      </div>
    </header>
  );
};

export default Header;
