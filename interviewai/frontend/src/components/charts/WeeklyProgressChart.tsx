import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: { _id: string; submissions: number }[];
}

export function WeeklyProgressChart({ data }: Props) {
  const chartData = data.map((d) => ({
    day: new Date(d._id).toLocaleDateString('en-US', { weekday: 'short' }),
    submissions: d.submissions,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="mintFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E6A0" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00E6A0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#232B38" vertical={false} />
        <XAxis dataKey="day" stroke="#5A6478" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#5A6478" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#161C27', border: '1px solid #232B38', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8B96A8' }}
        />
        <Area
          type="monotone"
          dataKey="submissions"
          stroke="#00E6A0"
          strokeWidth={2}
          fill="url(#mintFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
