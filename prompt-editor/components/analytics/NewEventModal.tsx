import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface MetadataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description?: string;
}

interface EventDefinition {
  event_name: string;
  description: string;
  metadata_schema: MetadataField[];
  validation_rules: any[];
  success_criteria: any;
  alert_thresholds: any;
}

const EVENT_TEMPLATES = {
  'User Onboarding': [
    'onboarding_started',
    'onboarding_step_completed',
    'onboarding_finished',
    'onboarding_abandoned'
  ],
  'E-commerce': [
    'product_viewed',
    'added_to_cart',
    'checkout_started',
    'purchase_completed',
    'cart_abandoned'
  ],
  'Content Engagement': [
    'content_viewed',
    'content_shared',
    'content_liked',
    'comment_posted'
  ],
  'Support': [
    'ticket_created',
    'issue_resolved',
    'feedback_submitted',
    'satisfaction_rated'
  ]
};

interface NewEventModalProps {
  onSave: (definition: EventDefinition) => void;
  onCancel: () => void;
}

export default function NewEventModal({ onSave, onCancel }: NewEventModalProps) {
  const [formData, setFormData] = useState<EventDefinition>({
    event_name: '',
    description: '',
    metadata_schema: [],
    validation_rules: [],
    success_criteria: {},
    alert_thresholds: {}
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const addField = () => {
    const field: MetadataField = {
      name: '',
      type: 'string',
      required: false,
      description: ''
    };

    setFormData({
      ...formData,
      metadata_schema: [...formData.metadata_schema, field]
    });
  };

  const removeField = (fieldIndex: number) => {
    setFormData({
      ...formData,
      metadata_schema: formData.metadata_schema.filter((_, i) => i !== fieldIndex)
    });
  };

  const updateField = (fieldIndex: number, field: Partial<MetadataField>) => {
    const updatedFields = [...formData.metadata_schema];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...field };
    setFormData({ ...formData, metadata_schema: updatedFields });
  };

  const handleSave = async () => {
    if (!formData.event_name.trim()) {
      setError('Event name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiClient.request('/event-definitions', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      onSave(formData);
    } catch (error: any) {
      setError(error?.message || 'Failed to save event');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-1">
      {/* Error Message */}
      {error && (
        <div className="p-2 rounded text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="event_name" className="text-sm">Event Name</Label>
          <Input
            id="event_name"
            value={formData.event_name}
            onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
            placeholder="e.g., user_signup"
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
          placeholder="Describe when this event should be triggered"
          className="h-8"
        />
      </div>

      {/* Standard Fields Info */}
      <div className="p-3 bg-gray-50 rounded-md space-y-1">
        <Label className="text-sm font-medium">Standard Fields (automatically available)</Label>
        <p className="text-xs text-gray-600">These fields are available in all events:</p>
        <ul className="text-xs text-gray-600 ml-4 list-disc space-y-0.5">
          <li><code className="bg-white px-1 rounded">event_name</code> - string (required)</li>
          <li><code className="bg-white px-1 rounded">trace_id</code> - string (required)</li>
          <li><code className="bg-white px-1 rounded">user_id</code> - string (optional)</li>
          <li><code className="bg-white px-1 rounded">session_id</code> - string (optional)</li>
          <li><code className="bg-white px-1 rounded">value</code> - number (optional, for revenue/metrics)</li>
          <li><code className="bg-white px-1 rounded">currency</code> - string (optional)</li>
        </ul>
      </div>

      {/* Custom Metadata Fields */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <Label className="text-sm font-medium">Custom Metadata Fields</Label>
            <p className="text-xs text-gray-500">Define custom fields that will be passed in the metadata object</p>
          </div>
          <Button
            onClick={addField}
            size="sm"
            variant="outline"
            className="h-7 px-2"
            type="button"
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {formData.metadata_schema.map((field, idx) => (
          <div key={`meta-${idx}`} className="flex gap-2 items-start p-2 bg-gray-50 rounded">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Field name"
                  value={field.name}
                  onChange={(e) => updateField(idx, { name: e.target.value })}
                  className="h-8 text-sm flex-1"
                />
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(idx, { type: value as any })}
                >
                  <SelectTrigger className="w-24 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(idx, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
              </div>
              <Input
                placeholder="Description (optional)"
                value={field.description || ''}
                onChange={(e) => updateField(idx, { description: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeField(idx)}
              className="h-8 w-8 p-0 mt-0"
              type="button"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {formData.metadata_schema.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No custom fields defined. Click "Add" to create one.</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="bg-black hover:bg-gray-800"
        >
          {saving ? 'Creating...' : 'Create Event'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}