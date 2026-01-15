/**
 * State Persistence
 * 
 * Saves and loads bot state to prevent reprocessing tweets after restart.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface BotState {
  lastProcessedTweetId: string | null;
  processedTweets: string[];
  lastUpdated: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const STATE_FILE = process.env.STATE_FILE || path.join(process.cwd(), 'bot-state.json');

// Maximum number of processed tweet IDs to keep (prevent file from growing forever)
const MAX_PROCESSED_TWEETS = 1000;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Loads the bot state from disk.
 */
export function loadState(): { lastProcessedTweetId: string | null; processedTweets: Set<string> } {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      const state: BotState = JSON.parse(data);
      
      console.log(`📂 Loaded state from ${STATE_FILE}`);
      console.log(`   Last tweet ID: ${state.lastProcessedTweetId || 'none'}`);
      console.log(`   Processed tweets: ${state.processedTweets.length}`);
      
      return {
        lastProcessedTweetId: state.lastProcessedTweetId,
        processedTweets: new Set(state.processedTweets),
      };
    }
  } catch (error) {
    console.warn(`⚠️ Could not load state file: ${error}`);
  }
  
  return {
    lastProcessedTweetId: null,
    processedTweets: new Set(),
  };
}

/**
 * Saves the bot state to disk.
 */
export function saveState(lastProcessedTweetId: string | null, processedTweets: Set<string>): void {
  try {
    // Convert Set to array and limit size
    const tweetsArray = Array.from(processedTweets).slice(-MAX_PROCESSED_TWEETS);
    
    const state: BotState = {
      lastProcessedTweetId,
      processedTweets: tweetsArray,
      lastUpdated: new Date().toISOString(),
    };
    
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`❌ Could not save state: ${error}`);
  }
}

