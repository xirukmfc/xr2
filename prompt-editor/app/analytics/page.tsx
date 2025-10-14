"use client"

import React, { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import useLocalStorage from "@/hooks/useLocalStorage"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ABTestManager from '@/components/analytics/ABTestManager';
import SimpleABTestManager from '@/components/analytics/SimpleABTestManager';
import EventDefinitionBuilder from '@/components/analytics/EventDefinitionBuilder';
import ConversionsManager from '@/components/analytics/ConversionsManager';
import NewEventModal from '@/components/analytics/NewEventModal';
import NewConversionModal from '@/components/analytics/NewConversionModal';
import SimpleEventsTable from '@/components/analytics/SimpleEventsTable';
import FunnelAnalysis from '@/components/analytics/FunnelAnalysis';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart3, TestTube, Settings, FileText, TrendingUp, Plus } from 'lucide-react';

const subsections = [
  { id: "dashboard", name: "Dashboard", icon: BarChart3 },
  { id: "recent-events", name: "Recent Events", icon: FileText },
  { id: "monthly-events", name: "Monthly Events", icon: TrendingUp },
  { id: "funnel", name: "Funnel Analysis", icon: BarChart3 },
  { id: "ab-tests", name: "A/B Tests", icon: TestTube },
  { id: "events", name: "Events define", icon: Settings },
  { id: "conversions", name: "Custom metrics", icon: TrendingUp },
]

export default function AnalyticsPage() {
  const [activeSubsection, setActiveSubsection] = useLocalStorage<string>("analytics-active-tab", "dashboard")

  // Modal states
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showABTestModal, setShowABTestModal] = useState(false)

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const [customFunnelSteps, setCustomFunnelSteps] = useState<string[]>([])

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await fetch('http://localhost:8000/internal/analytics/dashboard-test?period=7d');
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Calculate funnel data from analytics data using custom steps
  const funnelData = React.useMemo(() => {
    if (!analyticsData?.recent_events || customFunnelSteps.length === 0) return null;

    const events = analyticsData.recent_events;
    const result = [];

    // Count events for each step
    for (let i = 0; i < customFunnelSteps.length; i++) {
      const stepName = customFunnelSteps[i];
      const stepEvents = events.filter((e: any) => e.event_metadata?.event_name === stepName).length;

      // Calculate conversion rate (percentage from first step)
      const firstStepEvents = i === 0 ? stepEvents : events.filter((e: any) => e.event_metadata?.event_name === customFunnelSteps[0]).length;
      const conversionRate = firstStepEvents > 0 ? (stepEvents / firstStepEvents) * 100 : 0;

      result.push({
        step: stepName.charAt(0).toUpperCase() + stepName.slice(1),
        users: stepEvents,
        conversion_rate: i === 0 ? 100 : conversionRate
      });
    }

    return result;
  }, [analyticsData, customFunnelSteps]);


  const renderDashboardSection = () => (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Performance Dashboard</h2>
        <p className="text-xs text-slate-600">Monitor conversion performance and filter by conversions and date ranges</p>
      </div>
      <AnalyticsDashboard />
    </div>
  )

  const renderConversionsSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Conversions</h2>
          <p className="text-xs text-slate-600">Track conversion rates from prompts to business outcomes</p>
        </div>
        <Button onClick={() => setShowConversionModal(true)} className="bg-black hover:bg-gray-800 text-xs h-7 px-2" data-testid="create-conversion-button-main">
          <Plus className="w-3 h-3 mr-1" />
          New Conversion
        </Button>
      </div>
      <ConversionsManager showCreateButton={false} />
    </div>
  )

  const renderABTestsSection = () => (
    <div className="space-y-3">
      <SimpleABTestManager />
    </div>
  )

  const renderEventsSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Event Definitions</h2>
          <p className="text-xs text-slate-600">Define custom events to track business outcomes from prompts</p>
        </div>
        <Button onClick={() => setShowEventModal(true)} className="bg-black hover:bg-gray-800 text-xs h-7 px-2">
          <Plus className="w-3 h-3 mr-1" />
          New Event
        </Button>
      </div>
      <EventDefinitionBuilder
        onSave={(definition) => {
          console.log('Saving event definition:', definition);
        }}
        showCreateButton={false}
      />
    </div>
  )

  const renderRecentEventsSection = () => (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Recent Events</h2>
        <p className="text-xs text-slate-600">View recent events tracked across your workspace</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48">Loading events...</div>
      ) : (
        <SimpleEventsTable events={analyticsData?.recent_events || []} />
      )}
    </div>
  )

  const renderMonthlyEventsSection = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Monthly Events</h2>
            <p className="text-xs text-slate-600">Event trends and patterns over time</p>
          </div>
          <div className="flex items-center justify-center h-48">Loading events...</div>
        </div>
      );
    }

    const hasData = analyticsData?.monthly_events_chart?.series.length > 0;

    return (
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Monthly Events</h2>
          <p className="text-xs text-slate-600">Event trends and patterns over time</p>
        </div>

        {hasData ? (
          <div className="space-y-3">
            {/* Monthly Events Chart */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium mb-2">Monthly Event Trends</h3>
              <p className="text-xs text-slate-600 mb-3">Events grouped by event_name + category over the last 30 days</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.monthly_events_chart.dates.map((date: string, index: number) => {
                  const dataPoint: any = { date };
                  analyticsData.monthly_events_chart.series.forEach((series: any) => {
                    dataPoint[series.name] = series.data[index] || 0;
                  });
                  return dataPoint;
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  {analyticsData.monthly_events_chart.series.map((series: any, index: number) => {
                    const isHidden = hiddenSeries.has(series.name);
                    return (
                      <Line
                        key={series.name}
                        type="monotone"
                        dataKey={series.name}
                        stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                        activeDot={{ r: 6 }}
                        strokeOpacity={isHidden ? 0 : 1}
                        dot={false}
                        hide={isHidden}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>

              {/* Custom Interactive Legend */}
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {analyticsData.monthly_events_chart.series.map((series: any, index: number) => {
                  const isHidden = hiddenSeries.has(series.name);
                  const color = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;

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
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs transition-all hover:bg-gray-100 ${
                        isHidden ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full border-2"
                        style={{
                          backgroundColor: isHidden ? 'transparent' : color,
                          borderColor: color
                        }}
                      ></div>
                      <span className={isHidden ? 'line-through text-gray-500' : 'text-gray-700'}>
                        {series.event_name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        ({series.data.reduce((sum: number, count: number) => sum + count, 0)})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Series Summary */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium mb-2">Event Series Summary</h3>
              <p className="text-xs text-slate-600 mb-3">Overview of tracked event types</p>
              <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                {analyticsData.monthly_events_chart.series.map((series: any, index: number) => (
                  <div key={series.name} className="flex items-center space-x-2 p-2 border rounded-lg">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
                    ></div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate">{series.event_name}</p>
                      <p className="text-[10px] text-slate-600 truncate">{series.category}</p>
                      <p className="text-[10px]">
                        Total: {series.data.reduce((sum: number, count: number) => sum + count, 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-slate-500">
            <div className="text-center">
              <p className="text-sm font-medium mb-1">No event data available</p>
              <p className="text-xs">Start tracking events to see analytics here</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderFunnelSection = () => {
    return (
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Funnel Analysis</h2>
          <p className="text-xs text-slate-600">User journey from start to purchase</p>
        </div>
        <FunnelAnalysis
          data={funnelData}
          analyticsData={analyticsData}
          onFunnelChange={(steps) => setCustomFunnelSteps(steps)}
        />
      </div>
    );
  }


  const renderContent = () => {
    switch (activeSubsection) {
      case "dashboard":
        return renderDashboardSection()
      case "recent-events":
        return renderRecentEventsSection()
      case "monthly-events":
        return renderMonthlyEventsSection()
      case "funnel":
        return renderFunnelSection()
      case "ab-tests":
        return renderABTestsSection()
      case "events":
        return renderEventsSection()
      case "conversions":
        return renderConversionsSection()
      default:
        return renderDashboardSection()
    }
  }

  return (
    <ProtectedRoute>
      <>
        {/* EditorHeader */}
        <div className="px-4 pt-[12px] pb-[12px] h-[65px] bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold">Performance Analytics</h1>
            <p className="text-xs text-slate-600">
              Track business outcomes, measure ROI, and optimize your prompts
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex bg-gray-50 overflow-hidden">
          {/* Subsection navigation sidebar */}
          <div className="w-48 bg-white border-r border-slate-200 p-2 overflow-y-auto">
            <div className="space-y-0.5">
              {subsections.map((subsection) => {
                const Icon = subsection.icon
                return (
                  <button
                    key={subsection.id}
                    onClick={() => setActiveSubsection(subsection.id)}
                    className={`w-full flex items-center space-x-2 px-2 py-1.5 text-left rounded-md transition-colors ${
                      activeSubsection === subsection.id
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="text-xs font-medium">{subsection.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-full">{renderContent()}</div>
          </div>
        </div>

        {/* Event Definition Modal */}
        <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Event Definition</DialogTitle>
              <DialogDescription>
                Define a custom event to track business outcomes from your prompts
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">
              <NewEventModal
                onSave={(definition) => {
                  console.log('Saving event definition:', definition);
                  setShowEventModal(false)
                  // Refresh the events list
                  window.location.reload()
                }}
                onCancel={() => setShowEventModal(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Conversion Modal */}
        <Dialog open={showConversionModal} onOpenChange={setShowConversionModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh]" data-testid="conversion-modal">
            <DialogHeader>
              <DialogTitle>Create New Conversion</DialogTitle>
              <DialogDescription>
                Track conversion rates from prompts to business outcomes
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">
              <NewConversionModal
                onSave={(conversion) => {
                  console.log('Saving conversion:', conversion);
                  setShowConversionModal(false)
                  // Refresh the conversions list
                  window.location.reload()
                }}
                onCancel={() => setShowConversionModal(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* A/B Test Modal */}
        <Dialog open={showABTestModal} onOpenChange={setShowABTestModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New A/B Test</DialogTitle>
              <DialogDescription>
                Compare different prompt versions to optimize performance
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <SimpleABTestManager />
            </div>
          </DialogContent>
        </Dialog>
      </>
    </ProtectedRoute>
  );
}