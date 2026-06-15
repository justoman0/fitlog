"use client";

export function LineChart({
  points,
  height = 160,
  unit = "",
}: {
  points: { x: string; y: number }[];
  height?: number;
  unit?: string;
}) {
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
        <linearGradient id="lcfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={w - pad}
          y1={pad + (h - pad * 2) * t}
          y2={pad + (h - pad * 2) * t}
          stroke="#262a35"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill="url(#lcfill)" />
      <path
        d={path}
        fill="none"
        stroke="#4ade80"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((p, i) => {
        const [px, py] = coord(i, p.y);
        return <circle key={i} cx={px} cy={py} r="2.5" fill="#4ade80" />;
      })}
      <text x={pad} y={14} fill="#8b909c" fontSize="10">
        {max.toFixed(1)}
        {unit}
      </text>
      <text x={pad} y={h - pad + 16} fill="#8b909c" fontSize="10">
        {min.toFixed(1)}
        {unit}
      </text>
      <text
        x={w - pad}
        y={14}
        fill="#4ade80"
        fontSize="11"
        textAnchor="end"
        fontWeight="600"
      >
        {last.y}
        {unit}
      </text>
    </svg>
  );
}
