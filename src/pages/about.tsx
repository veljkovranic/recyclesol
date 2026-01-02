/**
 * About Page
 * 
 * About Recycle Sol and the team behind it.
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

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About - Recycle Sol</title>
        <meta name="description" content="Learn about Recycle Sol, the open-source tool helping Solana users recover locked SOL from empty token accounts." />
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
              <Link href="/about" className="text-sm text-recycle-primary font-medium">
                About
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-recycle-text mb-4">
              About <span className="text-recycle-primary">Recycle Sol</span>
            </h1>
            <p className="text-lg text-recycle-text-secondary">
              Helping Solana users recover what&apos;s rightfully theirs
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="pb-20 px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Meet the Builder */}
            <div className="bg-white border-2 border-recycle-border rounded-2xl p-6 md:p-8 shadow-eco">
              <h2 className="font-display text-2xl font-bold text-recycle-text mb-6">Meet the Builder</h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <img 
                  src="/veljko.jpg" 
                  alt="Veljko Vranić" 
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-recycle-border flex-shrink-0"
                />
                <div>
                  <h3 className="text-xl font-bold text-recycle-text mb-2 text-center sm:text-left">Veljko Vranić</h3>
                  <p className="text-recycle-text-secondary leading-relaxed mb-4">
                    Solo builder with over a decade of experience in software development. 
                    I&apos;m publicly documenting how I build products and sharing the journey along the way.
                  </p>
                  <a 
                    href="https://x.com/veljko_builds" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-recycle-primary hover:text-recycle-primary-dark transition-colors font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Follow the build journey →
                  </a>
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="bg-white border-2 border-recycle-border rounded-2xl p-6 md:p-8 shadow-eco">
              <h2 className="font-display text-2xl font-bold text-recycle-text mb-4">Our Mission</h2>
              <p className="text-recycle-text-secondary leading-relaxed mb-4">
                Every time you interact with tokens on Solana, a small amount of SOL gets locked as &quot;rent&quot; in token accounts. 
                When you sell or transfer tokens, these empty accounts stick around—with your SOL still trapped inside.
              </p>
              <p className="text-recycle-text-secondary leading-relaxed">
                Recycle Sol was built to solve this problem. We help you find and close these empty accounts, 
                returning your SOL back to your wallet. It&apos;s your money—you should have it.
              </p>
            </div>

            {/* Why Trust Us */}
            <div className="bg-white border-2 border-recycle-border rounded-2xl p-6 md:p-8 shadow-eco">
              <h2 className="font-display text-2xl font-bold text-recycle-text mb-6">Why Trust Us?</h2>
              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-recycle-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔓</span>
                  </div>
                  <div>
                    <h3 className="text-recycle-text font-semibold mb-1">100% Open Source</h3>
                    <p className="text-recycle-text-secondary text-sm">
                      Every line of code is public. Inspect it, audit it, or contribute to it.{' '}
                      <a 
                        href="https://github.com/veljkovranic/pump-cleanup" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-recycle-primary hover:text-recycle-primary-dark underline underline-offset-2 transition-colors"
                      >
                        View on GitHub →
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-recycle-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <div>
                    <h3 className="text-recycle-text font-semibold mb-1">Non-Custodial</h3>
                    <p className="text-recycle-text-secondary text-sm">
                      We never have access to your private keys or funds. All transactions are signed by you in your own wallet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-recycle-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h3 className="text-recycle-text font-semibold mb-1">Only Empty Accounts</h3>
                    <p className="text-recycle-text-secondary text-sm">
                      We only close accounts with zero token balance. Your assets are always safe.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-recycle-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div>
                    <h3 className="text-recycle-text font-semibold mb-1">Transparent Fees</h3>
                    <p className="text-recycle-text-secondary text-sm">
                      10% of recovered SOL—that&apos;s it. No hidden charges, no upfront costs. You only pay when you get your SOL back.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tech */}
            <div className="bg-white border-2 border-recycle-border rounded-2xl p-6 md:p-8 shadow-eco">
              <h2 className="font-display text-2xl font-bold text-recycle-text mb-4">Built Different</h2>
              <p className="text-recycle-text-secondary leading-relaxed mb-4">
                Unlike other tools, Recycle Sol scans <span className="text-recycle-text font-medium">both</span> the standard SPL Token Program 
                and the Token-2022 Program that many competitors miss. This means we often find significantly more locked SOL in your wallet.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-recycle-bg rounded-lg text-xs text-recycle-text-secondary border border-recycle-border">Next.js</span>
                <span className="px-3 py-1.5 bg-recycle-bg rounded-lg text-xs text-recycle-text-secondary border border-recycle-border">Solana Web3.js</span>
                <span className="px-3 py-1.5 bg-recycle-bg rounded-lg text-xs text-recycle-text-secondary border border-recycle-border">SPL Token</span>
                <span className="px-3 py-1.5 bg-recycle-bg rounded-lg text-xs text-recycle-text-secondary border border-recycle-border">TypeScript</span>
                <span className="px-3 py-1.5 bg-recycle-bg rounded-lg text-xs text-recycle-text-secondary border border-recycle-border">Tailwind CSS</span>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-recycle-primary/5 border-2 border-recycle-primary/20 rounded-2xl p-8 text-center">
              <h3 className="font-display text-2xl font-bold text-recycle-text mb-3">
                Ready to Recycle Your SOL?
              </h3>
              <p className="text-recycle-text-secondary mb-6">
                Connect your wallet and see how much locked SOL is waiting for you.
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
            </div>
          </div>
        </section>

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
