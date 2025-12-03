import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, AlertTriangle, Search, Filter, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface PromptEvent {
  id: string;
  trace_id: string;
  prompt_id: string;
  event_type: string;
  outcome: 'success' | 'failure' | 'partial' | 'abandoned';
  user_id?: string;
  event_metadata?: {
    event_name?: string;
    prompt_name?: string;
    prompt_slug?: string;
    version_number?: number;
    source_name?: string;
    [key: string]: any;
  };
  metadata?: any;
  business_metrics?: any;
  created_at: string;
}

export default function RecentEventsTable() {
  const [events, setEvents] = useState<PromptEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(20);

  // Debounce search term to avoid excessive re-renders
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch events only once on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, eventTypeFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // For now, fetch all events (backend pagination not implemented yet)
      // We'll filter on client side
      const response = await apiClient.request<PromptEvent[]>('/analytics/events');

      // Handle both array and paginated response
      const allEvents = Array.isArray(response) ? response : (response as any).events || [];

      setEvents(allEvents);
      setTotalEvents(allEvents.length);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
      setTotalEvents(0);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'failure':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
      case 'abandoned':
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
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

  const formatEventType = (eventType: string) => {
    const typeMap: Record<string, string> = {
      'custom_event': 'track_event',
      'prompt_request': 'get_prompt'
    };
    return typeMap[eventType] || eventType;
  };

  // Client-side filtering (until backend pagination is ready)
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.trace_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      event.prompt_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesEventType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;

    return matchesSearch && matchesEventType;
  });

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const displayedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          Loading events...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      {/* Filters Block */}
      <Card>
        <CardContent className="px-4 py-3">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by trace ID or prompt ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="prompt_request">get_prompt</SelectItem>
                <SelectItem value="custom_event">track_event</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchEvents} className="h-9 px-3 text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spacing between filters and table */}
      <div className="h-4"></div>

      {/* Table Block */}
      <Card>
        <CardContent className="px-4 py-3">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="h-10 px-4 py-2 text-xs font-medium">Time</TableHead>
                <TableHead className="h-10 px-4 py-2 text-xs font-medium">Trace ID</TableHead>
                <TableHead className="h-10 px-4 py-2 text-xs font-medium">Prompt</TableHead>
                <TableHead className="h-10 px-4 py-2 text-xs font-medium">Version</TableHead>
                <TableHead className="h-10 px-4 py-2 text-xs font-medium">Type</TableHead>
                <TableHead className="h-10 px-4 py-2 text-xs font-medium">Source</TableHead>
                <TableHead className="h-10 px-4 py-2 text-xs font-medium">Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedEvents.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/50">
                  <TableCell className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded font-mono break-all">
                      {event.trace_id}
                    </code>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {event.event_metadata?.prompt_name ? (
                      <span className="text-xs">{event.event_metadata.prompt_name}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-xs">
                    {event.event_metadata?.version_number
                      ? `v${event.event_metadata.version_number}`
                      : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-xs">{formatEventType(event.event_type)}</TableCell>
                  <TableCell className="px-4 py-2 text-xs">
                    {event.event_metadata?.source_name ? (
                      <span>{event.event_metadata.source_name}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-xs">
                    {event.event_type === 'custom_event' && event.event_metadata?.event_name ? (
                      <span>{event.event_metadata.event_name}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEvents.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-8">
            No events found matching your filters.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-3 mb-3">
            <div className="text-xs text-muted-foreground">
              {startIndex + 1}-{Math.min(startIndex + eventsPerPage, filteredEvents.length)} of {filteredEvents.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-xs"
              >
                Prev
              </Button>
              <span className="px-2 py-1 text-xs text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}