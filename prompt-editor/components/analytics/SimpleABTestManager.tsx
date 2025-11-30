import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlayCircle, PauseCircle, Plus, Trash2, CheckCircle, XCircle, StopCircle,
  Trophy, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ABTest {
  id: string;
  name: string;
  prompt_id: string;
  prompt_name: string;
  version_a_id: string;
  version_a_name: string;
  version_b_id: string;
  version_b_name: string;
  total_requests: number;
  version_a_requests: number;
  version_b_requests: number;
  funnel_config_id?: string;
  funnel_config_name?: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

interface Prompt {
  id: string;
  name: string;
  slug: string;
  versions: PromptVersion[];
}

interface PromptVersion {
  id: string;
  version_number: number;
  status: string;
  created_at: string;
}

interface FunnelConfig {
  id: string;
  name: string;
  description?: string;
  event_steps: string[];
}

interface ABTestResults {
  test_id: string;
  test_name: string;
  status: string;
  prompt_name: string;
  version_a: { id: string; name: string; requests: number };
  version_b: { id: string; name: string; requests: number };
  total_requests: number;
  progress: number;
  funnel_results?: {
    funnel_name: string;
    steps: string[];
    version_a: Array<{ step: string; count: number; conversion_rate: number }>;
    version_b: Array<{ step: string; count: number; conversion_rate: number }>;
    final_conversion_a: number;
    final_conversion_b: number;
    conversion_rate_a: number;
    conversion_rate_b: number;
    winner?: 'A' | 'B' | null;
    lift?: number | null;
    statistical_significance: {
      confidence: number;
      is_significant: boolean;
      p_value: number;
      message: string;
    };
  };
  events_breakdown: Array<{
    event_type: string;
    version_a_count: number;
    version_b_count: number;
    version_a_rate: number;
    version_b_rate: number;
    diff_rate: number;
    winner?: 'A' | 'B' | null;
  }>;
}

export default function SimpleABTestManager() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [funnels, setFunnels] = useState<FunnelConfig[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ABTestResults>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    prompt_id: '',
    version_a_id: '',
    version_b_id: '',
    total_requests: 100,
    funnel_config_id: ''
  });

  useEffect(() => {
    loadTests();
    loadPrompts();
    loadFunnels();

    // Auto-refresh every 30 seconds to update test status
    const interval = setInterval(() => {
      loadTests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadTests = async () => {
    try {
      const data = await apiClient.request<ABTest[]>('/ab-tests-simple/test');
      setTests(data);
    } catch (error) {
      console.error('Failed to load A/B tests:', error);
    }
  };

  const loadPrompts = async () => {
    try {
      const data = await apiClient.request<Prompt[]>('/ab-tests-simple/test/prompts');
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const loadFunnels = async () => {
    try {
      const data = await apiClient.request<FunnelConfig[]>('/ab-tests-simple/test/funnels');
      setFunnels(data);
    } catch (error) {
      console.error('Failed to load funnels:', error);
    }
  };

  const loadTestResults = async (testId: string) => {
    try {
      const data = await apiClient.request<ABTestResults>(`/ab-tests-simple/test/${testId}/results`);
      setTestResults(prev => ({ ...prev, [testId]: data }));
    } catch (error) {
      console.error('Failed to load test results:', error);
    }
  };

  const toggleTestExpanded = async (testId: string) => {
    if (expandedTestId === testId) {
      setExpandedTestId(null);
    } else {
      setExpandedTestId(testId);
      // Load results if not already loaded
      if (!testResults[testId]) {
        await loadTestResults(testId);
      }
    }
  };

  const createTest = async () => {
    if (!formData.name || !formData.prompt_id || !formData.version_a_id || !formData.version_b_id) {
      alert('Please fill all fields');
      return;
    }

    if (formData.version_a_id === formData.version_b_id) {
      alert('Version A and Version B must be different');
      return;
    }

    setLoading(true);
    try {
      await apiClient.request('/ab-tests-simple/test', {
        method: 'POST',
        body: formData,
      });

      await loadTests();
      setShowCreateForm(false);
      setFormData({
        name: '',
        prompt_id: '',
        version_a_id: '',
        version_b_id: '',
        total_requests: 100,
        funnel_config_id: ''
      });
    } catch (error: any) {
      console.error('Failed to create A/B test:', error);
      alert(`Failed to create A/B test: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testId: string) => {
    setLoading(true);
    try {
      await apiClient.request(`/ab-tests-simple/test/${testId}/start`, { method: 'POST' });
      await loadTests();
    } catch (error: any) {
      console.error('Failed to start test:', error);
      alert(`Failed to start test: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const stopTest = async (testId: string) => {
    setLoading(true);
    try {
      await apiClient.request(`/ab-tests-simple/test/${testId}/stop`, { method: 'POST' });
      await loadTests();
    } catch (error: any) {
      console.error('Failed to stop test:', error);
      alert(`Failed to stop test: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const completeTest = async (testId: string) => {
    if (!confirm('Are you sure you want to complete this A/B test? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.request(`/ab-tests-simple/test/${testId}/complete`, { method: 'POST' });
      await loadTests();
    } catch (error: any) {
      console.error('Failed to complete test:', error);
      alert(`Failed to complete test: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this A/B test?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.request(`/ab-tests-simple/test/${testId}`, { method: 'DELETE' });
      await loadTests();
    } catch (error: any) {
      console.error('Failed to delete test:', error);
      alert(`Failed to delete test: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPrompt = () => {
    return prompts.find(p => p.id === formData.prompt_id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgress = (test: ABTest) => {
    const totalServed = test.version_a_requests + test.version_b_requests;
    return (totalServed / test.total_requests) * 100;
  };

  const formatPercentage = (part: number, total: number) => {
    if (total === 0) return '0%';
    return `${((part / total) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold">A/B Tests</h2>
          <p className="text-xs text-slate-600">
            Create simple A/B tests to compare two prompt versions with 50/50 traffic split
          </p>
        </div>
        <Button data-testid="ab-test-new-button" onClick={() => setShowCreateForm(true)} className="bg-black hover:bg-gray-800 text-xs h-7 px-2">
          <Plus className="w-3 h-3 mr-1" />
          New A/B Test
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium">Create New A/B Test</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3 space-y-3">
            <div>
              <Label htmlFor="test-name" className="text-sm">Test Name</Label>
              <Input
                id="test-name"
                data-testid="ab-test-name-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome Message Test"
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="prompt-select" className="text-sm">Select Prompt</Label>
              <select
                id="prompt-select"
                data-testid="ab-test-prompt-select"
                className="w-full h-9 px-3 text-sm border rounded-md"
                value={formData.prompt_id}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  prompt_id: e.target.value,
                  version_a_id: '',
                  version_b_id: ''
                }))}
              >
                <option value="">Choose a prompt...</option>
                {prompts.map(prompt => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.name} ({prompt.versions.length} versions)
                  </option>
                ))}
              </select>
            </div>

            {formData.prompt_id && getSelectedPrompt() && (
              <>
                <div>
                  <Label htmlFor="version-a" className="text-sm">Version A (Control)</Label>
                  <select
                    id="version-a"
                    data-testid="ab-test-version-a-select"
                    className="w-full h-9 px-3 text-sm border rounded-md"
                    value={formData.version_a_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, version_a_id: e.target.value }))}
                  >
                    <option value="">Choose Version A...</option>
                    {getSelectedPrompt()?.versions.map(version => (
                      <option key={version.id} value={version.id}>
                        Version {version.version_number} ({version.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="version-b" className="text-sm">Version B (Variant)</Label>
                  <select
                    id="version-b"
                    data-testid="ab-test-version-b-select"
                    className="w-full h-9 px-3 text-sm border rounded-md"
                    value={formData.version_b_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, version_b_id: e.target.value }))}
                  >
                    <option value="">Choose Version B...</option>
                    {getSelectedPrompt()?.versions.map(version => (
                      <option key={version.id} value={version.id}>
                        Version {version.version_number} ({version.status})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Success Metric - Funnel Selection */}
            <div>
              <Label htmlFor="funnel-select" className="text-sm flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                Success Metric (optional)
              </Label>
              <select
                id="funnel-select"
                className="w-full h-9 px-3 text-sm border rounded-md"
                value={formData.funnel_config_id}
                onChange={(e) => setFormData(prev => ({ ...prev, funnel_config_id: e.target.value }))}
              >
                <option value="">No funnel - show all events</option>
                {funnels.map(funnel => (
                  <option key={funnel.id} value={funnel.id}>
                    {funnel.name} ({funnel.event_steps.join(' → ')})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Select a funnel to compare conversion rates between versions
              </p>
            </div>

            <div>
              <Label htmlFor="total-requests" className="text-sm">Total Requests</Label>
              <Input
                id="total-requests"
                data-testid="ab-test-total-requests-input"
                type="number"
                value={formData.total_requests}
                onChange={(e) => setFormData(prev => ({ ...prev, total_requests: parseInt(e.target.value) || 100 }))}
                min={10}
                max={10000}
                step={10}
                className="h-9 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of requests to split 50/50 between versions
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                data-testid="ab-test-create-button"
                onClick={createTest}
                disabled={loading || !formData.name || !formData.prompt_id || !formData.version_a_id || !formData.version_b_id}
                className="h-8 text-sm px-4"
              >
                {loading ? 'Creating...' : 'Create Test'}
              </Button>
              <Button data-testid="ab-test-cancel-button" variant="outline" onClick={() => setShowCreateForm(false)} className="h-8 text-sm px-4">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests List */}
      <div className="space-y-2">
        {tests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground">No A/B tests created yet.</p>
              <p className="text-xs text-muted-foreground">Create your first test to start comparing prompt versions.</p>
            </CardContent>
          </Card>
        ) : (
          tests.map(test => (
            <Card key={test.id}>
              <CardHeader className="px-4 py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      {test.name}
                      <Badge className={`${getStatusColor(test.status)} text-xs px-1.5 py-0`}>
                        {test.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Prompt: {test.prompt_name}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {(test.status === 'draft' || test.status === 'paused') && (
                      <Button data-testid="ab-test-start-button" onClick={() => startTest(test.id)} size="sm" disabled={loading} className="h-7 text-xs px-2">
                        <PlayCircle className="w-3.5 h-3.5 mr-1" />
                        {test.status === 'paused' ? 'Resume' : 'Start'}
                      </Button>
                    )}
                    {test.status === 'running' && getProgress(test) < 100 && (
                      <Button onClick={() => stopTest(test.id)} size="sm" variant="secondary" disabled={loading} className="h-7 text-xs px-2">
                        <PauseCircle className="w-3.5 h-3.5 mr-1" />
                        Pause
                      </Button>
                    )}
                    {(test.status === 'running' || test.status === 'paused') && getProgress(test) < 100 && (
                      <Button onClick={() => completeTest(test.id)} size="sm" variant="outline" className="text-blue-600 hover:text-blue-700 h-7 text-xs px-2" disabled={loading}>
                        <StopCircle className="w-3.5 h-3.5 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button onClick={() => deleteTest(test.id)} size="sm" variant="outline" className="text-red-600 hover:text-red-700 h-7 w-7 p-0" disabled={loading}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-3 pt-0">
                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{test.version_a_requests + test.version_b_requests} / {test.total_requests} requests</span>
                  </div>
                  <Progress value={getProgress(test)} className="h-2" />
                </div>

                {/* Funnel info */}
                {test.funnel_config_name && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Success metric: <span className="font-medium text-foreground">{test.funnel_config_name}</span></span>
                  </div>
                )}

                {/* Version Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded"></div>
                      Version A ({test.version_a_name})
                    </div>
                    <div className="text-lg font-bold">{test.version_a_requests}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(test.version_a_requests, test.version_a_requests + test.version_b_requests)} of total
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded"></div>
                      Version B ({test.version_b_name})
                    </div>
                    <div className="text-lg font-bold">{test.version_b_requests}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(test.version_b_requests, test.version_a_requests + test.version_b_requests)} of total
                    </div>
                  </div>
                </div>

                {/* Status Info */}
                {test.status === 'completed' && (
                  <div className="mt-3 p-2 bg-muted rounded-md flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs">
                      Test completed.
                      {test.version_a_requests + test.version_b_requests > 0
                        ? ` ${test.version_a_requests + test.version_b_requests} requests served. Final split: ${formatPercentage(test.version_a_requests, test.version_a_requests + test.version_b_requests)} / ${formatPercentage(test.version_b_requests, test.version_a_requests + test.version_b_requests)}`
                        : ' No requests were served during this test.'
                      }
                    </span>
                  </div>
                )}

                {getProgress(test) >= 100 && test.status === 'running' && (
                  <div className="mt-3 p-2 bg-muted rounded-md flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-xs">
                      Test has reached the target number of requests. Future requests will use the production version.
                    </span>
                  </div>
                )}

                {/* Timestamps */}
                <div className="mt-3 text-xs text-muted-foreground">
                  Created: {new Date(test.created_at).toLocaleDateString()}
                  {test.started_at && ` • Started: ${new Date(test.started_at).toLocaleDateString()}`}
                  {test.ended_at && ` • Ended: ${new Date(test.ended_at).toLocaleDateString()}`}
                </div>

                {/* View Results Button */}
                {(test.status === 'running' || test.status === 'completed') && (test.version_a_requests + test.version_b_requests) > 0 && (
                  <button
                    onClick={() => toggleTestExpanded(test.id)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    {expandedTestId === test.id ? 'Hide Results' : 'View Results & Metrics'}
                    {expandedTestId === test.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}

                {/* Expanded Results Section */}
                {expandedTestId === test.id && testResults[test.id] && (
                  <div className="mt-3 pt-3 border-t space-y-4">
                    {/* Winner Banner */}
                    {testResults[test.id].funnel_results?.winner && (
                      <div className={`p-3 rounded-lg ${testResults[test.id].funnel_results?.winner === 'B' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex items-center gap-2">
                          <Trophy className={`w-5 h-5 ${testResults[test.id].funnel_results?.winner === 'B' ? 'text-green-600' : 'text-blue-600'}`} />
                          <div>
                            <div className="text-sm font-semibold">
                              Winner: Version {testResults[test.id].funnel_results?.winner}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {testResults[test.id].funnel_results?.lift !== null && testResults[test.id].funnel_results?.lift !== undefined && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                  +{testResults[test.id].funnel_results!.lift!.toFixed(1)}% lift in conversion
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Statistical Confidence Indicator */}
                    {testResults[test.id].funnel_results?.statistical_significance && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            Statistical Confidence
                          </span>
                          <span className={`font-semibold ${testResults[test.id].funnel_results!.statistical_significance.is_significant ? 'text-green-600' : 'text-yellow-600'}`}>
                            {testResults[test.id].funnel_results!.statistical_significance.confidence}%
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                              testResults[test.id].funnel_results!.statistical_significance.confidence >= 95 
                                ? 'bg-green-500' 
                                : testResults[test.id].funnel_results!.statistical_significance.confidence >= 80 
                                  ? 'bg-yellow-500' 
                                  : 'bg-gray-400'
                            }`}
                            style={{ width: `${testResults[test.id].funnel_results!.statistical_significance.confidence}%` }}
                          />
                          {/* 95% marker */}
                          <div className="absolute inset-y-0 left-[95%] w-px bg-black/30" />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>0%</span>
                          <span className="text-black/50">95% threshold</span>
                          <span>100%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {testResults[test.id].funnel_results!.statistical_significance.message}
                        </p>
                      </div>
                    )}

                    {/* Funnel Comparison */}
                    {testResults[test.id].funnel_results && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Funnel Comparison: {testResults[test.id].funnel_results!.funnel_name}</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-1.5 font-medium">Step</th>
                                <th className="text-right py-1.5 font-medium text-blue-600">Version A</th>
                                <th className="text-right py-1.5 font-medium text-green-600">Version B</th>
                                <th className="text-right py-1.5 font-medium">Diff</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testResults[test.id].funnel_results!.steps.map((step, idx) => {
                                const stepA = testResults[test.id].funnel_results!.version_a[idx];
                                const stepB = testResults[test.id].funnel_results!.version_b[idx];
                                const diff = stepB.conversion_rate - stepA.conversion_rate;
                                return (
                                  <tr key={`${step}-${idx}`} className="border-b last:border-b-0">
                                    <td className="py-1.5">{step}</td>
                                    <td className="text-right py-1.5 text-blue-600">{stepA.count} ({stepA.conversion_rate.toFixed(1)}%)</td>
                                    <td className="text-right py-1.5 text-green-600">{stepB.count} ({stepB.conversion_rate.toFixed(1)}%)</td>
                                    <td className={`text-right py-1.5 ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : ''}`}>
                                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* All Events Breakdown */}
                    {testResults[test.id].events_breakdown.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium">All Events Breakdown</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-1.5 font-medium">Event</th>
                                <th className="text-right py-1.5 font-medium text-blue-600">A</th>
                                <th className="text-right py-1.5 font-medium text-green-600">B</th>
                                <th className="text-right py-1.5 font-medium">Winner</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testResults[test.id].events_breakdown.map((event, idx) => (
                                <tr key={`${event.event_type}-${idx}`} className="border-b last:border-b-0">
                                  <td className="py-1.5">{event.event_type}</td>
                                  <td className="text-right py-1.5 text-blue-600">{event.version_a_count} ({event.version_a_rate}%)</td>
                                  <td className="text-right py-1.5 text-green-600">{event.version_b_count} ({event.version_b_rate}%)</td>
                                  <td className="text-right py-1.5">
                                    {event.winner && (
                                      <Badge variant="outline" className={`text-[10px] px-1 ${event.winner === 'B' ? 'text-green-600 border-green-300' : 'text-blue-600 border-blue-300'}`}>
                                        {event.winner}
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* No data message */}
                    {testResults[test.id].events_breakdown.length === 0 && !testResults[test.id].funnel_results && (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No events recorded yet for this test.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}