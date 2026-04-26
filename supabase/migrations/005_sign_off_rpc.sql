CREATE OR REPLACE FUNCTION sign_off_review_item(
  p_review_item_id UUID,
  p_now TIMESTAMPTZ DEFAULT now()
) RETURNS JSON AS $$
DECLARE
  v_item RECORD;
  v_delta RECORD;
  v_existing RECORD;
  v_fact_id UUID;
  v_changes JSONB := '[]'::JSONB;
  v_commit_id UUID;
  v_group TEXT;
  v_valid_groups TEXT[] := ARRAY['demographics','diagnosis','staging','medication','imaging','lab','history','genomics'];
BEGIN
  -- Fetch review item
  SELECT * INTO v_item FROM review_items WHERE id = p_review_item_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Review item not found', 'status', 404);
  END IF;

  IF v_item.status = 'merged' THEN
    RETURN json_build_object('error', 'Already signed off', 'status', 409);
  END IF;

  IF v_item.status = 'declined' THEN
    RETURN json_build_object('error', 'Cannot sign off a declined item', 'status', 409);
  END IF;

  -- Check for unresolved conflicts
  IF EXISTS (SELECT 1 FROM review_conflicts WHERE review_item_id = p_review_item_id) THEN
    RETURN json_build_object('error', 'Unresolved conflicts', 'status', 422);
  END IF;

  -- Process each delta
  FOR v_delta IN SELECT * FROM review_deltas WHERE review_item_id = p_review_item_id ORDER BY sort_order LOOP
    -- Check if fact exists
    SELECT id, value INTO v_existing FROM facts
    WHERE patient_id = v_item.patient_id AND key = v_delta.fact_key;

    IF FOUND THEN
      -- Update existing fact
      UPDATE facts SET
        value = v_delta.after_value,
        label = v_delta.label,
        updated_at = p_now,
        source_kind = v_item.source_kind,
        source_id = v_item.source_id,
        source_label = v_item.source_label,
        source_at = v_item.source_at,
        source_author = v_item.source_author
      WHERE id = v_existing.id;

      v_fact_id := v_existing.id;

      -- Record history
      INSERT INTO fact_history (fact_id, patient_id, key, old_value, new_value, review_item_id, created_at)
      VALUES (v_existing.id, v_item.patient_id, v_delta.fact_key, v_existing.value, v_delta.after_value, p_review_item_id, p_now);
    ELSE
      -- Determine group from key prefix
      v_group := split_part(v_delta.fact_key, '.', 1);
      IF NOT (v_group = ANY(v_valid_groups)) THEN
        v_group := 'history';
      END IF;

      -- Insert new fact
      INSERT INTO facts (patient_id, key, label, value, "group", source_kind, source_id, source_label, source_at, source_author, updated_at)
      VALUES (v_item.patient_id, v_delta.fact_key, v_delta.label, v_delta.after_value, v_group, v_item.source_kind, v_item.source_id, v_item.source_label, v_item.source_at, v_item.source_author, p_now)
      RETURNING id INTO v_fact_id;

      -- Record history
      INSERT INTO fact_history (fact_id, patient_id, key, old_value, new_value, review_item_id, created_at)
      VALUES (v_fact_id, v_item.patient_id, v_delta.fact_key, NULL, v_delta.after_value, p_review_item_id, p_now);
    END IF;

    -- Accumulate changes
    v_changes := v_changes || jsonb_build_array(jsonb_build_object(
      'fact_key', v_delta.fact_key,
      'before', v_existing.value,
      'after', v_delta.after_value
    ));
  END LOOP;

  -- Create commit record
  INSERT INTO record_commits (patient_id, review_item_id, changes, committed_at)
  VALUES (v_item.patient_id, p_review_item_id, v_changes, p_now)
  RETURNING id INTO v_commit_id;

  -- Update review item status
  UPDATE review_items SET status = 'merged', merged_at = p_now
  WHERE id = p_review_item_id;

  RETURN json_build_object('ok', true, 'commitId', v_commit_id, 'changesApplied', jsonb_array_length(v_changes));
END;
$$ LANGUAGE plpgsql;
