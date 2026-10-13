// Shared chart colors driven by the active theme. Charts are client components
// and read `isDark` + `accent` from the settings context, then pass them here so
// axes, grids, and tooltips stay legible on light and dark surfaces alike.
export function chartColors(isDark: boolean, accent: string) {
  return {
    grid: isDark ? '#1e293b' : '#e5e7eb',
    axis: isDark ? '#94a3b8' : '#374151',
    axisLine: isDark ? '#334155' : '#9ca3af',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#e5e7eb',
    tooltipLabel: isDark ? '#f1f5f9' : '#111827',
    tooltipItem: isDark ? '#cbd5e1' : '#374151',
    // Single-series charts (patients) use the theme accent so they tint with the mode.
    series: accent,
  } as const;
}

export const STATUS_COLOURS: Record<string, string> = {
  Booked: '#0072B2', // Blue
  Done: '#009E73', // Green
  'No-show': '#D55E00', // Vermillion
  Cancelled: '#CC79A7', // Reddish purple
};
