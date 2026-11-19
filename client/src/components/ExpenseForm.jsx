import { useState } from "react";
import { todayISO } from "../utils.js";

// Controlled form for adding or editing an expense.
// initial: existing expense when editing; onSubmit(values) returns a promise.
export default function ExpenseForm({ categories, initial, onSubmit, onCancel, submitLabel = "Add expense" }) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState(initial ? String(initial.category_id) : "");
  const [date, setDate] = useState(initial ? initial.expense_date : todayISO());
  const [description, setDescription] = useState(initial?.description || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = amount.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0) {
      return setError("Enter an amount greater than 0, like 12.50.");
    }
    if (!categoryId) return setError("Pick a category.");
    if (!date) return setError("Pick a date.");

    setSaving(true);
    setError("");
    try {
      await onSubmit({ amount: value, category_id: Number(categoryId), expense_date: date, description: description.trim() });
      if (!initial) {
        // Clear the add form but keep the date, since people often log several expenses for one day
        setAmount("");
        setDescription("");
        setCategoryId("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const idp = initial ? `edit-${initial.expense_id}` : "new"; // unique ids for labels

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      <div className="row g-2">
        <div className="col-6">
          <label htmlFor={`${idp}-amount`} className="form-label small mb-1">Amount</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input id={`${idp}-amount`} className="form-control" inputMode="decimal" placeholder="0.00"
                   value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <div className="col-6">
          <label htmlFor={`${idp}-date`} className="form-label small mb-1">Date</label>
          <input id={`${idp}-date`} type="date" className="form-control" max={todayISO()}
                 value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="col-12">
          <label htmlFor={`${idp}-cat`} className="form-label small mb-1">Category</label>
          <select id={`${idp}-cat`} className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Choose…</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-12">
          <label htmlFor={`${idp}-desc`} className="form-label small mb-1">Description <span className="text-muted">(optional)</span></label>
          <input id={`${idp}-desc`} className="form-control" maxLength={255} placeholder="e.g. Groceries at Safeway"
                 value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-brand flex-grow-1" disabled={saving}>{saving ? "Saving…" : submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
