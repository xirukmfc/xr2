import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlayCircle, PauseCircle, Plus, Trash2, CheckCircle, XCircle, StopCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function SimpleABTestManager() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    prompt_id: '',
    version_a_id: '',
    version_b_id: '',
    total_requests: 100
  });

  useEffect(() => {
    loadTests();
    loadPrompts();

    // Auto-refresh every 30 seconds to update test status
    const interval = setInterval(() => {
      loadTests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadTests = async () => {
    try {
      const response = await fetch('http://localhost:8000/internal/ab-tests-simple/test');
      if (response.ok) {
        const data = await response.json();
        setTests(data);
      }
    } catch (error) {
      console.error('Failed to load A/B tests:', error);
    }
  };

  const loadPrompts = async () => {
    try {
      const response = await fetch('http://localhost:8000/internal/ab-tests-simple/test/prompts');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
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
      const response = await fetch('http://localhost:8000/internal/ab-tests-simple/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadTests();
        setShowCreateForm(false);
        setFormData({
          name: '',
          prompt_id: '',
          version_a_id: '',
          version_b_id: '',
          total_requests: 100
        });
      } else {
        const error = await response.json();
        alert(`Failed to create A/B test: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      alert('Failed to create A/B test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/internal/ab-tests-simple/test/${testId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadTests();
      } else {
        const error = await response.json();
        alert(`Failed to start test: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to start test:', error);
      alert('Failed to start test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopTest = async (testId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/internal/ab-tests-simple/test/${testId}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadTests();
      } else {
        const error = await response.json();
        alert(`Failed to stop test: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to stop test:', error);
      alert('Failed to stop test. Please try again.');
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
      const response = await fetch(`http://localhost:8000/internal/ab-tests-simple/test/${testId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadTests();
      } else {
        const error = await response.json();
        alert(`Failed to complete test: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to complete test:', error);
      alert('Failed to complete test. Please try again.');
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
      const response = await fetch(`http://localhost:8000/internal/ab-tests-simple/test/${testId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTests();
      } else {
        const error = await response.json();
        alert(`Failed to delete test: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete test:', error);
      alert('Failed to delete test. Please try again.');
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Create New A/B Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-name">Test Name</Label>
              <Input
                id="test-name"
                data-testid="ab-test-name-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome Message Test"
              />
            </div>

            <div>
              <Label htmlFor="prompt-select">Select Prompt</Label>
              <select
                id="prompt-select"
                data-testid="ab-test-prompt-select"
                className="w-full p-2 border rounded-md"
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
                  <Label htmlFor="version-a">Version A (Control)</Label>
                  <select
                    id="version-a"
                    data-testid="ab-test-version-a-select"
                    className="w-full p-2 border rounded-md"
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
                  <Label htmlFor="version-b">Version B (Variant)</Label>
                  <select
                    id="version-b"
                    data-testid="ab-test-version-b-select"
                    className="w-full p-2 border rounded-md"
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

            <div>
              <Label htmlFor="total-requests">Total Requests</Label>
              <Input
                id="total-requests"
                data-testid="ab-test-total-requests-input"
                type="number"
                value={formData.total_requests}
                onChange={(e) => setFormData(prev => ({ ...prev, total_requests: parseInt(e.target.value) || 100 }))}
                min={10}
                max={10000}
                step={10}
              />
              <p className="text-xs text-slate-600 mt-1">
                Number of requests to split 50/50 between versions
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                data-testid="ab-test-create-button"
                onClick={createTest}
                disabled={loading || !formData.name || !formData.prompt_id || !formData.version_a_id || !formData.version_b_id}
              >
                {loading ? 'Creating...' : 'Create Test'}
              </Button>
              <Button data-testid="ab-test-cancel-button" variant="outline" onClick={() => setShowCreateForm(false)}>
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
            <CardContent className="text-center py-8">
              <p className="text-slate-600">No A/B tests created yet.</p>
              <p className="text-xs text-slate-600">Create your first test to start comparing prompt versions.</p>
            </CardContent>
          </Card>
        ) : (
          tests.map(test => (
            <Card key={test.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      {test.name}
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-slate-600">
                      Prompt: {test.prompt_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(test.status === 'draft' || test.status === 'paused') && (
                      <Button data-testid="ab-test-start-button" onClick={() => startTest(test.id)} size="sm" disabled={loading}>
                        <PlayCircle className="w-4 h-4 mr-1" />
                        {test.status === 'paused' ? 'Resume' : 'Start'}
                      </Button>
                    )}
                    {test.status === 'running' && getProgress(test) < 100 && (
                      <Button onClick={() => stopTest(test.id)} size="sm" variant="secondary" disabled={loading}>
                        <PauseCircle className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {(test.status === 'running' || test.status === 'paused') && getProgress(test) < 100 && (
                      <Button onClick={() => completeTest(test.id)} size="sm" variant="outline" className="text-blue-600 hover:text-blue-700" disabled={loading}>
                        <StopCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button onClick={() => deleteTest(test.id)} size="sm" variant="outline" className="text-red-600 hover:text-red-700" disabled={loading}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{test.version_a_requests + test.version_b_requests} / {test.total_requests} requests</span>
                  </div>
                  <Progress value={getProgress(test)} />
                </div>

                {/* Version Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded"></div>
                      Version A ({test.version_a_name})
                    </div>
                    <div className="text-lg font-bold">{test.version_a_requests}</div>
                    <div className="text-xs text-slate-600">
                      {formatPercentage(test.version_a_requests, test.version_a_requests + test.version_b_requests)} of total
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded"></div>
                      Version B ({test.version_b_name})
                    </div>
                    <div className="text-lg font-bold">{test.version_b_requests}</div>
                    <div className="text-xs text-slate-600">
                      {formatPercentage(test.version_b_requests, test.version_a_requests + test.version_b_requests)} of total
                    </div>
                  </div>
                </div>

                {/* Status Info */}
                {test.status === 'completed' && (
                  <Alert className="mt-2">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Test completed! All {test.total_requests} requests have been served.
                      {test.version_a_requests === test.version_b_requests
                        ? ' Perfect 50/50 split achieved.'
                        : ` Final split: ${formatPercentage(test.version_a_requests, test.total_requests)} / ${formatPercentage(test.version_b_requests, test.total_requests)}`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                {getProgress(test) >= 100 && test.status === 'running' && (
                  <Alert className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Test has reached the target number of requests. Future requests will use the production version.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Timestamps */}
                <div className="mt-4 text-xs text-muted-foreground">
                  Created: {new Date(test.created_at).toLocaleDateString()}
                  {test.started_at && ` • Started: ${new Date(test.started_at).toLocaleDateString()}`}
                  {test.ended_at && ` • Ended: ${new Date(test.ended_at).toLocaleDateString()}`}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}