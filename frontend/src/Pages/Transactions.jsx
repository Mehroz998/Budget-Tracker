import { useState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import TransactionFormModal from "../Components/TransactionFormModal";

const CATEGORIES = [
  "All",
  "Food",
  "Rent",
  "Utilities",
  "Entertainment",
  "Transport",
  "Healthcare",
  "Shopping",
  "Salary",
  "Investment",
  "Other",
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);

  const [filterType, setFilterType] = useState("category"); // 'category' or 'date'
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("month_to_date");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, categoryFilter, dateFilter, startDate, endDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let endpoint = `/transactions?page=${page}&limit=10`;

      if (filterType === "category") {
        if (categoryFilter !== "All") {
          endpoint += `&category=${categoryFilter}`;
        }
      } else if (filterType === "date") {
        if (dateFilter === "custom_range") {
          endpoint += `&dateFilter=${dateFilter}&startDate=${startDate}&endDate=${endDate}`;
        } else {
          endpoint += `&dateFilter=${dateFilter}`;
        }
      }

      const response = await api.get(endpoint);
      if (response.data.success) {
        setTransactions(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType, categoryFilter, dateFilter, page, startDate, endDate]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const handleEdit = (trx) => {
    setEditingTransaction(trx);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      let endpoint = `/transactions/export?`;

      if (filterType === "category") {
        if (categoryFilter !== "All") {
          endpoint += `category=${categoryFilter}`;
        }
      } else if (filterType === "date") {
        if (dateFilter === "custom_range") {
          endpoint += `dateFilter=${dateFilter}&startDate=${startDate}&endDate=${endDate}`;
        } else {
          endpoint += `dateFilter=${dateFilter}`;
        }
      }

      const response = await api.get(endpoint, { responseType: "blob" });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      if (e.response && e.response.status === 404) {
        alert("No transactions found for the selected filter.");
      } else {
        alert("Export failed. Please try again.");
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="flex items-center gap-2">
            Transactions History
            {loading && (
              <Loader2 size={18} className="animate-spin text-primary" />
            )}
          </h2>
          <p>View and manage all your transactions.</p>
        </div>
        <button
          className="btn-primary"
          onClick={handleExportCSV}
          style={{ whiteSpace: "nowrap" }}
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div
        className="glass-panel"
        style={{ padding: "1.5rem", marginBottom: "2rem" }}
      >
        <div className="flex items-center gap-4">
          <span className="font-medium text-muted">Filter By:</span>

          <div
            style={{
              padding: "0.25rem 0.8rem",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              background: "var(--bg-card)",
            }}
          >
            <select
              className="form-select"
              style={{
                width: "150px",
                outline: "none",
                boxShadow: "none",
                background: "transparent",
                border: "none",
                color: "black",
                padding: "0",
              }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="category">Category</option>
              <option value="date">Date</option>
            </select>
          </div>

          <div
            style={{
              padding: "0.25rem 0.8rem",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              background: "var(--bg-card)",
            }}
          >
            {filterType === "category" ? (
              <select
                className="form-select"
                style={{
                  width: "150px",
                  outline: "none",
                  boxShadow: "none",
                  background: "transparent",
                  border: "none",
                  color: "black",
                  padding: "0",
                }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="form-select"
                style={{
                  width: "150px",
                  outline: "none",
                  boxShadow: "none",
                  background: "transparent",
                  border: "none",
                  color: "black",
                  padding: "0",
                }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="month_to_date">Month to Date</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="from_start">From Start</option>
                <option value="custom_range">Custom Range</option>
              </select>
            )}
          </div>

          {filterType === "date" && dateFilter === "custom_range" && (
            <div className="flex gap-2 items-center animate-in fade-in duration-300">
              <input
                type="date"
                className="form-input"
                max={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                }}
              />
              <span className="text-muted">to</span>
              <input
                type="date"
                className="form-input"
                min={startDate || ""}
                max={today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div
        className="glass-panel"
        style={{ overflowX: "auto", marginBottom: "1rem" }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody
            style={{
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            {transactions.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "3rem" }}
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((trx) => (
                <tr key={trx.id}>
                  <td>{new Date(trx.date).toLocaleDateString()}</td>
                  <td
                    style={{
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {trx.description || "-"}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: "rgba(22,22,22,0.1)" }}
                    >
                      {trx.category}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${trx.type}`}>
                      {trx.type.charAt(0).toUpperCase() + trx.type.slice(1)}
                    </span>
                  </td>
                  <td
                    className={
                      trx.type === "income" ? "text-success" : "text-danger"
                    }
                    style={{ fontWeight: "600" }}
                  >
                    ${parseFloat(trx.amount).toFixed(2)}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn-icon primary"
                        onClick={() => handleEdit(trx)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(trx.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > 0 && (
        <div
          className="flex items-center justify-between mt-4 mb-4"
          style={{ padding: "0 1rem" }}
        >
          <span className="text-muted text-sm" style={{ fontWeight: "500" }}>
            Page <span className="text-main">{page}</span> of{" "}
            <span className="text-main">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              className="btn-icon"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                padding: "0.5rem 1rem",
                opacity: page === 1 ? 0.5 : 1,
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              className="btn-icon"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                padding: "0.5rem 1rem",
                opacity: page === totalPages || totalPages === 0 ? 0.5 : 1,
                cursor:
                  page === totalPages || totalPages === 0
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <TransactionFormModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTransactions();
          }}
          initialData={editingTransaction}
        />
      )}
    </div>
  );
}
