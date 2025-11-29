-- Remove duplicate origins, keeping only the oldest entry for each unique name
DELETE FROM origins a
USING origins b
WHERE a.id > b.id
  AND LOWER(a.name) = LOWER(b.name);

-- Remove duplicate policy_types, keeping only the oldest entry for each unique name  
DELETE FROM policy_types a
USING policy_types b
WHERE a.id > b.id
  AND LOWER(a.name) = LOWER(b.name);

-- Add unique constraint to prevent future duplicates (case insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS origins_name_unique_idx ON origins (LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS policy_types_name_unique_idx ON policy_types (LOWER(name));