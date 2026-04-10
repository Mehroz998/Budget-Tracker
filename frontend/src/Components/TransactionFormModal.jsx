import { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../api/axios";

const CATEGORIES = [
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

export default function TransactionFormModal({
  onClose,
  onSuccess,
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        amount: initialData.amount,
        category: initialData.category,
        date: new Date(initialData.date).toISOString().split("T")[0],
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (initialData) {
        await api.put(`/transactions/${initialData.id}`, formData);
      } else {
        await api.post("/transactions", formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="mb-4">
          {initialData ? "Edit Transaction" : "Add New Transaction"}
        </h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group flex gap-4">
            <label
              className="flex items-center gap-2"
              style={{ cursor: "pointer" }}
            >
              <input
                type="radio"
                name="type"
                value="expense"
                checked={formData.type === "expense"}
                onChange={handleChange}
                style={{ accentColor: "var(--danger)" }}
              />
              <span className="text-danger font-medium">Expense</span>
            </label>
            <label
              className="flex items-center gap-2"
              style={{ cursor: "pointer" }}
            >
              <input
                type="radio"
                name="type"
                value="income"
                checked={formData.type === "income"}
                onChange={handleChange}
                style={{ accentColor: "var(--success)" }}
              />
              <span className="text-success font-medium">Income</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              max={today}
              className="form-input"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              name="description"
              className="form-input"
              placeholder="What was this for?"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-4"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
