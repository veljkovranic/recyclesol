/**
 * Header Component
 * 
 * Clean, trustworthy navigation header for Recycle Sol.
 */

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

// Recycling icon component
const RecycleIcon = () => (
  <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#2d8a4e"/>
    <path d="M12 5.5L14.5 8.5H13V10.5C13 11.5 13.5 12 14.5 12H16.5V13.5H14C12.5 13.5 11 12 11 10.5V8.5H9.5L12 5.5Z" fill="white"/>
    <path d="M7.5 15.5L7.5 13L9.5 15.5H7.5ZM8.5 16.5H6C5.5 16.5 5 16 5 15.5V12.5H6.5V15H9V17.5L11 17.5L9.5 20L8 17.5L8.5 16.5Z" fill="white" transform="rotate(-120 12 12)"/>
    <path d="M7.5 15.5L7.5 13L9.5 15.5H7.5ZM8.5 16.5H6C5.5 16.5 5 16 5 15.5V12.5H6.5V15H9V17.5L11 17.5L9.5 20L8 17.5L8.5 16.5Z" fill="white" transform="rotate(120 12 12)"/>
  </svg>
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
          <RecycleIcon />
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
