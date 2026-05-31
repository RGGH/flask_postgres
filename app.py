from flask import Flask, render_template, request, redirect, url_for
from psycopg2 import pool
import psycopg2.extras
import os
from dotenv import load_dotenv
from contextlib import contextmanager

load_dotenv()

app = Flask(__name__)

# Database config from environment
DB_CONFIG = {
    "database": os.environ["DB_NAME"],
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASS"],
    "host": os.environ["DB_HOST"],
    "port": os.environ["DB_PORT"],
}

# Create a connection pool
connection_pool = pool.SimpleConnectionPool(1, 10, **DB_CONFIG)

@contextmanager
def get_db():
    conn = connection_pool.getconn()
    try:
        yield conn
    finally:
        connection_pool.putconn(conn)

# ---- Database setup (runs once on startup) ----
def init_db():
    with get_db() as conn:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS products (
                        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                        name TEXT NOT NULL,
                        price NUMERIC(6,2) NOT NULL CHECK (price >= 0),
                        created TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                    """
                )
                cur.execute("SELECT COUNT(*) FROM products;")
                count = cur.fetchone()[0]
                if count == 0:
                    cur.execute(
                        """
                        INSERT INTO products (name, price)
                        VALUES
                            ('Apple', 1.99),
                            ('Orange', 0.99),
                            ('Pear', 0.79),
                            ('Banana', 0.59);
                        """
                    )

init_db()

# ---- Routes ----

@app.route('/')
def index():
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute('SELECT * FROM products ORDER BY id')
            data = cur.fetchall()
    return render_template('index.html', data=data)

@app.route("/create", methods=["POST"])
def create():
    name = request.form["name"]
    price = request.form["price"]
    with get_db() as conn:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO products (name, price) VALUES (%s, %s)", (name, price)
                )
    return redirect(url_for("index"))

@app.route("/update", methods=["POST"])
def update():
    name = request.form["name"]
    price = request.form["price"]
    product_id = request.form["id"]
    with get_db() as conn:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE products SET name=%s, price=%s, updated_at=CURRENT_TIMESTAMP WHERE id=%s",
                    (name, price, product_id),
                )
    return redirect(url_for("index"))

@app.route("/delete", methods=["POST"])
def delete():
    product_id = request.form["id"]
    with get_db() as conn:
        with conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM products WHERE id=%s", (product_id,))
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(debug=True)
