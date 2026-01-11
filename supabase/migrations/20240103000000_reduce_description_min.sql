-- Reduce minimum description length from 100 to 50 characters
ALTER TABLE call_requests DROP CONSTRAINT description_length;
ALTER TABLE call_requests ADD CONSTRAINT description_length CHECK (char_length(description) >= 50 AND char_length(description) <= 2000);
