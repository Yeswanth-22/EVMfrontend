import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function RegionResultsChart({ data }) {
  return (
    <article className="analyst-chart-card">
      <h3>Region-wise Voting Results</h3>
      <div className="analyst-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe5f5" />
            <XAxis dataKey="region" tick={{ fill: "#334155", fontSize: 12 }} />
            <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="votes" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default RegionResultsChart;
