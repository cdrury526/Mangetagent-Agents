/*
  # Make Transaction Fields Optional for Initial Creation

  1. Changes
    - Make property_address optional (agents may not know the address when creating a transaction)
    - This allows agents to create transactions with just a name and type (side)
    - Agents can fill in additional details later as they become available
  
  2. Important Notes
    - Status has a default value of 'prospecting' so it doesn't need to be provided
    - inspection_required has a default of false
    - All other fields are already optional
*/

-- Make property_address optional
DO $$
BEGIN
  ALTER TABLE transactions ALTER COLUMN property_address DROP NOT NULL;
END $$;

-- Set a default value for property_address to avoid breaking existing queries
DO $$
BEGIN
  ALTER TABLE transactions ALTER COLUMN property_address SET DEFAULT '';
END $$;
