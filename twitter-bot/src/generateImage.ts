/**
 * Image Generation for Twitter Bot
 * 
 * Creates a branded graphic showing wallet scan results.
 */

import { createCanvas } from '@napi-rs/canvas';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface ScanImageData {
  walletAddress: string;
  closeableCount: number;
  reclaimableSol: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Draw a rounded rectangle (compatible helper)
 */
function drawRoundedRect(
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ============================================================================
// IMAGE GENERATION
// ============================================================================

/**
 * Generates a branded image showing scan results.
 * Returns the image as a Buffer.
 */
export async function generateScanImage(data: ScanImageData): Promise<Buffer> {
  const width = 1200;
  const height = 630;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // ========== BACKGROUND ==========
  // Dark gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0a0a0f');
  bgGradient.addColorStop(0.5, '#0d1117');
  bgGradient.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Glow effect in center
  const glowGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 400);
  glowGradient.addColorStop(0, 'rgba(0, 255, 136, 0.08)');
  glowGradient.addColorStop(0.5, 'rgba(0, 200, 150, 0.03)');
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, width, height);

  // ========== HEADER ==========
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PUMPCLEANUP.COM', width / 2, 70);
  
  // Subheader
  ctx.fillStyle = '#00ff88';
  ctx.font = '24px Arial, sans-serif';
  ctx.fillText('WALLET SCAN RESULTS', width / 2, 105);

  // ========== WALLET ADDRESS BOX ==========
  const boxY = 140;
  const boxHeight = 50;
  const boxWidth = 650;
  const boxX = (width - boxWidth) / 2;

  // Box background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 12);
  ctx.fill();

  // Box border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Wallet address
  ctx.fillStyle = '#9ca3af';
  ctx.font = '22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(data.walletAddress, width / 2, boxY + 33);

  // ========== MAIN STATS CARD ==========
  const cardY = 210;
  const cardHeight = 320;
  const cardWidth = 700;
  const cardX = (width - cardWidth) / 2;

  // Card background with gradient border effect
  const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
  cardGradient.addColorStop(0, 'rgba(30, 35, 45, 0.9)');
  cardGradient.addColorStop(1, 'rgba(20, 25, 35, 0.9)');
  ctx.fillStyle = cardGradient;
  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
  ctx.fill();

  // Card border
  const borderGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY);
  borderGradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
  borderGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.3)');
  borderGradient.addColorStop(1, 'rgba(0, 255, 136, 0.3)');
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
  ctx.stroke();

  // ========== RECLAIMABLE SOL ==========
  ctx.fillStyle = '#6b7280';
  ctx.font = '28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Reclaimable SOL:', width / 2, cardY + 70);

  // Big SOL number with gradient
  const solText = `${data.reclaimableSol.toFixed(4)} SOL`;
  ctx.font = 'bold 72px Arial, sans-serif';
  
  // Create gradient for the SOL amount
  const solGradient = ctx.createLinearGradient(width / 2 - 200, 0, width / 2 + 200, 0);
  solGradient.addColorStop(0, '#00ff88');
  solGradient.addColorStop(0.5, '#00d4aa');
  solGradient.addColorStop(1, '#00ff88');
  ctx.fillStyle = solGradient;
  ctx.fillText(solText, width / 2, cardY + 160);

  // ========== CLOSEABLE ACCOUNTS ==========
  // Divider line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 50, cardY + 200);
  ctx.lineTo(cardX + cardWidth - 50, cardY + 200);
  ctx.stroke();

  // Account count
  ctx.fillStyle = '#9ca3af';
  ctx.font = '24px Arial, sans-serif';
  ctx.fillText(`${data.closeableCount} closeable account${data.closeableCount !== 1 ? 's' : ''}`, width / 2, cardY + 250);

  // Call to action
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('Visit pumpcleanup.com to reclaim', width / 2, cardY + 295);


  // ========== RETURN BUFFER ==========
  return canvas.toBuffer('image/png') as Buffer;
}

/**
 * Generates and saves image to a temp file.
 * Returns the file path.
 */
export async function generateScanImageFile(data: ScanImageData): Promise<string> {
  const buffer = await generateScanImage(data);
  const tempPath = path.join('/tmp', `pumpcleanup-${Date.now()}.png`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

