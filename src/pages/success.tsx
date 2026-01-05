/**
 * Success Page
 * 
 * Displayed after a successful recycle operation.
 * Allows users to share their success on social media.
 */

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

// Logo component using logo.svg
const RecycleIcon = () => (
  <Image src="/logo.svg" alt="Recycle Sol" width={40} height={40} className="w-10 h-10" />
);

export default function SuccessPage() {
  const router = useRouter();
  const { sol, accounts } = router.query;
  
  const solAmount = parseFloat(sol as string) || 0;
  const accountCount = parseInt(accounts as string) || 0;

  const shareText = `♻️ Just recycled ${solAmount.toFixed(4)} SOL from ${accountCount} empty token accounts using @recyclesol!\n\nYour Solana wallet probably has locked SOL too. Check it out 👇\nhttps://recyclesol.com`;
  
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <>
      <Head>
        <title>Success! - Recycle Sol</title>
        <meta name="description" content="Successfully recycled SOL from empty token accounts!" />
      </Head>

      <div className="min-h-screen bg-recycle-bg flex flex-col">
        {/* Header */}
        <header className="w-full py-4 px-4 md:px-8 border-b border-recycle-border bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
              <RecycleIcon />
              <span className="font-display text-xl font-bold text-recycle-text">
                Recycle Sol
              </span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full text-center">
            {/* Success Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-recycle-success/10 flex items-center justify-center mb-6 animate-pulse">
                <span className="text-5xl">♻️</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-recycle-text mb-4">
                Success!
              </h1>
            </div>

            {/* Stats */}
            {solAmount > 0 && (
              <div className="bg-white border-2 border-recycle-border rounded-2xl p-6 mb-8 shadow-eco">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-recycle-text-muted text-sm mb-1">SOL Recycled</p>
                    <p className="text-3xl font-bold font-display text-recycle-primary">{solAmount.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-recycle-text-muted text-sm mb-1">Accounts Closed</p>
                    <p className="text-3xl font-bold font-display text-recycle-text">{accountCount}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            <p className="text-recycle-text-secondary text-lg mb-8">
              Your SOL has been successfully recycled and sent to your wallet! 🌱
            </p>

            {/* Share Button */}
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold py-4 px-8 rounded-xl transition-all mb-4 shadow-eco"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X (Twitter)
            </a>

            {/* Back Button */}
            <div className="mt-6">
              <Link 
                href="/"
                className="text-recycle-text-secondary hover:text-recycle-primary transition-colors text-sm"
              >
                ← Back to Recycle Sol
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 border-t border-recycle-border bg-white text-center">
          <p className="text-recycle-text-muted text-sm">
            Thank you for using Recycle Sol! 🌿
          </p>
        </footer>
      </div>
    </>
  );
}
