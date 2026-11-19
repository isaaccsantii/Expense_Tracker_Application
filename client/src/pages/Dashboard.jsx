import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../api/client.js";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import { currentMonth, money, monthLabel, shiftMonth } from "../utils.js";

export default function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [expenses, setExpenses] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Categories only need to load once
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data.categories)).catch((err) => setError(errorMessage(err)));
  }, []);

  // Reload the list and the summary whenever the month, filter or sort changes
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        api.get("/expenses", { params: { month, category_id: categoryFilter, sort } }),
        api.get("/expenses/summary", { params: { month } }),
      ]);
      setExpenses(list.data.expenses);
      setListTotal(list.data.total);
      setSummary(sum.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month, categoryFilter, sort]);

  useEffect(() => {
    load();
  }, [load]);

  // After any change, reload so the list, totals and breakdown stay in sync
  async function addExpense(values) {
    try {
      const res = await api.post("/expenses", values);
      const added = res.data.expense;
      if (added.expense_date.slice(0, 7) !== month) setMonth(added.expense_date.slice(0, 7)); // jump to that month
      else await load();
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  }

  async function updateExpense(id, values) {
    try {
      await api.put(`/expenses/${id}`, values);
      await load();
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  }

  async function deleteExpense(id) {
    try {
      await api.delete(`/expenses/${id}`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const isCurrentMonth = month === currentMonth();

  return (
    <>
      {/* Month navigation */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">‹</button>
          <h1 className="h4 mb-0 month-title">{monthLabel(month)}</h1>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setMonth(shiftMonth(month, 1))}
                  disabled={isCurrentMonth} aria-label="Next month">›</button>
        </div>
        {!isCurrentMonth && (
          <button className="btn btn-link btn-sm" onClick={() => setMonth(currentMonth())}>Back to this month</button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-8 order-2 order-lg-1">
          <SummaryCards summary={summary} />

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <h2 className="h6 mb-0">
                Expenses <span className="text-muted fw-normal">({expenses.length} · {money(listTotal)})</span>
              </h2>
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm" aria-label="Filter by category" value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All categories</option>
                  {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                </select>
                <select className="form-select form-select-sm" aria-label="Sort expenses" value={sort}
                        onChange={(e) => setSort(e.target.value)}>
                  <option value="date_desc">Newest first</option>
                  <option value="date_asc">Oldest first</option>
                  <option value="amount_desc">Highest amount</option>
                  <option value="amount_asc">Lowest amount</option>
                </select>
              </div>
            </div>
            {loading ? (
              <p className="text-muted p-3 mb-0">Loading…</p>
            ) : (
              <ExpenseList expenses={expenses} categories={categories} onUpdate={updateExpense} onDelete={deleteExpense} />
            )}
          </div>
        </div>

        <div className="col-lg-4 order-1 order-lg-2">
          <div className="card shadow-sm border-0 sticky-lg-top" style={{ top: "1rem" }}>
            <div className="card-body">
              <h2 className="h5 mb-3">Add an expense</h2>
              <ExpenseForm categories={categories} onSubmit={addExpense} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
