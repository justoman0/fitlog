export const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const fmtDateShort = (iso: string) => {
  const dt = new Date(iso + "T00:00:00");
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export const epley1RM = (weight: number, reps: number) =>
  reps > 0 ? Math.round(weight * (1 + reps / 30)) : 0;

export const pace = (km?: number, min?: number) => {
  if (!km || !min || km <= 0) return "—";
  const p = min / km;
  const m = Math.floor(p);
  const s = Math.round((p - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
};
