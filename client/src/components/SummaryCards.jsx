import { money } from "../utils.js";

// Phase-1 monthly snapshot: total, number of expenses, top category, and a
// simple category breakdown. Charts and deeper analytics come in Phase 2.
export default function SummaryCards({ summary }) {
  if (!summary) return null;
  const { total, count, topCategory, byCategory } = summary;

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-sm-4">
          <div className="stat-card p-3 h-100">
            <div className="stat-label">Spent this month</div>
            <div className="stat-value">{money(total)}</div>
          </div>
        </div>
        <div className="col-6 col-sm-4">
          <div className="stat-card p-3 h-100">
            <div className="stat-label">Expenses logged</div>
            <div className="stat-value">{count}</div>
          </div>
        </div>
        <div className="col-6 col-sm-4">
          <div className="stat-card p-3 h-100">
            <div className="stat-label">Top category</div>
            <div className="stat-value stat-small">{topCategory ? topCategory.category : "—"}</div>
            {topCategory && <div className="small text-muted">{money(topCategory.total)}</div>}
          </div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h2 className="h6 mb-3">Where it went</h2>
            {byCategory.map((c) => {
              const pct = total ? Math.round((c.total / total) * 100) : 0;
              return (
                <div key={c.category} className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span><span className="cat-dot me-2" style={{ background: c.color }} />{c.category}</span>
                    <span className="text-muted">{money(c.total)} · {pct === 0 ? "<1" : pct}%</span>
                  </div>
                  <div className="progress" role="progressbar" aria-label={`${c.category} share`} aria-valuenow={pct}
                       aria-valuemin="0" aria-valuemax="100" style={{ height: 6 }}>
                    <div className="progress-bar" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
