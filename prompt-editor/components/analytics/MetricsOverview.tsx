import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { TrendingUp, TrendingDown, Users, Zap, DollarSign, Clock, Activity } from 'lucide-react';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage' | 'time';
}

interface MetricsData {
  current: {
    total_events: number;
    success_rate: number;
    total_revenue: number;
    unique_users: number;
    avg_response_time_ms: number;
  };
  previous?: {
    total_events: number;
    success_rate: number;
    total_revenue: number;
    unique_users: number;
    avg_response_time_ms: number;
  };
}

export default function MetricsOverview() {
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Calculate date ranges
      const endDate = new Date();
      const startDate = new Date();
      
      let previousStartDate = new Date();
      let previousEndDate = new Date();
      
      switch (period) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          previousStartDate.setDate(startDate.getDate() - 1);
          previousEndDate = new Date(startDate);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          previousStartDate.setDate(startDate.getDate() - 7);
          previousEndDate = new Date(startDate);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          previousStartDate.setDate(startDate.getDate() - 30);
          previousEndDate = new Date(startDate);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
          previousStartDate.setDate(startDate.getDate() - 7);
          previousEndDate = new Date(startDate);
      }

      // Fetch current period
      const currentData = await apiClient.request(
        `/analytics/dashboard?period=${period}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
      );

      // Fetch previous period for comparison
      const previousData = await apiClient.request(
        `/analytics/dashboard?period=${period}&start_date=${previousStartDate.toISOString()}&end_date=${previousEndDate.toISOString()}`
      );

      setMetrics({
        current: currentData.summary || {
          total_events: 0,
          success_rate: 0,
          total_revenue: 0,
          unique_users: 0,
          avg_response_time_ms: 0,
        },
        previous: previousData.summary || {
          total_events: 0,
          success_rate: 0,
          total_revenue: 0,
          unique_users: 0,
          avg_response_time_ms: 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setMetrics({
        current: {
          total_events: 0,
          success_rate: 0,
          total_revenue: 0,
          unique_users: 0,
          avg_response_time_ms: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatValue = (value: number, format: 'number' | 'currency' | 'percentage' | 'time' = 'number'): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${value.toFixed(0)}ms`;
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  };

  const getMetricCards = (): MetricCard[] => {
    if (!metrics) return [];

    const { current, previous } = metrics;
    const prev = previous || current;

    return [
      {
        title: 'Total Events',
        value: current.total_events || 0,
        change: calculateChange(current.total_events, prev.total_events),
        changeLabel: 'vs previous period',
        icon: <Activity className="w-4 h-4" />,
        format: 'number',
      },
      {
        title: 'Success Rate',
        value: current.success_rate || 0,
        change: calculateChange(current.success_rate, prev.success_rate),
        changeLabel: 'vs previous period',
        icon: <Zap className="w-4 h-4" />,
        format: 'percentage',
      },
      {
        title: 'Total Revenue',
        value: current.total_revenue || 0,
        change: calculateChange(current.total_revenue, prev.total_revenue),
        changeLabel: 'vs previous period',
        icon: <DollarSign className="w-4 h-4" />,
        format: 'currency',
      },
      {
        title: 'Unique Users',
        value: current.unique_users || 0,
        change: calculateChange(current.unique_users, prev.unique_users),
        changeLabel: 'vs previous period',
        icon: <Users className="w-4 h-4" />,
        format: 'number',
      },
      {
        title: 'Avg Response Time',
        value: current.avg_response_time_ms || 0,
        change: calculateChange(current.avg_response_time_ms, prev.avg_response_time_ms),
        changeLabel: 'vs previous period',
        icon: <Clock className="w-4 h-4" />,
        format: 'time',
      },
    ];
  };

  const metricCards = getMetricCards();

  if (loading) {
    return (
      <Card>
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">Loading metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      {/* Period Selector */}
      <Card>
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground">Overview</h3>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Spacing */}
      <div className="h-4"></div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {metricCards.map((metric, index) => {
          const isPositive = (metric.change || 0) >= 0;
          const changeAbs = Math.abs(metric.change || 0);

          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="px-4 py-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {metric.icon}
                    <span className="text-xs font-medium">{metric.title}</span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-semibold">
                    {formatValue(metric.value as number, metric.format)}
                  </div>
                </div>
                {metric.change !== undefined && (
                  <div className="flex items-center gap-1">
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {changeAbs.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {metric.changeLabel}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}











