import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api';
import { useLocale } from '@/contexts/locale-context';

interface Prompt {
  id: string;
  name: string;
  slug: string;
}

interface PromptVersion {
  id: string;
  version_number: number;
  status: string;
  created_at: string;
}

interface PromptEvent {
  id: string;
  trace_id: string;
  prompt_id: string;
  prompt_version_id: string;
  event_type: string;
  outcome: string;
  user_id: string | null;
  event_metadata: {
    event_name?: string;
    category?: string;
    prompt_name?: string;
    version_number?: number;
    [key: string]: any;
  } | null;
  created_at: string;
}

interface ChartData {
  dates: string[];
  series: Array<{
    name: string;
    event_name: string;
    category: string;
    data: number[];
  }>;
}

export default function PromptEventsViewer() {
  const { t } = useLocale();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('all');
  const [period, setPeriod] = useState<string>('today');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [events, setEvents] = useState<PromptEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    if (selectedPromptId) {
      loadVersions(selectedPromptId);
    } else {
      setVersions([]);
      setSelectedVersionId('all');
    }
  }, [selectedPromptId]);

  useEffect(() => {
    if (selectedPromptId) {
      // For "All Versions", wait until versions are loaded
      if (selectedVersionId === 'all' && versions.length === 0) {
        return;
      }
      loadEvents();
    }
  }, [selectedPromptId, selectedVersionId, period, versions]);

  const loadPrompts = async () => {
    try {
      const data = await apiClient.request<Prompt[]>('/prompts/');
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const loadVersions = async (promptId: string) => {
    try {
      const data = await apiClient.request<PromptVersion[]>(`/prompts/${promptId}/versions`);
      setVersions(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Calculate date range based on period
      // Always use UTC to avoid timezone issues
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case 'today':
          // Start of today in UTC
          startDate = new Date(Date.UTC(
            endDate.getUTCFullYear(),
            endDate.getUTCMonth(),
            endDate.getUTCDate(),
            0, 0, 0, 0
          ));
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          // Start of current year in UTC
          startDate = new Date(Date.UTC(endDate.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
          break;
      }

      console.log('Loading events with date range:', {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // If "All Versions" is selected, fetch events for last 3 versions only
      if (selectedVersionId === 'all') {
        // Sort versions by version number descending and take last 3
        const lastThreeVersions = [...versions]
          .sort((a, b) => b.version_number - a.version_number)
          .slice(0, 3);

        if (lastThreeVersions.length === 0) {
          setEvents([]);
          setChartData(null);
          setLoading(false);
          return;
        }

        // OPTIMIZATION: Single request with multiple version IDs instead of multiple requests
        const params = new URLSearchParams({
          prompt_id: selectedPromptId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });

        // Add multiple version_id parameters
        lastThreeVersions.forEach(version => {
          params.append('version_ids', version.id);
        });

        const eventsData = await apiClient.request<PromptEvent[]>(`/analytics/events?${params.toString()}`);

        console.log('Events loaded (All Versions):', {
          totalEvents: eventsData.length,
          versions: lastThreeVersions.map(v => `v${v.version_number}`),
          dateRange: eventsData.length > 0 ? {
            earliest: new Date(Math.min(...eventsData.map(e => new Date(e.created_at).getTime()))).toISOString(),
            latest: new Date(Math.max(...eventsData.map(e => new Date(e.created_at).getTime()))).toISOString()
          } : null
        });

        setEvents(eventsData);
        processChartData(eventsData, startDate, endDate);
      } else {
        // Fetch events for the selected version
        const params = new URLSearchParams({
          prompt_id: selectedPromptId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          version_id: selectedVersionId,
        });

        const eventsData = await apiClient.request<PromptEvent[]>(`/analytics/events?${params.toString()}`);

        console.log('Events loaded (Single Version):', {
          totalEvents: eventsData.length,
          version: selectedVersionId,
          dateRange: eventsData.length > 0 ? {
            earliest: new Date(Math.min(...eventsData.map(e => new Date(e.created_at).getTime()))).toISOString(),
            latest: new Date(Math.max(...eventsData.map(e => new Date(e.created_at).getTime()))).toISOString()
          } : null
        });

        setEvents(eventsData);
        processChartData(eventsData, startDate, endDate);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatEventType = (eventType: string) => {
    const typeMap: Record<string, string> = {
      'custom_event': 'track_event',
      'prompt_request': 'get_prompt'
    };
    return typeMap[eventType] || eventType;
  };

  const processChartData = (eventsData: PromptEvent[], startDate: Date, endDate: Date) => {
    console.log('Processing chart data:', {
      totalEvents: eventsData.length,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      sampleEvents: eventsData.slice(0, 3).map(e => ({
        created_at: e.created_at,
        event_type: e.event_type,
        event_name: e.event_metadata?.event_name
      }))
    });

    // Group events by date and event type
    const eventsByDate: { [key: string]: { [key: string]: number } } = {};
    const eventTypes = new Set<string>();

    eventsData.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      const eventType = event.event_type === 'custom_event'
        ? (event.event_metadata?.event_name || 'custom_event')
        : event.event_type;

      eventTypes.add(eventType);

      if (!eventsByDate[date]) {
        eventsByDate[date] = {};
      }
      eventsByDate[date][eventType] = (eventsByDate[date][eventType] || 0) + 1;
    });

    console.log('Events grouped by date:', eventsByDate);

    // Generate all dates in range, not just dates with events
    const allDates: string[] = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      allDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filter to only include dates that have events OR limit to reasonable range
    const datesWithEvents = Object.keys(eventsByDate).sort();

    let dates: string[];
    if (datesWithEvents.length === 0) {
      setChartData({ dates: [], series: [] });
      return;
    } else if (datesWithEvents.length === 1) {
      // If all events are on one date, show a range around it for better visualization
      const singleDate = new Date(datesWithEvents[0]);
      dates = [];
      for (let i = -3; i <= 3; i++) {
        const d = new Date(singleDate);
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
    } else {
      // Use dates with events
      dates = datesWithEvents;
    }

    // Create series data
    const series = Array.from(eventTypes).map((eventType, index) => ({
      name: eventType,
      event_name: formatEventType(eventType),
      category: 'event',
      data: dates.map(date => eventsByDate[date]?.[eventType] || 0),
      color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
    }));

    console.log('Chart data prepared:', {
      dates,
      seriesCount: series.length,
      series: series.map(s => ({
        name: s.name,
        totalCount: s.data.reduce((sum, v) => sum + v, 0),
        data: s.data
      }))
    });

    setChartData({ dates, series });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Create pivot table: rows = event types, columns = versions
  const getPivotData = () => {
    const pivot: { [eventType: string]: { [versionId: string]: number } } = {};
    const versionIds = new Set<string>();

    // Build pivot table from events
    events.forEach(event => {
      const eventType = event.event_type === 'custom_event'
        ? (event.event_metadata?.event_name || 'custom_event')
        : event.event_type;

      const versionId = event.prompt_version_id || 'unknown';

      versionIds.add(versionId);

      if (!pivot[eventType]) {
        pivot[eventType] = {};
      }

      pivot[eventType][versionId] = (pivot[eventType][versionId] || 0) + 1;
    });

    // Get version numbers for sorting (ascending order)
    const versionList = Array.from(versionIds).map(vId => {
      const version = versions.find(v => v.id === vId);
      return {
        id: vId,
        number: version?.version_number || 0,
        status: version?.status || 'unknown'
      };
    }).sort((a, b) => a.number - b.number);

    // Convert to array format for rendering, with prompt_request (get_prompt) always first
    const rows = Object.entries(pivot)
      .sort(([eventTypeA], [eventTypeB]) => {
        if (eventTypeA === 'prompt_request') return -1;
        if (eventTypeB === 'prompt_request') return 1;
        return eventTypeA.localeCompare(eventTypeB);
      })
      .map(([eventType, versionCounts]) => ({
        eventType: formatEventType(eventType),
        versionCounts
      }));

    // Calculate total filtered events
    const totalFilteredEvents = Object.values(pivot).reduce((sum, versionCounts) =>
      sum + Object.values(versionCounts).reduce((s: number, c) => s + (c as number), 0), 0
    );

    return { rows, versions: versionList, totalFilteredEvents };
  };

  const pivotData = getPivotData();

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Prompt Selector */}
            <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('analytics.promptEvents.selectPromptPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {prompts.map(prompt => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Version Selector */}
            <Select
              value={selectedVersionId}
              onValueChange={setSelectedVersionId}
              disabled={!selectedPromptId}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('analytics.promptEvents.selectVersionPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('analytics.promptEvents.allVersions')}</SelectItem>
                {versions.map(version => (
                  <SelectItem key={version.id} value={version.id}>
                    v{version.version_number} ({version.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period Selector */}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('analytics.promptEvents.periodToday')}</SelectItem>
                <SelectItem value="week">{t('analytics.promptEvents.periodWeek')}</SelectItem>
                <SelectItem value="month">{t('analytics.promptEvents.periodMonth')}</SelectItem>
                <SelectItem value="year">{t('analytics.promptEvents.periodYear')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {selectedPromptId && chartData && chartData.series.length > 0 ? (
        <Card>
          <CardContent className="px-4 py-3 w-full overflow-hidden">
            <div className="w-full" style={{ maxWidth: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.dates.map((date, index) => {
                const dataPoint: any = {
                  date,
                  displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                };
                chartData.series.forEach((series: any) => {
                  dataPoint[series.name] = series.data[index] || 0;
                });
                return dataPoint;
              })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="text-xs font-medium mb-2">{label}</p>
                          {payload.map((entry: any, index: number) => {
                            const series = chartData.series.find((s: any) => s.name === entry.dataKey);
                            const displayName = series?.event_name || entry.dataKey;
                            return (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <div
                                  className="w-3.5 h-3.5 rounded-full border-2"
                                  style={{ 
                                    backgroundColor: entry.color,
                                    borderColor: entry.color
                                  }}
                                />
                                <span className="font-medium">{displayName}:</span>
                                <span>{entry.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {chartData.series.map((series: any, index: number) => {
                  const isHidden = hiddenSeries.has(series.name);
                  return (
                    <Line
                      key={series.name}
                      type="monotone"
                      dataKey={series.name}
                      stroke={series.color}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      dot={false}
                      hide={isHidden}
                      strokeOpacity={isHidden ? 0 : 1}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {chartData.series.map((series: any) => {
                const isHidden = hiddenSeries.has(series.name);
                const total = series.data.reduce((sum: number, count: number) => sum + count, 0);

                return (
                  <button
                    key={series.name}
                    onClick={() => {
                      const newHidden = new Set(hiddenSeries);
                      if (isHidden) {
                        newHidden.delete(series.name);
                      } else {
                        newHidden.add(series.name);
                      }
                      setHiddenSeries(newHidden);
                    }}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-all hover:bg-gray-100 ${
                      isHidden ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2"
                      style={{
                        backgroundColor: isHidden ? 'transparent' : series.color,
                        borderColor: series.color
                      }}
                    ></div>
                    <span className={isHidden ? 'line-through text-muted-foreground' : 'text-foreground'}>
                      {series.event_name}
                    </span>
                    <span className="text-muted-foreground">({total})</span>
                  </button>
                );
              })}
            </div>
            </div>
          </CardContent>
        </Card>
      ) : selectedPromptId && !loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
            <p>{t('analytics.promptEvents.chartEmpty')}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Events Summary Table - Pivot Format */}
      {selectedPromptId && events.length > 0 && pivotData.rows.length > 0 && (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="rounded-md border overflow-x-auto max-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-10 px-4 py-2 text-xs font-medium sticky left-0 bg-white z-10">{t('analytics.promptEvents.table.eventType')}</TableHead>
                    {pivotData.versions.map(version => (
                      <TableHead key={version.id} className="h-10 px-4 py-2 text-xs text-center min-w-[100px]">
                        v{version.number}
                        {version.status !== 'unknown' && (
                          <span className="text-xs text-muted-foreground ml-1">({version.status})</span>
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="h-10 px-4 py-2 text-xs text-right font-medium">{t('analytics.promptEvents.table.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pivotData.rows.map((row) => {
                    const total = Object.values(row.versionCounts).reduce((sum: number, count) => sum + (count as number), 0);
                    return (
                      <TableRow key={row.eventType}>
                        <TableCell className="px-4 py-2 text-xs font-medium sticky left-0 bg-white z-10">
                          {row.eventType}
                        </TableCell>
                        {pivotData.versions.map(version => {
                          const count = row.versionCounts[version.id] || 0;
                          return (
                            <TableCell key={version.id} className="px-4 py-2 text-xs text-center">
                              {count > 0 ? count : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          );
                        })}
                        <TableCell className="px-4 py-2 text-xs text-right font-bold">
                          {total}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Totals row */}
                  <TableRow className="border-t-2 font-medium bg-muted/30">
                    <TableCell className="px-4 py-2 text-xs font-bold sticky left-0 bg-muted/30 z-10">
                      {t('analytics.promptEvents.table.total')}
                    </TableCell>
                    {pivotData.versions.map(version => {
                      const total = pivotData.rows.reduce((sum, row) => sum + (row.versionCounts[version.id] || 0), 0);
                      return (
                        <TableCell key={version.id} className="px-4 py-2 text-xs text-center font-bold">
                          {total}
                        </TableCell>
                      );
                    })}
                    <TableCell className="px-4 py-2 text-xs text-right font-bold">
                      {pivotData.totalFilteredEvents}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p>{t('analytics.promptEvents.loading')}</p>
          </CardContent>
        </Card>
      )}

      {!selectedPromptId && (
        <Card>
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
            <p>{t('analytics.promptEvents.selectPromptHint')}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata Insights */}
      {selectedPromptId && events.length > 0 && (
        <MetadataInsights events={events} />
      )}
    </div>
  );
}

// Metadata Insights Component
function MetadataInsights({ events }: { events: PromptEvent[] }) {
  const { t } = useLocale();
  // Extract all metadata fields
  const metadataFields = new Set<string>();
  events.forEach(event => {
    if (event.event_metadata) {
      Object.keys(event.event_metadata).forEach(key => {
        // Skip standard fields
        if (!['event_name', 'prompt_name', 'prompt_slug', 'version_number', 'source_name'].includes(key)) {
          metadataFields.add(key);
        }
      });
    }
  });

  if (metadataFields.size === 0) {
    return null;
  }

  // Analyze each field
  const fieldAnalysis: { [key: string]: any } = {};

  metadataFields.forEach(fieldName => {
    const values: any[] = [];

    events.forEach(event => {
      const value = event.event_metadata?.[fieldName];
      if (value !== undefined && value !== null && value !== '') {
        values.push(value);
      }
    });

    if (values.length === 0) return;

    // Check if field is numeric
    const isNumeric = values.every(v => !isNaN(Number(v)));

    if (isNumeric) {
      const numbers = values.map(v => Number(v));
      fieldAnalysis[fieldName] = {
        type: 'numeric',
        count: numbers.length,
        avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        total: numbers.reduce((a, b) => a + b, 0)
      };
    } else {
      // Categorical field - count occurrences
      const counts: { [value: string]: number } = {};
      values.forEach(v => {
        const strValue = String(v);
        counts[strValue] = (counts[strValue] || 0) + 1;
      });

      fieldAnalysis[fieldName] = {
        type: 'categorical',
        count: values.length,
        values: Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10) // Top 10 values
      };
    }
  });

  const numericFields = Object.entries(fieldAnalysis).filter(([_, analysis]) => analysis.type === 'numeric');
  const categoricalFields = Object.entries(fieldAnalysis).filter(([_, analysis]) => analysis.type !== 'numeric');

  return (
    <Card>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm font-medium">{t('analytics.promptEvents.metadata.title')}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        <div className="space-y-4">
          {/* Numeric Fields - Compact List */}
          {numericFields.length > 0 && (
            <div className="space-y-2">
              {numericFields.map(([fieldName, analysis]) => (
                <div key={fieldName} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium capitalize truncate">
                        {fieldName.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {analysis.count} {t('analytics.promptEvents.metadata.events')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{t('analytics.promptEvents.metadata.avg')}</div>
                      <div className="text-xs font-semibold">{analysis.avg.toFixed(1)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{t('analytics.promptEvents.metadata.range')}</div>
                      <div className="text-xs font-semibold">
                        {analysis.min.toFixed(1)}–{analysis.max.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Categorical Fields - Compact List */}
          {categoricalFields.length > 0 && (
            <div className="space-y-2">
              {categoricalFields.map(([fieldName, analysis]) => (
                <div key={fieldName} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-50 text-purple-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium capitalize truncate">
                        {fieldName.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1.5">
                        {analysis.count} events
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.values.slice(0, 3).map(([value, count]: [string, number]) => (
                          <span
                            key={value}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs"
                          >
                            <span className="font-medium truncate max-w-[120px]">{value}</span>
                            <span className="text-muted-foreground">({count})</span>
                          </span>
                        ))}
                        {analysis.values.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                            +{analysis.values.length - 3} {t('analytics.promptEvents.metadata.more', { count: analysis.values.length - 3 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {numericFields.length === 0 && categoricalFields.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-xs">
              {t('analytics.promptEvents.metadata.empty')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
