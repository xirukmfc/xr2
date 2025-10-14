import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlayCircle, PauseCircle, Trophy,
  TrendingUp, AlertTriangle, Beaker
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

interface ABTest {
  id: string;
  name: string;
  prompt_id: string;
  control_version_id: string;
  variant_version_ids: string[];
  traffic_allocation: Record<string, number>;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  metrics_to_track: string[];
  current_sample_size: number;
  sample_size_target: number;
  statistical_significance?: number;
  winner_version_id?: string;
  started_at?: string;
  results?: {
    control: TestResults;
    variants: Record<string, TestResults>;
  };
}

interface TestResults {
  sample_size: number;
  success_rate: number;
  conversion_rate: number;
  avg_revenue: number;
  confidence_interval: [number, number];
}

export default function ABTestManager({ promptId }: { promptId: string }) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingTest, setCreatingTest] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    control_version_id: '',
    variant_version_ids: [''],
    traffic_allocation: { control: 50, variant_a: 50 },
    metrics_to_track: ['success_rate', 'conversion_rate', 'revenue'],
    sample_size_target: 1000
  });

  useEffect(() => {
    void fetchTests();
  }, [promptId]);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/internal/ab-tests?prompt_id=${promptId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testId: string) => {
    try {
      const response = await fetch(`/internal/ab-tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchTests();
      }
    } catch (error) {
      console.error('Failed to start test:', error);
    }
  };

  const stopTest = async (testId: string) => {
    try {
      const response = await fetch(`/internal/ab-tests/${testId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        await fetchTests();
      }
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  const TestResultsCard = ({ test }: { test: ABTest }) => {
    if (!test.results) return null;

    const control = test.results.control;
    const bestVariant = Object.entries(test.results.variants)
      .reduce((best, [id, results]) =>
        results.success_rate > best.results.success_rate ? { id, results } : best,
        { id: 'control', results: control }
      );

    const improvement = bestVariant.id !== 'control'
      ? ((bestVariant.results.success_rate - control.success_rate) / control.success_rate) * 100
      : 0;

    return (
      <Card className={test.winner_version_id ? 'border-green-500' : ''}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{test.name}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant={
                  test.status === 'running' ? 'default' :
                  test.status === 'completed' ? 'default' : 'secondary'
                }>
                  {test.status}
                </Badge>
                {test.statistical_significance && (
                  <Badge variant="outline">
                    {(test.statistical_significance * 100).toFixed(1)}% significance
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {test.status === 'draft' && (
                <Button onClick={() => startTest(test.id)} size="sm">
                  <PlayCircle className="h-4 w-4 mr-1" /> Start
                </Button>
              )}
              {test.status === 'running' && (
                <Button onClick={() => stopTest(test.id)} size="sm" variant="secondary">
                  <PauseCircle className="h-4 w-4 mr-1" /> Stop
                </Button>
              )}
              {test.winner_version_id && (
                <Badge className="bg-green-500">
                  <Trophy className="h-4 w-4 mr-1" /> Winner Found
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Sample Progress</span>
              <span>{test.current_sample_size} / {test.sample_size_target}</span>
            </div>
            <Progress
              value={(test.current_sample_size / test.sample_size_target) * 100}
            />
          </div>

          {/* Results Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Control */}
            <div className="space-y-2">
              <div className="font-medium">Control</div>
              <div className="text-2xl font-bold">
                {control.success_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {control.sample_size} samples
              </div>
              <div className="text-xs text-muted-foreground">
                CI: [{control.confidence_interval[0].toFixed(1)}%, {control.confidence_interval[1].toFixed(1)}%]
              </div>
            </div>

            {/* Variants */}
            {Object.entries(test.results.variants).map(([id, results]) => (
              <div key={id} className="space-y-2">
                <div className="font-medium">Variant {id}</div>
                <div className="text-2xl font-bold">
                  {results.success_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {results.sample_size} samples
                </div>
                <div className="text-xs text-muted-foreground">
                  CI: [{results.confidence_interval[0].toFixed(1)}%, {results.confidence_interval[1].toFixed(1)}%]
                </div>
                {id === bestVariant.id && improvement > 0 && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{improvement.toFixed(1)}%
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Recommendation */}
          {test.status === 'running' && test.statistical_significance && test.statistical_significance > 0.95 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Test has reached statistical significance.
                {bestVariant.id !== 'control'
                  ? ` Variant ${bestVariant.id} is performing ${improvement.toFixed(1)}% better than control.`
                  : ' Control is performing best.'}
                Consider stopping the test and implementing the winner.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  // Loading State
  if (loading) {
    return <LoadingState message="Loading A/B tests..." />
  }

  // Error State
  if (error) {
    return (
      <ErrorState
        title="Failed to load A/B tests"
        message={error}
        onRetry={fetchTests}
      />
    )
  }

  // Empty State
  const hasNoTests = tests.length === 0 && !creatingTest;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">A/B Tests</h2>
        <Button onClick={() => setCreatingTest(true)}>
          Create New Test
        </Button>
      </div>

      {hasNoTests ? (
        <EmptyState
          icon={Beaker}
          title="No A/B tests yet"
          description="Create your first A/B test to compare different versions of your prompts and find what works best."
          actionLabel="Create First Test"
          onAction={() => setCreatingTest(true)}
        />
      ) : (
        <>
          {/* Active Tests */}
          <div className="space-y-4">
            {tests.filter(t => t.status === 'running').map(test => (
              <TestResultsCard key={test.id} test={test} />
            ))}
          </div>

          {/* Completed Tests */}
          {tests.filter(t => t.status === 'completed').length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Completed Tests</h3>
              {tests.filter(t => t.status === 'completed').map(test => (
                <TestResultsCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </>
      )}

      {/* New Test Creator */}
      {creatingTest && (
        <Card>
          <CardHeader>
            <CardTitle>Create A/B Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-name">Test Name</Label>
              <Input
                id="test-name"
                value={newTest.name}
                onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Shorter vs Longer Welcome Message"
              />
            </div>

            <div>
              <Label>Traffic Allocation</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-4">
                  <span className="w-20">Control:</span>
                  <Slider
                    value={[newTest.traffic_allocation.control]}
                    onValueChange={(value: number[]) => {
                      setNewTest(prev => ({
                        ...prev,
                        traffic_allocation: {
                          control: value[0],
                          variant_a: 100 - value[0]
                        }
                      }));
                    }}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{newTest.traffic_allocation.control}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-20">Variant A:</span>
                  <div className="flex-1 bg-muted rounded h-2" />
                  <span className="w-12 text-right">{newTest.traffic_allocation.variant_a}%</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="sample-size">Target Sample Size</Label>
              <Input
                id="sample-size"
                type="number"
                value={newTest.sample_size_target}
                onChange={(e) => setNewTest(prev => ({
                  ...prev,
                  sample_size_target: parseInt(e.target.value)
                }))}
                min={100}
                step={100}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Estimated time to complete: {Math.ceil(newTest.sample_size_target / 100)} days
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => {
                // Create test logic
                setCreatingTest(false);
              }}>
                Create Test
              </Button>
              <Button variant="outline" onClick={() => setCreatingTest(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}