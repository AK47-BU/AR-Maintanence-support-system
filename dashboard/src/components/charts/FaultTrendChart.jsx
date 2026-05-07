import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'

// Custom tooltip so it matches the dark theme
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius)',
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

// Takes the raw trends array from the API and reshapes it into
// a flat array of { date, critical, high, medium, low } objects
function processTrends(rawTrends) {
  const byDate = {}

  for (const item of rawTrends) {
    const { date, severity } = item._id
    if (!byDate[date]) {
      byDate[date] = { date, critical: 0, high: 0, medium: 0, low: 0 }
    }
    byDate[date][severity] = item.count
  }

  return Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      // Shorten the date label for display: "12 May"
      label: (() => {
        try { return format(parseISO(d.date), 'd MMM') } catch { return d.date }
      })(),
    }))
}

export function FaultTrendChart({ trends = [] }) {
  const data = processTrends(trends)

  if (!data.length) {
    return (
      <div className="empty-state" style={{ padding: 40 }}>
        <p>No trend data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 12 }}
        />
        <Line type="monotone" dataKey="critical" stroke="var(--critical)" strokeWidth={2} dot={false} name="Critical" />
        <Line type="monotone" dataKey="high"     stroke="var(--high)"     strokeWidth={2} dot={false} name="High" />
        <Line type="monotone" dataKey="medium"   stroke="var(--medium)"   strokeWidth={2} dot={false} name="Medium" />
        <Line type="monotone" dataKey="low"      stroke="var(--low)"      strokeWidth={2} dot={false} name="Low" />
      </LineChart>
    </ResponsiveContainer>
  )
}
