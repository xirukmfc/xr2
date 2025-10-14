"use client"

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

interface PromptAnalyticsButtonProps {
  promptId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function PromptAnalyticsButton({
  promptId,
  variant = "outline",
  size = "sm"
}: PromptAnalyticsButtonProps) {
  return (
    <Link href={`/analytics/dashboard?promptId=${promptId}`}>
      <Button variant={variant} size={size}>
        <BarChart3 className="h-4 w-4 mr-2" />
        Analytics
      </Button>
    </Link>
  );
}