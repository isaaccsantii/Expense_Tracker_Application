import { useState } from "react";
import ExpenseForm from "./ExpenseForm.jsx";
import { money, prettyDate } from "../utils.js";

// List of expenses with inline edit and delete
export default function ExpenseList({ expenses, categories, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);

  if (expenses.length === 0) {
    return <div className="empty-state text-center p-5 rounded">No expenses match these filters yet.</div>;
  }

  return (
    <ul className="list-unstyled mb-0 expense-list">
      {expenses.map((e) =>
        editingId === e.expense_id ? (
          <li key={e.expense_id} className="expense-row editing p-3">
            <ExpenseForm
              categories={categories}
              initial={e}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                await onUpdate(e.expense_id, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          </li>
        ) : (
          <li key={e.expense_id} className="expense-row d-flex align-items-center gap-3 px-3 py-2">
            <span className="cat-dot flex-shrink-0" style={{ background: e.color }} title={e.category} />
            <div className="flex-grow-1 min-w-0">
              <div className="fw-semibold text-truncate">{e.description || e.category}</div>
              <div className="small text-muted">
                {e.category} · {prettyDate(e.expense_date)}
              </div>
            </div>
            <div className="fw-bold text-nowrap">{money(e.amount)}</div>
            <div className="d-flex gap-1 row-actions">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingId(e.expense_id)}
                      aria-label={`Edit ${e.description || e.category}`}>Edit</button>
              <button className="btn btn-sm btn-outline-danger"
                      onClick={() => window.confirm(`Delete this ${money(e.amount)} expense?`) && onDelete(e.expense_id)}
                      aria-label={`Delete ${e.description || e.category}`}>Delete</button>
            </div>
          </li>
        )
      )}
    </ul>
  );
}
