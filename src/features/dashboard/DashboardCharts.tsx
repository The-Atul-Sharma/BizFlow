import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatINR } from '@/utils/format';

interface PipelineData {
  name: string;
  count: number;
  value: number;
  color: string;
}

export function PipelineBarChart({ data }: { data: PipelineData[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === 'value') return [formatINR(Number(value)), 'Pipeline Value'];
              return [value, 'Enquiries'];
            }}
            contentStyle={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CategoryData {
  name: string;
  count: number;
  outstanding: number;
  color: string;
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-xs text-muted-foreground">
        No customers added yet.
      </div>
    );
  }
  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-cat-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, _name: any, item: any) => [
              `${value} Customers (₹${(item.payload.outstanding / 1000).toFixed(0)}k Due)`,
              item.payload.name,
            ]}
            contentStyle={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
          <Legend
            iconType="circle"
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface OutstandingTopData {
  name: string;
  outstanding: number;
  creditLimit: number;
}

export function OutstandingBarChart({ data }: { data: OutstandingTopData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-xs text-muted-foreground">
        No pending payments recorded.
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10 }}
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={100}
            tickFormatter={(name) => (name.length > 14 ? `${name.substring(0, 14)}…` : name)}
          />
          <Tooltip
            formatter={(val: any) => [formatINR(Number(val)), 'Pending Due']}
            contentStyle={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="outstanding" fill="#ef4444" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
