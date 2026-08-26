DO $$
DECLARE
  r RECORD;
  raw_text TEXT;
BEGIN
  -- Fix workflow_steps.action_config when stored as a JSON string
  FOR r IN
    SELECT id, action_config
    FROM workflow_steps
    WHERE action_config IS NOT NULL
      AND jsonb_typeof(action_config) = 'string'
  LOOP
    BEGIN
      raw_text := trim(both '"' from r.action_config::text);
      IF left(raw_text, 1) IN ('{', '[') THEN
        UPDATE workflow_steps
        SET action_config = raw_text::jsonb
        WHERE id = r.id;
      END IF;
    EXCEPTION WHEN others THEN
      -- Skip invalid JSON without failing the migration
    END;
  END LOOP;

  -- Fix workflow_steps.condition when stored as a JSON string
  FOR r IN
    SELECT id, condition
    FROM workflow_steps
    WHERE condition IS NOT NULL
      AND jsonb_typeof(condition) = 'string'
  LOOP
    BEGIN
      raw_text := trim(both '"' from r.condition::text);
      IF left(raw_text, 1) IN ('{', '[') THEN
        UPDATE workflow_steps
        SET condition = raw_text::jsonb
        WHERE id = r.id;
      END IF;
    EXCEPTION WHEN others THEN
      -- Skip invalid JSON without failing the migration
    END;
  END LOOP;

  -- Fix workflows.trigger_config when stored as a JSON string
  FOR r IN
    SELECT id, trigger_config
    FROM workflows
    WHERE trigger_config IS NOT NULL
      AND jsonb_typeof(trigger_config) = 'string'
  LOOP
    BEGIN
      raw_text := trim(both '"' from r.trigger_config::text);
      IF left(raw_text, 1) IN ('{', '[') THEN
        UPDATE workflows
        SET trigger_config = raw_text::jsonb
        WHERE id = r.id;
      END IF;
    EXCEPTION WHEN others THEN
      -- Skip invalid JSON without failing the migration
    END;
  END LOOP;
END $$;
