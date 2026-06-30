"use client";

export function LineChart({
  points,
  height = 160,
  unit = "",
  color = "var(--accent)",
}: {
  points: { x: string; y: number }[];
  height?: number;
  unit?: string;
  color?: string;
}) {
  const gid = `lcfill-${color.replace(/[^a-z0-9]/gi, "")}`;
  if (points.length === 0) return null;
  const w = 320;
  const h = height;
  const pad = 28;
  const ys = points.map((p) => p.y);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  const stepX =
    points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coord = (i: number, y: number) => {
    const px = pad + i * stepX;
    const py = pad + (h - pad * 2) * (1 - (y - min) / range);
    return [px, py] as const;
  };

  const path = points
    .map((p, i) => {
      const [px, py] = coord(i, p.y);
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");

  const area = `${path} L${(pad + (points.length - 1) * stepX).toFixed(
    1
  )},${h - pad} L${pad},${h - pad} Z`;

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={w - pad}
          y1={pad + (h - pad * 2) * t}
          y2={pad + (h - pad * 2) * t}
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((p, i) => {
        const [px, py] = coord(i, p.y);
        return <circle key={i} cx={px} cy={py} r="2.5" fill={color} />;
      })}
      <text x={pad} y={14} fill="var(--muted)" fontSize="10">
        {max.toFixed(1)}
        {unit}
      </text>
      <text x={pad} y={h - pad + 16} fill="var(--muted)" fontSize="10">
        {min.toFixed(1)}
        {unit}
      </text>
      <text
        x={w - pad}
        y={14}
        fill={color}
        fontSize="11"
        textAnchor="end"
        fontWeight="700"
      >
        {last.y}
        {unit}
      </text>
    </svg>
  );
}
