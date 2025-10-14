-- Quick fix for local database if the status constraint is outdated
-- Run this if you get errors when trying to set status to 'in_progress'

-- Drop the old constraint (suppress error if it doesn't exist)
DO $$
BEGIN
  ALTER TABLE requests DROP CONSTRAINT requests_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add the updated constraint with all 12 statuses
ALTER TABLE requests ADD CONSTRAINT requests_status_check
  CHECK (status IN (
    'new',
    'viewed',
    'quoted',
    'accepted',
    'scheduled',
    'in_progress',
    'completed',
    'invoiced',
    'paid',
    'overdue',
    'disputed',
    'cancelled'
  ));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'requests'::regclass
AND conname = 'requests_status_check';
