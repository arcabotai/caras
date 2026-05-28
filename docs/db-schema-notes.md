# Database Schema Notes — Talkie LATAM

## Overview

This document outlines the current database schema design and provides recommendations
for future production enhancements.

## Current Stack

- **Database**: PostgreSQL (via Drizzle ORM)
- **Hosting**: Railway (production)
- **ORM**: Drizzle ORM with typed schema definitions

## Character Search — Current Implementation

### ILIKE-Based Search (Interim Solution)

The current search implementation uses PostgreSQL's `ILIKE` operator for pattern matching
across character fields:

```sql
-- Search in name, shortDesc, fullPrompt
WHERE name ILIKE '%query%'
   OR shortDesc ILIKE '%query%'
   OR fullPrompt ILIKE '%query%'

-- Tag filtering using array overlap
WHERE tags && ARRAY['anime', 'games']
```

### Limitations of ILIKE

1. **No relevance scoring** — Results are returned in arbitrary order, not ranked by relevance
2. **No prefix matching optimization** — Full table scan may occur for broad patterns
3. **No typo tolerance** — "Kai Nakamori" won't match "Kai Nakamura" or "Kai Nakamori"
4. **No full-text features** — No stemming, stop words, or language-specific processing

## Production Recommendations

### Option 1: PgVector (Recommended for Scale < 1M characters)

**Pros:**
- Vector embeddings capture semantic similarity
- Handles typo tolerance via approximate nearest neighbor search
- Native PostgreSQL extension — no new infrastructure
- Supports hybrid search (keyword + semantic)

**Setup:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to characters table
ALTER TABLE characters ADD COLUMN embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX ON characters USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Index Size Estimate:** ~1536 floats × 4 bytes = ~6KB per character
For 100K characters: ~600MB index

### Option 2: Dedicated Search Service

For scale > 1M characters or advanced features:

| Service | Best For | Integration |
|---------|----------|-------------|
| Algolia | Real-time, faceted search | REST API |
| Meilisearch | Open-source, typo-tolerant | REST API |
| Typesense | Open-source, lightweight | REST API |
| Elasticsearch | Complex aggregations | REST API |

These services handle:
- Automatic indexing and ranking
- Typo tolerance and synonym handling
- Faceted filtering and sorting
- Analytics and search insights

## Current API Endpoints

### GET /api/characters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (ILIKE on name, shortDesc, fullPrompt) |
| `tags` | string | Comma-separated tags for filtering |
| `category` | string | Category filter (anime, game, fiction, etc.) |
| `sort` | string | Sort order: popular, new, trending, para_ti |
| `page` | number | Pagination (default: 1) |
| `limit` | number | Results per page (max: 50) |

**Example:**
```
GET /api/characters?q=kai&tags=anime,games&category=anime&sort=popular
```

## Schema Reference

See `src/lib/db/schema.ts` for full Drizzle schema definitions.

### Characters Table

```typescript
{
  id: uuid (PK),
  creatorId: uuid (FK → users),
  name: varchar(255) NOT NULL,
  shortDesc: text NOT NULL,
  fullPrompt: text NOT NULL,
  avatarUrl: text (nullable),
  category: enum (anime, game, fiction, media, custom, featured),
  tags: text[] (array, default []),
  isPublic: boolean (default true),
  isPremium: boolean (default false),
  replyCount: integer (default 0),
  chatCount: integer (default 0),
  isFlagged: boolean (default false),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Migration Path

1. **Current** → Add `searchVector` tsvector column + GIN index
2. **Phase 2** → Add PgVector for semantic search
3. **Phase 3** → Consider dedicated search service if scale demands

## Notes

- All text is stored as-is; no preprocessing for search optimization
- Tags are stored as text array; `&&` operator enables array overlap queries
- Current search is case-insensitive via PostgreSQL ILIKE