import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2, Lightbulb } from 'lucide-react';

// Custom smooth funnel component - Google Analytics style
const SmoothFunnel = ({ data, color = "#8884d8" }: { data: FunnelStep[], color?: string }) => {
  if (!data || data.length === 0) return null;

  const maxUsers = Math.max(...data.map(d => d.users));
  const height = 250;
  const svgWidth = 400;
  const padding = 20;
  const availableHeight = height - (padding * 2);
  const stepHeight = availableHeight / data.length;
  const gap = 2; // Gap between segments
  const cornerRadius = 4; // Rounded corners

  // Generate unique ID for gradients to avoid conflicts
  const gradientId = `funnelGradient-${color.replace('#', '')}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${svgWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.85" />
        </linearGradient>
        <filter id={`shadow-${color.replace('#', '')}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {data.map((step, index) => {
        const y = padding + (index * stepHeight);
        const actualStepHeight = stepHeight - gap;

        // Calculate widths based on user count (percentage of max)
        const widthPercent = (step.users / maxUsers) * 70 + 15; // 15-85%
        const nextWidthPercent = index < data.length - 1
          ? (data[index + 1].users / maxUsers) * 70 + 15
          : widthPercent * 0.7;

        const topWidth = (widthPercent / 100) * (svgWidth - padding * 2);
        const bottomWidth = (nextWidthPercent / 100) * (svgWidth - padding * 2);

        const x1 = (svgWidth - topWidth) / 2;
        const x2 = svgWidth - x1;
        const nextX1 = (svgWidth - bottomWidth) / 2;
        const nextX2 = svgWidth - nextX1;

        // Create trapezoid with rounded corners
        const path = `
          M ${x1 + cornerRadius} ${y}
          L ${x2 - cornerRadius} ${y}
          Q ${x2} ${y} ${x2} ${y + cornerRadius}
          L ${nextX2} ${y + actualStepHeight - cornerRadius}
          Q ${nextX2} ${y + actualStepHeight} ${nextX2 - cornerRadius} ${y + actualStepHeight}
          L ${nextX1 + cornerRadius} ${y + actualStepHeight}
          Q ${nextX1} ${y + actualStepHeight} ${nextX1} ${y + actualStepHeight - cornerRadius}
          L ${x1} ${y + cornerRadius}
          Q ${x1} ${y} ${x1 + cornerRadius} ${y}
          Z
        `;

        return (
          <g key={step.step}>
            <path
              d={path}
              fill={`url(#${gradientId})`}
              filter={`url(#shadow-${color.replace('#', '')})`}
              stroke="white"
              strokeWidth="0.5"
              opacity="0.95"
            />
            <text
              x={svgWidth / 2}
              y={y + actualStepHeight / 2 - 4}
              textAnchor="middle"
              fill="white"
              fontSize="15"
              fontWeight="700"
            >
              {step.users.toLocaleString()}
            </text>
            <text
              x={svgWidth / 2}
              y={y + actualStepHeight / 2 + 12}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="500"
              opacity="0.95"
            >
              {step.conversion_rate.toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
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

interface ABTest {
  id: string;
  name: string;
  status: string;
}

interface SplitFunnelData {
  ab_test_id: string;
  ab_test_name: string;
  prompt_name: string;
  version_a: {
    version_id: string;
    version_number: number;
    data: FunnelStep[];
  };
  version_b: {
    version_id: string;
    version_number: number;
    data: FunnelStep[];
  };
}

interface FunnelAnalysisProps {
  data?: FunnelStep[] | null;
  onFunnelChange?: (steps: string[]) => void;
}

export default function FunnelAnalysis({ data, onFunnelChange }: FunnelAnalysisProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [funnelName, setFunnelName] = useState('');
  const [funnelSteps, setFunnelSteps] = useState<string[]>(['', '']);
  const [savedConfigurations, setSavedConfigurations] = useState<CustomFunnelConfiguration[]>([]);
  const [currentConfiguration, setCurrentConfiguration] = useState<CustomFunnelConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const [completedABTests, setCompletedABTests] = useState<ABTest[]>([]);
  const [selectedABTestId, setSelectedABTestId] = useState<string>('');
  const [splitFunnelData, setSplitFunnelData] = useState<SplitFunnelData | null>(null);

  // Load saved configurations and event definitions on component mount
  useEffect(() => {
    loadSavedConfigurations();
    loadEventDefinitions();
    loadCompletedABTests();
  }, []);

  // Fetch split funnel data when A/B test is selected
  useEffect(() => {
    if (selectedABTestId && currentConfiguration) {
      fetchSplitFunnelData();
    } else {
      setSplitFunnelData(null);
    }
  }, [selectedABTestId, currentConfiguration]);

  const loadSavedConfigurations = async () => {
    try {
      const response = await fetch('http://localhost:8000/internal/custom-funnel-configurations/test');
      if (response.ok) {
        const configurations = await response.json();
        setSavedConfigurations(configurations);

        // Load the first active configuration if available
        const activeConfig = configurations.find((config: CustomFunnelConfiguration) => config.is_active);
        if (activeConfig && onFunnelChange) {
          setCurrentConfiguration(activeConfig);
          onFunnelChange(activeConfig.event_steps);
        }
      }
    } catch (error) {
      console.error('Failed to load saved funnel configurations:', error);
    }
  };

  const loadEventDefinitions = async () => {
    try {
      const response = await fetch('http://localhost:8000/internal/event-definitions/test');
      if (response.ok) {
        const definitions = await response.json();
        setEventDefinitions(definitions);
      }
    } catch (error) {
      console.error('Failed to load event definitions:', error);
    }
  };

  const loadCompletedABTests = async () => {
    try {
      const response = await fetch('http://localhost:8000/internal/ab-tests-simple/test');
      if (response.ok) {
        const tests = await response.json();
        const completed = tests.filter((test: ABTest) => test.status === 'completed');
        setCompletedABTests(completed);
      }
    } catch (error) {
      console.error('Failed to load completed A/B tests:', error);
    }
  };

  const fetchSplitFunnelData = async () => {
    if (!currentConfiguration || !selectedABTestId) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/internal/analytics/funnel-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_sequence: currentConfiguration.event_steps,
          ab_test_id: selectedABTestId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSplitFunnelData(data);
      } else {
        console.error('Failed to fetch split funnel data');
        setSplitFunnelData(null);
      }
    } catch (error) {
      console.error('Error fetching split funnel data:', error);
      setSplitFunnelData(null);
    } finally {
      setLoading(false);
    }
  };

  const saveFunnelConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/internal/custom-funnel-configurations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: funnelName,
          description: `Custom funnel with steps: ${funnelSteps.filter(step => step.trim()).join(' → ')}`,
          event_steps: funnelSteps.filter(step => step.trim())
        }),
      });

      if (response.ok) {
        const newConfiguration = await response.json();
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
      } else {
        const error = await response.json();
        console.error('Failed to save funnel configuration:', error);
        alert('Failed to save funnel configuration. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save funnel configuration:', error);
      alert('Failed to save funnel configuration. Please try again.');
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

  const deleteFunnelConfiguration = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this funnel configuration?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/internal/custom-funnel-configurations/test/${configId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setSavedConfigurations(prev => prev.filter(config => config.id !== configId));

        // If this was the current configuration, clear it
        if (currentConfiguration?.id === configId) {
          setCurrentConfiguration(null);
          if (onFunnelChange) {
            onFunnelChange([]); // Clear funnel steps
          }
        }
      } else {
        const error = await response.json();
        console.error('Failed to delete funnel configuration:', error);
        alert('Failed to delete funnel configuration. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete funnel configuration:', error);
      alert('Failed to delete funnel configuration. Please try again.');
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
    await saveFunnelConfiguration();
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
            <div>
              <CardTitle>Funnel Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">Create custom conversion funnels to track user journeys</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="bg-black hover:bg-gray-800" data-testid="open-create-funnel" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Funnel
            </Button>
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
                            placeholder={`Event name (e.g., ${index === 0 ? 'start' : index === 1 ? 'end' : 'buy'})`}
                            value={step}
                            onChange={(e) => updateStep(index, e.target.value)}
                            onFocus={() => setShowSuggestions(index)}
                            onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                          />
                          {showSuggestions === index && eventDefinitions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              <div className="p-2 border-b bg-gray-50">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Lightbulb className="w-3 h-3" />
                                  Event Definitions
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
                    {loading ? 'Saving...' : 'Create Funnel'}
                  </Button>
                  <Button
                    data-testid="cancel-funnel-button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFunnelName('');
                      setFunnelSteps(['', '']);
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

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <p className="text-xs text-muted-foreground">
              Current funnel: {currentConfiguration?.name || 'User Onboarding'}
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {savedConfigurations.length > 0 && (
              <select
                className="text-xs border rounded px-2 py-1"
                value={currentConfiguration?.id || ''}
                onChange={(e) => {
                  const config = savedConfigurations.find(c => c.id === e.target.value);
                  if (config) loadConfiguration(config);
                }}
              >
                <option value="">Select saved funnel...</option>
                {savedConfigurations.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            )}
            {completedABTests.length > 0 && currentConfiguration && (
              <select
                className="text-xs border rounded px-2 py-1 bg-purple-50"
                value={selectedABTestId}
                onChange={(e) => setSelectedABTestId(e.target.value)}
              >
                <option value="">No A/B Test Split</option>
                {completedABTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    A/B: {test.name}
                  </option>
                ))}
              </select>
            )}
            {currentConfiguration && (
              <Button
                onClick={() => deleteFunnelConfiguration(currentConfiguration.id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                disabled={loading}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            <Button onClick={() => setShowCreateForm(true)} variant="outline" size="sm" className="text-xs h-7 px-2">
              <Plus className="w-3 h-3 mr-1" />
              New Funnel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <>
              {splitFunnelData ? (
                // Split view for A/B test
                <div className="space-y-2">
                  <div className="text-center space-y-1">
                    <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">A/B Test: {splitFunnelData.ab_test_name}</Badge>
                    <p className="text-xs text-muted-foreground">
                      Prompt: <span className="font-medium">{splitFunnelData.prompt_name}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Version A */}
                    <div className="border-r pr-3">
                      <h3 className="text-sm font-semibold mb-2 text-blue-600 text-center">
                        Version {splitFunnelData.version_a.version_number}
                      </h3>
                      <div style={{ height: '200px' }}>
                        <SmoothFunnel data={splitFunnelData.version_a.data} color="#3b82f6" />
                      </div>

                      <div className="mt-2 space-y-1">
                        {splitFunnelData.version_a.data.map((step, index) => (
                          <div key={step.step} className="flex justify-between items-center p-1.5 bg-blue-50 rounded">
                            <div>
                              <div className="font-medium text-xs">{step.step}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {step.users.toLocaleString()} users
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xs">{step.conversion_rate.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Version B */}
                    <div className="pl-3">
                      <h3 className="text-sm font-semibold mb-2 text-green-600 text-center">
                        Version {splitFunnelData.version_b.version_number}
                      </h3>
                      <div style={{ height: '200px' }}>
                        <SmoothFunnel data={splitFunnelData.version_b.data} color="#10b981" />
                      </div>

                      <div className="mt-2 space-y-1">
                        {splitFunnelData.version_b.data.map((step, index) => (
                          <div key={step.step} className="flex justify-between items-center p-1.5 bg-green-50 rounded">
                            <div>
                              <div className="font-medium text-xs">{step.step}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {step.users.toLocaleString()} users
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xs">{step.conversion_rate.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Normal single funnel view
                <>
                  <SmoothFunnel data={data} color="#8884d8" />

                  <div className="mt-3 space-y-1.5">
                    {data.map((step, index) => (
                      <div key={step.step} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium text-xs">{step.step}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {step.users.toLocaleString()} users
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xs">{step.conversion_rate.toFixed(1)}%</div>
                          {index > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              Drop: {(data[index - 1].conversion_rate - step.conversion_rate).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                          placeholder={`Event name (e.g., ${index === 0 ? 'start' : index === 1 ? 'end' : 'buy'})`}
                          value={step}
                          onChange={(e) => updateStep(index, e.target.value)}
                          onFocus={() => setShowSuggestions(index)}
                          onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                          className="text-xs h-7"
                        />
                        {showSuggestions === index && eventDefinitions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                            <div className="p-1.5 border-b bg-gray-50">
                              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                <Lightbulb className="w-2.5 h-2.5" />
                                Event Definitions
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
              <div className="bg-blue-50 p-2 rounded border">
                <h4 className="font-medium text-blue-900 mb-1 text-xs">How it works:</h4>
                <ul className="text-[10px] text-blue-800 space-y-0.5">
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
                  {loading ? 'Saving...' : 'Save Funnel'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFunnelName('');
                    setFunnelSteps(['', '']);
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