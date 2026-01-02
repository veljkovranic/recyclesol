/**
 * Blog Post: What is Solana Rent?
 * 
 * Educational article about Solana's rent mechanism.
 */

import Head from 'next/head';
import Link from 'next/link';

// Recycling icon component
const RecycleIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#2d8a4e"/>
    <path d="M12 5.5L14.5 8.5H13V10.5C13 11.5 13.5 12 14.5 12H16.5V13.5H14C12.5 13.5 11 12 11 10.5V8.5H9.5L12 5.5Z" fill="white"/>
    <path d="M7.5 15.5L7.5 13L9.5 15.5H7.5ZM8.5 16.5H6C5.5 16.5 5 16 5 15.5V12.5H6.5V15H9V17.5L11 17.5L9.5 20L8 17.5L8.5 16.5Z" fill="white" transform="rotate(-120 12 12)"/>
    <path d="M7.5 15.5L7.5 13L9.5 15.5H7.5ZM8.5 16.5H6C5.5 16.5 5 16 5 15.5V12.5H6.5V15H9V17.5L11 17.5L9.5 20L8 17.5L8.5 16.5Z" fill="white" transform="rotate(120 12 12)"/>
  </svg>
);

export default function BlogPost() {
  return (
    <>
      <Head>
        <title>What is Solana Rent and Why Are You Paying It? - Recycle Sol</title>
        <meta name="description" content="Learn about Solana's rent mechanism, why token accounts lock your SOL, and how to reclaim it." />
        <meta property="og:title" content="What is Solana Rent and Why Are You Paying It?" />
        <meta property="og:description" content="Learn about Solana's rent mechanism and how to reclaim locked SOL." />
        <meta property="og:type" content="article" />
      </Head>

      <div className="min-h-screen bg-recycle-bg">
        {/* Header */}
        <header className="w-full py-4 px-4 md:px-8 border-b border-recycle-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
              <RecycleIcon />
              <span className="font-display text-xl font-bold text-recycle-text">
                Recycle Sol
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-recycle-text-secondary hover:text-recycle-primary transition-colors">
                App
              </Link>
              <Link href="/blog" className="text-sm text-recycle-text-secondary hover:text-recycle-primary transition-colors">
                Learn
              </Link>
              <Link href="/faq" className="text-sm text-recycle-text-secondary hover:text-recycle-primary transition-colors">
                FAQ
              </Link>
              <Link href="/about" className="text-sm text-recycle-text-secondary hover:text-recycle-primary transition-colors">
                About
              </Link>
            </nav>
          </div>
        </header>

        {/* Article */}
        <article className="py-12 md:py-20 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-recycle-text-secondary hover:text-recycle-primary transition-colors mb-8"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Learn
            </Link>

            {/* Article header */}
            <header className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs px-3 py-1 rounded-full bg-recycle-primary/10 text-recycle-primary font-medium">
                  Education
                </span>
                <span className="text-xs text-recycle-text-muted">5 min read</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-recycle-text mb-4 leading-tight">
                What is Solana Rent and Why Are You Paying It?
              </h1>
              <p className="text-lg text-recycle-text-secondary">
                Every time you interact with a token on Solana, you&apos;re paying rent. Here&apos;s what that means and how to get your SOL back.
              </p>
              <div className="mt-6 pt-6 border-t border-recycle-border">
                <time className="text-sm text-recycle-text-muted">
                  December 24, 2024
                </time>
              </div>
            </header>

            {/* Article content */}
            <div className="prose prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-recycle-text mb-4">
                  Understanding Solana&apos;s Rent Model
                </h2>
                <p className="text-recycle-text-secondary leading-relaxed mb-4">
                  Solana uses a unique approach to managing on-chain data storage called &quot;rent.&quot; Unlike traditional blockchains where you pay gas fees only for transactions, Solana requires accounts to maintain a minimum balance to store data on the network.
                </p>
                <p className="text-recycle-text-secondary leading-relaxed">
                  This rent mechanism exists to prevent state bloat—a problem where the blockchain becomes cluttered with unused data, slowing down the network for everyone.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-recycle-text mb-4">
                  Why Token Accounts Lock Your SOL
                </h2>
                <p className="text-recycle-text-secondary leading-relaxed mb-4">
                  Every time you receive a new token on Solana—whether from a swap, an airdrop, or an NFT mint—a new &quot;token account&quot; is created in your wallet. This account holds your balance of that specific token.
                </p>
                <div className="bg-white border-2 border-recycle-border rounded-xl p-6 my-6 shadow-eco">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-recycle-primary/10 flex items-center justify-center">
                      <span className="text-lg">💡</span>
                    </div>
                    <span className="font-semibold text-recycle-text">Key Point</span>
                  </div>
                  <p className="text-recycle-text-secondary">
                    Each token account requires approximately <span className="text-recycle-primary font-semibold">0.00203928 SOL</span> as &quot;rent-exempt&quot; balance. This SOL is locked and cannot be used while the account exists.
                  </p>
                </div>
                <p className="text-recycle-text-secondary leading-relaxed">
                  The problem? When you sell or transfer all of a token, the account remains—with your SOL still locked inside. Most users don&apos;t realize they have dozens or even hundreds of these empty accounts.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-recycle-text mb-4">
                  How Much SOL Are You Missing?
                </h2>
                <p className="text-recycle-text-secondary leading-relaxed mb-4">
                  Let&apos;s do the math. If you&apos;ve been active on Solana—trading memecoins, collecting NFTs, or using DeFi—you might have:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-recycle-text-secondary">
                    <span className="text-recycle-primary mt-1">•</span>
                    <span><strong className="text-recycle-text">50 empty accounts</strong> = ~0.10 SOL locked</span>
                  </li>
                  <li className="flex items-start gap-3 text-recycle-text-secondary">
                    <span className="text-recycle-primary mt-1">•</span>
                    <span><strong className="text-recycle-text">100 empty accounts</strong> = ~0.20 SOL locked</span>
                  </li>
                  <li className="flex items-start gap-3 text-recycle-text-secondary">
                    <span className="text-recycle-primary mt-1">•</span>
                    <span><strong className="text-recycle-text">500 empty accounts</strong> = ~1.00 SOL locked</span>
                  </li>
                </ul>
                <p className="text-recycle-text-secondary leading-relaxed">
                  Heavy traders and NFT collectors can have thousands of accounts, representing significant locked value.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-recycle-text mb-4">
                  How to Recycle Your SOL
                </h2>
                <p className="text-recycle-text-secondary leading-relaxed mb-4">
                  The good news: you can close these empty token accounts and get your SOL back. When you close an account, the rent-exempt SOL is returned to your wallet.
                </p>
                <p className="text-recycle-text-secondary leading-relaxed mb-4">
                  That&apos;s exactly what <Link href="/" className="text-recycle-primary hover:underline">Recycle Sol</Link> does. It scans your wallet, identifies all recyclable accounts, and lets you reclaim your SOL in just a few clicks.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-recycle-text mb-4">
                  Is It Safe?
                </h2>
                <p className="text-recycle-text-secondary leading-relaxed mb-4">
                  Yes! Closing an empty token account is a standard Solana operation. We only close accounts that:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-recycle-text-secondary">
                    <span className="text-recycle-success mt-1">✓</span>
                    <span>Have a <strong className="text-recycle-text">zero token balance</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-recycle-text-secondary">
                    <span className="text-recycle-success mt-1">✓</span>
                    <span>Are <strong className="text-recycle-text">owned by you</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-recycle-text-secondary">
                    <span className="text-recycle-success mt-1">✓</span>
                    <span>Are <strong className="text-recycle-text">not frozen</strong> by the token program</span>
                  </li>
                </ul>
                <p className="text-recycle-text-secondary leading-relaxed">
                  You always review and approve each transaction before signing. Your wallet, your control.
                </p>
              </section>

              {/* CTA */}
              <section className="bg-recycle-primary/5 border-2 border-recycle-primary/20 rounded-2xl p-8 text-center">
                <h3 className="font-display text-2xl font-bold text-recycle-text mb-3">
                  Ready to Recycle Your SOL?
                </h3>
                <p className="text-recycle-text-secondary mb-6">
                  Connect your wallet and see how much Locked SOL you have.
                </p>
                <Link 
                  href="/"
                    className="inline-flex items-center gap-2 bg-recycle-primary text-white font-semibold py-3 px-8 rounded-xl hover:bg-recycle-primary-dark transition-all shadow-eco"
                >
                  ♻️ Launch App
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </section>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-recycle-border bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <Link href="/" className="text-recycle-text-secondary hover:text-recycle-primary transition-colors text-sm">
              ← Back to Recycle Sol
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
