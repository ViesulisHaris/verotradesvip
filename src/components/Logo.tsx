'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'medium', showText = true, className = '' }: LogoProps) {
  // Size configurations
  const sizeConfig = {
    small: {
      imageSize: 32,
      textSize: 'text-base',
      gap: 'gap-2'
    },
    medium: {
      imageSize: 40,
      textSize: 'text-lg',
      gap: 'gap-3'
    },
    large: {
      imageSize: 48,
      textSize: 'text-2xl',
      gap: 'gap-3'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <div className="relative" style={{ width: config.imageSize, height: config.imageSize }}>
        <Image
          src="/logo.png"
          alt="VeroTrade Logo"
          fill
          className="object-contain"
          priority
          style={{
            filter: 'brightness(0) invert(1) sepia(1) saturate(1.5) hue-rotate(25deg) brightness(1.1) contrast(1.1)'
          }}
        />
      </div>
      {showText && (
        <span
          className="heading-luxury logo-text"
          style={{
            fontSize: config.textSize === 'text-base' ? '18px' : config.textSize === 'text-lg' ? '24px' : '32px',
            color: '#B89B5E'
          }}
        >
          VeroTrade
        </span>
      )}
    </div>
  );
}