-- Function to check poll rules before inserting a vote
CREATE OR REPLACE FUNCTION check_poll_voting_rules()
RETURNS TRIGGER AS $$
DECLARE
    poll_expires_at TIMESTAMPTZ;
    poll_settings JSONB;
    poll_max_responses INTEGER;
    current_response_count INTEGER;
BEGIN
    -- Get poll settings and expiration
    SELECT expires_at, settings
    INTO poll_expires_at, poll_settings
    FROM polls
    WHERE id = NEW.poll_id;

    -- Extract maxResponses from settings JSONB (handling potential string/number conversion)
    -- Assuming settings is { "maxResponses": 10, ... }
    IF poll_settings ? 'maxResponses' THEN
        poll_max_responses := (poll_settings->>'maxResponses')::INTEGER;
    END IF;

    -- Check expiration (poll.expires_at)
    IF poll_expires_at IS NOT NULL AND poll_expires_at < NOW() THEN
        RAISE EXCEPTION 'Poll has expired';
    END IF;

    -- Check expiration in settings (poll.settings.expiresAt) if root expires_at is null
    -- Some polls might store it in settings
    IF poll_expires_at IS NULL AND poll_settings ? 'expiresAt' THEN
        BEGIN
            poll_expires_at := (poll_settings->>'expiresAt')::TIMESTAMPTZ;
            IF poll_expires_at < NOW() THEN
                RAISE EXCEPTION 'Poll has expired';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore invalid date format in settings
        END;
    END IF;

    -- Check max responses
    IF poll_max_responses IS NOT NULL AND poll_max_responses > 0 THEN
        -- Count existing votes for this poll
        -- Lock the parent poll row to prevent race conditions? 
        -- Or just accept "good enough" concurrency control. Strict counting requires serialization.
        -- For low traffic, reading COUNT is okay.
        SELECT COUNT(*) INTO current_response_count
        FROM votes
        WHERE poll_id = NEW.poll_id;

        IF current_response_count >= poll_max_responses THEN
            RAISE EXCEPTION 'Poll has reached maximum responses';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for votes table
DROP TRIGGER IF EXISTS enforce_poll_rules_votes ON votes;
CREATE TRIGGER enforce_poll_rules_votes
BEFORE INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION check_poll_voting_rules();

-- Optional: If there is a form_responses table (not confirmed, but good practice if it exists)
-- DO $$ 
-- BEGIN 
--     IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'form_responses') THEN
--         DROP TRIGGER IF EXISTS enforce_poll_rules_form_responses ON form_responses;
--         CREATE TRIGGER enforce_poll_rules_form_responses
--         BEFORE INSERT ON form_responses
--         FOR EACH ROW
--         EXECUTE FUNCTION check_poll_voting_rules();
--     END IF;
-- END $$;
