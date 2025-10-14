"use client"

import React from 'react';
import ABTestManager from '@/components/analytics/ABTestManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, HelpCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ABTestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptId = searchParams.get('promptId');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">A/B Testing</h1>
            <p className="text-muted-foreground">
              Test different prompt versions to optimize performance
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Help Card */}
      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertDescription>
          A/B testing helps you compare different prompt versions to find the most effective one.
          Create tests to measure success rates, conversion rates, and revenue impact.
        </AlertDescription>
      </Alert>

      {/* A/B Test Manager */}
      <ABTestManager promptId={promptId || ''} />
    </div>
  );
}