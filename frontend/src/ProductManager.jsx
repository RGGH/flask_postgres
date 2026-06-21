import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';

// Point this at your Flask API, e.g. '/api/products' if served from the
// same origin, or 'http://localhost:5000/api/products' if separate.
const API_BASE = '/api/products';

// Shown if the API can't be reached, so the UI is still browsable.
const MOCK_DATA = [
  { id: 1, name: 'Espresso Beans', price: 14.5 },
  { id: 2, name: 'Pour-Over Kettle', price: 38.0 },
  { id: 3, name: 'Ceramic Mug', price: 9.25 },
];

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  function seedDrafts(data) {
    const next = {};
    data.forEach((p) => {
      next[p.id] = { name: p.name, price: String(p.price) };
    });
    setDrafts(next);
  }

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setProducts(data);
      seedDrafts(data);
    } catch (err) {
      setProducts(MOCK_DATA);
      seedDrafts(MOCK_DATA);
      setError('Could not reach the API — showing sample data instead.');
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(id, field, value) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  }

  async function handleUpdate(id) {
    setSavingId(id);
    setError(null);
    const draft = drafts[id];
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft.name, price: parseFloat(draft.price) }),
      });
      if (!res.ok) throw new Error('Update failed');
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: draft.name, price: parseFloat(draft.price) } : p))
      );
    } catch (err) {
      setError('Could not save that update. Check your API connection.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('Could not delete that row. Check your API connection.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.price.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProduct.name, price: parseFloat(newProduct.price) }),
      });
      if (!res.ok) throw new Error('Create failed');
      const created = await res.json();
      setProducts((prev) => [...prev, created]);
      setDrafts((d) => ({ ...d, [created.id]: { name: created.name, price: String(created.price) } }));
      setNewProduct({ name: '', price: '' });
    } catch (err) {
      setError('Could not create that product. Check your API connection.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 font-sans text-slate-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Flask + React</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Product Inventory</h1>
        </header>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading products…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No products yet — add one below.
                  </td>
                </tr>
              ) : (
                products.map((row) => {
                  const draft = drafts[row.id] || { name: '', price: '' };
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 text-slate-400">{row.id}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => updateDraft(row.id, 'name', e.target.value)}
                          className="w-full rounded border border-transparent bg-transparent px-2 py-1 transition hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={draft.price}
                          onChange={(e) => updateDraft(row.id, 'price', e.target.value)}
                          className="w-24 rounded border border-transparent bg-transparent px-2 py-1 transition hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(row.id)}
                            disabled={savingId === row.id}
                            className="flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
                          >
                            {savingId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Pencil className="h-3.5 w-3.5" />
                            )}
                            Update
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            disabled={deletingId === row.id}
                            className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Create a new product
          </h2>
          <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Name"
              autoComplete="off"
              value={newProduct.name}
              onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
              className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}