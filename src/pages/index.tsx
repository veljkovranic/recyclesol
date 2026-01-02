/**
 * Recycle Sol - Main Page
 * 
 * Eco-friendly landing page and dApp for reclaiming SOL from empty token accounts.
 * Clean design with light greens and recycling theme.
 */

import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header, HeroSection, ScannerPanel, Footer, RecentPayouts } from '@/components';
import { getCachedTotalSolReclaimed } from '@/components/RecentPayouts';
import { faqs } from './faq';

export default function Home() {
  const { connected } = useWallet();

  return (
    <>
      <Head>
        <title>Recycle Sol - Reclaim Locked SOL From Your Wallet</title>
        <meta name="description" content="Your Solana wallet has locked SOL in empty token accounts. Recycle Sol helps you recover it—clean wallet, recovered value." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Recycle Sol - Reclaim Locked SOL From Your Wallet" />
        <meta property="og:description" content="Your Solana wallet has SOL locked in empty token accounts. Recycle Sol helps you recover it." />
        <meta property="og:url" content="https://recyclesol.com" />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@recyclesol" />
        <meta name="twitter:title" content="Recycle Sol - Reclaim Locked SOL From Your Wallet" />
        <meta name="twitter:description" content="Your Solana wallet has SOL locked in empty token accounts. Recycle Sol helps you recover it." />
      </Head>

      <div className="min-h-screen flex flex-col bg-recycle-bg relative overflow-hidden">
        {/* Subtle eco pattern background */}
        <div className="fixed inset-0 pointer-events-none eco-pattern" />

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
                <StatsSection />
                <FeaturesSection />
                <HowItWorksSection />
                <FAQSection />
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}

/**
 * Stats section showing key metrics.
 */
const StatsSection: React.FC = () => {
  const [totalSol, setTotalSol] = useState(0);

  useEffect(() => {
    const updateTotal = () => setTotalSol(getCachedTotalSolReclaimed());
    updateTotal();
    const interval = setInterval(updateTotal, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { 
      value: totalSol > 0 ? `${totalSol.toFixed(2)}+` : '---', 
      label: 'SOL Recycled',
      icon: '♻️'
    },
    { value: '~0.002', label: 'SOL per Account', icon: '💰' },
    { value: '10%', label: 'Service Fee', icon: '✨' },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-3xl md:text-4xl font-bold font-display text-recycle-primary mb-2">
              {stat.value}
            </div>
            <div className="text-sm text-recycle-text-secondary">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Features section explaining key benefits.
 */
const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: '♻️',
      title: 'Recover Locked SOL',
      description: 'Each empty token account has ~0.002 SOL locked as rent. We help you recycle it back to your wallet.',
    },
    {
      icon: '🧹',
      title: 'Clean Wallet',
      description: 'Remove clutter from old swaps, NFT mints, and abandoned tokens. Keep your wallet organized.',
    },
    {
      icon: '🔒',
      title: 'Safe & Secure',
      description: 'Non-custodial and open source. Your wallet, your control. We never access your private keys.',
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-recycle-text mb-4">
          Why Recycle Your SOL?
        </h2>
        <p className="text-recycle-text-secondary max-w-2xl mx-auto">
          Every token transaction on Solana creates accounts that lock SOL. Most users don&apos;t realize they have dozens of empty accounts with trapped value waiting to be recovered.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <div 
            key={i} 
            className="bg-white border-2 border-recycle-border rounded-2xl p-6 card-hover shadow-eco"
          >
            <div className="w-14 h-14 rounded-xl bg-recycle-primary/10 flex items-center justify-center mb-4 text-2xl">
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold text-recycle-text mb-2 font-display">{feature.title}</h3>
            <p className="text-recycle-text-secondary text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * How it works section.
 */
const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Connect Wallet',
      description: 'Connect your Solana wallet securely. We support Phantom, Solflare, and more.',
    },
    {
      step: '02',
      title: 'Find Recyclables',
      description: 'We automatically scan for empty token accounts with reclaimable rent.',
    },
    {
      step: '03',
      title: 'Recycle & Recover',
      description: 'Close empty accounts in one click and receive your SOL instantly.',
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-recycle-text mb-4">
          How It Works
        </h2>
        <p className="text-recycle-text-secondary max-w-2xl mx-auto">
          Recycle your SOL in three simple steps. No technical knowledge required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((item, i) => (
          <div key={i} className="relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-recycle-border" />
            )}
            
            <div className="relative bg-white border-2 border-recycle-border rounded-2xl p-6 text-center shadow-eco">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-recycle-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-white font-display">{item.step}</span>
              </div>
              <h3 className="text-lg font-bold text-recycle-text mb-2 font-display">{item.title}</h3>
              <p className="text-recycle-text-secondary text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * FAQ Section on home page
 */
const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16 mb-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-recycle-text mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-recycle-text-secondary max-w-2xl mx-auto">
          Everything you need to know about recycling your SOL
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="bg-white border-2 border-recycle-border rounded-xl overflow-hidden shadow-eco"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-recycle-bg-alt transition-colors"
            >
              <h3 className="font-display text-base font-semibold text-recycle-text pr-4">
                {faq.question}
              </h3>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full bg-recycle-bg flex items-center justify-center transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                <svg className="w-3.5 h-3.5 text-recycle-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {openIndex === index && (
              <div className="px-5 pb-5">
                <div className="text-recycle-text-secondary text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link 
          href="/faq"
          className="text-recycle-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
        >
          View all FAQs
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
};
