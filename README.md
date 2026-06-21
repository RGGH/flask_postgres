# Flask + PostgreSQL

A web application built with Python, Flask, and PostgreSQL 17, following modern development standards.

## Stack

- **React**
- **Python**
- **PostgreSQL 17** — database, running in Docker
- **psycopg2** — raw SQL with connection pooling (no ORM)
- **uv** — package manager
- **Docker Compose** — runs the full stack (app + database) with one command

## Features

- Full CRUD — Create, Read, Update, Delete products
- Connection pooling via `psycopg2.pool.SimpleConnectionPool`
- Context manager (`get_db`) for clean, automatic connection release
- `RealDictCursor` — rows returned as dicts, so templates use `{{ product.name }}` not `{{ product[1] }}`
- Parameterized queries throughout — no SQL injection risk
- Safe startup — `IF NOT EXISTS` means the init script is safe to run on every deploy
- Seed data — auto-inserted on first run if the table is empty
- Config from environment — all credentials via `.env`, never hardcoded

## Project Structure

```
❯ lt
 .
├──  app.py
├──  docker-compose.yml
├──  Dockerfile
├──  frontend
│   ├──  eslint.config.js
│   ├──  index.html
│   ├──  node_modules
│   ├──  package-lock.json
│   ├──  package.json
│   ├──  public
│   ├──  README.md
│   ├── 󱧼 src
│   └──  vite.config.js
├──  node_modules
│   ├──  @emnapi
│   ├──  @jridgewell
│   ├──  @napi-rs
│   ├──  @oxc-project
│   ├──  @rolldown
│   ├──  @tailwindcss
│   ├──  @tybys
│   ├──  detect-libc
│   ├──  enhanced-resolve
│   ├──  fdir
│   ├──  graceful-fs
│   ├──  jiti
│   ├──  lightningcss
│   ├──  lightningcss-linux-x64-gnu
│   ├──  magic-string
│   ├──  nanoid
│   ├──  picocolors
│   ├──  picomatch
│   ├──  postcss
│   ├──  rolldown
│   ├──  source-map-js
│   ├──  tailwindcss
│   ├──  tapable
│   ├──  tinyglobby
│   ├──  tslib
│   └──  vite
├──  package-lock.json
├──  package.json
├──  pyproject.toml
├──  README.md
├──  static
│   └──  style.css
├──  templates
│   └──  index.html
└──  uv.lock
```

## Getting Started

### 1. Clone and configure

```bash
git clone https://github.com/RGGH/flask_postgres
cd flask_postgres
```

Create a `.env` file:

```
DB_NAME=flask_db
DB_USER=myuser
DB_PASS=mypassword
DB_HOST=db
DB_PORT=5432
```

> `DB_HOST=db` refers to the PostgreSQL service name in `docker-compose.yml` — this is how the two containers find each other.

```
    Install tailwind
    cd frontend
    npm install tailwindcss @tailwindcss/vite
```

### 2. Start the stack

```bash
docker compose up --build
```

```bash
docker compose exec db psql -U myuser -d flask_db -c "
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);"
```


Then open [http://localhost:5000](http://localhost:5000).

### 3. First run

The app will automatically:
- Create the `products` table if it doesn't exist
- Seed it with four sample products (Apple, Orange, Pear, Banana)

No manual `CREATE DATABASE` step needed — the database is created by Docker via the `POSTGRES_DB` environment variable.

## Docker Compose Commands

| Situation | Command |
|---|---|
| First time / after Dockerfile change | `docker compose up --build` |
| After `uv add <package>` | `docker compose up --build` |
| Normal start | `docker compose up` |
| Run in background | `docker compose up -d` |
| Stop everything | `docker compose down` |
| Stop and wipe the database | `docker compose down -v` |

> The database is persisted in a Docker volume (`postgres_data`). Use `down -v` only if you want a clean slate.

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS products (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name     TEXT NOT NULL,
    price    NUMERIC(6,2) NOT NULL CHECK (price >= 0),
    created    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Notable choices:
- `BIGINT GENERATED ALWAYS AS IDENTITY` — modern standard, not the deprecated `SERIAL`
- `NUMERIC(6,2)` — exact decimal for financial data, not `FLOAT`
- `TIMESTAMPTZ` — timezone-aware timestamps

## Key Code Patterns

### Context manager for connections

```python
@contextmanager
def get_db():
    conn = connection_pool.getconn()
    try:
        yield conn
    finally:
        connection_pool.putconn(conn)
```

Every route uses `with get_db() as conn:` — connections are always returned to the pool, even if an exception occurs.

### Named column access

```python
with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
    cur.execute('SELECT * FROM products ORDER BY id')
    data = cur.fetchall()
```

Rows behave like dicts, so Jinja2 templates can use `{{ product.name }}` instead of `{{ product[1] }}`.

## Resources

- [Flask Playlist](https://www.youtube.com/playlist?list=PLKMY3XNPiQ7uTf4_E00BjPhcafEiGZP4M)
- [Jinja2 Templates](https://jinja.palletsprojects.com/en/stable/templates/)
- [Docker Install](https://docs.docker.com/get-started/get-docker/)
- [psycopg2 docs](https://www.psycopg.org/docs/)
