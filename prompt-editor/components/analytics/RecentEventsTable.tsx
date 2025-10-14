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

interface PromptEvent {
  id: string;
  trace_id: string;
  prompt_id: string;
  event_type: string;
  outcome: 'success' | 'failure' | 'partial' | 'abandoned';
  user_id?: string;
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
  const [eventsPerPage] = useState(10);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/internal/analytics/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'abandoned':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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
      event.prompt_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user_id?.toLowerCase().includes(searchTerm.toLowerCase());

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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Events</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchEvents}>
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by trace ID, prompt ID, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Trace ID</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-mono text-sm">
                  {new Date(event.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <span className="bg-muted px-2 py-1 rounded text-xs">
                    {event.trace_id.slice(-8)}
                  </span>
                </TableCell>
                <TableCell>{event.event_type}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getOutcomeIcon(event.outcome)}
                    {getOutcomeBadge(event.outcome)}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {event.user_id ? (
                    <span className="bg-muted px-2 py-1 rounded text-xs">
                      {event.user_id.slice(-6)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {event.business_metrics?.revenue ? (
                    <span className="font-medium text-green-600">
                      ${event.business_metrics.revenue.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {event.event_metadata?.event_name && (
                    <Badge variant="outline" className="text-xs">
                      {event.event_metadata.event_name}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredEvents.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No events found matching your filters.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + eventsPerPage, filteredEvents.length)} of {filteredEvents.length} events
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
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