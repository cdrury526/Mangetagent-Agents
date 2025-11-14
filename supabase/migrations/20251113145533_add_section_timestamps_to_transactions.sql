/*
  # Add Section Timestamps to Transactions

  1. Changes
    - Add `section_last_updated` JSONB column to `transactions` table
    - This column will store timestamps for when each section (property, financial, dates, additional) was last modified
    - Allows tracking of individual section updates for better user transparency

  2. Structure
    - JSONB format: { "property": "2025-11-13T10:30:00Z", "financial": "2025-11-13T09:15:00Z", ... }
    - NULL-safe: column allows null values for transactions without section tracking
    - Indexed: add GIN index for efficient JSONB queries if needed in future

  3. Notes
    - Existing transactions will have NULL values initially
    - Application will populate timestamps as sections are updated
    - No impact on existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'section_last_updated'
  ) THEN
    ALTER TABLE transactions ADD COLUMN section_last_updated JSONB DEFAULT NULL;
  END IF;
END $$;