-- ─────────────────────────────────────────────
-- MediCore — PostgreSQL initialization
-- Runs once when Docker container starts
-- ─────────────────────────────────────────────

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Fast text search (LIKE queries)
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- Accent-insensitive search (español)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation

-- Create text search configuration for Spanish
-- This allows searching "García" when user types "garcia"
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;
