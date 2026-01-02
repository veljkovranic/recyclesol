/**
 * FAQ Page
 * 
 * Frequently Asked Questions about Recycle Sol and Solana rent.
 */

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

// Recycling icon component
const RecycleIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#2d8a4e"/>
    <path d="M12 5.5L14.5 8.5H13V10.5C13 11.5 13.5 12 14.5 12H16.5V13.5H14C12.5 13.5 11 12 11 10.5V8.5H9.5L12 5.5Z" fill="white"/>
    <path d="M7.5 15.5L7.5 13L9.5 15.5H7.5ZM8.5 16.5H6C5.5 16.5 5 16 5 15.5V12.5H6.5V15H9V17.5L11 17.5L9.5 20L8 17.5L8.5 16.5Z" fill="white" transform="rotate(-120 12 12)"/>
    <path d="M7.5 15.5L7.5 13L9.5 15.5H7.5ZM8.5 16.5H6C5.5 16.5 5 16 5 15.5V12.5H6.5V15H9V17.5L11 17.5L9.5 20L8 17.5L8.5 16.5Z" fill="white" transform="rotate(120 12 12)"/>
  </svg>
);

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    question: "How does this work?",
    answer: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 bg-recycle-bg rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-recycle-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-recycle-primary font-bold text-sm">1</span>
            </div>
            <p className="text-sm">When you buy a token, a <span className="text-recycle-text">token account</span> is created to store it.</p>
          </div>
          <div className="flex items-start gap-3 bg-recycle-bg rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-recycle-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-recycle-primary font-bold text-sm">2</span>
            </div>
            <p className="text-sm">Solana charges <span className="text-recycle-primary font-semibold">0.00204 SOL</span> rent to keep it active.</p>
          </div>
          <div className="flex items-start gap-3 bg-recycle-bg rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-recycle-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-recycle-primary font-bold text-sm">3</span>
            </div>
            <p className="text-sm">After selling tokens, the <span className="text-recycle-text">empty account remains</span>, holding your SOL.</p>
          </div>
          <div className="flex items-start gap-3 bg-recycle-bg rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-recycle-success/20 flex items-center justify-center flex-shrink-0">
              <span className="text-recycle-success font-bold text-sm">✓</span>
            </div>
            <p className="text-sm">We close these empty accounts and <span className="text-recycle-success font-semibold">recycle your SOL!</span></p>
          </div>
        </div>
        <p className="text-sm text-recycle-text-muted pt-2">
          We take a small 10% fee from recovered amounts to keep our servers running.
        </p>
      </div>
    ),
  },
  {
    question: "Is it safe to close token accounts?",
    answer: (
      <div className="bg-recycle-success/10 border-2 border-recycle-success/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-recycle-success/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-recycle-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-recycle-success font-semibold text-lg">100% Safe</span>
        </div>
        <p className="text-recycle-text-secondary">
          We only close accounts that are <span className="text-recycle-text font-medium">completely empty and unused</span>. You won&apos;t lose any tokens, and your wallet remains fully secure.
        </p>
      </div>
    ),
  },
  {
    question: "What is Account Rent?",
    answer: (
      <div className="space-y-4">
        <p className="text-recycle-text-secondary">
          When an account is created on Solana, a rent fee is required to store its data for 2 years. This rent is <span className="text-recycle-text font-medium">refundable only when the account is closed</span>.
        </p>
        <a 
          href="https://solana.com/docs/core/fees#rent" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-recycle-bg border-2 border-recycle-border rounded-xl px-4 py-3 hover:border-recycle-primary transition-colors group"
        >
          <svg className="w-5 h-5 text-recycle-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-recycle-text font-medium">Read Solana Docs</span>
          <svg className="w-4 h-4 text-recycle-text-muted group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    ),
  },
  {
    question: "Are there any fees?",
    answer: (
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold font-display text-recycle-primary">10%</div>
            <div className="text-xs text-recycle-text-muted mt-1">Service Fee</div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-recycle-text-secondary">
              Automatically deducted from recovered SOL — <span className="text-recycle-text font-medium">nothing to pay upfront</span>.
            </p>
            <p className="text-sm text-recycle-text-muted">
              We keep our fees competitive to be the best option for SOL recovery. 🙌
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    question: "Do you find more SOL than other tools?",
    answer: (
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-recycle-primary flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <p className="text-recycle-text font-semibold mb-2">Yes! We scan deeper than competitors.</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-recycle-text-secondary">
                <span className="text-recycle-success">✓</span>
                <span>Includes the <span className="text-recycle-text">Token-2022 Program</span> others miss</span>
              </li>
              <li className="flex items-center gap-2 text-recycle-text-secondary">
                <span className="text-recycle-success">✓</span>
                <span>Finds significantly more locked SOL in your wallet</span>
              </li>
              <li className="flex items-center gap-2 text-recycle-text-secondary">
                <span className="text-recycle-success">✓</span>
                <span>Works even for wallets that just started trading</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Head>
        <title>FAQ - Recycle Sol</title>
        <meta name="description" content="Frequently asked questions about recovering SOL from empty token accounts on Solana." />
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
              <Link href="/faq" className="text-sm text-recycle-primary font-medium">
                FAQ
              </Link>
              <Link href="/about" className="text-sm text-recycle-text-secondary hover:text-recycle-primary transition-colors">
                About
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-recycle-text mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-recycle-text-secondary">
              Everything you need to know about recycling your SOL
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="pb-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-white border-2 border-recycle-border rounded-2xl overflow-hidden shadow-eco"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-recycle-bg-alt transition-colors"
                  >
                    <h3 className="font-display text-lg font-semibold text-recycle-text pr-4">
                      {faq.question}
                    </h3>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-recycle-bg flex items-center justify-center transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-recycle-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {openIndex === index && (
                    <div className="px-6 pb-6">
                      <div className="text-recycle-text-secondary leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 bg-recycle-primary/5 border-2 border-recycle-primary/20 rounded-2xl p-8 text-center">
              <h3 className="font-display text-2xl font-bold text-recycle-text mb-3">
                Ready to Recycle Your SOL?
              </h3>
              <p className="text-recycle-text-secondary mb-6">
                Connect your wallet and see how much locked SOL you have.
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

export { faqs };
