/*
  # Enhanced Task and Subtask Management Constraints

  1. Changes
    - Add constraint to ensure subtasks cannot have due dates (only parent tasks can have due dates)
    - Add trigger function to prevent subtasks from having their own subtasks (no nested subtasks beyond one level)
    - These enforce the business rules: 
      * Subtasks are simple action items without due dates
      * Only parent tasks (tasks without a parent_task_id) can have due dates
      * Task hierarchy is limited to one level (parent -> subtask)
  
  2. Security
    - No changes to existing RLS policies (already properly configured)
  
  3. Important Notes
    - The due date constraint is a CHECK constraint validated on INSERT and UPDATE
    - The nested subtasks prevention uses a trigger for validation
    - Existing data will be checked against the due date constraint
*/

-- Add constraint: subtasks cannot have due dates (only parent tasks can)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_subtasks_no_due_date' 
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_subtasks_no_due_date 
    CHECK (
      (parent_task_id IS NULL) OR 
      (parent_task_id IS NOT NULL AND due_date IS NULL)
    );
  END IF;
END $$;

-- Create trigger function to prevent nested subtasks
CREATE OR REPLACE FUNCTION prevent_nested_subtasks()
RETURNS TRIGGER AS $$
BEGIN
  -- If this task has a parent_task_id, check if that parent also has a parent
  IF NEW.parent_task_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = NEW.parent_task_id 
      AND parent_task_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot create subtask: parent task is already a subtask. Subtasks cannot have their own subtasks.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent nested subtasks on INSERT and UPDATE
DROP TRIGGER IF EXISTS check_nested_subtasks ON tasks;
CREATE TRIGGER check_nested_subtasks
  BEFORE INSERT OR UPDATE OF parent_task_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_nested_subtasks();
