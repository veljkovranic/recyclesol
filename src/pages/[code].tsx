/**
 * Referral Code Handler
 * 
 * Handles URLs like pumpcleanup.com/XXXXXX
 * Renders the full app with the referral code stored.
 * URL stays as pumpcleanup.com/XXXXXX throughout the flow.
 */

import { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useWallet } from '@solana/wallet-adapter-react';
import { REFERRAL_STORAGE_KEY } from '@/lib/constants';
import { Header, HeroSection, ScannerPanel, Footer, RecentPayouts } from '@/components';

// Reserved paths that should NOT be treated as referral codes
const RESERVED_PATHS = [
  'about',
  'faq',
  'blog',
  'success',
  'api',
  '_next',
  'static',
];

interface ReferralPageProps {
  code: string;
  isValid: boolean;
}

export default function ReferralPage({ code, isValid }: ReferralPageProps) {
  const { connected } = useWallet();

  // Store the referral code on mount
  useEffect(() => {
    if (isValid && code) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, code);
        console.log('[Referral] Stored code from URL path:', code);
      } catch (e) {
        console.error('[Referral] Failed to store code:', e);
      }
    }
  }, [code, isValid]);

  // Render the full app (same as index.tsx but with referral code in URL)
  return (
    <>
      <Head>
        <title>PumpCleanup - Reclaim SOL From Empty Token Accounts</title>
        <meta name="description" content="Your Solana Wallet is Leaking SOL, We'll Help You Reclaim It." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="PumpCleanup - Reclaim SOL From Empty Token Accounts" />
        <meta property="og:description" content="Your Solana Wallet is Leaking SOL, We'll Help You Reclaim It." />
        <meta property="og:url" content={`https://pumpcleanup.com/${code}`} />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pumpcleanup" />
        <meta name="twitter:title" content="PumpCleanup - Reclaim SOL From Empty Token Accounts" />
        <meta name="twitter:description" content="Your Solana Wallet is Leaking SOL, We'll Help You Reclaim It." />
      </Head>

      <div className="min-h-screen flex flex-col bg-cleanup-dark relative overflow-hidden">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-cleanup-primary/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cleanup-secondary/5 rounded-full blur-[120px]" />
          
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1b2308_1px,transparent_1px),linear-gradient(to_bottom,#1a1b2308_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {connected && <Header />}

          <main className="flex-1 flex flex-col items-center">
            {connected ? (
              <>
                <ScannerPanel />
                <RecentPayouts />
              </>
            ) : (
              <>
                <HeroSection />
                <RecentPayouts />
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { code } = context.params as { code: string };
  
  // Check if this is a reserved path
  if (RESERVED_PATHS.includes(code.toLowerCase())) {
    return {
      notFound: true,
    };
  }

  // Basic validation: referral codes are 6 chars alphanumeric OR full wallet addresses (32-44 chars)
  const isShortCode = /^[A-Z0-9]{6}$/i.test(code);
  const isWalletAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(code);
  const isValid = isShortCode || isWalletAddress;

  // If not valid, return 404
  if (!isValid) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      code: code.toUpperCase(),
      isValid,
    },
  };
};
