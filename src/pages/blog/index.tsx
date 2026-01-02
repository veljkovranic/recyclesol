/**
 * Blog Index Page
 * 
 * Lists all blog posts with a clean, eco-friendly design.
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

// Blog posts data
const blogPosts = [
  {
    slug: 'what-is-solana-rent',
    title: 'What is Solana Rent and Why Are You Paying It?',
    excerpt: 'Learn about Solana\'s rent mechanism, why token accounts lock your SOL, and how to reclaim it.',
    date: '2024-12-24',
    readTime: '5 min read',
    category: 'Education',
  },
];

export default function BlogIndex() {
  return (
    <>
      <Head>
        <title>Learn - Recycle Sol</title>
        <meta name="description" content="Learn about Solana, token accounts, rent, and how to optimize your wallet." />
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
              <Link href="/blog" className="text-sm text-recycle-primary font-medium">
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

        {/* Hero */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-recycle-text mb-4">
              Learn
            </h1>
            <p className="text-lg text-recycle-text-secondary max-w-2xl mx-auto">
              Learn about Solana, token accounts, wallet optimization, and the latest updates from Recycle Sol.
            </p>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {blogPosts.map((post) => (
                <Link 
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block bg-white border-2 border-recycle-border rounded-2xl p-6 md:p-8 hover:border-recycle-primary transition-all group shadow-eco"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-recycle-primary/10 text-recycle-primary font-medium">
                      {post.category}
                    </span>
                    <span className="text-xs text-recycle-text-muted">{post.readTime}</span>
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-recycle-text mb-3 group-hover:text-recycle-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-recycle-text-secondary mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-recycle-text-muted">
                      {new Date(post.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="text-recycle-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Read more
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty state */}
            {blogPosts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-recycle-text-muted">No blog posts yet. Check back soon!</p>
              </div>
            )}
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
