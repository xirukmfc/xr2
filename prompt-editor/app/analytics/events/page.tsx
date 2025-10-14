"use client"

import React, { useState } from 'react';
import EventDefinitionBuilder from '@/components/analytics/EventDefinitionBuilder';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, List, Code } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EventDefinition {
  event_name: string;
  category: string;
  description: string;
  required_fields: any[];
  optional_fields: any[];
  validation_rules: any[];
  success_criteria: any;
  alert_thresholds: any;
}

export default function EventsPage() {
  const router = useRouter();
  const [savedEvents, setSavedEvents] = useState<EventDefinition[]>([]);
  const [activeTab, setActiveTab] = useLocalStorage<string>("events-active-tab", "list");

  const handleSaveEvent = (definition: EventDefinition) => {
    setSavedEvents([...savedEvents, definition]);
    console.log('Event definition saved:', definition);
  };

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
            <h1 className="text-3xl font-bold">Event Definitions</h1>
            <p className="text-muted-foreground">
              Define custom events to track business outcomes from your prompts
            </p>
          </div>
        </div>
      </div>

      {/* Help Card */}
      <Alert>
        <Code className="h-4 w-4" />
        <AlertDescription>
          Event definitions specify what data to track when users interact with your prompts.
          Define required fields, validation rules, and success criteria for each event type.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Event List
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Saved Event Definitions</CardTitle>
            </CardHeader>
            <CardContent>
              {savedEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No event definitions created yet.
                  <br />
                  <Button
                    variant="link"
                    className="mt-2"
                  >
                    Create your first event definition
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedEvents.map((event, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{event.event_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          </div>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {event.category}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          <strong>Required fields:</strong> {event.required_fields.length}
                          <br />
                          <strong>Optional fields:</strong> {event.optional_fields.length}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder">
          <EventDefinitionBuilder onSave={handleSaveEvent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}