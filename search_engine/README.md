# Full-Text Search Engine

For lightweight search engine, Meilisearch is the best choice.

## Tradeoffs
- ElasticSearch
    - https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-with-docker
    - https://github.com/elastic/elasticsearch
- SQLite with FTS5
- Meilisearch
    - https://github.com/meilisearch/meilisearch
    - https://www.meilisearch.com/docs/resources/self_hosting/getting_started/quick_start

## Notes
- `Documents` are composed of fields, each field containing an attribute and a value
- An `index` in Meilisearch is a collection of documents
- The `primary key` is a special field that must be present in all documents indexed by Meilisearch
- `Lightning Memory-Mapped Database (LMDB)`
    - configurable with `--db-path`
    - LMDB is a transactional key-value store written in C that was developed for OpenLDAP and has ACID properties
    - All documents stored on disk are automatically loaded in memory when Meilisearch asks for them
- RAM‑to‑disk ratio
    - 1/3 usually fine, but in our case, likely just put all to memory
    - default Max Indexing Memory (default: 2/3 of available RAM, minimum 100MB)
    - configurable with `--max-indexing-memory`
