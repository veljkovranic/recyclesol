/**
 * Confetti Component
 * 
 * Full-screen confetti animation that triggers when shown.
 * Eco-themed with green colors and leaf emojis.
 */

import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  show: boolean;
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  drift: number;
}

// Eco-friendly green color palette
const COLORS = [
  '#2d8a4e', // primary green
  '#3da564', // light green
  '#0d9488', // teal
  '#14b8a6', // light teal
  '#22c55e', // success green
  '#16a34a', // medium green
  '#10b981', // emerald
];

export const Confetti: React.FC<ConfettiProps> = ({ show, duration = 4000 }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 150; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 8 + 4,
          drift: (Math.random() - 0.5) * 100,
        });
      }
      setParticles(newParticles);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: '-20px',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${2 + Math.random()}s`,
            '--drift': `${particle.drift}px`,
          } as React.CSSProperties}
        >
          <div
            className="animate-spin-slow"
            style={{
              width: particle.size,
              height: particle.size * 0.6,
              backgroundColor: particle.color,
              borderRadius: '2px',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}

      {/* Celebration emojis - eco themed */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`emoji-${i}`}
          className="absolute text-2xl animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-40px',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2.5 + Math.random()}s`,
            '--drift': `${(Math.random() - 0.5) * 50}px`,
          } as React.CSSProperties}
        >
          {['♻️', '🌱', '🌿', '✨', '💚'][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </div>
  );
};

export default Confetti;
