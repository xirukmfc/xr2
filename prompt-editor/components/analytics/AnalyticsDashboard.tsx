import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';

interface AnalyticsData {
  summary: {
    total_events: number;
    success_rate: number;
    total_revenue: number;
    unique_users: number;
    avg_response_time_ms: number;
    roi_percentage: number;
  };
  top_prompts: Array<{
    prompt_id: string;
    prompt_name: string;
    usage_count: number;
    success_rate: number;
    revenue_generated: number;
    roi: number;
  }>;
  trends: Array<{
    date: string;
    success_rate: number;
    event_count: number;
    revenue: number;
  }>;
  recent_events: Array<{
    id: string;
    trace_id: string;
    event_type: string;
    outcome: string;
    user_id: string | null;
    business_metrics: { revenue?: number; [key: string]: any } | null;
    event_metadata: {
      event_name?: string;
      category?: string;
      fields?: { [key: string]: any };
      [key: string]: any;
    } | null;
    created_at: string;
  }>;
  monthly_events_chart: {
    dates: string[];
    series: Array<{
      name: string;
      event_name: string;
      category: string;
      data: number[];
    }>;
  };
  funnel_data?: Array<{
    step: string;
    users: number;
    conversion_rate: number;
  }>;
}

// Helper function to format dates consistently
const formatDate = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

// Helper function to format datetime for display
const formatDateTime = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

export default function AnalyticsDashboard({ promptId }: { promptId?: string }) {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Conversion filters
  const [showActivePrompts, setShowActivePrompts] = useState(true);
  const [selectedConversions, setSelectedConversions] = useState<string[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [conversionMetrics, setConversionMetrics] = useState<any[]>([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Custom date range
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showCustomDates, setShowCustomDates] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchConversions();
  }, [period, promptId, showActivePrompts, selectedConversions, customDateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Build query parameters
      let queryParams = `period=${period}`;
      if (period === 'custom' && customDateRange.start && customDateRange.end) {
        // Convert date strings to ISO datetime format
        const startDate = new Date(customDateRange.start + 'T00:00:00.000Z').toISOString();
        const endDate = new Date(customDateRange.end + 'T23:59:59.999Z').toISOString();
        queryParams += `&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
      }

      const endpoint = promptId
        ? `http://localhost:8000/internal/analytics/performance/${promptId}?${queryParams}`
        : `http://localhost:8000/internal/analytics/dashboard-test?${queryParams}`;

      // Use different headers for test vs production endpoints
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      // Only add authorization for non-test endpoints
      if (!endpoint.includes('dashboard-test')) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('auth_token')}`;
      }

      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Authentication required for analytics API');
          // Set empty data instead of error to gracefully handle auth issues
          setData({
            summary: { total_events: 0, success_rate: 0, total_revenue: 0, unique_users: 0, avg_response_time_ms: 0, roi_percentage: 0 },
            top_prompts: [],
            trends: [],
            recent_events: [],
            monthly_events_chart: { dates: [], series: [] }
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        const analyticsData = JSON.parse(text);
        console.log('Analytics data received:', analyticsData);
        setData(analyticsData);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set fallback data for graceful degradation
      setData({
        summary: { total_events: 0, success_rate: 0, total_revenue: 0, unique_users: 0, avg_response_time_ms: 0, roi_percentage: 0 },
        top_prompts: [],
        trends: [],
        recent_events: [],
        monthly_events_chart: { dates: [], series: [] }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConversions = async () => {
    try {
      // Fetch conversion funnels using protected endpoint
      const conversionsData = await apiClient.request('/conversion-funnels');
      console.log('Conversions loaded:', conversionsData);
      setConversions(conversionsData);

      // Auto-select all conversions initially if none selected and user hasn't interacted yet
      if (selectedConversions.length === 0 && conversionsData.length > 0 && !hasUserInteracted) {
        const allIds = conversionsData.map((c: any) => c.id);
        setSelectedConversions(allIds);
        // Don't fetch metrics here, let the useEffect handle it
        return;
      }

      // Skip metrics if no conversions are selected
      if (selectedConversions.length === 0) {
        console.log('No conversions selected, skipping metrics fetch');
        setConversionMetrics([]);
        return;
      }

      // Build query parameters for conversion metrics
      let queryParams = '';
      if (period === 'custom' && customDateRange.start && customDateRange.end) {
        // Convert date strings to ISO datetime format for API
        const startDate = new Date(customDateRange.start + 'T00:00:00.000Z').toISOString();
        const endDate = new Date(customDateRange.end + 'T23:59:59.999Z').toISOString();
        queryParams = `start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
      } else {
        // For predefined periods, calculate start/end dates
        const period_map: { [key: string]: number } = {
          '24h': 1,
          '7d': 7,
          '30d': 30
        };
        const days = period_map[period] || 7;
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
        queryParams = `start_date=${encodeURIComponent(startDate.toISOString())}&end_date=${encodeURIComponent(endDate.toISOString())}`;
      }

      console.log('Selected conversions for API:', selectedConversions);
      console.log('Show active prompts:', showActivePrompts);
      console.log('Custom date range:', customDateRange);
      console.log('Query params for metrics:', queryParams);

      // Fetch metrics for each selected conversion
      const allMetrics: any[] = [];

      for (const funnelId of selectedConversions) {
        try {
          console.log('Fetching funnel metrics for:', funnelId);
          const metrics = await apiClient.request(`/conversion-funnels/${funnelId}/metrics?${queryParams}`);
          console.log(`Metrics for funnel ${funnelId}:`, metrics);
          allMetrics.push(metrics);
        } catch (error) {
          console.error(`Error fetching metrics for funnel ${funnelId}:`, error);
        }
      }

      console.log('All conversion metrics collected:', allMetrics);
      setConversionMetrics(allMetrics);
    } catch (error) {
      console.error('Failed to fetch conversions:', error);
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  if (!data) {
    return <Alert><AlertDescription>Failed to load analytics data</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-3">
      {/* Performance Content */}
      <div className="space-y-3">
          {/* Conversion Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Performance Filters</CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-1">Filter conversions and date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Date Range Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select
                    value={period}
                    onValueChange={(value) => {
                      setPeriod(value);
                      setShowCustomDates(value === 'custom');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Date Range Inputs */}
                  {showCustomDates && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="date"
                        placeholder="Start date"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        className="px-2 py-1 border rounded text-xs flex-1"
                      />
                      <input
                        type="date"
                        placeholder="End date"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                        className="px-2 py-1 border rounded text-xs flex-1"
                      />
                    </div>
                  )}
                </div>

                {/* Active Prompts Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Prompts Filter</label>
                  <Select
                    value={showActivePrompts ? "active" : "all"}
                    onValueChange={(value) => setShowActivePrompts(value === "active")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Prompts Only</SelectItem>
                      <SelectItem value="all">All Prompts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conversion Types Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Conversions</label>
                  <Select
                    value={selectedConversions.length === conversions.length ? "all" : "selected"}
                    onValueChange={(value) => {
                      setHasUserInteracted(true);
                      if (value === "all") {
                        setSelectedConversions(conversions.map(c => c.id));
                      } else {
                        setSelectedConversions([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Conversions ({conversions.length})</SelectItem>
                      <SelectItem value="selected">Selected ({selectedConversions.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Individual Conversion Checkboxes */}
              {conversions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Specific Conversions:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {conversions.map((conversion) => (
                      <label key={conversion.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedConversions.includes(conversion.id)}
                          onChange={(e) => {
                            setHasUserInteracted(true);
                            if (e.target.checked) {
                              setSelectedConversions([...selectedConversions, conversion.id]);
                            } else {
                              setSelectedConversions(selectedConversions.filter(id => id !== conversion.id));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span>{conversion.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Metrics Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Conversion Performance</CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-1">
                {conversionMetrics.length > 0
                  ? `Showing ${conversionMetrics.length} conversions for selected filters`
                  : `No conversion data found for selected filters`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversionMetrics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Conversion</th>
                        <th className="text-left p-2">Source Events</th>
                        <th className="text-left p-2">Target Events</th>
                        <th className="text-left p-2">Conversion Rate</th>
                        <th className="text-left p-2">Total Value</th>
                        <th className="text-left p-2">Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversionMetrics.map((metric, index) => (
                        <tr key={metric.funnel_id || index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{metric.funnel_name || metric.name || 'Unknown'}</td>
                          <td className="p-2">{metric.source_count?.toLocaleString() || metric.sources?.toLocaleString() || 0}</td>
                          <td className="p-2">{metric.target_count?.toLocaleString() || metric.targets?.toLocaleString() || 0}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              (metric.conversion_rate || metric.rate || 0) > 10 ? 'bg-green-100 text-green-800' :
                              (metric.conversion_rate || metric.rate || 0) > 5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(metric.conversion_rate || metric.rate || 0)?.toFixed(2)}%
                            </span>
                          </td>
                          <td className="p-2">
                            {(metric.total_value || metric.value) ? `${(metric.total_value || metric.value).toLocaleString()}` : '-'}
                          </td>
                          <td className="p-2 text-xs text-gray-500">
                            {(metric.period_start && metric.period_end)
                              ? `${formatDate(metric.period_start)} - ${formatDate(metric.period_end)}`
                              : 'Current period'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-4">
                    <p className="text-lg font-medium">No conversion data available</p>
                    <div className="text-sm mt-2 space-y-1">
                      <p>Selected period: <strong>{period === 'custom' && customDateRange.start && customDateRange.end
                        ? `${formatDate(customDateRange.start)} - ${formatDate(customDateRange.end)}`
                        : period}
                      </strong></p>
                      <p>Active prompts only: <strong>{showActivePrompts ? 'Yes' : 'No'}</strong></p>
                      <p>Selected conversions: <strong>{selectedConversions.length} / {conversions.length}</strong></p>
                      <p>Status: <strong>
                        {conversions.length === 0
                          ? 'No conversions configured'
                          : selectedConversions.length === 0
                            ? 'No conversions selected'
                            : 'API request failed (Status 422) - check parameters'
                        }
                      </strong></p>
                    </div>
                  </div>
                  {conversions.length === 0 ? (
                    <p className="text-sm">
                      No conversion funnels configured.
                      <a href="/analytics?subsection=conversions" className="text-blue-600 hover:underline ml-1">
                        Set up conversions first
                      </a>
                    </p>
                  ) : selectedConversions.length === 0 ? (
                    <p className="text-sm">
                      Please select at least one conversion above to see data.
                    </p>
                  ) : (
                    <div className="text-sm">
                      <p className="mb-2">Backend API (localhost:8000) may be down.</p>
                      <p>Check browser console for detailed error messages.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
    </div>
  );
}