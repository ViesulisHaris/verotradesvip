-- Create the insert_trade_with_emotions function
CREATE OR REPLACE FUNCTION insert_trade_with_emotions(
  p_symbol TEXT,
  p_market TEXT,
  p_side TEXT,
  p_quantity NUMERIC,
  p_pnl NUMERIC,
  p_trade_date TIMESTAMP WITH TIME ZONE,
  p_emotional_state TEXT[],
  p_entry_time TIME WITH TIME ZONE,
  p_exit_time TIME WITH TIME ZONE,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER invoker
STRICT