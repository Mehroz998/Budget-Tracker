import { useState, useEffect } from "react";
import { Plus, Wallet, TrendingUp, TrendingDown, Filter } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../api/axios";
import TransactionFormModal from "../Components/TransactionFormModal";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#ea580c",
  "#c026d3",
  "#14b8a6",
  "#eab308",
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState({
    metrics: { balance: 0, income: 0, expense: 0 },
    categoryBreakdown: [],
    monthlyData: [],
    trendData: { data: [], categories: [] },
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("month_to_date");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const numberFormatter = (num) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(num) || 0);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const url =
        dateFilter === "custom_range"
          ? `/transactions/summary?dateFilter=${dateFilter}&startDate=${startDate}&endDate=${endDate}`
          : `/transactions/summary?dateFilter=${dateFilter}`;

      console.log(url);
      const response = await api.get(url);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [dateFilter, startDate, endDate]);

  return (
    <div>
      <div className="page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 className="flex items-center gap-2">Dashboard Overview</h2>
          <p>Welcome! Here's your financial summary.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div
            className="flex items-center gap-2"
            style={{
              background: "var(--bg-card)",
              padding: "0.25rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <Filter size={16} className="text-muted" />
            <select
              className="form-select"
              style={{
                border: "none",
                outline: "none",
                boxShadow: "none",
                background: "transparent",
                width: "160px",
                padding: "0.25rem",
                color: "black",
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
          </div>
          {dateFilter === "custom_range" && (
            <div className="flex gap-2 items-center mt-2 animate-in fade-in duration-300">
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
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Add Transaction
          </button>
        </div>
      </div>

      <div className="cards-grid">
        <div className="glass-panel metric-card">
          <div className="metric-title">
            <Wallet size={18} /> Total Balance
          </div>
          <div className="metric-value">
            ${numberFormatter(data.metrics.balance)}
          </div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-title">
            <TrendingUp size={18} className="text-success" /> Total Income
          </div>
          <div className="metric-value text-success">
            ${numberFormatter(data.metrics.income.toFixed(2))}
          </div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-title">
            <TrendingDown size={18} className="text-danger" /> Total Expense
          </div>
          <div className="metric-value text-danger">
            ${numberFormatter(data.metrics.expense.toFixed(2))}
          </div>
        </div>
      </div>

      <div className="charts-grid mt-4">
        <div className="glass-panel chart-container">
          <h3>Income & Expenses</h3>
          {data.monthlyData.length > 0 ? (
            <div style={{ width: "100%", height: 300, marginTop: "1rem" }}>
              <ResponsiveContainer>
                <BarChart
                  data={data.monthlyData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      color: "#0f172a",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted mt-4">
              No data available
            </div>
          )}
        </div>

        <div className="glass-panel chart-container">
          <h3>Expense Category Breakdown</h3>
          {data.categoryBreakdown.length > 0 ? (
            <div style={{ width: "100%", height: 300, marginTop: "1rem" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="flex items-center justify-center flex-col mt-4"
              style={{ height: "250px", color: "#94a3b8" }}
            >
              <p>No expenses found.</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel chart-container mt-4 mb-4">
        <h3>Expense Trends by Category</h3>
        {data.trendData?.data?.length > 0 ? (
          <div style={{ width: "100%", height: 350, marginTop: "1rem" }}>
            <ResponsiveContainer>
              <LineChart
                data={data.trendData.data}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                {data.trendData.categories.map((cat, i) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted mt-4">
            No trend data available for this period.
          </div>
        )}
      </div>

      {isModalOpen && (
        <TransactionFormModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchSummary();
          }}
        />
      )}
    </div>
  );
}
