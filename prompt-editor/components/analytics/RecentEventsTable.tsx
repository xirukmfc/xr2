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
import { CheckCircle, XCircle, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { apiClient } from '@/lib/api';

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
    [key: string]: any;
  };
  metadata?: any;
  business_metrics?: any;
  created_at: string;
}

export default function RecentEventsTable() {
  const [events, setEvents] = useState<PromptEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(20);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await apiClient.request<PromptEvent[]>('/analytics/events');
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.trace_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.prompt_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOutcome = outcomeFilter === 'all' || event.outcome === outcomeFilter;

    return matchesSearch && matchesOutcome;
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
    <Card className="border-0 shadow-none">
      <CardHeader className="px-4 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">Recent Events</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchEvents} className="h-7 text-xs">
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by trace ID or prompt ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="success" className="text-xs">Success</SelectItem>
              <SelectItem value="failure" className="text-xs">Failure</SelectItem>
              <SelectItem value="partial" className="text-xs">Partial</SelectItem>
              <SelectItem value="abandoned" className="text-xs">Abandoned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="h-8 px-2 text-xs font-medium">Time</TableHead>
                <TableHead className="h-8 px-2 text-xs font-medium">Trace ID</TableHead>
                <TableHead className="h-8 px-2 text-xs font-medium">Version</TableHead>
                <TableHead className="h-8 px-2 text-xs font-medium">Prompt</TableHead>
                <TableHead className="h-8 px-2 text-xs font-medium">Event</TableHead>
                <TableHead className="h-8 px-2 text-xs font-medium">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedEvents.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/50">
                  <TableCell className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                    {new Date(event.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </TableCell>
                  <TableCell className="px-2 py-1.5">
                    <code className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded font-mono break-all">
                      {event.trace_id}
                    </code>
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-xs">
                    {event.event_metadata?.version_number
                      ? `v${event.event_metadata.version_number}`
                      : '—'}
                  </TableCell>
                  <TableCell className="px-2 py-1.5">
                    {event.event_metadata?.prompt_name ? (
                      <span className="text-xs">{event.event_metadata.prompt_name}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-xs">{event.event_type}</TableCell>
                  <TableCell className="px-2 py-1.5">
                    {event.event_metadata?.event_name && (
                      <span className="text-xs">{event.event_metadata.event_name}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No events found matching your filters.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-3 mb-3">
            <div className="text-[11px] text-muted-foreground">
              {startIndex + 1}-{Math.min(startIndex + eventsPerPage, filteredEvents.length)} of {filteredEvents.length}
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 text-xs"
              >
                Prev
              </Button>
              <span className="px-2 py-1 text-[11px] text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}