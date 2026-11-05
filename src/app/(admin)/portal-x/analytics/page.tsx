'use client';

import * as React from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { PortalXHeader } from '@/components/admin/PortalXHeader';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Flame,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AnalyticsApiResponse {
  year: number;
  month: number;
  totalAssigned: number;
  maxDaily: number;
  dailyCounts: Record<string, number>;
}

export default function PortalXCalendarHeatmapAnalyticsPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [data, setData] = React.useState<AnalyticsApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = React.useState<{ dateStr: string; count: number } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  const fetchMonthAnalytics = React.useCallback(async (targetYear: number, targetMonth: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/qr/dynamic/analytics?year=${targetYear}&month=${targetMonth}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to fetch calendar analytics.');
      }
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMonthAnalytics(year, month);
  }, [fetchMonthAnalytics, year, month]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 (Sun) to 6 (Sat)

  const dailyCounts = data?.dailyCounts || {};
  const maxDaily = data?.maxDaily || 1;
  const totalAssigned = data?.totalAssigned || 0;

  // Active days count
  const activeDays = Object.values(dailyCounts).filter((c) => c > 0).length;
  const avgPerActiveDay = activeDays > 0 ? (totalAssigned / activeDays).toFixed(1) : '0.0';

  // Find peak day date
  let peakDateStr = '—';
  if (data && data.maxDaily > 0) {
    for (const [dateStr, count] of Object.entries(dailyCounts)) {
      if (count === data.maxDaily) {
        peakDateStr = format(new Date(dateStr), 'MMM d');
        break;
      }
    }
  }

  // Calculate luminous intensity level (0 to 4)
  const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0;
    if (maxDaily <= 1) return 4;
    const ratio = count / maxDaily;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.8) return 3;
    return 4;
  };

  const getDayCellClasses = (count: number, isCurrentDay: boolean): string => {
    const level = getIntensityLevel(count);
    const borderAccent = isCurrentDay ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-[#0A0A0C]' : '';

    switch (level) {
      case 0:
        return `bg-[#0f172a]/60 border border-slate-800/80 text-slate-500 hover:border-slate-700 ${borderAccent}`;
      case 1:
        return `bg-indigo-950/40 border border-indigo-900/50 text-indigo-300 hover:bg-indigo-950/60 ${borderAccent}`;
      case 2:
        return `bg-indigo-900/60 border border-indigo-700/60 text-indigo-200 hover:bg-indigo-800/70 shadow-[0_0_8px_rgba(99,102,241,0.2)] ${borderAccent}`;
      case 3:
        return `bg-indigo-600/90 border border-indigo-500 text-white font-bold hover:bg-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.4)] ${borderAccent}`;
      case 4:
        return `bg-gradient-to-br from-indigo-400 to-indigo-600 border border-indigo-300 text-white font-extrabold hover:brightness-110 shadow-[0_0_22px_rgba(129,140,248,0.7)] ${borderAccent}`;
      default:
        return `bg-[#0f172a]/60 border border-slate-800 text-slate-500 ${borderAccent}`;
    }
  };

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Top days table
  const sortedDays = Object.entries(dailyCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <PortalXHeader
        title="Calendar Heatmap Analytics"
        subtitle="Luminous temporal visualization of physical QR activations and field velocity"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0 border-neutral-800 text-neutral-300 hover:text-white"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 py-1 bg-[#121216] border border-neutral-800 rounded-lg text-xs font-semibold text-white min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0 border-neutral-800 text-neutral-300 hover:text-white"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCurrentMonth}
              className="text-xs text-neutral-400 hover:text-white h-8"
            >
              This Month
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metric Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Month Activations</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalAssigned}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Physical QRs assigned in {format(currentDate, 'MMMM')}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Peak Velocity</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{data?.maxDaily || 0}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Max on {peakDateStr}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Days</span>
            <CalendarIcon className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {activeDays} <span className="text-xs text-neutral-500 font-normal">/ {daysInMonth.length}</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Days with recorded activations</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Velocity / Active Day</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{avgPerActiveDay}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Average activations when active</p>
        </div>
      </div>

      {/* Main Heatmap Container */}
      <div className="bg-[#121216] border border-neutral-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{format(currentDate, 'MMMM yyyy')} Deployment Intensity</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Each cell displays daily QR assignment volume. Hover over any date for precise counts.
            </p>
          </div>

          {/* Hover Status Readout */}
          <div className="h-9 px-3 py-1.5 rounded-lg bg-[#18181D] border border-neutral-800 text-xs flex items-center gap-2 min-w-[200px]">
            {hoveredDate ? (
              <>
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-white font-semibold">
                  {format(new Date(hoveredDate.dateStr), 'EEE, MMM d')}:
                </span>
                <span className="text-amber-400 font-bold">{hoveredDate.count} activations</span>
              </>
            ) : (
              <span className="text-neutral-500 italic">Hover any day to inspect details</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-neutral-500 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Computing temporal activity map...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {weekDayLabels.map((day) => (
                <div key={day} className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Padding empty cells for days before the 1st */}
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square rounded-xl bg-transparent border border-dashed border-neutral-800/40 opacity-20"
                />
              ))}

              {/* Days of the Month */}
              {daysInMonth.map((dayDate) => {
                const dateKey = format(dayDate, 'yyyy-MM-dd');
                const count = dailyCounts[dateKey] || 0;
                const isCurrent = isToday(dayDate);
                const dayNumber = format(dayDate, 'd');

                return (
                  <div
                    key={dateKey}
                    onMouseEnter={() => setHoveredDate({ dateStr: dateKey, count })}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`aspect-square rounded-xl p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer ${getDayCellClasses(
                      count,
                      isCurrent
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-medium">{dayNumber}</span>
                      {isCurrent && (
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" title="Today" />
                      )}
                    </div>
                    {count > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold tracking-tight">{count}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Intensity Legend */}
            <div className="flex items-center justify-between pt-5 border-t border-neutral-800/60 text-xs text-neutral-400">
              <span className="text-[11px]">Monthly assignment cycle</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] mr-1">Less</span>
                <div className="h-3 w-3 rounded bg-[#0f172a] border border-slate-800" title="0" />
                <div className="h-3 w-3 rounded bg-indigo-950 border border-indigo-900" title="1-25%" />
                <div className="h-3 w-3 rounded bg-indigo-800 border border-indigo-700" title="26-50%" />
                <div className="h-3 w-3 rounded bg-indigo-600 border border-indigo-500" title="51-75%" />
                <div className="h-3 w-3 rounded bg-indigo-400 border border-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.7)]" title="76-100%" />
                <span className="text-[11px] ml-1">More</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Velocity Days Table */}
      {sortedDays.length > 0 && sortedDays[0][1] > 0 && (
        <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-[#121216]">
          <div className="px-5 py-3.5 bg-[#18181D] border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Peak Performing Days This Month
            </h3>
            <span className="text-[11px] text-neutral-500">Ranked by volume</span>
          </div>

          <div className="divide-y divide-neutral-800/60">
            {sortedDays.map(([dateStr, count], idx) => (
              <div
                key={dateStr}
                className="px-5 py-3 flex items-center justify-between text-xs hover:bg-neutral-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-neutral-500 font-semibold w-5">#{idx + 1}</span>
                  <span className="font-semibold text-white">
                    {format(new Date(dateStr), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 font-bold text-sm">{count}</span>
                  <span className="text-neutral-500 text-[11px]">activations</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
