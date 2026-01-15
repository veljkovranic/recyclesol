/**
 * PumpCleanup Twitter Bot
 * 
 * Monitors for mentions and scans Solana wallets for reclaimable rent.
 * When tagged with a Solana address, replies with cleanup stats.
 */

import 'dotenv/config';
import { TwitterApi, TweetV2, ApiResponseError } from 'twitter-api-v2';
import * as fs from 'fs';
import { extractSolanaAddress, scanWallet } from './solana';
import { generateScanImageFile } from './generateImage';
import { loadState, saveState } from './state';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TWITTER_API_KEY = process.env.TWITTER_API_KEY!;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET!;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN!;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET!;

// How often to check for new mentions (in milliseconds)
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '60000', 10);

// Website URL to include in replies
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://pumpcleanup.com';

// Dry run mode - logs but doesn't actually post
const DRY_RUN = process.env.DRY_RUN === 'true';

// ============================================================================
// VALIDATION
// ============================================================================

function validateConfig(): void {
  const requiredVars = [
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET', 
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }
}

// ============================================================================
// TWITTER CLIENT
// ============================================================================

// Client using OAuth 1.0a user context (for both reading and writing)
const client = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_SECRET,
});

// ============================================================================
// STATE (persisted to disk)
// ============================================================================

// Load state from disk on startup
const initialState = loadState();

// Track the last processed tweet ID to avoid duplicates
let lastProcessedTweetId: string | null = initialState.lastProcessedTweetId;

// Track processed tweet IDs to prevent duplicate replies
const processedTweets: Set<string> = initialState.processedTweets;

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Generates a reply message based on scan results.
 */
function generateReplyMessage(
  address: string,
  closeableCount: number,
  reclaimableSol: number,
  success: boolean,
  error?: string
): string {
  if (!success) {
    return `❌ Couldn't scan that wallet. ${error || 'Please try again later.'}`;
  }

  if (closeableCount === 0) {
    return `🫡 Nothing to recover here - wallet's squeaky clean!\n\nHit us up after your next degen session in the trenches 🎰\n\n${WEBSITE_URL}`;
  }

  const solFormatted = reclaimableSol.toFixed(4);
  
  return `🧹 ${closeableCount} empty token account${closeableCount > 1 ? 's' : ''} found!\n\n💰 Reclaim ~${solFormatted} SOL\n\n👇 Clean up at ${WEBSITE_URL}`;
}

/**
 * Processes a single mention tweet.
 */
async function processMention(tweet: TweetV2): Promise<void> {
  const tweetId = tweet.id;
  const tweetText = tweet.text;

  // Skip if already processed
  if (processedTweets.has(tweetId)) {
    return;
  }

  console.log(`\n📨 Processing tweet ${tweetId}:`);
  console.log(`   "${tweetText.substring(0, 100)}${tweetText.length > 100 ? '...' : ''}"`);

  // Extract Solana address from tweet
  const address = extractSolanaAddress(tweetText);

  if (!address) {
    console.log('   ⚠️ No valid Solana address found - skipping');
    processedTweets.add(tweetId);
    saveState(lastProcessedTweetId, processedTweets);
    return;
  }

  console.log(`   🔍 Found address: ${address}`);

  // Scan the wallet
  console.log('   ⏳ Scanning wallet...');
  const result = await scanWallet(address);

  // SAFETY: Only proceed if we have real scan results (not mock data)
  if (!result.success) {
    console.log(`   ❌ Scan failed: ${result.error || 'Unknown error'}`);
    processedTweets.add(tweetId);
    saveState(lastProcessedTweetId, processedTweets);
    return;
  }

  // Generate reply text
  const replyText = generateReplyMessage(
    address,
    result.closeableCount,
    result.totalReclaimableSol,
    result.success,
    result.error
  );

  try {
    // DRY RUN mode - just log, don't actually post
    if (DRY_RUN) {
      console.log('   🧪 DRY RUN - Would reply with:');
      console.log(`   "${replyText}"`);
      if (result.closeableCount > 0) {
        console.log('   (with image attached)');
      }
      processedTweets.add(tweetId);
      saveState(lastProcessedTweetId, processedTweets);
      return;
    }

    // If there are accounts to cleanup, generate and attach an image
    if (result.closeableCount > 0) {
      console.log('   🎨 Generating image...');
      const imagePath = await generateScanImageFile({
        walletAddress: address,
        closeableCount: result.closeableCount,
        reclaimableSol: result.totalReclaimableSol,
      });

      // Upload media
      const mediaId = await client.v1.uploadMedia(imagePath);
      
      // Reply with image
      await client.v2.reply(replyText, tweetId, {
        media: { media_ids: [mediaId] },
      });

      // Clean up temp file
      fs.unlinkSync(imagePath);
      console.log('   ✅ Reply with image sent successfully');
    } else {
      // Reply without image
      await client.v2.reply(replyText, tweetId);
      console.log('   ✅ Reply sent successfully');
    }
  } catch (err) {
    if (err instanceof ApiResponseError) {
      console.error(`   ❌ Twitter API error: ${err.message}`);
      
      // Handle rate limits
      if (err.rateLimitError) {
        console.log('   ⏳ Rate limited, will retry later');
        return; // Don't mark as processed so we retry
      }
    } else {
      console.error('   ❌ Failed to reply:', err);
    }
  }

  // Mark as processed and save state
  processedTweets.add(tweetId);
  saveState(lastProcessedTweetId, processedTweets);
}

/**
 * Fetches and processes new mentions.
 */
async function checkMentions(): Promise<void> {
  try {
    // Get bot's user ID
    const me = await client.v2.me();
    const myId = me.data.id;
    const myUsername = me.data.username;

    console.log(`\n🔄 Checking mentions for @${myUsername}...`);

    // Fetch recent mentions
    const mentions = await client.v2.userMentionTimeline(myId, {
      max_results: 10,
      ...(lastProcessedTweetId && { since_id: lastProcessedTweetId }),
      'tweet.fields': ['author_id', 'created_at', 'text'],
    });

    if (!mentions.data.data || mentions.data.data.length === 0) {
      console.log('   No new mentions');
      return;
    }

    console.log(`   Found ${mentions.data.data.length} new mention(s)`);

    // Process mentions in reverse order (oldest first)
    const tweets = [...mentions.data.data].reverse();

    for (const tweet of tweets) {
      await processMention(tweet);
      
      // Update last processed ID
      if (!lastProcessedTweetId || tweet.id > lastProcessedTweetId) {
        lastProcessedTweetId = tweet.id;
        saveState(lastProcessedTweetId, processedTweets);
      }
    }
  } catch (err) {
    if (err instanceof ApiResponseError) {
      console.error(`❌ Twitter API error: ${err.message}`);
      console.error(`   Code: ${err.code}`);
      console.error(`   Data:`, JSON.stringify(err.data, null, 2));
      
      if (err.rateLimitError) {
        const resetTime = err.rateLimit?.reset 
          ? new Date(err.rateLimit.reset * 1000).toLocaleTimeString()
          : 'unknown';
        console.log(`⏳ Rate limited. Resets at: ${resetTime}`);
      }
    } else {
      console.error('❌ Error checking mentions:', err);
    }
  }
}

/**
 * Starts the polling loop.
 */
async function startPolling(): Promise<void> {
  console.log(`\n🤖 Starting PumpCleanup Twitter Bot`);
  console.log(`   Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
  console.log(`   Website: ${WEBSITE_URL}`);
  if (DRY_RUN) {
    console.log(`   ⚠️  DRY RUN MODE - Will NOT post replies`);
  }
  
  // Initial check
  await checkMentions();

  // Set up polling interval
  setInterval(checkMentions, POLL_INTERVAL_MS);

  console.log('\n✅ Bot is running! Press Ctrl+C to stop.\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('   PumpCleanup Twitter Bot');
  console.log('═══════════════════════════════════════════');

  validateConfig();
  await startPolling();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

