import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface EventField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

interface EventDefinition {
  event_name: string;
  category: string;
  description: string;
  required_fields: EventField[];
  optional_fields: EventField[];
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
    category: '',
    description: '',
    required_fields: [],
    optional_fields: [],
    validation_rules: [],
    success_criteria: {},
    alert_thresholds: {}
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const addField = (required: boolean) => {
    const field: EventField = {
      name: '',
      type: 'string',
      required,
      description: ''
    };

    if (required) {
      setFormData({
        ...formData,
        required_fields: [...formData.required_fields, field]
      });
    } else {
      setFormData({
        ...formData,
        optional_fields: [...formData.optional_fields, field]
      });
    }
  };

  const removeField = (fieldIndex: number, required: boolean) => {
    if (required) {
      setFormData({
        ...formData,
        required_fields: formData.required_fields.filter((_, i) => i !== fieldIndex)
      });
    } else {
      setFormData({
        ...formData,
        optional_fields: formData.optional_fields.filter((_, i) => i !== fieldIndex)
      });
    }
  };

  const updateField = (fieldIndex: number, required: boolean, field: Partial<EventField>) => {
    if (required) {
      const updatedFields = [...formData.required_fields];
      updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...field };
      setFormData({ ...formData, required_fields: updatedFields });
    } else {
      const updatedFields = [...formData.optional_fields];
      updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...field };
      setFormData({ ...formData, optional_fields: updatedFields });
    }
  };

  const handleSave = async () => {
    if (!formData.event_name.trim()) {
      setError('Event name is required');
      return;
    }
    if (!formData.category.trim()) {
      setError('Category is required');
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
        <div>
          <Label htmlFor="category" className="text-sm">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(EVENT_TEMPLATES).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Required Fields */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Required Fields</Label>
          <Button
            onClick={() => addField(true)}
            size="sm"
            variant="outline"
            className="h-7 px-2"
            type="button"
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {formData.required_fields.map((field, idx) => (
          <div key={`req-${idx}`} className="flex gap-2 items-center">
            <Input
              placeholder="Name"
              value={field.name}
              onChange={(e) => updateField(idx, true, { name: e.target.value })}
              className="h-8 text-sm flex-1"
            />
            <Select
              value={field.type}
              onValueChange={(value) => updateField(idx, true, { type: value as any })}
            >
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="object">Object</SelectItem>
                <SelectItem value="array">Array</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Description"
              value={field.description || ''}
              onChange={(e) => updateField(idx, true, { description: e.target.value })}
              className="h-8 text-sm flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeField(idx, true)}
              className="h-8 w-8 p-0"
              type="button"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Optional Fields */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Optional Fields</Label>
          <Button
            onClick={() => addField(false)}
            size="sm"
            variant="outline"
            className="h-7 px-2"
            type="button"
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {formData.optional_fields.map((field, idx) => (
          <div key={`opt-${idx}`} className="flex gap-2 items-center">
            <Input
              placeholder="Name"
              value={field.name}
              onChange={(e) => updateField(idx, false, { name: e.target.value })}
              className="h-8 text-sm flex-1"
            />
            <Select
              value={field.type}
              onValueChange={(value) => updateField(idx, false, { type: value as any })}
            >
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="object">Object</SelectItem>
                <SelectItem value="array">Array</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Description"
              value={field.description || ''}
              onChange={(e) => updateField(idx, false, { description: e.target.value })}
              className="h-8 text-sm flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeField(idx, false)}
              className="h-8 w-8 p-0"
              type="button"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
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