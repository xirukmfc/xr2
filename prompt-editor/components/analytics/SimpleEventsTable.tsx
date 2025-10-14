import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface Event {
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
}

interface SimpleEventsTableProps {
  events?: Event[];
}

export default function SimpleEventsTable({ events = [] }: SimpleEventsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (eventId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedRows(newExpanded);
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failure':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'abandoned':
        return <Clock className="h-3 w-3 text-gray-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const variants = {
      success: 'default',
      failure: 'destructive',
      partial: 'secondary',
      abandoned: 'outline'
    } as const;

    return (
      <Badge variant={variants[outcome as keyof typeof variants] || 'outline'}>
        {outcome}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="p-3">
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No recent events found</p>
            <p className="text-sm">Events will appear here as they are tracked</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium w-8"></th>
                  <th className="text-left p-2 font-medium">Event</th>
                  <th className="text-left p-2 font-medium w-24">Category</th>
                  <th className="text-left p-2 font-medium">Data</th>
                  <th className="text-left p-2 font-medium w-20">Amount</th>
                  <th className="text-left p-2 font-medium w-32">Created</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const isExpanded = expandedRows.has(event.id);
                  return (
                    <React.Fragment key={event.id}>
                      <tr className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(event.id)}
                            className="p-0.5 h-5 w-5"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            {getOutcomeIcon(event.outcome)}
                            <span className="font-medium text-xs">
                              {event.event_metadata?.event_name || event.event_type}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          {event.event_metadata?.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {event.event_metadata.category}
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          {event.event_metadata?.fields && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(event.event_metadata.fields)
                                .filter(([key]) => key !== 'amount')
                                .slice(0, 2)
                                .map(([key, value]) => (
                                <div key={key} className="bg-blue-50 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[120px]">
                                  <span className="font-medium text-blue-700">{key}:</span>
                                  <span className="text-blue-600 ml-1" title={String(value)}>
                                    {String(value).length > 12 ? String(value).substring(0, 12) + '...' : String(value)}
                                  </span>
                                </div>
                              ))}
                              {Object.keys(event.event_metadata.fields).filter((key) => key !== 'amount').length > 2 && (
                                <span className="text-[10px] text-gray-500">+{Object.keys(event.event_metadata.fields).filter((key) => key !== 'amount').length - 2}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          {event.event_metadata?.fields?.amount ? (
                            <span className="font-medium text-green-600 text-xs">
                              {Number(event.event_metadata.fields.amount).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-2 text-[10px] text-gray-600 whitespace-nowrap">
                          {new Date(event.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="p-3">
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <h4 className="font-semibold mb-1.5 text-xs">Event Details</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <div><span className="font-medium">ID:</span> <span className="text-gray-600">{event.id}</span></div>
                                    <div><span className="font-medium">Type:</span> <span className="text-gray-600">{event.event_type}</span></div>
                                    <div className="flex items-center gap-2"><span className="font-medium">Outcome:</span> {getOutcomeBadge(event.outcome)}</div>
                                    <div><span className="font-medium">User ID:</span> <span className="text-gray-600">{event.user_id || 'N/A'}</span></div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium whitespace-nowrap">Full Trace ID:</span>
                                      <code className="text-[10px] bg-gray-200 px-2 py-1 rounded break-all">{event.trace_id}</code>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-1.5 text-xs">Event Metadata</h4>
                                  {event.event_metadata ? (
                                    <div className="space-y-1.5 text-xs">
                                      {event.event_metadata.event_name && (
                                        <div><span className="font-medium">Event Name:</span> <span className="text-gray-600">{event.event_metadata.event_name}</span></div>
                                      )}
                                      {event.event_metadata.category && (
                                        <div><span className="font-medium">Category:</span> <span className="text-gray-600">{event.event_metadata.category}</span></div>
                                      )}
                                      {event.event_metadata.fields && (
                                        <div>
                                          <span className="font-medium">All Fields:</span>
                                          <div className="mt-1 space-y-1">
                                            {Object.entries(event.event_metadata.fields).map(([key, value]) => (
                                              <div key={key} className="bg-white px-2 py-1 rounded border text-[10px]">
                                                <span className="font-medium text-blue-700">{key}:</span>
                                                <span className="ml-2 text-gray-600">{String(value)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-gray-500 text-xs">No metadata available</div>
                                  )}
                                </div>
                              </div>
                              {event.business_metrics && (
                                <div>
                                  <h4 className="font-semibold mb-1.5 text-xs">Business Metrics</h4>
                                  <div className="text-xs">
                                    <pre className="bg-white p-2 rounded border text-[10px] overflow-x-auto">
                                      {JSON.stringify(event.business_metrics, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}