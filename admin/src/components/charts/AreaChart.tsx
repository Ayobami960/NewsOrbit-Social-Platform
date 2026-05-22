import {
  AreaChart as ReAreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { ArticlesByDayItem } from "../../types";

interface Props {
  data: ArticlesByDayItem[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-red-400 font-semibold">{payload[0]?.value} articles</p>
      {payload[1] && <p className="text-blue-400 font-semibold">{payload[1]?.value?.toLocaleString()} views</p>}
    </div>
  );
};

export default function AreaChart({ data, height = 200 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReAreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="_id" tick={{ fill: "#52525b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#52525b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} fill="url(#redGrad)" name="articles" />
        <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={1.5} fill="url(#blueGrad)" name="views" />
      </ReAreaChart>
    </ResponsiveContainer>
  );
}
