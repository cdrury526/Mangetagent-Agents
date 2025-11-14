/*
  # Add 'both' option to transaction_side enum

  1. Changes
    - Add 'both' value to transaction_side enum for dual agency transactions
    - This allows agents who represent both buyer and seller in the same transaction
  
  2. Important Notes
    - This is a non-breaking change as it only adds a new enum value
    - Existing data with 'buyer' or 'seller' values will not be affected
*/

-- Add 'both' to the transaction_side enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'transaction_side' 
    AND pg_enum.enumlabel = 'both'
  ) THEN
    ALTER TYPE transaction_side ADD VALUE 'both';
  END IF;
END $$;
