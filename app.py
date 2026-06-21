import os
from flask import Flask, jsonify, request
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv()

app = Flask(__name__)

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": os.environ.get("DB_PORT", 5432),
    "dbname": os.environ.get("DB_NAME"),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASS"),
}


def get_db():
    return psycopg2.connect(**DB_CONFIG)


# Run this once against your database:

# CREATE TABLE products (
#     id SERIAL PRIMARY KEY,
#     name TEXT NOT NULL,
#     price NUMERIC(10, 2) NOT NULL
# );


@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id, name, price FROM products ORDER BY id")
            rows = cur.fetchall()
        return jsonify([dict(r) for r in rows])
    finally:
        conn.close()


@app.route("/api/products", methods=["POST"])
def create_product():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    price = data.get("price")

    if not name or price is None:
        return jsonify({"error": "name and price are required"}), 400

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO products (name, price) VALUES (%s, %s) "
                "RETURNING id, name, price",
                (name, price),
            )
            new_row = cur.fetchone()
        conn.commit()
        return jsonify(dict(new_row)), 201
    finally:
        conn.close()


@app.route("/api/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    price = data.get("price")

    if not name or price is None:
        return jsonify({"error": "name and price are required"}), 400

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "UPDATE products SET name = %s, price = %s WHERE id = %s "
                "RETURNING id, name, price",
                (name, price, product_id),
            )
            updated_row = cur.fetchone()
        conn.commit()
        if updated_row is None:
            return jsonify({"error": "product not found"}), 404
        return jsonify(dict(updated_row))
    finally:
        conn.close()


@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
            deleted = cur.rowcount
        conn.commit()
        if deleted == 0:
            return jsonify({"error": "product not found"}), 404
        return "", 204
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(debug=True)