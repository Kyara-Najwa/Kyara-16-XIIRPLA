"use client";

import React, { useEffect, useRef } from "react";

interface StarsBackgroundProps {
  starDensity?: number;
  allStarsTwinkle?: boolean;
  twinkleProbability?: number;
  minTwinkleSpeed?: number;
  maxTwinkleSpeed?: number;
  className?: string;
}

export const StarsBackground: React.FC<StarsBackgroundProps> = ({
  starDensity = 0.00005,
  allStarsTwinkle = true,
  twinkleProbability = 0.7,
  minTwinkleSpeed = 0.5,
  maxTwinkleSpeed = 1,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createStars = () => {
      const rect = container.getBoundingClientRect();
      const totalArea = rect.width * rect.height;
      const starCount = Math.floor(totalArea * starDensity);

      for (let i = 0; i < starCount; i++) {
        const star = document.createElement("div");
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        const size = Math.random() * 2 + 0.5;

        star.style.position = "absolute";
        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.backgroundColor = "white";
        star.style.borderRadius = "50%";
        star.style.pointerEvents = "none";

        if (allStarsTwinkle || Math.random() < twinkleProbability) {
          const twinkleDuration = Math.random() * (maxTwinkleSpeed - minTwinkleSpeed) + minTwinkleSpeed;
          star.style.animation = `twinkle ${twinkleDuration}s infinite ease-in-out`;
        }

        container.appendChild(star);
      }
    };

    createStars();

    const style = document.createElement("style");
    style.textContent = `
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [starDensity, allStarsTwinkle, twinkleProbability, minTwinkleSpeed, maxTwinkleSpeed]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};
