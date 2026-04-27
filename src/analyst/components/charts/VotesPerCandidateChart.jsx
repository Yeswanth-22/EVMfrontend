import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function VotesPerCandidateChart({ data }) {
  return (
    <article className="analyst-chart-card">
      <h3>Votes per Candidate</h3>
      <div className="analyst-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe5f5" />
            <XAxis dataKey="name" tick={{ fill: "#334155", fontSize: 12 }} />
            <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="votes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default VotesPerCandidateChart;
