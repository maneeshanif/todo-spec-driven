'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface BackgroundBeamsProps {
  className?: string;
}

export function BackgroundBeams({ className }: BackgroundBeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let beams: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createBeams = () => {
      const beamCount = Math.floor(window.innerWidth / 150);
      beams = [];
      for (let i = 0; i < beamCount; i++) {
        beams.push({
          x: Math.random() * canvas.width,
          y: -100,
          length: Math.random() * 200 + 100,
          speed: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      beams.forEach((beam) => {
        // Create gradient
        const gradient = ctx.createLinearGradient(
          beam.x,
          beam.y,
          beam.x,
          beam.y + beam.length
        );
        gradient.addColorStop(0, `rgba(139, 92, 246, 0)`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${beam.opacity})`);
        gradient.addColorStop(1, `rgba(59, 130, 246, 0)`);

        // Draw beam
        ctx.fillStyle = gradient;
        ctx.fillRect(beam.x - 1, beam.y, 2, beam.length);

        // Update position
        beam.y += beam.speed;

        // Reset beam when it goes off screen
        if (beam.y > canvas.height + 100) {
          beam.y = -100;
          beam.x = Math.random() * canvas.width;
          beam.opacity = Math.random() * 0.5 + 0.2;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createBeams();
    animate();

    window.addEventListener('resize', () => {
      resizeCanvas();
      createBeams();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none', className)}
    />
  );
}
