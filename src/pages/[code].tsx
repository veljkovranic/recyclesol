/**
 * Referral Code Handler
 * 
 * Handles URLs like pumpcleanup.com/XXXXXX
 * Stores the referral code and redirects to the main page.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { REFERRAL_STORAGE_KEY } from '@/lib/constants';

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
  const router = useRouter();

  useEffect(() => {
    if (isValid && code) {
      // Store the referral code
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, code);
        console.log('[Referral] Stored code from URL path:', code);
      } catch (e) {
        console.error('[Referral] Failed to store code:', e);
      }
    }
    
    // Redirect to home page
    router.replace('/');
  }, [code, isValid, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-cleanup-dark">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-cleanup-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-cleanup-text-secondary">Redirecting...</p>
      </div>
    </div>
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

  return {
    props: {
      code: code.toUpperCase(),
      isValid,
    },
  };
};

