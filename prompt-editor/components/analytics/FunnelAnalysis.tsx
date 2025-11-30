import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2, Lightbulb, Pencil, ArrowRight, TrendingDown, GitCompare, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api';

// Comparison funnel component - side by side with diff
const ComparisonFunnel = ({ 
  leftData, 
  rightData, 
  leftLabel, 
  rightLabel,
  onRemoveRight 
}: { 
  leftData: FunnelStep[], 
  rightData: FunnelStep[], 
  leftLabel: string,
  rightLabel: string,
  onRemoveRight: () => void 
}) => {
  if (!leftData || leftData.length === 0) return null;

  const maxUsers = Math.max(
    ...leftData.map(d => d.users),
    ...rightData.map(d => d.users)
  );

  return (
    <div className="space-y-0">
      {/* Header row */}
      <div className="flex items-center gap-2 pb-3 mb-2 border-b">
        <div className="w-5 flex-shrink-0" />
        <div className="w-28 flex-shrink-0" />
        <div className="flex-1 text-center">
          <span className="text-xs font-semibold text-blue-600">{leftLabel}</span>
        </div>
        <div className="flex-1 text-center flex items-center justify-center gap-1">
          <span className="text-xs font-semibold text-green-600">{rightLabel}</span>
          <button 
            onClick={onRemoveRight}
            className="ml-1 p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="w-16 text-center flex-shrink-0">
          <span className="text-[10px] text-muted-foreground">Diff</span>
        </div>
      </div>

      {leftData.map((step, index) => {
        const rightStep = rightData[index];
        const leftWidthPercent = maxUsers > 0 ? (step.users / maxUsers) * 100 : 0;
        const rightWidthPercent = rightStep && maxUsers > 0 ? (rightStep.users / maxUsers) * 100 : 0;
        
        // Calculate diff
        const conversionDiff = rightStep ? rightStep.conversion_rate - step.conversion_rate : 0;
        const isPositive = conversionDiff > 0;
        const isNegative = conversionDiff < 0;
        
        return (
          <div key={step.step}>
            {/* Step row */}
            <div className="flex items-center gap-2 py-1.5 group hover:bg-muted/30 rounded px-2 -mx-2 transition-colors">
              {/* Step number */}
              <div className="flex-shrink-0 w-5 h-5 rounded bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                {index + 1}
              </div>
              
              {/* Step name */}
              <div className="w-28 flex-shrink-0">
                <span className="text-xs font-medium truncate block">{step.step}</span>
              </div>
              
              {/* Left version bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative h-5 bg-blue-100 rounded overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-blue-500 rounded transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(leftWidthPercent, 1)}%` }}
                    />
                  </div>
                  <div className="w-10 text-right">
                    <span className="text-[10px] font-medium tabular-nums">{step.users.toLocaleString()}</span>
                  </div>
                  <div className="w-10 text-right">
                    <span className="text-[10px] font-bold tabular-nums text-blue-600">{step.conversion_rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              {/* Right version bar */}
              <div className="flex-1 min-w-0">
                {rightStep ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative h-5 bg-green-100 rounded overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-green-500 rounded transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(rightWidthPercent, 1)}%` }}
                      />
                    </div>
                    <div className="w-10 text-right">
                      <span className="text-[10px] font-medium tabular-nums">{rightStep.users.toLocaleString()}</span>
                    </div>
                    <div className="w-10 text-right">
                      <span className="text-[10px] font-bold tabular-nums text-green-600">{rightStep.conversion_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-muted-foreground text-center">—</div>
                )}
              </div>
              
              {/* Diff indicator */}
              <div className="w-16 text-right flex-shrink-0">
                {rightStep ? (
                  <span className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                    isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {isPositive && <ArrowUpRight className="w-3 h-3" />}
                    {isNegative && <ArrowDownRight className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{conversionDiff.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </div>
            </div>
            
            {/* Connector line */}
            {index < leftData.length - 1 && (
              <div className="flex items-center gap-2 h-0.5">
                <div className="w-5 flex justify-center">
                  <div className="w-px h-1.5 bg-border" />
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Summary footer */}
      {leftData.length >= 2 && rightData.length >= 2 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <div className="w-5 flex-shrink-0" />
            <div className="w-28 flex-shrink-0">
              <span className="text-xs text-muted-foreground">Overall</span>
            </div>
            <div className="flex-1 text-center">
              <span className="text-sm font-bold text-blue-600">
                {leftData[leftData.length - 1].conversion_rate.toFixed(1)}%
              </span>
            </div>
            <div className="flex-1 text-center">
              <span className="text-sm font-bold text-green-600">
                {rightData[rightData.length - 1].conversion_rate.toFixed(1)}%
              </span>
            </div>
            <div className="w-16 text-right flex-shrink-0">
              {(() => {
                const diff = rightData[rightData.length - 1].conversion_rate - leftData[leftData.length - 1].conversion_rate;
                const isPos = diff > 0;
                const isNeg = diff < 0;
                return (
                  <span className={`text-xs font-bold ${isPos ? 'text-green-600' : isNeg ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {isPos ? '+' : ''}{diff.toFixed(1)}%
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modern horizontal funnel component - matching analytics style
const ModernFunnel = ({ data, color = "#6366f1" }: { data: FunnelStep[], color?: string }) => {
  if (!data || data.length === 0) return null;

  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <div className="space-y-0">
      {data.map((step, index) => {
        const widthPercent = maxUsers > 0 ? (step.users / maxUsers) * 100 : 0;
        const dropPercent = index > 0 && data[index - 1].users > 0 
          ? ((data[index - 1].users - step.users) / data[index - 1].users * 100) 
          : 0;
        
        return (
          <div key={step.step}>
            {/* Step row */}
            <div className="flex items-center gap-3 py-2 group hover:bg-muted/30 rounded px-2 -mx-2 transition-colors">
              {/* Step number */}
              <div className="flex-shrink-0 w-5 h-5 rounded bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                {index + 1}
              </div>
              
              {/* Step name */}
              <div className="w-32 flex-shrink-0">
                <span className="text-xs font-medium truncate block">{step.step}</span>
              </div>
              
              {/* Progress bar */}
              <div className="flex-1 min-w-0">
                <div className="relative h-6 bg-muted rounded overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-foreground/80 rounded transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(widthPercent, 1)}%` }}
                  />
                </div>
              </div>
              
              {/* Users count - always right aligned after bar */}
              <div className="w-16 text-right flex-shrink-0">
                <span className="text-xs font-medium tabular-nums">{step.users.toLocaleString()}</span>
              </div>
              
              {/* Conversion rate */}
              <div className="w-12 text-right flex-shrink-0">
                <span className="text-xs font-bold tabular-nums">{step.conversion_rate.toFixed(1)}%</span>
              </div>
              
              {/* Drop indicator */}
              <div className="w-20 text-right flex-shrink-0">
                {index > 0 ? (
                  <span className="text-[10px] text-red-500 font-medium">
                    −{dropPercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </div>
            </div>
            
            {/* Connector line */}
            {index < data.length - 1 && (
              <div className="flex items-center gap-3 h-1">
                <div className="w-5 flex justify-center">
                  <div className="w-px h-2 bg-border" />
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Summary footer */}
      {data.length >= 2 && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Overall conversion</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">
              {data[data.length - 1].conversion_rate.toFixed(1)}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({data[data.length - 1].users.toLocaleString()} / {data[0].users.toLocaleString()})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface FunnelStep {
  step: string;
  users: number;
  conversion_rate: number;
}

interface CustomFunnelConfiguration {
  id: string;
  name: string;
  description?: string;
  event_steps: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EventDefinition {
  id: string;
  event_name: string;
  category: string;
  description?: string;
}

interface PromptInfo {
  id: string;
  name: string;
  slug: string;
}

interface PromptVersionInfo {
  id: string;
  version_number: number;
  status: string;
}

interface FunnelAnalysisProps {
  data?: FunnelStep[] | null;
  onFunnelChange?: (steps: string[]) => void;
  onFilterChange?: (promptId: string | null, versionId: string | null) => void;
  showCreateButton?: boolean;
  externalShowCreateForm?: boolean;
  onCreateFormClose?: () => void;
}

export default function FunnelAnalysis({ data, onFunnelChange, onFilterChange, showCreateButton = true, externalShowCreateForm, onCreateFormClose }: FunnelAnalysisProps) {
  const [internalShowCreateForm, setInternalShowCreateForm] = useState(false);
  // Combine external and internal state - show form if either is true
  const showCreateForm = externalShowCreateForm || internalShowCreateForm;
  const setShowCreateForm = (value: boolean) => {
    // Always update internal state
    setInternalShowCreateForm(value);
    // If closing and external callback exists, call it
    if (!value && onCreateFormClose) {
      onCreateFormClose();
    }
  };
  const [funnelName, setFunnelName] = useState('');
  const [funnelSteps, setFunnelSteps] = useState<string[]>(['get_prompt', '']);
  const [savedConfigurations, setSavedConfigurations] = useState<CustomFunnelConfiguration[]>([]);
  const [currentConfiguration, setCurrentConfiguration] = useState<CustomFunnelConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [funnelDataFromAPI, setFunnelDataFromAPI] = useState<FunnelStep[] | null>(null);
  const [editingConfiguration, setEditingConfiguration] = useState<CustomFunnelConfiguration | null>(null);
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  
  // Prompt and version filters
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [promptVersions, setPromptVersions] = useState<PromptVersionInfo[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  
  // Version comparison
  const [compareVersionId, setCompareVersionId] = useState<string>('');
  const [compareData, setCompareData] = useState<FunnelStep[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  // Date range filter
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Load saved configurations and event definitions on component mount
  useEffect(() => {
    loadSavedConfigurations();
    loadEventDefinitions();
    loadPrompts();
  }, []);
  
  // Load versions when prompt is selected
  useEffect(() => {
    if (selectedPromptId) {
      loadPromptVersions(selectedPromptId);
    } else {
      setPromptVersions([]);
      setSelectedVersionId('');
    }
  }, [selectedPromptId]);

  // Notify parent about filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(
        selectedPromptId || null,
        selectedVersionId || null
      );
    }
  }, [selectedPromptId, selectedVersionId]);

  // Fetch funnel data when configuration, filters, or dates change
  // All filters are applied together (AND condition):
  // - If prompt selected: filter by prompt_id
  // - If version selected: filter by version_id (within selected prompt if prompt also selected)
  // - If dates selected: filter by date range
  useEffect(() => {
    if (currentConfiguration) {
      // Use API if any filter is selected (prompt, version, or dates)
      // All selected filters will be applied together (AND)
      if (selectedPromptId || selectedVersionId || startDate || endDate) {
        console.log('useEffect: Filters detected, calling fetchFunnelData', {
          selectedPromptId,
          selectedVersionId,
          startDate,
          endDate
        });
        fetchFunnelData();
      } else {
        // If no filters selected, clear API data to use props data
        console.log('useEffect: No filters, clearing API data');
        setFunnelDataFromAPI(null);
      }
    }
  }, [currentConfiguration, selectedPromptId, selectedVersionId, startDate, endDate]);

  // Fetch comparison data when compare version is selected
  useEffect(() => {
    if (compareVersionId && currentConfiguration && selectedPromptId) {
      fetchCompareData(compareVersionId);
    } else {
      setCompareData(null);
    }
  }, [compareVersionId, currentConfiguration, startDate, endDate]);

  const fetchFunnelData = async () => {
    if (!currentConfiguration) {
      console.log('fetchFunnelData: No configuration selected');
      return;
    }
    
    console.log('fetchFunnelData: Starting fetch', {
      selectedPromptId,
      selectedVersionId,
      startDate,
      endDate,
      eventSteps: currentConfiguration.event_steps
    });
    
    setLoading(true);
    try {
      // Prepare request body with optional filters
      const requestBody: any = {
        event_sequence: currentConfiguration.event_steps
      };
      
      // Add prompt filter if provided (AND condition)
      if (selectedPromptId) {
        requestBody.prompt_id = selectedPromptId;
        console.log('fetchFunnelData: Adding prompt_id filter:', selectedPromptId);
      }
      
      // Add version filter if provided (AND condition - filters within selected prompt)
      if (selectedVersionId) {
        requestBody.version_id = selectedVersionId;
        console.log('fetchFunnelData: Adding version_id filter:', selectedVersionId);
      }
      
      if (startDate) {
        // Ensure start date is at beginning of day
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        requestBody.start_date = startDateTime.toISOString();
        console.log('fetchFunnelData: Adding start_date filter:', requestBody.start_date);
      }
      if (endDate) {
        // Set end date to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        requestBody.end_date = endDateTime.toISOString();
        console.log('fetchFunnelData: Adding end_date filter:', requestBody.end_date);
      }
      
      console.log('fetchFunnelData: Sending request with body:', JSON.stringify(requestBody, null, 2));
      
      const result = await apiClient.request<FunnelStep[]>(
        '/analytics/funnel-test',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      console.log('fetchFunnelData: Received result:', result);
      setFunnelDataFromAPI(result || []);
    } catch (error) {
      console.error('fetchFunnelData: Failed to fetch funnel data:', error);
      setFunnelDataFromAPI([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompareData = async (versionId: string) => {
    if (!currentConfiguration) return;
    
    try {
      // Prepare request body with optional date filters
      const requestBody: any = {
        event_sequence: currentConfiguration.event_steps,
        version_id: versionId
      };
      
      if (startDate) {
        requestBody.start_date = new Date(startDate).toISOString();
      }
      if (endDate) {
        // Set end date to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        requestBody.end_date = endDateTime.toISOString();
      }
      
      // Use the funnel-test endpoint with version filter
      const result = await apiClient.request<FunnelStep[]>(
        '/analytics/funnel-test',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      setCompareData(result || []);
    } catch (error) {
      console.error('Failed to fetch comparison funnel data:', error);
      setCompareData(null);
    }
  };

  const startComparison = () => {
    setIsComparing(true);
    setCompareVersionId('');
    setCompareData(null);
  };

  const stopComparison = () => {
    setIsComparing(false);
    setCompareVersionId('');
    setCompareData(null);
  };

  const loadSavedConfigurations = async () => {
    try {
      const configurations = await apiClient.request<CustomFunnelConfiguration[]>('/custom-funnel-configurations/test');
      setSavedConfigurations(configurations);

      // Load the first active configuration if available
      const activeConfig = configurations.find((config: CustomFunnelConfiguration) => config.is_active);
      if (activeConfig && onFunnelChange) {
        setCurrentConfiguration(activeConfig);
        onFunnelChange(activeConfig.event_steps);
      }
    } catch (error) {
      console.error('Failed to load saved funnel configurations:', error);
    }
  };

  const loadEventDefinitions = async () => {
    try {
      const definitions = await apiClient.request<any[]>('/event-definitions/test');
      setEventDefinitions(definitions);
    } catch (error) {
      console.error('Failed to load event definitions:', error);
    }
  };

  const loadPrompts = async () => {
    try {
      const promptsList = await apiClient.request<PromptInfo[]>('/prompts/');
      setPrompts(promptsList);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const loadPromptVersions = async (promptId: string) => {
    try {
      const versions = await apiClient.request<PromptVersionInfo[]>(`/prompts/${promptId}/versions`);
      setPromptVersions(versions);
    } catch (error) {
      console.error('Failed to load prompt versions:', error);
      setPromptVersions([]);
    }
  };

  const saveFunnelConfiguration = async () => {
    console.log('saveFunnelConfiguration called');
    console.log('funnelName:', funnelName);
    console.log('funnelSteps:', funnelSteps);

    const validSteps = funnelSteps.filter(step => step.trim());
    console.log('validSteps:', validSteps);

    // Validate
    if (!funnelName.trim()) {
      alert('Please enter a funnel name');
      return;
    }

    if (validSteps.length < 2) {
      alert('Please enter at least 2 funnel steps');
      return;
    }

    setLoading(true);
    try {
      const newConfiguration = await apiClient.request<CustomFunnelConfiguration>('/custom-funnel-configurations/test', {
        method: 'POST',
        body: {
          name: funnelName.trim(),
          description: `Custom funnel with steps: ${validSteps.join(' → ')}`,
          event_steps: validSteps
        },
      });

      setSavedConfigurations(prev => [...prev, newConfiguration]);
      setCurrentConfiguration(newConfiguration);

      // Notify parent component to use new steps
      if (onFunnelChange) {
        onFunnelChange(newConfiguration.event_steps);
      }

      // Reset form
      setShowCreateForm(false);
      setFunnelName('');
      setFunnelSteps(['', '']);
    } catch (error: any) {
      console.error('Failed to save funnel configuration:', error);
      console.error('Request data:', {
        name: funnelName.trim(),
        description: `Custom funnel with steps: ${validSteps.join(' → ')}`,
        event_steps: validSteps
      });

      let errorMessage = 'Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
          // Handle Pydantic validation errors
          errorMessage = error.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        } else {
          errorMessage = JSON.stringify(error.detail);
        }
      }

      alert(`Failed to save funnel configuration: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = (config: CustomFunnelConfiguration) => {
    setCurrentConfiguration(config);
    if (onFunnelChange) {
      onFunnelChange(config.event_steps);
    }
  };

  const startEditConfiguration = (config: CustomFunnelConfiguration) => {
    setEditingConfiguration(config);
    setFunnelName(config.name);
    setFunnelSteps(config.event_steps.length > 0 ? config.event_steps : ['get_prompt', '']);
    setShowCreateForm(true);
  };

  const updateFunnelConfiguration = async () => {
    if (!editingConfiguration) return;

    const validSteps = funnelSteps.filter(step => step.trim());

    if (!funnelName.trim()) {
      alert('Please enter a funnel name');
      return;
    }

    if (validSteps.length < 2) {
      alert('Please enter at least 2 funnel steps');
      return;
    }

    setLoading(true);
    try {
      const updatedConfiguration = await apiClient.request<CustomFunnelConfiguration>(`/custom-funnel-configurations/test/${editingConfiguration.id}`, {
        method: 'PUT',
        body: {
          name: funnelName.trim(),
          description: `Custom funnel with steps: ${validSteps.join(' → ')}`,
          event_steps: validSteps
        },
      });

      setSavedConfigurations(prev => prev.map(c => c.id === editingConfiguration.id ? updatedConfiguration : c));
      setCurrentConfiguration(updatedConfiguration);

      if (onFunnelChange) {
        onFunnelChange(updatedConfiguration.event_steps);
      }

      // Reset form
      setShowCreateForm(false);
      setEditingConfiguration(null);
      setFunnelName('');
      setFunnelSteps(['get_prompt', '']);
    } catch (error: any) {
      console.error('Failed to update funnel configuration:', error);
      alert(`Failed to update funnel configuration: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteFunnelConfiguration = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this funnel configuration?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.request(`/custom-funnel-configurations/test/${configId}`, {
        method: 'DELETE',
      });

      // Remove from local state
      setSavedConfigurations(prev => prev.filter(config => config.id !== configId));

      // If this was the current configuration, clear it
      if (currentConfiguration?.id === configId) {
        setCurrentConfiguration(null);
        if (onFunnelChange) {
          onFunnelChange([]); // Clear funnel steps
        }
      }
    } catch (error: any) {
      console.error('Failed to delete funnel configuration:', error);
      alert(`Failed to delete funnel configuration: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    setFunnelSteps([...funnelSteps, '']);
  };

  const removeStep = (index: number) => {
    if (funnelSteps.length > 2) {
      setFunnelSteps(funnelSteps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...funnelSteps];
    newSteps[index] = value;
    setFunnelSteps(newSteps);
  };

  const handleCreateFunnel = async () => {
    if (editingConfiguration) {
      await updateFunnelConfiguration();
    } else {
      await saveFunnelConfiguration();
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        {/* Saved Configurations Section */}
        {savedConfigurations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Saved Funnel Configurations</CardTitle>
              <p className="text-sm text-muted-foreground">Load a previously saved funnel configuration</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {savedConfigurations.map((config) => (
                  <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{config.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Steps: {config.event_steps.join(' → ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(config.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => loadConfiguration(config)}
                        variant={currentConfiguration?.id === config.id ? "default" : "outline"}
                        size="sm"
                      >
                        {currentConfiguration?.id === config.id ? "Active" : "Load"}
                      </Button>
                      <Button
                        onClick={() => startEditConfiguration(config)}
                        variant="outline"
                        size="sm"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteFunnelConfiguration(config.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            {showCreateButton && (
              <Button onClick={() => setShowCreateForm(true)} className="bg-black hover:bg-gray-800" data-testid="open-create-funnel" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Funnel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {showCreateForm ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="funnel-name">Funnel Name</Label>
                  <Input
                    id="funnel-name"
                    data-testid="funnel-name-input"
                    placeholder="e.g., User Onboarding"
                    value={funnelName}
                    onChange={(e) => setFunnelName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Funnel Steps (in order)</Label>
                  <div className="space-y-2 mt-2">
                    {funnelSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="w-12 justify-center">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 relative">
                          <Input
                            data-testid={`funnel-step-${index}`}
                            placeholder={`Event name (e.g., ${index === 0 ? 'get_prompt' : index === 1 ? 'purchase' : 'signup'})`}
                            value={step}
                            onChange={(e) => updateStep(index, e.target.value)}
                            onFocus={() => setShowSuggestions(index)}
                            onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                          />
                          {showSuggestions === index && (
                            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {/* Built-in events */}
                              <div className="p-2 border-b bg-gray-50">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Lightbulb className="w-3 h-3" />
                                  Built-in Events
                                </div>
                              </div>
                              {['get_prompt'].filter(name => name.toLowerCase().includes(step.toLowerCase())).map((eventName) => (
                                <button
                                  key={eventName}
                                  className="w-full text-left p-2 hover:bg-gray-50 border-b"
                                  onClick={() => {
                                    updateStep(index, eventName);
                                    setShowSuggestions(null);
                                  }}
                                >
                                  <div className="font-medium text-sm">{eventName}</div>
                                  <div className="text-xs text-gray-500">System event - prompt request</div>
                                </button>
                              ))}
                              {/* Custom event definitions */}
                              {eventDefinitions.length > 0 && (
                                <>
                                  <div className="p-2 border-b bg-gray-50">
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <Lightbulb className="w-3 h-3" />
                                      Custom Events
                                    </div>
                                  </div>
                                  {eventDefinitions
                                    .filter(def => def.event_name.toLowerCase().includes(step.toLowerCase()))
                                    .map((definition) => (
                                      <button
                                        key={definition.id}
                                        className="w-full text-left p-2 hover:bg-gray-50 border-b last:border-b-0"
                                        onClick={() => {
                                          updateStep(index, definition.event_name);
                                          setShowSuggestions(null);
                                        }}
                                      >
                                        <div className="font-medium text-sm">{definition.event_name}</div>
                                        <div className="text-xs text-gray-500">{definition.category}</div>
                                        {definition.description && (
                                          <div className="text-xs text-gray-400 mt-1">{definition.description}</div>
                                        )}
                                      </button>
                                    ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {funnelSteps.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeStep(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </div>
                <div className="bg-blue-50 p-4 rounded border">
                  <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Define the sequence of events that represent your conversion funnel</li>
                    <li>• Event names should match the event_name field from your tracked events</li>
                    <li>• The system will calculate conversion rates between each step</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-testid="create-funnel-button"
                    onClick={handleCreateFunnel}
                    disabled={!funnelName || funnelSteps.some(step => !step.trim()) || loading}
                  >
                    {loading ? 'Saving...' : (editingConfiguration ? 'Update Funnel' : 'Create Funnel')}
                  </Button>
                  <Button
                    data-testid="cancel-funnel-button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingConfiguration(null);
                      setFunnelName('');
                      setFunnelSteps(['get_prompt', '']);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No funnel data available.</p>
                <p className="text-sm">Create a custom funnel to track conversion rates between specific events.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quick date presets helper
  const applyDatePreset = (preset: 'today' | '7days' | '30days' | 'thisMonth') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    switch (preset) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case '7days':
        const week = new Date(today);
        week.setDate(week.getDate() - 7);
        setStartDate(formatDate(week));
        setEndDate(formatDate(today));
        break;
      case '30days':
        const month = new Date(today);
        month.setDate(month.getDate() - 30);
        setStartDate(formatDate(month));
        setEndDate(formatDate(today));
        break;
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(formatDate(firstDay));
        setEndDate(formatDate(today));
        break;
    }
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="p-4">
          {!showCreateForm && (
            <div className="flex flex-col gap-2">
              {/* Row 1: Funnel + Edit/Delete + Prompt + Version + Compare */}
              <div className="flex items-center gap-2 flex-wrap">
                {savedConfigurations.length > 0 && (
                  <select
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white min-w-[140px] h-8"
                    value={currentConfiguration?.id || ''}
                    onChange={(e) => {
                      const config = savedConfigurations.find(c => c.id === e.target.value);
                      if (config) loadConfiguration(config);
                    }}
                  >
                    <option value="">Select funnel...</option>
                    {savedConfigurations.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                )}
                {currentConfiguration && (
                  <>
                    <Button
                      onClick={() => startEditConfiguration(currentConfiguration)}
                      variant="outline"
                      className="h-8 w-8 p-0"
                      title="Edit funnel configuration"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => deleteFunnelConfiguration(currentConfiguration.id)}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      disabled={loading}
                      title="Delete funnel configuration"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
                {showCreateButton && (
                  <Button onClick={() => setShowCreateForm(true)} variant="outline" className="text-xs h-8 px-2">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    New
                  </Button>
                )}
                
                {/* Separator */}
                {currentConfiguration && prompts.length > 0 && (
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                )}
                
                {/* Prompt filter */}
                {currentConfiguration && prompts.length > 0 && (
                  <select
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white min-w-[140px] h-8"
                    value={selectedPromptId}
                    onChange={(e) => {
                      setSelectedPromptId(e.target.value);
                      setSelectedVersionId('');
                    }}
                  >
                    <option value="">All Prompts</option>
                    {prompts.map((prompt) => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </option>
                    ))}
                  </select>
                )}
                {/* Version filter */}
                {currentConfiguration && selectedPromptId && promptVersions.length > 0 && (
                  <>
                    <select
                      className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white min-w-[100px] h-8"
                      value={selectedVersionId}
                      onChange={(e) => {
                        setSelectedVersionId(e.target.value);
                        if (isComparing) {
                          setCompareVersionId('');
                          setCompareData(null);
                        }
                      }}
                    >
                      <option value="">All Versions</option>
                      {promptVersions.map((version) => (
                        <option key={version.id} value={version.id}>
                          v{version.version_number} ({version.status})
                        </option>
                      ))}
                    </select>
                    
                    {/* Compare button */}
                    {selectedVersionId && !isComparing && (
                      <Button
                        onClick={startComparison}
                        variant="outline"
                        className="h-8 px-2 text-xs gap-1"
                        title="Compare with another version"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        Compare
                      </Button>
                    )}
                    
                    {/* Compare version selector */}
                    {isComparing && selectedVersionId && (
                      <>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <select
                          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white min-w-[100px] h-8"
                          value={compareVersionId}
                          onChange={(e) => setCompareVersionId(e.target.value)}
                        >
                          <option value="">Select...</option>
                          {promptVersions
                            .filter(v => v.id !== selectedVersionId)
                            .map((version) => (
                              <option key={version.id} value={version.id}>
                                v{version.version_number} ({version.status})
                              </option>
                            ))}
                        </select>
                        <Button
                          onClick={stopComparison}
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          title="Cancel comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {/* Row 2: Date range with quick presets */}
              {currentConfiguration && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  
                  {/* Quick presets */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => applyDatePreset('today')}
                      className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => applyDatePreset('7days')}
                      className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      7 days
                    </button>
                    <button
                      onClick={() => applyDatePreset('30days')}
                      className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      30 days
                    </button>
                    <button
                      onClick={() => applyDatePreset('thisMonth')}
                      className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      This month
                    </button>
                  </div>
                  
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  
                  {/* Custom date range */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-xs h-8 w-[130px]"
                    />
                    <span className="text-xs text-muted-foreground">—</span>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-xs h-8 w-[130px]"
                    />
                  </div>
                  
                  {(startDate || endDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-gray-900"
                      title="Clear date filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <>
              {(() => {
                // Check if any filters are selected (prompt, version, or dates)
                const hasFilters = selectedPromptId || selectedVersionId || startDate || endDate;
                
                // Show loading state when fetching API data
                if (loading && hasFilters) {
                  return (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p className="text-sm">Loading funnel data...</p>
                    </div>
                  );
                }
                
                // Use API data if filters are selected (prompt, version, or dates)
                // Otherwise use props data
                // IMPORTANT: If filters are selected, ONLY use API data (never fall back to props)
                const displayData = hasFilters 
                  ? (funnelDataFromAPI !== null ? funnelDataFromAPI : [])  // Use API data, empty array if not loaded yet
                  : data;  // Use props data when no filters
                
                // Show message if filters are active but no data returned
                if (hasFilters && !loading && (!displayData || displayData.length === 0)) {
                  const filterMessages = [];
                  if (selectedPromptId) {
                    const promptName = prompts.find(p => p.id === selectedPromptId)?.name || 'selected prompt';
                    filterMessages.push(`Prompt: ${promptName}`);
                  }
                  if (selectedVersionId) {
                    const version = promptVersions.find(v => v.id === selectedVersionId);
                    if (version) {
                      filterMessages.push(`Version: v${version.version_number}`);
                    }
                  }
                  if (startDate || endDate) {
                    if (startDate && endDate) {
                      filterMessages.push(`Period: ${startDate} to ${endDate}`);
                    } else if (startDate) {
                      filterMessages.push(`From: ${startDate}`);
                    } else if (endDate) {
                      filterMessages.push(`Until: ${endDate}`);
                    }
                  }
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <p className="text-sm font-medium">No data found for the selected filters</p>
                      {filterMessages.length > 0 && (
                        <p className="text-xs mt-1">{filterMessages.join(' • ')}</p>
                      )}
                    </div>
                  );
                }
                
                if (isComparing && compareData && displayData && displayData.length > 0) {
                  // Version comparison view
                  return (
                    <ComparisonFunnel
                      leftData={displayData}
                      rightData={compareData}
                      leftLabel={`v${promptVersions.find(v => v.id === selectedVersionId)?.version_number || '?'}`}
                      rightLabel={`v${promptVersions.find(v => v.id === compareVersionId)?.version_number || '?'}`}
                      onRemoveRight={stopComparison}
                    />
                  );
                } else if (displayData && displayData.length > 0) {
                  // Normal single funnel view - Modern Amplitude style
                  return <ModernFunnel data={displayData} />;
                } else if (!hasFilters) {
                  // No data and no filters - show generic message
                  return (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      <p>No funnel data available</p>
                    </div>
                  );
                }
              })()}
              
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="funnel-name-replace" className="text-xs">Funnel Name</Label>
                <Input
                  id="funnel-name-replace"
                  placeholder="e.g., Purchase Journey"
                  value={funnelName}
                  onChange={(e) => setFunnelName(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Funnel Steps (in order)</Label>
                <div className="space-y-1.5 mt-2">
                  {funnelSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <Badge variant="outline" className="w-8 justify-center text-[10px] h-6">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 relative">
                        <Input
                          placeholder={`Event name (e.g., ${index === 0 ? 'get_prompt' : index === 1 ? 'purchase' : 'signup'})`}
                          value={step}
                          onChange={(e) => updateStep(index, e.target.value)}
                          onFocus={() => setShowSuggestions(index)}
                          onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                          className="text-xs h-7"
                        />
                        {showSuggestions === index && (
                          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {/* Built-in events */}
                            <div className="p-1.5 border-b bg-gray-50">
                              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                <Lightbulb className="w-2.5 h-2.5" />
                                Built-in Events
                              </div>
                            </div>
                            {['get_prompt'].filter(name => name.toLowerCase().includes(step.toLowerCase())).map((eventName) => (
                              <button
                                key={eventName}
                                className="w-full text-left p-1.5 hover:bg-gray-50 border-b"
                                onClick={() => {
                                  updateStep(index, eventName);
                                  setShowSuggestions(null);
                                }}
                              >
                                <div className="font-medium text-xs">{eventName}</div>
                                <div className="text-[10px] text-gray-500">System event - prompt request</div>
                              </button>
                            ))}
                            {/* Custom event definitions */}
                            {eventDefinitions.length > 0 && (
                              <>
                                <div className="p-1.5 border-b bg-gray-50">
                                  <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                    <Lightbulb className="w-2.5 h-2.5" />
                                    Custom Events
                                  </div>
                                </div>
                                {eventDefinitions
                                  .filter(def => def.event_name.toLowerCase().includes(step.toLowerCase()))
                                  .map((definition) => (
                                    <button
                                      key={definition.id}
                                      className="w-full text-left p-1.5 hover:bg-gray-50 border-b last:border-b-0"
                                      onClick={() => {
                                        updateStep(index, definition.event_name);
                                        setShowSuggestions(null);
                                      }}
                                    >
                                      <div className="font-medium text-xs">{definition.event_name}</div>
                                      <div className="text-[10px] text-gray-500">{definition.category}</div>
                                      {definition.description && (
                                        <div className="text-[10px] text-gray-400 mt-0.5">{definition.description}</div>
                                      )}
                                    </button>
                                  ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {funnelSteps.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeStep(index)}
                          className="h-7 w-7 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  className="mt-1.5 text-xs h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Step
                </Button>
              </div>
              <div className="bg-blue-50 p-3 rounded border">
                <h4 className="font-medium text-blue-900 mb-1.5 text-sm">How it works:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Define the sequence of events that represent your conversion funnel</li>
                  <li>• Event names should match the event_name field from your tracked events</li>
                  <li>• The system will calculate conversion rates between each step</li>
                  <li>• This will replace your current funnel configuration</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateFunnel}
                  disabled={!funnelName || funnelSteps.some(step => !step.trim()) || loading}
                  className="text-xs h-7 px-3"
                >
                  {loading ? 'Saving...' : (editingConfiguration ? 'Update Funnel' : 'Save Funnel')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingConfiguration(null);
                    setFunnelName('');
                    setFunnelSteps(['get_prompt', '']);
                  }}
                  className="text-xs h-7 px-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}