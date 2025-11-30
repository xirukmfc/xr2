import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api';

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
      loadEvents();
    }
  }, [selectedPromptId, selectedVersionId, period]);

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
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch events for the selected prompt
      const params = new URLSearchParams({
        prompt_id: selectedPromptId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (selectedVersionId !== 'all') {
        params.append('version_id', selectedVersionId);
      }

      const eventsData = await apiClient.request<PromptEvent[]>(`/analytics/events?${params.toString()}`);
      setEvents(eventsData);

      // Process data for chart
      processChartData(eventsData, startDate, endDate);
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

    // Use only dates that have events (sorted)
    const dates = Object.keys(eventsByDate).sort();

    // If no events, return empty data
    if (dates.length === 0) {
      setChartData({ dates: [], series: [] });
      return;
    }

    // Create series data
    const series = Array.from(eventTypes).map((eventType, index) => ({
      name: eventType,
      event_name: formatEventType(eventType),
      category: 'event',
      data: dates.map(date => eventsByDate[date]?.[eventType] || 0),
      color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
    }));

    setChartData({ dates, series });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Create pivot table: rows = event types, columns = versions
  const getPivotData = () => {
    const pivot: { [eventType: string]: { [versionId: string]: number } } = {};
    const versionIds = new Set<string>();

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

    // Get version numbers for sorting
    let versionList = Array.from(versionIds).map(vId => {
      const version = versions.find(v => v.id === vId);
      return {
        id: vId,
        number: version?.version_number || 0,
        status: version?.status || 'unknown'
      };
    }).sort((a, b) => a.number - b.number);

    // If "All Versions" is selected, limit to last 3 versions
    if (selectedVersionId === 'all' && versionList.length > 3) {
      versionList = versionList.slice(-3);
    }

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

    return { rows, versions: versionList };
  };

  const pivotData = getPivotData();

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Prompt Selector */}
            <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select prompt" />
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
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Versions</SelectItem>
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
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {selectedPromptId && chartData && chartData.series.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Events Timeline - {selectedPrompt?.name}
              {selectedVersionId !== 'all' && selectedVersion && ` (v${selectedVersion.version_number})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            <div className="w-full" style={{ maxWidth: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.dates.map((date, index) => {
                const dataPoint: any = { date };
                chartData.series.forEach((series: any) => {
                  dataPoint[series.name] = series.data[index] || 0;
                });
                return dataPoint;
              })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
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
                      className="w-3 h-3 rounded-full border-2"
                      style={{
                        backgroundColor: isHidden ? 'transparent' : series.color,
                        borderColor: series.color
                      }}
                    ></div>
                    <span className={isHidden ? 'line-through text-gray-500' : 'text-gray-700'}>
                      {series.event_name}
                    </span>
                    <span className="text-gray-500">({total})</span>
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
            <p>No events found for the selected period</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Events Summary Table - Pivot Format */}
      {selectedPromptId && events.length > 0 && pivotData.rows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Events Summary ({events.length} total events)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="rounded-md border overflow-x-auto max-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium sticky left-0 bg-white z-10 py-2 px-3">Event Type</TableHead>
                    {pivotData.versions.map(version => (
                      <TableHead key={version.id} className="text-xs text-center min-w-[100px] py-2 px-2">
                        v{version.number}
                        {version.status !== 'unknown' && (
                          <span className="text-[10px] text-muted-foreground ml-1">({version.status})</span>
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="text-xs text-right font-medium py-2 px-3">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pivotData.rows.map((row) => {
                    const total = Object.values(row.versionCounts).reduce((sum: number, count) => sum + (count as number), 0);
                    return (
                      <TableRow key={row.eventType}>
                        <TableCell className="text-xs font-medium sticky left-0 bg-white z-10 py-2 px-3">
                          {row.eventType}
                        </TableCell>
                        {pivotData.versions.map(version => {
                          const count = row.versionCounts[version.id] || 0;
                          return (
                            <TableCell key={version.id} className="text-xs text-center py-2 px-2">
                              {count > 0 ? count : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-xs text-right font-bold py-2 px-3">
                          {total}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Totals row */}
                  <TableRow className="border-t-2 font-medium bg-muted/30">
                    <TableCell className="text-xs font-bold sticky left-0 bg-muted/30 z-10 py-2 px-3">
                      Total
                    </TableCell>
                    {pivotData.versions.map(version => {
                      const total = pivotData.rows.reduce((sum, row) => sum + (row.versionCounts[version.id] || 0), 0);
                      return (
                        <TableCell key={version.id} className="text-xs text-center font-bold py-2 px-2">
                          {total}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-xs text-right font-bold py-2 px-3">
                      {events.length}
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
            <p>Loading events...</p>
          </CardContent>
        </Card>
      )}

      {!selectedPromptId && (
        <Card>
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Please select a prompt to view events</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
