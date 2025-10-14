import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

interface ConversionData {
  name: string;
  description: string;
  source_type: 'prompt_requests' | 'event';
  source_prompt_id: string;
  source_event_name: string;
  target_event_name: string;
  target_event_category: string;
  metric_type: 'count' | 'sum';
  metric_field: string;
  conversion_window_hours: number;
}

interface NewConversionModalProps {
  onSave: (conversion: ConversionData) => void;
  onCancel: () => void;
}

export default function NewConversionModal({ onSave, onCancel }: NewConversionModalProps) {
  const [formData, setFormData] = useState<ConversionData>({
    name: '',
    description: '',
    source_type: 'prompt_requests',
    source_prompt_id: '',
    source_event_name: '',
    target_event_name: '',
    target_event_category: '',
    metric_type: 'count',
    metric_field: '',
    conversion_window_hours: 24
  });

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        apiClient.getPrompts(),
        apiClient.request('/event-definitions')
      ]);

      if (results[0].status === 'fulfilled') {
        setPrompts((results[0].value as Prompt[]) || []);
      } else {
        console.error('Failed to load prompts:', results[0].reason);
        setPrompts([]);
      }

      if (results[1].status === 'fulfilled') {
        setEventDefinitions((results[1].value as EventDefinition[]) || []);
      } else {
        console.error('Failed to load event definitions:', results[1].reason);
        setEventDefinitions([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Conversion name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
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

      await apiClient.request('/conversion-funnels', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      onSave(formData);
    } catch (error) {
      console.error('Error saving conversion:', error);
      setError('Failed to save conversion. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const canSave = prompts.length > 0 && eventDefinitions.length > 0;

  return (
    <div className="space-y-4 p-1">
      {/* Error Message */}
      {error && (
        <div className="p-2 rounded text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Prerequisites Check */}
      {!canSave && (
        <div className="p-4 border-orange-200 bg-orange-50 rounded">
          <h3 className="font-medium text-orange-900 mb-2">Setup Required</h3>
          {prompts.length === 0 && (
            <p className="text-sm text-orange-800 mb-1">
              ⚠️ No prompts found. Create prompts first
            </p>
          )}
          {eventDefinitions.length === 0 && (
            <p className="text-sm text-orange-800">
              ⚠️ No event definitions found. Create events first
            </p>
          )}
        </div>
      )}

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
            <SelectTrigger className="h-8" data-testid="source-type-select">
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
            <SelectTrigger className="h-8" data-testid="metric-type-select">
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
            <SelectTrigger className="h-8" data-testid="source-prompt-select">
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
            <SelectTrigger className="h-8" data-testid="source-event-select">
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
          <SelectTrigger className="h-8" data-testid="target-event-select">
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
          onClick={handleSave}
          disabled={saving || !canSave}
          size="sm"
          className="bg-black hover:bg-gray-800"
          data-testid="create-conversion-button"
        >
          {saving ? 'Creating...' : 'Create Conversion'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          data-testid="cancel-conversion-button"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}