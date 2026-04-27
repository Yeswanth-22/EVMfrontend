import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function VotingTrendLineChart({ data }) {
  return (
    <article className="analyst-chart-card">
      <h3>Voting Trend Over Time</h3>
      <div className="analyst-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe5f5" />
            <XAxis dataKey="time" tick={{ fill: "#334155", fontSize: 12 }} />
            <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="votes"
              stroke="#1e3a8a"
              strokeWidth={3}
              dot={{ r: 3, fill: "#1e3a8a" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default VotingTrendLineChart;
