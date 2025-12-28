/**
 * Success Page
 * 
 * Displayed after a successful cleanup operation.
 * Allows users to share their success on social media.
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SuccessPage() {
  const router = useRouter();
  const { sol, accounts } = router.query;
  
  const solAmount = parseFloat(sol as string) || 0;
  const accountCount = parseInt(accounts as string) || 0;

  const shareText = `🎉 Just reclaimed ${solAmount.toFixed(4)} SOL from ${accountCount} empty token accounts using @pumpcleanup!\n\nYour Solana wallet is probably leaking SOL too. Check it out 👇\nhttps://pumpcleanup.com`;
  
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <>
      <Head>
        <title>Success! - PumpCleanup</title>
        <meta name="description" content="Successfully reclaimed SOL from empty token accounts!" />
      </Head>

      <div className="min-h-screen bg-cleanup-dark flex flex-col">
        {/* Header */}
        <header className="w-full py-4 px-4 md:px-8 border-b border-cleanup-border/50 backdrop-blur-xl bg-cleanup-dark/90">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
              <img 
                src="/logo.svg" 
                alt="PumpCleanup" 
                className="w-10 h-10 rounded-xl"
              />
              <span className="font-display text-xl font-bold text-white">
                PumpCleanup
              </span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full text-center">
            {/* Success Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cleanup-secondary/20 to-cleanup-primary/20 flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-12 h-12 text-cleanup-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                🎉 Success!
              </h1>
            </div>

            {/* Stats */}
            {solAmount > 0 && (
              <div className="bg-cleanup-card border border-cleanup-border rounded-2xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-cleanup-text-muted text-sm mb-1">SOL Reclaimed</p>
                    <p className="text-3xl font-bold font-display gradient-text">{solAmount.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-cleanup-text-muted text-sm mb-1">Accounts Closed</p>
                    <p className="text-3xl font-bold font-display text-white">{accountCount}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            <p className="text-cleanup-text-secondary text-lg mb-8">
              Your SOL has been successfully reclaimed and sent to your wallet!
            </p>

            {/* Share Button */}
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold py-4 px-8 rounded-xl transition-all mb-4"
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
                className="text-cleanup-text-secondary hover:text-white transition-colors text-sm"
              >
                ← Back to PumpCleanup
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 border-t border-cleanup-border/50 text-center">
          <p className="text-cleanup-text-muted text-sm">
            Thank you for using PumpCleanup! 💚
          </p>
        </footer>
      </div>
    </>
  );
}

