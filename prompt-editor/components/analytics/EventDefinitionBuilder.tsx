import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit, Code, Copy, Zap, Search } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

export interface MetadataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description?: string;
  validation?: any;
}

export interface EventDefinition {
  id?: string;
  event_name: string;
  description: string;
  metadata_schema: MetadataField[];
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

export interface EventDefinitionBuilderProps {
  onSave?: (definition: EventDefinition) => void;
  onDelete?: (id: string) => void;
  events?: EventDefinition[];
  initialData?: EventDefinition;
  modalMode?: boolean;
  showCreateButton?: boolean;
  onNewClick?: () => void;
  onEditClick?: (event: EventDefinition) => void;
  onDeleteClick?: (eventId: string) => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function EventDefinitionBuilder({
  onSave,
  onDelete,
  events = [],
  initialData,
  modalMode = false,
  showCreateButton = true,
  onNewClick,
  onEditClick,
  onDeleteClick,
  showNotification
}: EventDefinitionBuilderProps) {
  const [eventsList, setEventsList] = useState<EventDefinition[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventDefinition | null>(null);
  const [showCodeFor, setShowCodeFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

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
        console.log('Events:', data.map((e: any) => ({ id: e.id, name: e.event_name })));

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
    description: '',
    metadata_schema: [],
    validation_rules: [],
    success_criteria: {},
    alert_thresholds: {},
    is_active: true,
    collapsed: false
  });

  const addField = (event: EventDefinition) => {
    const field: MetadataField = {
      name: '',
      type: 'string',
      required: false,
      description: ''
    };

    const updated = { ...event };
    updated.metadata_schema = [...updated.metadata_schema, field];
    setEditingEvent(updated);
  };

  const removeField = (event: EventDefinition, fieldIndex: number) => {
    const updated = { ...event };
    updated.metadata_schema = updated.metadata_schema.filter((_, i) => i !== fieldIndex);
    setEditingEvent(updated);
  };

  const updateField = (event: EventDefinition, fieldIndex: number, field: Partial<MetadataField>) => {
    const updated = { ...event };
    updated.metadata_schema[fieldIndex] = { ...updated.metadata_schema[fieldIndex], ...field };
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

      const isUpdate = editingEvent.id && eventsList.find(e => e.id === editingEvent.id);

      const requestData = {
        event_name: editingEvent.event_name,
        description: editingEvent.description,
        metadata_schema: editingEvent.metadata_schema,
        validation_rules: editingEvent.validation_rules,
        success_criteria: editingEvent.success_criteria,
        alert_thresholds: editingEvent.alert_thresholds
      };

      console.log('Sending request data:', requestData);

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
    const metadata: any = {};

    // Add metadata fields with example values
    event.metadata_schema?.forEach(field => {
      switch (field.type) {
        case 'string':
          metadata[field.name] = `example_${field.name}`;
          break;
        case 'number':
          metadata[field.name] = 123;
          break;
        case 'boolean':
          metadata[field.name] = true;
          break;
        case 'object':
          metadata[field.name] = { key: "value" };
          break;
        default:
          metadata[field.name] = `value`;
      }
    });

    const traceId = `evt_${Math.random().toString(36).substring(2, 11)}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    return `curl -X 'POST' \\
  'https://xr2.uk/api/v1/events' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "trace_id": "${traceId}",
  "event_name": "${event.event_name}",
  "source_name": "your_source_name",
  "user_id": "user_123",
  "value": 99.99,
  "currency": "USD",
  "metadata": ${JSON.stringify(metadata, null, 4)}
}'`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    if (showNotification) {
      showNotification('Code copied to clipboard', 'success');
    } else {
      setSaveMessage('Code copied to clipboard!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
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

  const handleFieldChange = useCallback((fieldIndex: number, fieldUpdate: Partial<MetadataField>) => {
    if (!editingEvent) return;
    updateField(editingEvent, fieldIndex, fieldUpdate);
  }, [editingEvent]);

  const handleAddField = useCallback(() => {
    if (!editingEvent) return;
    addField(editingEvent);
  }, [editingEvent]);

  const handleRemoveField = useCallback((fieldIndex: number) => {
    if (!editingEvent) return;
    removeField(editingEvent, fieldIndex);
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

  // Filter events by search term
  const filteredEventsList = eventsList.filter(event =>
    event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-0">
      {/* Filters Block */}
      {!modalMode && (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by event name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              {showCreateButton && (
                <Button
                  onClick={onNewClick || (() => setEditingEvent(createNewEvent()))}
                  size="sm"
                  className="bg-black hover:bg-gray-800 text-xs h-9 px-3 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spacing between filters and content */}
      {!modalMode && <div className="h-4"></div>}

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
                  onClick={() => handleAddField()}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {editingEvent.metadata_schema.map((field, idx) => (
                <div key={`meta-${idx}`} className="flex gap-2 items-start p-2 bg-gray-50 rounded">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => handleFieldChange(idx, { name: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                      <Select
                        value={field.type}
                        onValueChange={(value) => handleFieldChange(idx, { type: value as any })}
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
                          onChange={(e) => handleFieldChange(idx, { required: e.target.checked })}
                          className="rounded"
                        />
                        Required
                      </label>
                    </div>
                    <Input
                      placeholder="Description (optional)"
                      value={field.description || ''}
                      onChange={(e) => handleFieldChange(idx, { description: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveField(idx)}
                    className="h-8 w-8 p-0 mt-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {editingEvent.metadata_schema.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No custom fields defined. Click "Add" to create one.</p>
              )}
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
        {filteredEventsList.filter(event => editingEvent?.id !== event.id).length === 0 && !editingEvent ? (
          <EmptyState
            icon={Zap}
            title="No event definitions yet"
            description="Create your first event definition to start tracking user actions and behaviors in your application."
            actionLabel="Create Event Definition"
            onAction={() => setEditingEvent(createNewEvent())}
          />
        ) : (
          filteredEventsList.filter(event => editingEvent?.id !== event.id).map((event) => (
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
                    {event.description && (
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    )}
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
                    onClick={() => onEditClick ? onEditClick(event) : setEditingEvent(event)}
                    className="h-6 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteClick ? onDeleteClick(event.id!) : deleteEvent(event.id!)}
                    className="h-6 px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {!event.collapsed && (
                <div className="mt-3 pt-3 border-t text-sm space-y-2">
                  <p><strong>Description:</strong> {event.description || 'No description'}</p>
                  {event.metadata_schema && event.metadata_schema.length > 0 ? (
                    <div>
                      <p className="font-medium mb-1">Custom Metadata Fields:</p>
                      <ul className="ml-4 list-disc text-xs space-y-1">
                        {event.metadata_schema.map((field, idx) => (
                          <li key={idx}>
                            <code className="bg-gray-100 px-1 rounded">{field.name}</code>
                            {' '}({field.type})
                            {field.required && <span className="text-red-600"> *</span>}
                            {field.description && <span className="text-gray-600"> - {field.description}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs">No custom fields defined</p>
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
