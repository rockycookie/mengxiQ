# Load data to search engine

## Context
- total data size: less than 1MB (currently 88kb)
- expected to grow, but just me using it (single user)

## When to load
- Add a report tab for `Full-Text Search`, add a button `load reports`
- When clicking on that button, load all reports to Meilisearch

## How to load
1. Create new index `search-report` in Meilisearch (skip if existing)
2. Read all reports items from json server
3. Write them to Meilisearch

## What to load
Keep item to load to Meilisearch simple for now
```json
{
    "id": "", // primary key, this is the `id` in todo queue === `id` in report items
    "description": "",
    "link": "",
}
```
