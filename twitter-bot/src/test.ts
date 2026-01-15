/**
 * Test Script - LOCAL ONLY - Does NOT post to Twitter
 * 
 * This script tests image generation and wallet scanning locally.
 * It NEVER posts anything to Twitter.
 * 
 * Run with: npx tsx src/test.ts [wallet_address]
 */

import 'dotenv/config';
import { scanWallet, extractSolanaAddress } from './solana';
import { generateScanImageFile } from './generateImage';

// Test wallet address (or use your own)
const TEST_WALLET = process.argv[2] || '9HN5EeoBiwqvmSMDMGQxQ5pg25YTfoeRf7fqLKdL6UN';

console.log('⚠️  LOCAL TEST MODE - Nothing will be posted to Twitter\n');

async function testExtraction() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   Testing Address Extraction');
  console.log('═══════════════════════════════════════════\n');

  const testTweets = [
    '@pumpcleanup check 9HN5EeoBiwqvmSMDMGQxQ5pg25YTfoeRf7fqLKdL6UN',
    'Hey @pumpcleanup can you scan this wallet? 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU thanks!',
    '@pumpcleanup no wallet here lol',
    'My wallet is 9HN5EeoBiwqvmSMDMGQxQ5pg25YTfoeRf7fqLKdL6UN @pumpcleanup',
  ];

  for (const tweet of testTweets) {
    const address = extractSolanaAddress(tweet);
    console.log(`Tweet: "${tweet.substring(0, 50)}..."`);
    console.log(`  → Address: ${address || '(none found)'}\n`);
  }
}

async function testScanning() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   Testing Wallet Scan');
  console.log('═══════════════════════════════════════════\n');

  console.log(`Scanning wallet: ${TEST_WALLET}\n`);
  
  const result = await scanWallet(TEST_WALLET);
  
  console.log('\nScan Result:');
  console.log(`  Total accounts: ${result.totalAccounts}`);
  console.log(`  Closeable: ${result.closeableCount}`);
  console.log(`  Reclaimable: ${result.totalReclaimableSol.toFixed(4)} SOL`);
  console.log(`  Frozen: ${result.frozenAccounts}`);
  console.log(`  Success: ${result.success}`);
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }
  
  return result;
}

async function testImageGeneration(closeableCount: number, reclaimableSol: number) {
  console.log('\n═══════════════════════════════════════════');
  console.log('   Testing Image Generation');
  console.log('═══════════════════════════════════════════\n');

  const imagePath = await generateScanImageFile({
    walletAddress: TEST_WALLET,
    closeableCount,
    reclaimableSol,
  });

  console.log(`✅ Image generated: ${imagePath}`);
  console.log(`\nOpen it with:`);
  console.log(`  open ${imagePath}`);
}

async function main() {
  console.log('🧪 PumpCleanup Bot Test Suite\n');

  // Test 1: Address extraction
  await testExtraction();

  // Test 2: Wallet scanning
  const scanResult = await testScanning();

  // Test 3: Image generation (only with REAL data)
  if (scanResult.success && scanResult.closeableCount > 0) {
    await testImageGeneration(scanResult.closeableCount, scanResult.totalReclaimableSol);
  } else {
    console.log('\n⚠️  Wallet is clean - no accounts to cleanup');
    console.log('   Skipping image generation (we only generate images with real data)');
    console.log('   Try a different wallet address to test image generation');
  }

  console.log('\n✅ All tests complete!\n');
}

main().catch(console.error);

