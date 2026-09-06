/*
# Fix trigger function security

1. Security Changes
   - Set search_path on update_item_status_on_lock to prevent search_path injection
   - Revoke EXECUTE from anon and authenticated so the function can only be
     invoked by the database trigger, not via the REST API
*/

CREATE OR REPLACE FUNCTION update_item_status_on_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE items SET status = 'locked' WHERE id = NEW.item_id;
  ELSIF NEW.status = 'released' OR NEW.status = 'expired' THEN
    UPDATE items SET status = 'available' WHERE id = NEW.item_id;
  ELSIF NEW.status = 'converted' THEN
    UPDATE items SET status = 'sold' WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_item_status_on_lock() FROM anon, authenticated;