'use client';

import { useSettings, THEMES, CHART_OPTIONS, type ThemeName, type ChartKey, type UpcomingMode, type UpcomingWindow } from '@/app/ui/settings/settings-context';

function ThemeSelector() {
  const { settings, setTheme } = useSettings();
  return (
    <section className="rounded-md border p-4">
      <h2 className="mb-3 font-semibold">Theme</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(THEMES) as ThemeName[]).map((theme) => {
          const t = THEMES[theme];
          return (
            <button
              key={theme}
              onClick={() => setTheme(theme)}
              className={`relative rounded-lg border-2 p-3 transition ${settings.theme === theme ? 'border-blue-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-full"
                  style={{ backgroundColor: t.accent }}
                />
                <span className="font-medium capitalize">{t.label}</span>
              </div>
              <div className="text-xs text-gray-500 capitalize">{t.mode}</div>
              {settings.theme === theme && (
                <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChartSelector() {
  const { settings, setChartSlot } = useSettings();

  return (
    <section className="rounded-md border p-4">
      <h2 className="mb-3 font-semibold">Dashboard Charts</h2>
      <p className="mb-4 text-sm text-gray-500">
        Choose a different chart type for each slot. Both slots will always show different charts.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            <label className="block text-sm font-medium">Chart Slot {i + 1}</label>
            <div className="flex flex-wrap gap-2">
              {CHART_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setChartSlot(i as 0 | 1, opt.key)}
                  disabled={settings.chartSlots[1 - i] === opt.key}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    settings.chartSlots[i] === opt.key
                      ? 'bg-blue-600 text-white'
                      : settings.chartSlots[1 - i] === opt.key
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpcomingSelector() {
  const { settings, setUpcoming } = useSettings();

  return (
    <section className="rounded-md border p-4">
      <h2 className="mb-3 font-semibold">Upcoming Appointments</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Display Mode</label>
          <div className="flex flex-wrap gap-2">
            {(['count', 'window'] as UpcomingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setUpcoming({ upcomingMode: mode })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  settings.upcomingMode === mode ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {mode === 'count' ? 'Next N appointments' : 'Time window'}
              </button>
            ))}
          </div>
        </div>

        {settings.upcomingMode === 'count' && (
          <div>
            <label className="block text-sm font-medium mb-2">Number to Show</label>
            <input
              type="number"
              min="1"
              max="12"
              value={settings.upcomingLimit}
              onChange={(e) => setUpcoming({ upcomingLimit: Number(e.target.value) })}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {settings.upcomingMode === 'window' && (
          <div>
            <label className="block text-sm font-medium mb-2">Time Window</label>
            <div className="flex flex-wrap gap-2">
              {(['today', 'week', 'month', 'all'] as UpcomingWindow[]).map((window) => (
                <button
                  key={window}
                  onClick={() => setUpcoming({ upcomingWindow: window })}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    settings.upcomingWindow === window ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  {window === 'today' ? 'Today' : window === 'week' ? 'Next 7 days' : window === 'month' ? 'Next 30 days' : 'All'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ResetButton() {
  const { reset } = useSettings();
  return (
    <section className="rounded-md border p-4">
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Reset to Defaults
      </button>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <main className="w-full max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <ThemeSelector />
      <ChartSelector />
      <UpcomingSelector />
      <ResetButton />
    </main>
  );
}