// Database schema for VeroTrade Trading Journal

export const databaseSchema = {
  // Users table (handled by Supabase Auth)
  users: {
    id: 'uuid',
    email: 'text',
    created_at: 'timestamp'
  },

  // Strategies table
  strategies: {
    id: 'uuid primary key default gen_random_uuid()',
    user_id: 'uuid references auth.users(id) on delete cascade',
    name: 'text not null',
    description: 'text',
    rules: 'text[]',
    winrate_min: 'numeric check (winrate_min >= 0 and winrate_min <= 100)',
    winrate_max: 'numeric check (winrate_max >= 0 and winrate_max <= 100)',
    profit_factor_min: 'numeric check (profit_factor_min >= 0)',
    net_pnl_min: 'numeric',
    net_pnl_max: 'numeric',
    max_drawdown_max: 'numeric check (max_drawdown_max >= 0 and max_drawdown_max <= 100)',
    sharpe_ratio_min: 'numeric',
    avg_hold_period_min: 'numeric check (avg_hold_period_min >= 0)',
    avg_hold_period_max: 'numeric check (avg_hold_period_max >= 0)',
    is_active: 'boolean default true',
    created_at: 'timestamp default now()',
    updated_at: 'timestamp default now()'
  },

  // Trades table
  trades: {
    id: 'uuid primary key default gen_random_uuid()',
    user_id: 'uuid references auth.users(id) on delete cascade',
    market: 'text not null', // Stock, Futures, Forex, Crypto
    symbol: 'text not null',
    strategy_id: 'uuid references strategies(id) on delete set null',
    trade_date: 'date not null',
    side: 'text check (side in (\'Buy\', \'Sell\'))',
    quantity: 'numeric',
    entry_price: 'numeric',
    exit_price: 'numeric',
    pnl: 'numeric',
    entry_time: 'time',
    exit_time: 'time',
    emotional_state: 'text[]', // Array of emotions: FOMO, REVENGE, TILT, OVERRISK, PATIENCE, REGRET, DISCIPLINE
    notes: 'text',
    created_at: 'timestamp default now()',
    updated_at: 'timestamp default now()'
  },

  // Trade rules junction table for strategy rules
  strategy_rules: {
    id: 'uuid primary key default gen_random_uuid()',
    strategy_id: 'uuid references strategies(id) on delete cascade',
    rule_text: 'text not null',
    rule_order: 'integer',
    is_checked: 'boolean default false',
    created_at: 'timestamp default now()'
  }
};

// SQL for creating tables
export const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT[],
  winrate_min NUMERIC CHECK (winrate_min >= 0 AND winrate_min <= 100),
  winrate_max NUMERIC CHECK (winrate_max >= 0 AND winrate_max <= 100),
  profit_factor_min NUMERIC CHECK (profit_factor_min >= 0),
  net_pnl_min NUMERIC,
  net_pnl_max NUMERIC,
  max_drawdown_max NUMERIC CHECK (max_drawdown_max >= 0 AND max_drawdown_max <= 100),
  sharpe_ratio_min NUMERIC,
  avg_hold_period_min NUMERIC CHECK (avg_hold_period_min >= 0),
  avg_hold_period_max NUMERIC CHECK (avg_hold_period_max >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

-- Constraints to ensure min <= max for range fields
  CONSTRAINT check_winrate_range CHECK (winrate_min IS NULL OR winrate_max IS NULL OR winrate_min <= winrate_max),
  CONSTRAINT check_net_pnl_range CHECK (net_pnl_min IS NULL OR net_pnl_max IS NULL OR net_pnl_min <= net_pnl_max),
  CONSTRAINT check_avg_hold_period_range CHECK (avg_hold_period_min IS NULL OR avg_hold_period_max IS NULL OR avg_hold_period_min <= avg_hold_period_max)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  symbol TEXT NOT NULL,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  trade_date DATE NOT NULL,
  side TEXT CHECK (side IN ('Buy', 'Sell')),
  quantity NUMERIC,
  entry_price NUMERIC,
  exit_price NUMERIC,
  pnl NUMERIC,
  entry_time TIME,
  exit_time TIME,
  emotional_state TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy rules table
CREATE TABLE IF NOT EXISTS strategy_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  rule_order INTEGER,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(trade_date);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_strategy ON strategy_rules(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_is_checked ON strategy_rules(is_checked);

-- RLS (Row Level Security) policies
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_rules ENABLE ROW LEVEL SECURITY;

-- Policies for strategies
CREATE POLICY "Users can view own strategies" ON strategies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies" ON strategies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies" ON strategies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies" ON strategies
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for trades
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for strategy rules
CREATE POLICY "Users can view own strategy rules" ON strategy_rules
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM strategies WHERE strategies.id = strategy_rules.strategy_id AND strategies.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own strategy rules" ON strategy_rules
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM strategies WHERE strategies.id = strategy_rules.strategy_id AND strategies.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own strategy rules" ON strategy_rules
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM strategies WHERE strategies.id = strategy_rules.strategy_id AND strategies.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own strategy rules" ON strategy_rules
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM strategies WHERE strategies.id = strategy_rules.strategy_id AND strategies.user_id = auth.uid()
  ));

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_rules_updated_at BEFORE UPDATE ON strategy_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// TypeScript types for the database
export interface Database {
  public: {
    Tables: {
      strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          rules: string[] | null;
          winrate_min: number | null;
          winrate_max: number | null;
          profit_factor_min: number | null;
          net_pnl_min: number | null;
          net_pnl_max: number | null;
          max_drawdown_max: number | null;
          sharpe_ratio_min: number | null;
          avg_hold_period_min: number | null;
          avg_hold_period_max: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          rules?: string[] | null;
          winrate_min?: number | null;
          winrate_max?: number | null;
          profit_factor_min?: number | null;
          net_pnl_min?: number | null;
          net_pnl_max?: number | null;
          max_drawdown_max?: number | null;
          sharpe_ratio_min?: number | null;
          avg_hold_period_min?: number | null;
          avg_hold_period_max?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          rules?: string[] | null;
          winrate_min?: number | null;
          winrate_max?: number | null;
          profit_factor_min?: number | null;
          net_pnl_min?: number | null;
          net_pnl_max?: number | null;
          max_drawdown_max?: number | null;
          sharpe_ratio_min?: number | null;
          avg_hold_period_min?: number | null;
          avg_hold_period_max?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          market: string;
          symbol: string;
          strategy_id: string | null;
          trade_date: string;
          side: 'Buy' | 'Sell' | null;
          quantity: number | null;
          entry_price: number | null;
          exit_price: number | null;
          pnl: number | null;
          entry_time: string | null;
          exit_time: string | null;
          emotional_state: string[] | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          market: string;
          symbol: string;
          strategy_id?: string | null;
          trade_date: string;
          side?: 'Buy' | 'Sell' | null;
          quantity?: number | null;
          entry_price?: number | null;
          exit_price?: number | null;
          pnl?: number | null;
          entry_time?: string | null;
          exit_time?: string | null;
          emotional_state?: string[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          market?: string;
          symbol?: string;
          strategy_id?: string | null;
          trade_date?: string;
          side?: 'Buy' | 'Sell' | null;
          quantity?: number | null;
          entry_price?: number | null;
          exit_price?: number | null;
          pnl?: number | null;
          entry_time?: string | null;
          exit_time?: string | null;
          emotional_state?: string[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      strategy_rules: {
        Row: {
          id: string;
          strategy_id: string;
          rule_text: string;
          rule_order: number | null;
          is_checked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          strategy_id: string;
          rule_text: string;
          rule_order?: number | null;
          is_checked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          strategy_id?: string;
          rule_text?: string;
          rule_order?: number | null;
          is_checked?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// Strategy statistics interface
export interface StrategyStats {
  total_trades: number;
  winning_trades: number;
  winrate: number;
  total_pnl: number;
  gross_profit: number;
  gross_loss: number;
  profit_factor: number;
  max_drawdown: number;
  sharpe_ratio: number;
  avg_hold_period: number;
}
