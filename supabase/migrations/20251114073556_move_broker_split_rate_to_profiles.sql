/*
  # Move Broker Split Rate to Profiles

  1. Changes
    - Add `broker_split_rate` column to `profiles` table
      - Type: numeric (decimal between 0 and 1)
      - Default: NULL (agent can set it in settings)
      - Check constraint to ensure value is between 0 and 1
    
    - Remove `broker_split_rate` column from `transactions` table
      - This field is agent-specific, not transaction-specific
      - Will be managed in agent settings instead
    
    - Drop the old constraint on transactions table
  
  2. Migration Notes
    - Existing broker_split_rate values in transactions will be lost
    - This is acceptable as the field should be set at the agent profile level
    - Agents will need to set their broker split rate in settings after this migration
*/

-- Add broker_split_rate to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'broker_split_rate'
  ) THEN
    ALTER TABLE profiles ADD COLUMN broker_split_rate numeric;
    
    -- Add check constraint to ensure value is between 0 and 1
    ALTER TABLE profiles ADD CONSTRAINT profiles_broker_split_valid 
      CHECK (broker_split_rate IS NULL OR (broker_split_rate >= 0 AND broker_split_rate <= 1));
  END IF;
END $$;

-- Remove broker_split_rate from transactions table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'broker_split_rate'
  ) THEN
    -- Drop the constraint first
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_broker_split_valid;
    
    -- Drop the column
    ALTER TABLE transactions DROP COLUMN broker_split_rate;
  END IF;
END $$;
