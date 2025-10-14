import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit, Code, Copy, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

interface EventField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  validation?: any;
}

interface EventDefinition {
  id?: string;
  event_name: string;
  category: string;
  description: string;
  required_fields: EventField[];
  optional_fields: EventField[];
  validation_rules: any[];
  success_criteria: any;
  alert_thresholds: any;
  is_active?: boolean;
  collapsed?: boolean;
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

export default function EventDefinitionBuilder({
  onSave,
  onDelete,
  events = [],
  initialData,
  modalMode = false,
  showCreateButton = true
}: {
  onSave?: (definition: EventDefinition) => void;
  onDelete?: (id: string) => void;
  events?: EventDefinition[];
  initialData?: EventDefinition;
  modalMode?: boolean;
  showCreateButton?: boolean;
}) {
  const [eventsList, setEventsList] = useState<EventDefinition[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventDefinition | null>(null);
  const [showCodeFor, setShowCodeFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Load events from API on mount
  useEffect(() => {
    loadEvents();

    // If in modal mode, automatically start creating a new event
    if (modalMode && !editingEvent) {
      setEditingEvent(createNewEvent());
    }
  }, [modalMode]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null); // Reset error state
    try {
      const data = await apiClient.request('/event-definitions');
      console.log('Loaded events from server:', data);

      if (Array.isArray(data)) {
        console.log('Event categories:', data.map((e: any) => ({ id: e.id, name: e.event_name, category: e.category })));

        // Preserve collapsed state
        const currentCollapsedState = eventsList.reduce((acc, event) => {
          acc[event.id!] = event.collapsed ?? true;
          return acc;
        }, {} as Record<string, boolean>);

        const newEventsList = data.map((event: any) => ({
          ...event,
          collapsed: currentCollapsedState[event.id] !== undefined ? currentCollapsedState[event.id] : true
        }));
        console.log('Setting new events list:', newEventsList);
        setEventsList(newEventsList);
        setRefreshKey(prev => prev + 1); // Force re-render
      } else {
        console.error('Invalid events data format:', data);
        setSaveMessage('Invalid events data format');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setSaveMessage('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const createNewEvent = (): EventDefinition => ({
    event_name: '',
    category: '',
    description: '',
    required_fields: [],
    optional_fields: [],
    validation_rules: [],
    success_criteria: {},
    alert_thresholds: {},
    is_active: true,
    collapsed: false
  });

  const addField = (event: EventDefinition, required: boolean) => {
    const field: EventField = {
      name: '',
      type: 'string',
      required,
      description: ''
    };

    const updated = { ...event };
    if (required) {
      updated.required_fields = [...updated.required_fields, field];
    } else {
      updated.optional_fields = [...updated.optional_fields, field];
    }
    setEditingEvent(updated);
  };

  const removeField = (event: EventDefinition, fieldIndex: number, required: boolean) => {
    const updated = { ...event };
    if (required) {
      updated.required_fields = updated.required_fields.filter((_, i) => i !== fieldIndex);
    } else {
      updated.optional_fields = updated.optional_fields.filter((_, i) => i !== fieldIndex);
    }
    setEditingEvent(updated);
  };

  const updateField = (event: EventDefinition, fieldIndex: number, required: boolean, field: Partial<EventField>) => {
    const updated = { ...event };
    if (required) {
      updated.required_fields[fieldIndex] = { ...updated.required_fields[fieldIndex], ...field };
    } else {
      updated.optional_fields[fieldIndex] = { ...updated.optional_fields[fieldIndex], ...field };
    }
    setEditingEvent(updated);
  };

  const saveEvent = async () => {
    if (!editingEvent) return;

    setSaving(true);
    setSaveMessage('');

    try {
      if (!editingEvent.event_name.trim()) {
        setSaveMessage('Event name is required');
        return;
      }
      if (!editingEvent.category.trim()) {
        setSaveMessage('Category is required');
        return;
      }

      const isUpdate = editingEvent.id && eventsList.find(e => e.id === editingEvent.id);

      const requestData = {
        event_name: editingEvent.event_name,
        category: editingEvent.category,
        description: editingEvent.description,
        required_fields: editingEvent.required_fields,
        optional_fields: editingEvent.optional_fields,
        validation_rules: editingEvent.validation_rules,
        success_criteria: editingEvent.success_criteria,
        alert_thresholds: editingEvent.alert_thresholds
      };

      console.log('Sending request data:', requestData);
      console.log('Current editingEvent category:', editingEvent.category);

      if (isUpdate) {
        // Update existing event
        await apiClient.request(`/event-definitions/${editingEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(requestData)
        });
      } else {
        // Create new event
        await apiClient.request('/event-definitions', {
          method: 'POST',
          body: JSON.stringify(requestData)
        });
      }

      console.log('Event save successful, reloading events...');
      setSaveMessage('Event saved successfully!');
      setEditingEvent(null);
      await loadEvents(); // Reload events from server
      console.log('Events reloaded after save');

      if (onSave) {
        onSave(editingEvent);
      }

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      setSaveMessage(error?.message || 'Failed to save event');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateCodeSnippet = (event: EventDefinition) => {
    const requiredFields: any = {};
    const optionalFields: any = {};

    // Add required fields with example values
    event.required_fields?.forEach(field => {
      switch (field.type) {
        case 'string':
          requiredFields[field.name] = `example_${field.name}`;
          break;
        case 'number':
          requiredFields[field.name] = 123;
          break;
        case 'boolean':
          requiredFields[field.name] = true;
          break;
        default:
          requiredFields[field.name] = `value`;
      }
    });

    // Add optional fields with example values
    event.optional_fields?.forEach(field => {
      switch (field.type) {
        case 'string':
          optionalFields[field.name] = `example_${field.name}`;
          break;
        case 'number':
          optionalFields[field.name] = 456;
          break;
        case 'boolean':
          optionalFields[field.name] = false;
          break;
        default:
          optionalFields[field.name] = `optional_value`;
      }
    });

    const allFields = { ...requiredFields, ...optionalFields };
    const traceId = `evt_${Math.random().toString(36).substring(2, 11)}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    return `curl -X 'POST' \\
  'http://localhost:8000/internal/events/events' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "trace_id": "${traceId}",
  "event_name": "${event.event_name}",
  "category": "${event.category}",
  "fields": ${JSON.stringify(allFields, null, 4)}
}'`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSaveMessage('Code copied to clipboard!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await apiClient.request(`/event-definitions/${eventId}`, {
        method: 'DELETE'
      });

      setSaveMessage('Event deleted successfully!');
      await loadEvents(); // Reload events from server

      if (onDelete) {
        onDelete(eventId);
      }

      if (editingEvent?.id === eventId) {
        setEditingEvent(null);
      }

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      setSaveMessage(error?.message || 'Failed to delete event');
      console.error('Delete error:', error);
    }
  };

  const toggleCollapse = (eventId: string) => {
    setEventsList(eventsList.map(e =>
      e.id === eventId ? { ...e, collapsed: !e.collapsed } : e
    ));
  };

  const handleFieldChange = useCallback((fieldIndex: number, required: boolean, fieldUpdate: Partial<EventField>) => {
    if (!editingEvent) return;
    updateField(editingEvent, fieldIndex, required, fieldUpdate);
  }, [editingEvent]);

  const handleAddField = useCallback((required: boolean) => {
    if (!editingEvent) return;
    addField(editingEvent, required);
  }, [editingEvent]);

  const handleRemoveField = useCallback((fieldIndex: number, required: boolean) => {
    if (!editingEvent) return;
    removeField(editingEvent, fieldIndex, required);
  }, [editingEvent]);

  // Loading State
  if (loading) {
    return <LoadingState message="Loading event definitions..." />
  }

  // Error State
  if (error) {
    return (
      <ErrorState
        title="Failed to load events"
        message={error}
        onRetry={loadEvents}
      />
    )
  }

  return (
    <div className="space-y-4">
      {!modalMode && (
        <div className="flex items-center justify-between">
          {showCreateButton && (
            <Button onClick={() => setEditingEvent(createNewEvent())} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          )}
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-2 rounded text-sm ${
          saveMessage.includes('successfully')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Edit/Create Form */}
      {editingEvent && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">
              {editingEvent.id && eventsList.find(e => e.id === editingEvent.id) ? 'Edit Event' : 'Create New Event'}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="event_name" className="text-sm">Event Name</Label>
                <Input
                  id="event_name"
                  value={editingEvent.event_name}
                  onChange={(e) => setEditingEvent({ ...editingEvent, event_name: e.target.value })}
                  placeholder="e.g., user_signup"
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-sm">Category</Label>
                <Select
                  value={editingEvent.category}
                  onValueChange={(value) => {
                    console.log('Category changed from', editingEvent.category, 'to', value);
                    setEditingEvent({ ...editingEvent, category: value });
                  }}
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
                value={editingEvent.description}
                onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                placeholder="Describe when this event should be triggered"
                className="h-8"
              />
            </div>

            {/* Required Fields */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Required Fields</Label>
                <Button
                  onClick={() => handleAddField(true)}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {editingEvent.required_fields.map((field, idx) => (
                <div key={`req-${idx}`} className="flex gap-2 items-center">
                  <Input
                    placeholder="Name"
                    value={field.name}
                    onChange={(e) => handleFieldChange(idx, true, { name: e.target.value })}
                    className="h-8 text-sm flex-1"
                  />
                  <Select
                    value={field.type}
                    onValueChange={(value) => handleFieldChange(idx, true, { type: value as any })}
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
                    onChange={(e) => handleFieldChange(idx, true, { description: e.target.value })}
                    className="h-8 text-sm flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveField(idx, true)}
                    className="h-8 w-8 p-0"
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
                  onClick={() => handleAddField(false)}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {editingEvent.optional_fields.map((field, idx) => (
                <div key={`opt-${idx}`} className="flex gap-2 items-center">
                  <Input
                    placeholder="Name"
                    value={field.name}
                    onChange={(e) => handleFieldChange(idx, false, { name: e.target.value })}
                    className="h-8 text-sm flex-1"
                  />
                  <Select
                    value={field.type}
                    onValueChange={(value) => handleFieldChange(idx, false, { type: value as any })}
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
                    onChange={(e) => handleFieldChange(idx, false, { description: e.target.value })}
                    className="h-8 text-sm flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveField(idx, false)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={saveEvent}
                disabled={saving}
                size="sm"
              >
                {saving ? 'Saving...' : 'Save Event'}
              </Button>
              <Button
                onClick={() => setEditingEvent(null)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for event list */}
      <div className="space-y-2">
        {eventsList.filter(event => editingEvent?.id !== event.id).length === 0 && !editingEvent ? (
          <EmptyState
            icon={Zap}
            title="No event definitions yet"
            description="Create your first event definition to start tracking user actions and behaviors in your application."
            actionLabel="Create Event Definition"
            onAction={() => setEditingEvent(createNewEvent())}
          />
        ) : (
          eventsList.filter(event => editingEvent?.id !== event.id).map((event) => (
            <Card key={`${event.id}-${refreshKey}`} className="p-3">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 -m-1 p-1 rounded"
                  onClick={() => toggleCollapse(event.id!)}
                >
                  <div className="h-6 w-6 flex items-center justify-center">
                    {event.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{event.event_name}</h3>
                    <p className="text-xs text-muted-foreground">{event.category}</p>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCodeFor(showCodeFor === event.id ? null : event.id!)}
                    className="h-6 px-2"
                    title="Show code"
                  >
                    <Code className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEvent(event)}
                    className="h-6 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEvent(event.id!)}
                    className="h-6 px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {!event.collapsed && (
                <div className="mt-3 pt-3 border-t text-sm space-y-2">
                  <p><strong>Description:</strong> {event.description}</p>
                  {event.required_fields && event.required_fields.length > 0 && (
                    <p><strong>Required:</strong> {event.required_fields.map(f => f.name).join(', ')}</p>
                  )}
                  {event.optional_fields && event.optional_fields.length > 0 && (
                    <p><strong>Optional:</strong> {event.optional_fields.map(f => f.name).join(', ')}</p>
                  )}
                </div>
              )}

              {showCodeFor === event.id && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Code Example</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generateCodeSnippet(event))}
                      className="h-6 px-2"
                      title="Copy code to clipboard"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                      {generateCodeSnippet(event)}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
