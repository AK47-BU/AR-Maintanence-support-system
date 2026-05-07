import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const STATUS_COLORS = {
  detected:    'var(--status-detected)',
  confirmed:   'var(--status-confirmed)',
  in_progress: 'var(--status-in_progress)',
  resolved:    'var(--status-resolved)',
  false_alarm: 'var(--text-muted)',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius)',
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{name}: </span>
      <strong style={{ color: 'var(--text-primary)' }}>{value}</strong>
    </div>
  )
}

export function StatusDonutChart({ byStatus = {} }) {
  const data = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: key.replace(/_/g, ' '),
      value,
      color: STATUS_COLORS[key] ?? 'var(--text-muted)',
    }))

  if (!data.length) {
    return <div className="empty-state" style={{ padding: 40 }}><p>No data</p></div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
