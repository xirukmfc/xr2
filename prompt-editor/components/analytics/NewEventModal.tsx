import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useLocale } from '@/contexts/locale-context';

interface MetadataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description?: string;
}

interface EventDefinition {
  id?: string;
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
  initialData?: EventDefinition | null;
}

export default function NewEventModal({ onSave, onCancel, initialData }: NewEventModalProps) {
  const { t } = useLocale();
  const [formData, setFormData] = useState<EventDefinition>(initialData || {
    event_name: '',
    description: '',
    metadata_schema: [],
    validation_rules: [],
    success_criteria: {},
    alert_thresholds: {}
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        event_name: '',
        description: '',
        metadata_schema: [],
        validation_rules: [],
        success_criteria: {},
        alert_thresholds: {}
      });
    }
  }, [initialData]);

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
      setError(t('analytics.eventForm.errorRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const isUpdate = formData.id;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate ? `/event-definitions/${formData.id}` : '/event-definitions';

      await apiClient.request(url, {
        method,
        body: JSON.stringify(formData)
      });

      onSave(formData);
    } catch (error: any) {
      setError(error?.message || t('analytics.eventForm.errorSave'));
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
          <Label htmlFor="event_name" className="text-sm">{t('analytics.eventForm.eventNameLabel')}</Label>
          <Input
            id="event_name"
            value={formData.event_name}
            onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
            placeholder={t('analytics.eventForm.eventNamePlaceholder')}
            className="h-8"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-sm">{t('analytics.eventForm.descriptionLabel')}</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('analytics.eventForm.descriptionPlaceholder')}
          className="h-8"
        />
      </div>

      {/* Standard Fields Info */}
      <div className="p-3 bg-muted/50 rounded-md space-y-2">
        <Label className="text-sm font-medium">{t('analytics.eventForm.standardFieldsTitle')}</Label>
        <p className="text-xs text-muted-foreground">{t('analytics.eventForm.standardFieldsInfo')}</p>
        <ul className="text-xs text-muted-foreground ml-4 list-disc space-y-0.5">
          <li>{t('analytics.eventForm.standardFields.eventName')}</li>
          <li>{t('analytics.eventForm.standardFields.traceId')}</li>
          <li>{t('analytics.eventForm.standardFields.userId')}</li>
          <li>{t('analytics.eventForm.standardFields.sessionId')}</li>
          <li>{t('analytics.eventForm.standardFields.value')}</li>
          <li>{t('analytics.eventForm.standardFields.currency')}</li>
        </ul>
      </div>

      {/* Custom Metadata Fields */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <Label className="text-sm font-medium">{t('analytics.eventForm.customFieldsTitle')}</Label>
            <p className="text-xs text-muted-foreground">{t('analytics.eventForm.customFieldsDescription')}</p>
          </div>
          <Button
            onClick={addField}
            size="sm"
            variant="outline"
            className="h-7 px-2"
            type="button"
          >
            <Plus className="h-3 w-3 mr-1" /> {t('analytics.eventForm.add')}
          </Button>
        </div>
        {formData.metadata_schema.map((field, idx) => (
          <div key={`meta-${idx}`} className="flex gap-2 items-start p-2 bg-gray-50 rounded">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t('analytics.eventForm.fieldNamePlaceholder')}
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
                    <SelectItem value="string">{t('analytics.eventForm.typeString')}</SelectItem>
                    <SelectItem value="number">{t('analytics.eventForm.typeNumber')}</SelectItem>
                    <SelectItem value="boolean">{t('analytics.eventForm.typeBoolean')}</SelectItem>
                    <SelectItem value="object">{t('analytics.eventForm.typeObject')}</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(idx, { required: e.target.checked })}
                    className="rounded"
                  />
                  {t('analytics.eventForm.required')}
                </label>
              </div>
              <Input
                placeholder={t('analytics.eventForm.fieldDescriptionPlaceholder')}
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
          <p className="text-xs text-muted-foreground text-center py-2">{t('analytics.eventForm.noFields')}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="bg-black hover:bg-gray-800"
        >
          {saving
            ? (formData.id ? t('analytics.eventForm.updating') : t('analytics.eventForm.creating'))
            : (formData.id ? t('analytics.eventForm.updateEvent') : t('analytics.eventForm.createEvent'))}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          {t('analytics.eventForm.cancel')}
        </Button>
      </div>
    </div>
  );
}
