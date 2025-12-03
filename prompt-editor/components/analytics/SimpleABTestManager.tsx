import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlayCircle, PauseCircle, Plus, Trash2, CheckCircle, XCircle, StopCircle,
  Trophy, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp, Info, TestTube, Search
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

interface SimpleABTestManagerProps {
  showCreateButton?: boolean;
  externalShowCreateForm?: boolean;
  onCreateFormClose?: () => void;
  showTestsList?: boolean;
  onNewClick?: () => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onDeleteClick?: (testId: string) => void;
}

export default function SimpleABTestManager({
  showCreateButton = true,
  externalShowCreateForm,
  onCreateFormClose,
  showTestsList = true,
  onNewClick,
  showNotification,
  onDeleteClick
}: SimpleABTestManagerProps = {}) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [funnels, setFunnels] = useState<FunnelConfig[]>([]);
  const [internalShowCreateForm, setInternalShowCreateForm] = useState(false);
  const showCreateForm = externalShowCreateForm !== undefined ? externalShowCreateForm : internalShowCreateForm;
  const setShowCreateForm = (value: boolean) => {
    setInternalShowCreateForm(value);
    if (!value && onCreateFormClose) {
      onCreateFormClose();
    }
  };
  const [loading, setLoading] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [collapsedTests, setCollapsedTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, ABTestResults>>({});
  const [searchTerm, setSearchTerm] = useState('');

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

  // Load results for all tests to show confidence and winner
  useEffect(() => {
    tests.forEach(test => {
      if ((test.status === 'running' || test.status === 'completed') &&
          (test.version_a_requests + test.version_b_requests) > 0 &&
          !testResults[test.id]) {
        loadTestResults(test.id);
      }
    });
  }, [tests]);

  // Collapse all tests initially when they load
  useEffect(() => {
    if (tests.length > 0 && collapsedTests.size === 0) {
      const allTestIds = new Set(tests.map(t => t.id));
      setCollapsedTests(allTestIds);
    }
  }, [tests]);

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
      // Prepare request body, excluding empty funnel_config_id
      const requestBody: any = {
        name: formData.name,
        prompt_id: formData.prompt_id,
        version_a_id: formData.version_a_id,
        version_b_id: formData.version_b_id,
        total_requests: formData.total_requests,
      };

      // Only include funnel_config_id if it's not empty
      if (formData.funnel_config_id && formData.funnel_config_id.trim()) {
        requestBody.funnel_config_id = formData.funnel_config_id;
      }

      await apiClient.request('/ab-tests-simple/test', {
        method: 'POST',
        body: requestBody,
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

      // Show success notification
      if (showNotification) {
        showNotification('A/B test created successfully', 'success');
      }
    } catch (error: any) {
      console.error('Failed to create A/B test:', error);
      if (showNotification) {
        showNotification(`Failed to create A/B test: ${error.message || 'Unknown error'}`, 'error');
      } else {
        alert(`Failed to create A/B test: ${error.message || 'Unknown error'}`);
      }
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
    // If onDeleteClick is provided, use it (will trigger confirmation modal)
    if (onDeleteClick) {
      onDeleteClick(testId);
      return;
    }

    // Fallback to confirm dialog if onDeleteClick is not provided
    if (!confirm('Are you sure you want to delete this A/B test?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.request(`/ab-tests-simple/test/${testId}`, { method: 'DELETE' });
      await loadTests();

      // Show success notification
      if (showNotification) {
        showNotification('A/B test deleted successfully', 'success');
      }
    } catch (error: any) {
      console.error('Failed to delete test:', error);
      if (showNotification) {
        showNotification('Failed to delete A/B test', 'error');
      } else {
        alert(`Failed to delete test: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPrompt = () => {
    return prompts.find(p => p.id === formData.prompt_id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-slate-700';
      case 'paused': return 'bg-slate-500';
      case 'completed': return 'bg-slate-600';
      case 'draft': return 'bg-slate-400';
      case 'cancelled': return 'bg-slate-500';
      default: return 'bg-slate-400';
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

  const toggleTestCollapsed = (testId: string) => {
    const newCollapsed = new Set(collapsedTests);
    if (newCollapsed.has(testId)) {
      newCollapsed.delete(testId);
    } else {
      newCollapsed.add(testId);
    }
    setCollapsedTests(newCollapsed);
  };

  // Filter tests by search term
  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.prompt_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-0">
      {/* Filters Block */}
      {showCreateButton && (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by test name or prompt name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Button
                data-testid="ab-test-new-button"
                onClick={() => onNewClick ? onNewClick() : setShowCreateForm(true)}
                size="sm"
                className="bg-black hover:bg-gray-800 text-xs h-9 px-3 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spacing between filters and content */}
      {showCreateButton && <div className="h-4"></div>}

      {/* Create Form */}
      {showCreateForm && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-name" className="text-sm">Test Name</Label>
              <Input
                id="test-name"
                data-testid="ab-test-name-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome Message Test"
                className="h-9 text-sm mt-2"
              />
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
                className="h-9 text-sm mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="prompt-select" className="text-sm">Select Prompt</Label>
            <select
              id="prompt-select"
              data-testid="ab-test-prompt-select"
              className="w-full h-9 px-3 text-sm border rounded-md mt-2"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="version-a" className="text-sm">Version A (Control)</Label>
                <select
                  id="version-a"
                  data-testid="ab-test-version-a-select"
                  className="w-full h-9 px-3 text-sm border rounded-md mt-2"
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
                  className="w-full h-9 px-3 text-sm border rounded-md mt-2"
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
            </div>
          )}

          <div>
            <Label htmlFor="funnel-select" className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Success Metric (optional)
            </Label>
            <select
              id="funnel-select"
              className="w-full h-9 px-3 text-sm border rounded-md mt-2"
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
            <p className="text-xs text-muted-foreground mt-2">
              Select a funnel to compare conversion rates between versions
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              data-testid="ab-test-create-button"
              onClick={createTest}
              disabled={loading || !formData.name || !formData.prompt_id || !formData.version_a_id || !formData.version_b_id}
              size="default"
              className="bg-black hover:bg-gray-800 text-white"
            >
              {loading ? 'Creating...' : 'Create Test'}
            </Button>
            <Button
              data-testid="ab-test-cancel-button"
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              size="default"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Tests List - Table Format */}
      {showTestsList && (
      <div>
        {filteredTests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                {tests.length === 0
                  ? 'No A/B tests created yet.'
                  : 'No tests found matching your search.'}
              </p>
              {tests.length === 0 && (
                <p className="text-xs text-muted-foreground">Create your first test to start comparing prompt versions.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Test Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Prompt</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Progress</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Versions</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Confidence</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Winner</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map(test => {
                    const isExpanded = expandedTestId === test.id;
                    return (
                      <React.Fragment key={test.id}>
                        <tr
                          className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => toggleTestExpanded(test.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">{test.name}</div>
                            {test.funnel_config_name && (
                              <div className="text-xs text-muted-foreground">Metric: {test.funnel_config_name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{test.prompt_name}</td>
                          <td className="px-4 py-3">
                            <Badge className={`${getStatusColor(test.status)} text-xs px-2 py-0.5`}>
                              {test.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-[80px]">
                                <Progress value={getProgress(test)} className="h-1.5 bg-muted [&>div]:bg-foreground/20" />
                              </div>
                              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                {test.version_a_requests + test.version_b_requests}/{test.total_requests}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {test.version_a_name} / {test.version_b_name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {testResults[test.id]?.funnel_results?.statistical_significance ? (
                              <span className={`font-medium tabular-nums ${
                                testResults[test.id].funnel_results!.statistical_significance.confidence >= 95
                                  ? 'text-green-600'
                                  : testResults[test.id].funnel_results!.statistical_significance.confidence >= 80
                                    ? 'text-yellow-600'
                                    : 'text-muted-foreground'
                              }`}>
                                {testResults[test.id].funnel_results!.statistical_significance.confidence}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {testResults[test.id]?.funnel_results?.winner ? (
                              <div className="flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5 text-yellow-600" />
                                <span className="font-medium">
                                  Version {testResults[test.id].funnel_results!.winner}
                                </span>
                                {testResults[test.id].funnel_results!.lift !== null && (
                                  <span className="text-xs text-green-600">
                                    +{testResults[test.id].funnel_results!.lift!.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-0.5 justify-end">
                              {(test.status === 'draft' || test.status === 'paused') && (
                                <Button data-testid="ab-test-start-button" onClick={() => startTest(test.id)} size="sm" variant="ghost" disabled={loading} className="h-7 w-7 p-0" title={test.status === 'paused' ? 'Resume' : 'Start'}>
                                  <PlayCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {test.status === 'running' && getProgress(test) < 100 && (
                                <Button onClick={() => stopTest(test.id)} size="sm" variant="ghost" disabled={loading} className="h-7 w-7 p-0" title="Pause">
                                  <PauseCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {(test.status === 'running' || test.status === 'paused') && getProgress(test) < 100 && (
                                <Button onClick={() => completeTest(test.id)} size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={loading} title="Complete">
                                  <StopCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button onClick={() => deleteTest(test.id)} size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={loading} title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && testResults[test.id] && (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 bg-muted/20 border-b">
                              <div className="space-y-4">
                                {/* Expanded Results Section */}
                  <div className="mt-3 pt-3 border-t space-y-4">
                    {/* Winner Banner */}
                    {testResults[test.id].funnel_results?.winner && (
                      <div className="p-3 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          <div>
                            <div className="text-sm font-semibold">
                              Winner: Version {testResults[test.id].funnel_results?.winner}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {testResults[test.id].funnel_results?.lift !== null && testResults[test.id].funnel_results?.lift !== undefined && (
                                <span className="flex items-center gap-2">
                                  <TrendingUp className="w-3.5 h-3.5" />
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
                          <span className="font-medium flex items-center gap-2">
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
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span className="text-black/50">95% threshold</span>
                          <span>100%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
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
                                      <Badge variant="outline" className={`text-xs px-2 ${event.winner === 'B' ? 'text-green-600 border-green-300' : 'text-blue-600 border-blue-300'}`}>
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
                                </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
      )}
    </div>
  );
}