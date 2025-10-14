import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ROIData {
  period_days: number;
  total_requests: number;
  success_rate: number;
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  roi_percentage: number;
  cost_per_request: number;
  revenue_per_success: number;
  conversion_rate: number;
  average_order_value: number;
}

interface ROIAnalysisProps {
  promptId?: string;
}

export default function ROIAnalysis({ promptId }: ROIAnalysisProps) {
  const [period, setPeriod] = useState('30');
  const [roiData, setRoiData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchROIData();
  }, [period, promptId]);

  const fetchROIData = async () => {
    setLoading(true);
    try {
      const endpoint = promptId
        ? `/api/internal/analytics/roi/${promptId}?period_days=${period}`
        : `/api/internal/analytics/roi/workspace?period_days=${period}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      setRoiData(data);
    } catch (error) {
      console.error('Failed to fetch ROI data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          Loading ROI analysis...
        </CardContent>
      </Card>
    );
  }

  if (!roiData || roiData.total_requests === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ROI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No data available for the selected period.
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ROI Analysis</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(roiData.roi_percentage)}
            </div>
            <div className="flex items-center mt-1">
              {roiData.roi_percentage >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <Badge variant={roiData.roi_percentage >= 100 ? "default" : "secondary"}>
                {roiData.roi_percentage >= 100 ? "Profitable" : "Needs Optimization"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(roiData.net_profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue: {formatCurrency(roiData.total_revenue)} - Cost: {formatCurrency(roiData.total_cost)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Request</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(roiData.cost_per_request)}
            </div>
            <p className="text-xs text-muted-foreground">
              {roiData.total_requests.toLocaleString()} total requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per Success</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(roiData.revenue_per_success)}
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate: {formatPercentage(roiData.success_rate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Revenue</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(roiData.total_revenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Costs</span>
                <span className="font-bold text-red-600">
                  -{formatCurrency(roiData.total_cost)}
                </span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="font-bold">Net Profit</span>
                <span className={`font-bold ${roiData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(roiData.net_profit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Conversion Rate</span>
                <span className="font-bold">
                  {formatPercentage(roiData.conversion_rate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Average Order Value</span>
                <span className="font-bold">
                  {formatCurrency(roiData.average_order_value)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate</span>
                <span className="font-bold">
                  {formatPercentage(roiData.success_rate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roiData.roi_percentage < 100 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <strong>⚠️ Low ROI:</strong> Current ROI is {formatPercentage(roiData.roi_percentage)}.
                Consider optimizing your prompts or reducing costs.
              </div>
            )}
            {roiData.conversion_rate < 5 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <strong>💡 Conversion Opportunity:</strong> Conversion rate is {formatPercentage(roiData.conversion_rate)}.
                A/B testing different prompt variations could improve performance.
              </div>
            )}
            {roiData.roi_percentage >= 200 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <strong>✅ Excellent Performance:</strong> ROI of {formatPercentage(roiData.roi_percentage)} indicates
                strong performance. Consider scaling this approach.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}