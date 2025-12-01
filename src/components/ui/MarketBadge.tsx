'use client';

import { TrendingUp, Bitcoin, DollarSign, BarChart3 } from 'lucide-react';

interface MarketBadgeProps {
  market: string;
  size?: 'sm' | 'md' | 'lg' | 'prominent' | 'compact';
  className?: string;
}

const marketConfig = {
  stock: {
    name: 'Stock',
    icon: TrendingUp,
    color: 'dusty-gold',
    bgColor: 'bg-[#B89B5E]/10',
    borderColor: 'border-[#B89B5E]/20',
    textColor: 'text-[#B89B5E]',
    hoverBg: 'hover:bg-[#B89B5E]/20'
  },
  crypto: {
    name: 'Crypto',
    icon: Bitcoin,
    color: 'rust-red',
    bgColor: 'bg-[#A7352D]/10',
    borderColor: 'border-[#A7352D]/20',
    textColor: 'text-[#A7352D]',
    hoverBg: 'hover:bg-[#A7352D]/20'
  },
  forex: {
    name: 'Forex',
    icon: DollarSign,
    color: 'muted-olive',
    bgColor: 'bg-[#4F5B4A]/10',
    borderColor: 'border-[#4F5B4A]/20',
    textColor: 'text-[#4F5B4A]',
    hoverBg: 'hover:bg-[#4F5B4A]/20'
  },
  futures: {
    name: 'Futures',
    icon: BarChart3,
    color: 'warm-sand',
    bgColor: 'bg-[#D6C7B2]/10',
    borderColor: 'border-[#D6C7B2]/20',
    textColor: 'text-[#D6C7B2]',
    hoverBg: 'hover:bg-[#D6C7B2]/20'
  }
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
  prominent: 'px-2 py-1 text-xl font-bold', // Match symbol styling
  compact: 'px-2 py-1 text-sm font-bold' // Exact match with symbol styling
};

const iconSizeConfig = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  prominent: 'w-5 h-5',
  compact: 'w-4 h-4'
};

// Prominent display configuration - matches symbol styling but with market-specific colors
const prominentConfig = {
  stock: {
    bgColor: 'bg-[var(--dusty-gold)]/10',
    borderColor: 'border-[var(--dusty-gold)]/20',
    textColor: 'text-[var(--dusty-gold)]' // Dusty Gold for Stock
  },
  crypto: {
    bgColor: 'bg-[var(--rust-red)]/10',
    borderColor: 'border-[var(--rust-red)]/20',
    textColor: 'text-[var(--rust-red)]' // Rust Red for Crypto
  },
  forex: {
    bgColor: 'bg-[var(--muted-olive)]/10',
    borderColor: 'border-[var(--muted-olive)]/20',
    textColor: 'text-[var(--muted-olive)]' // Muted Olive for Forex
  },
  futures: {
    bgColor: 'bg-[var(--warm-sand)]/10',
    borderColor: 'border-[var(--warm-sand)]/20',
    textColor: 'text-[var(--warm-sand)]' // Warm Sand for Futures
  }
};

// Compact display configuration - exact match with symbol styling
const compactConfig = {
  stock: {
    bgColor: 'bg-[#B89B5E]/10',
    borderColor: 'border-[#B89B5E]/20',
    textColor: 'var(--warm-off-white)' // Match symbol text color exactly
  },
  crypto: {
    bgColor: 'bg-[#A7352D]/10',
    borderColor: 'border-[#A7352D]/20',
    textColor: 'var(--warm-off-white)' // Match symbol text color exactly
  },
  forex: {
    bgColor: 'bg-[#4F5B4A]/10',
    borderColor: 'border-[#4F5B4A]/20',
    textColor: 'var(--warm-off-white)' // Match symbol text color exactly
  },
  futures: {
    bgColor: 'bg-[#D6C7B2]/10',
    borderColor: 'border-[#D6C7B2]/20',
    textColor: 'var(--warm-off-white)' // Match symbol text color exactly
  }
};

export default function MarketBadge({ market, size = 'md', className = '' }: MarketBadgeProps) {
  // Handle compact display mode
  if (size === 'compact') {
    // Handle null/undefined market
    if (!market) {
      return (
        <span className={`text-sm font-bold text-white bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 ${className}`}>
          UNKNOWN
        </span>
      );
    }

    // Handle multiple markets (comma-separated) or single market
    const markets = market.split(',').map(m => m.trim().toLowerCase());
    
    if (markets.length === 1 && markets[0]) {
      const marketKey = markets[0] as keyof typeof compactConfig;
      const config = compactConfig[marketKey];
      
      if (!config) {
        // Check if market contains emojis and clean them up
        const cleanedMarket = market.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        
        // Try to match cleaned market against known types
        const cleanedKey = cleanedMarket.toLowerCase() as keyof typeof compactConfig;
        const cleanedConfig = compactConfig[cleanedKey];
        
        if (cleanedConfig) {
          const originalConfig = marketConfig[cleanedKey];
          return (
            <span className={`text-sm font-bold text-white ${cleanedConfig.bgColor} px-2 py-1 rounded border ${cleanedConfig.borderColor} ${className}`}>
              {originalConfig?.name.toUpperCase() || cleanedMarket.toUpperCase()}
            </span>
          );
        }
        
        // Enhanced fallback for unknown market types
        const displayName = cleanedMarket || 'UNKNOWN';
        return (
          <span className={`text-sm font-bold text-white bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 ${className}`}>
            {displayName.toUpperCase()}
          </span>
        );
      }

      return (
        <span className={`text-sm font-bold text-white ${config.bgColor} px-2 py-1 rounded border ${config.borderColor} ${className}`}>
          {marketConfig[marketKey]?.name.toUpperCase() || marketKey.toUpperCase()}
        </span>
      );
    }
    
    // For multiple markets in compact mode, show the first one compactly
    if (markets.length > 1) {
      const firstMarketKey = markets[0] as keyof typeof compactConfig;
      const config = compactConfig[firstMarketKey];
      
      if (config) {
        return (
          <span className={`text-sm font-bold text-white ${config.bgColor} px-2 py-1 rounded border ${config.borderColor} ${className}`}>
            {marketConfig[firstMarketKey]?.name.toUpperCase() || firstMarketKey.toUpperCase()}
          </span>
        );
      }
      
      // Fallback for unknown multiple markets
      return (
        <span className={`text-sm font-bold text-white bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 ${className}`}>
          {markets[0].toUpperCase()}
        </span>
      );
    }
    
    // Fallback for empty or invalid market
    return (
      <span className={`text-sm font-bold text-white bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 ${className}`}>
        UNKNOWN
      </span>
    );
  }

  // Handle prominent display mode
  if (size === 'prominent') {
    // Handle null/undefined market
    if (!market) {
      return (
        <span className={`text-xl font-bold text-white bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 ${className}`}>
          UNKNOWN
        </span>
      );
    }

    // Handle multiple markets (comma-separated) or single market
    const markets = market.split(',').map(m => m.trim().toLowerCase());
    
    if (markets.length === 1 && markets[0]) {
      const marketKey = markets[0] as keyof typeof prominentConfig;
      const config = prominentConfig[marketKey];
      
      if (!config) {
        // Check if market contains emojis and clean them up
        const cleanedMarket = market.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        
        // Try to match cleaned market against known types
        const cleanedKey = cleanedMarket.toLowerCase() as keyof typeof prominentConfig;
        const cleanedConfig = prominentConfig[cleanedKey];
        
        if (cleanedConfig) {
          const originalConfig = marketConfig[cleanedKey];
          return (
            <span className={`text-xl font-bold ${cleanedConfig.textColor} ${cleanedConfig.bgColor} px-2 py-1 rounded border ${cleanedConfig.borderColor} ${className}`}>
              {originalConfig?.name.toUpperCase() || cleanedMarket.toUpperCase()}
            </span>
          );
        }
        
        // Enhanced fallback for unknown market types
        const displayName = cleanedMarket || 'UNKNOWN';
        return (
          <span className={`text-xl font-bold text-white bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 ${className}`}>
            {displayName.toUpperCase()}
          </span>
        );
      }

      return (
        <span className={`text-xl font-bold ${config.textColor} ${config.bgColor} px-2 py-1 rounded border ${config.borderColor} ${className}`}>
          {marketConfig[marketKey]?.name.toUpperCase() || marketKey.toUpperCase()}
        </span>
      );
    }
    
    // For multiple markets in prominent mode, show the first one prominently
    if (markets.length > 1) {
      const firstMarketKey = markets[0] as keyof typeof prominentConfig;
      const config = prominentConfig[firstMarketKey];
      
      if (config) {
        return (
          <span className={`text-xl font-bold ${config.textColor} ${config.bgColor} px-2 py-1 rounded border ${config.borderColor} ${className}`}>
            {marketConfig[firstMarketKey]?.name.toUpperCase() || firstMarketKey.toUpperCase()}
          </span>
        );
      }
      
      // Fallback for unknown multiple markets
      return (
        <span className={`text-xl font-bold text-white bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 ${className}`}>
          {markets[0].toUpperCase()}
        </span>
      );
    }
    
    // Fallback for empty or invalid market
    return (
      <span className={`text-xl font-bold text-white bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 ${className}`}>
        UNKNOWN
      </span>
    );
  }
  // Handle null/undefined market
  if (!market) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/20 bg-white/5 text-white/70 text-xs ${className}`}>
        Unknown
      </span>
    );
  }

  // Handle multiple markets (comma-separated) or single market
  const markets = market.split(',').map(m => m.trim().toLowerCase());
  
  if (markets.length === 1 && markets[0]) {
    const marketKey = markets[0] as keyof typeof marketConfig;
    const config = marketConfig[marketKey];
    
    if (!config) {
      // Check if market contains emojis and clean them up
      const cleanedMarket = market.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
      
      // Try to match cleaned market against known types
      const cleanedKey = cleanedMarket.toLowerCase() as keyof typeof marketConfig;
      const cleanedConfig = marketConfig[cleanedKey];
      
      if (cleanedConfig) {
        const Icon = cleanedConfig.icon;
        return (
          <span className={`
            inline-flex items-center gap-1.5 rounded-full border transition-all
            ${cleanedConfig.bgColor} ${cleanedConfig.borderColor} ${cleanedConfig.textColor} ${cleanedConfig.hoverBg}
            ${sizeConfig[size]} ${className}
          `}>
            <Icon className={iconSizeConfig[size]} />
            <span className="font-medium capitalize">{cleanedConfig.name}</span>
          </span>
        );
      }
      
      // Enhanced fallback for unknown market types - show cleaned name or default
      const displayName = cleanedMarket || 'Unknown';
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/20 bg-white/5 text-white/70 text-xs ${className}`}>
          <span className="font-medium capitalize">{displayName}</span>
        </span>
      );
    }

    const Icon = config.icon;
    
    return (
      <span className={`
        inline-flex items-center gap-1.5 rounded-full border transition-all
        ${config.bgColor} ${config.borderColor} ${config.textColor} ${config.hoverBg}
        ${sizeConfig[size]} ${className}
      `}>
        <Icon className={iconSizeConfig[size]} />
        <span className="font-medium capitalize">{config.name}</span>
      </span>
    );
  }
  
  // For multiple markets, show them as a stack
  if (markets.length > 1) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {markets.slice(0, 2).map((marketKey, index) => {
          const config = marketConfig[marketKey as keyof typeof marketConfig];
          if (!config) return null;
          
          const Icon = config.icon;
          return (
            <span
              key={index}
              className={`
                inline-flex items-center gap-1 rounded-full border
                ${config.bgColor} ${config.borderColor} ${config.textColor}
                ${size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'}
              `}
              style={{ marginLeft: index > 0 ? '-4px' : '0' }}
            >
              <Icon className="w-3 h-3" />
            </span>
          );
        })}
        {markets.length > 2 && (
          <span className="text-xs text-white/60 ml-1">+{markets.length - 2}</span>
        )}
      </div>
    );
  }
  
  // Fallback for empty or invalid market
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border border-secondary bg-secondary text-tertiary text-xs ${className}`}>
      Unknown
    </span>
  );
}