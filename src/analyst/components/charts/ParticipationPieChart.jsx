import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#10b981", "#cbd5e1"];

function ParticipationPieChart({ data }) {
  return (
    <article className="analyst-chart-card">
      <h3>Voter Participation</h3>
      <div className="analyst-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={102}
              innerRadius={60}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default ParticipationPieChart;
