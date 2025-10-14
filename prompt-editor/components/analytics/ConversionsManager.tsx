"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ConversionFunnel {
  id: string;
  name: string;
  description?: string;
  source_type: 'prompt_requests' | 'event';
  source_event_name?: string;
  source_prompt_id?: string;
  source_prompt_name?: string;
  target_event_name: string;
  target_event_category?: string;
  metric_type: 'count' | 'sum';
  metric_field?: string;
  conversion_window_hours: number;
  is_active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
  collapsed?: boolean;
}

interface ConversionMetrics {
  funnel_id: string;
  funnel_name: string;
  source_count: number;
  target_count: number;
  conversion_rate: number;
  total_value?: number;
  average_value?: number;
  period_start: string;
  period_end: string;
}

interface Prompt {
  id: string;
  name: string;
}

interface EventDefinition {
  id: string;
  event_name: string;
  category?: string;
  description?: string;
}

export default function ConversionsManager({ showCreateButton = true }: { showCreateButton?: boolean }) {
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [metrics, setMetrics] = useState<ConversionMetrics[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFunnel, setEditingFunnel] = useState<ConversionFunnel | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    source_type: 'prompt_requests' as 'prompt_requests' | 'event',
    source_prompt_id: '',
    source_event_name: '',
    target_event_name: '',
    target_event_category: '',
    metric_type: 'count' as 'count' | 'sum',
    metric_field: '',
    conversion_window_hours: 24
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data using protected API endpoints
      const results = await Promise.allSettled([
        apiClient.request('/conversion-funnels').catch(err => {
          console.warn('Conversion funnels endpoint error:', err.message);
          return [];
        }),
        apiClient.getPrompts().catch(err => {
          console.warn('Prompts endpoint error:', err.message);
          return [];
        }),
        apiClient.request('/event-definitions').catch(err => {
          console.warn('Event definitions endpoint error:', err.message);
          return [];
        })
      ]);

      // Process results
      if (results[0].status === 'fulfilled') {
        const funnelsData = results[0].value || [];
        setFunnels(Array.isArray(funnelsData) ? funnelsData.map((f: ConversionFunnel) => ({ ...f, collapsed: true })) : []);
      } else {
        console.warn('Failed to load funnels:', results[0].reason);
        setFunnels([]);
      }

      if (results[1].status === 'fulfilled') {
        setPrompts(results[1].value || []);
      } else {
        console.warn('Failed to load prompts:', results[1].reason);
        setPrompts([]);
      }

      if (results[2].status === 'fulfilled') {
        setEventDefinitions(results[2].value || []);
      } else {
        console.warn('Failed to load event definitions:', results[2].reason);
        setEventDefinitions([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check that the backend API is running.');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversion = () => ({
    name: '',
    description: '',
    source_type: 'prompt_requests' as 'prompt_requests' | 'event',
    source_prompt_id: '',
    source_event_name: '',
    target_event_name: '',
    target_event_category: '',
    metric_type: 'count' as 'count' | 'sum',
    metric_field: '',
    conversion_window_hours: 24
  });

  const handleCreateFunnel = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('Conversion name is required');
        return;
      }

      // Prepare the data according to the API schema
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        source_type: formData.source_type,
        source_prompt_id: formData.source_type === 'prompt_requests' ? formData.source_prompt_id : undefined,
        source_event_name: formData.source_type === 'event' ? formData.source_event_name : undefined,
        target_event_name: formData.target_event_name,
        target_event_category: formData.target_event_category || undefined,
        metric_type: formData.metric_type,
        metric_field: formData.metric_type === 'sum' ? formData.metric_field : undefined,
        conversion_window_hours: formData.conversion_window_hours
      };

      if (editingFunnel && editingFunnel.id) {
        await apiClient.request(`/conversion-funnels/${editingFunnel.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiClient.request('/conversion-funnels', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      // Reset form and close it
      setFormData(createNewConversion());
      setEditingFunnel(null);

      // Reload data
      await loadData();

    } catch (error) {
      console.error('Error saving funnel:', error);
      setError('Failed to save conversion funnel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditFunnel = (funnel: ConversionFunnel) => {
    setFormData({
      name: funnel.name,
      description: funnel.description || '',
      source_type: funnel.source_type,
      source_prompt_id: funnel.source_prompt_id || '',
      source_event_name: funnel.source_event_name || '',
      target_event_name: funnel.target_event_name,
      target_event_category: funnel.target_event_category || '',
      metric_type: funnel.metric_type,
      metric_field: funnel.metric_field || '',
      conversion_window_hours: funnel.conversion_window_hours
    });
    setEditingFunnel(funnel);
  };

  const handleDeleteFunnel = async (funnelId: string) => {
    if (!confirm('Are you sure you want to delete this conversion?')) {
      return;
    }

    try {
      await apiClient.request(`/conversion-funnels/${funnelId}`, {
        method: 'DELETE'
      });
      await loadData();
    } catch (error) {
      console.error('Error deleting funnel:', error);
      setError('Failed to delete conversion funnel. Please try again.');
    }
  };

  const toggleCollapse = (funnelId: string) => {
    setFunnels(funnels.map(f =>
      f.id === funnelId ? { ...f, collapsed: !f.collapsed } : f
    ));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading conversions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {showCreateButton && (
          <Button
            onClick={() => {
              setEditingFunnel({} as ConversionFunnel);
              setFormData(createNewConversion());
            }}
            size="sm"
            disabled={prompts.length === 0 || eventDefinitions.length === 0}
            data-testid="new-conversion-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversion
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2 rounded text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}


      {/* Prerequisites Check */}
      {(prompts.length === 0 || eventDefinitions.length === 0) && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <h3 className="font-medium text-orange-900 mb-2">Setup Required</h3>
          {prompts.length === 0 && (
            <p className="text-sm text-orange-800 mb-1">
              ⚠️ No prompts found. <a href="/prompts" className="text-blue-600 hover:underline">Create prompts first</a>
            </p>
          )}
          {eventDefinitions.length === 0 && (
            <p className="text-sm text-orange-800">
              ⚠️ No event definitions found. <a href="/analytics/events" className="text-blue-600 hover:underline">Create events first</a>
            </p>
          )}
        </Card>
      )}

      {/* Edit/Create Form */}
      {editingFunnel !== null && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">
              {editingFunnel.id ? 'Edit Conversion' : 'Create New Conversion'}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="conversion_name" className="text-sm">Conversion Name</Label>
                <Input
                  id="conversion_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Prompt to Purchase"
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="conversion_window" className="text-sm">Conversion Window (hours)</Label>
                <Input
                  id="conversion_window"
                  type="number"
                  min="1"
                  max="8760"
                  value={formData.conversion_window_hours}
                  onChange={(e) => setFormData({ ...formData, conversion_window_hours: parseInt(e.target.value) })}
                  className="h-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this conversion measures"
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="source_type" className="text-sm">Source Type</Label>
                <Select
                  value={formData.source_type}
                  onValueChange={(value: 'prompt_requests' | 'event') => setFormData({ ...formData, source_type: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prompt_requests">Prompt Requests</SelectItem>
                    <SelectItem value="event">Custom Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="metric_type" className="text-sm">Metric Type</Label>
                <Select
                  value={formData.metric_type}
                  onValueChange={(value: 'count' | 'sum') => setFormData({ ...formData, metric_type: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count (number of conversions)</SelectItem>
                    <SelectItem value="sum">Sum (total value)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.source_type === 'prompt_requests' ? (
              <div>
                <Label htmlFor="source_prompt" className="text-sm">Source Prompt</Label>
                <Select
                  value={formData.source_prompt_id}
                  onValueChange={(value) => setFormData({ ...formData, source_prompt_id: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select a prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.map(prompt => (
                      <SelectItem key={prompt.id} value={prompt.id}>{prompt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="source_event" className="text-sm">Source Event Name</Label>
                <Select
                  value={formData.source_event_name}
                  onValueChange={(value) => setFormData({ ...formData, source_event_name: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventDefinitions.map(event => (
                      <SelectItem key={event.id} value={event.event_name}>{event.event_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="target_event" className="text-sm">Target Event Name</Label>
              <Select
                value={formData.target_event_name}
                onValueChange={(value) => setFormData({ ...formData, target_event_name: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select target event" />
                </SelectTrigger>
                <SelectContent>
                  {eventDefinitions.map(event => (
                    <SelectItem key={event.id} value={event.event_name}>{event.event_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.metric_type === 'sum' && (
              <div>
                <Label htmlFor="metric_field" className="text-sm">Metric Field</Label>
                <Input
                  id="metric_field"
                  value={formData.metric_field}
                  onChange={(e) => setFormData({ ...formData, metric_field: e.target.value })}
                  placeholder="e.g., revenue, amount"
                  className="h-8"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateFunnel}
                disabled={saving}
                size="sm"
              >
                {saving ? 'Saving...' : editingFunnel.id ? 'Update Conversion' : 'Save Conversion'}
              </Button>
              <Button
                onClick={() => {
                  setEditingFunnel(null);
                  setFormData(createNewConversion());
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Conversions List */}
      <div className="space-y-2">
        {funnels.filter(funnel => editingFunnel?.id !== funnel.id).map((funnel) => (
          <Card key={funnel.id} className="p-3">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 -m-1 p-1 rounded"
                onClick={() => toggleCollapse(funnel.id)}
              >
                <div className="h-6 w-6 flex items-center justify-center">
                  {funnel.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{funnel.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {funnel.source_type === 'prompt_requests'
                      ? `Prompt → ${funnel.source_prompt_name || 'Unknown Prompt'} → ${funnel.target_event_name} (${funnel.metric_type}${funnel.metric_field ? `: ${funnel.metric_field}` : ''})`
                      : `Event → ${funnel.source_event_name} → ${funnel.target_event_name} (${funnel.metric_type}${funnel.metric_field ? `: ${funnel.metric_field}` : ''})`
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditFunnel(funnel)}
                  className="h-6 px-2"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFunnel(funnel.id)}
                  className="h-6 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {!funnel.collapsed && (
              <div className="mt-3 pt-3 border-t text-sm space-y-2">
                {funnel.description && <p><strong>Description:</strong> {funnel.description}</p>}
                <p><strong>Source:</strong> {funnel.source_type === 'prompt_requests'
                  ? funnel.source_prompt_name || 'Unknown Prompt'
                  : funnel.source_event_name}</p>
                <p><strong>Target:</strong> {funnel.target_event_name}</p>
                <p><strong>Metric:</strong> {funnel.metric_type} {funnel.metric_field && `(${funnel.metric_field})`}</p>
                <p><strong>Window:</strong> {funnel.conversion_window_hours} hours</p>
              </div>
            )}
          </Card>
        ))}

        {funnels.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No conversions defined yet. Click "New Conversion" to create your first conversion.
          </div>
        )}
      </div>
    </div>
  );
}
