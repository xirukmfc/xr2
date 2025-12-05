"use client"

import React, { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import useLocalStorage from "@/hooks/useLocalStorage"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { NotificationProvider, useNotification } from "@/components/notification-provider"
import ABTestManager from '@/components/analytics/ABTestManager';
import SimpleABTestManager from '@/components/analytics/SimpleABTestManager';
import EventDefinitionBuilder, { type EventDefinition } from '@/components/analytics/EventDefinitionBuilder';
import NewEventModal from '@/components/analytics/NewEventModal';
import SimpleEventsTable from '@/components/analytics/SimpleEventsTable';
import RecentEventsTable from '@/components/analytics/RecentEventsTable';
import FunnelAnalysis from '@/components/analytics/FunnelAnalysis';
import PromptEventsViewer from '@/components/analytics/PromptEventsViewer';
import { apiClient } from '@/lib/api';
import { BarChart3, TestTube, Settings, FileText, Plus } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';

const subsections = [
  { id: "recent-events", labelKey: "analytics.tabs.recentEvents", icon: FileText },
  { id: "prompt-events", labelKey: "analytics.tabs.prompts", icon: FileText },
  { id: "funnel", labelKey: "analytics.tabs.funnels", icon: BarChart3 },
  { id: "ab-tests", labelKey: "analytics.tabs.abTests", icon: TestTube },
  { id: "events", labelKey: "analytics.tabs.defineEvents", icon: Settings },
]

function AnalyticsPageContent() {
  const [activeSubsection, setActiveSubsection] = useLocalStorage<string>("analytics-active-tab", "recent-events")
  const { showNotification } = useNotification()
  const { t } = useLocale()

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [showDeleteFunnelModal, setShowDeleteFunnelModal] = useState(false)
  const [deletingFunnelId, setDeletingFunnelId] = useState<string | null>(null)
  const [showABTestModal, setShowABTestModal] = useState(false)
  const [showDeleteABTestModal, setShowDeleteABTestModal] = useState(false)
  const [deletingABTestId, setDeletingABTestId] = useState<string | null>(null)
  const [showFunnelModal, setShowFunnelModal] = useState(false)
  const [showEditFunnelModal, setShowEditFunnelModal] = useState(false)
  const [editingFunnelConfig, setEditingFunnelConfig] = useState<any>(null)
  const [funnelKey, setFunnelKey] = useState(0) // Key to force re-render
  const [abTestKey, setAbTestKey] = useState(0) // Key to force re-render A/B tests
  const [eventsKey, setEventsKey] = useState(0) // Key to force re-render events

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [customFunnelSteps, setCustomFunnelSteps] = useState<string[]>([])
  
  // Funnel filters
  const [funnelPromptId, setFunnelPromptId] = useState<string | null>(null)
  const [funnelVersionId, setFunnelVersionId] = useState<string | null>(null)

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;

    try {
      await apiClient.request(`/event-definitions/${deletingEventId}`, {
        method: 'DELETE'
      });
      setShowDeleteEventModal(false);
      setDeletingEventId(null);
      showNotification(t('analytics.notifications.eventDeletedSuccess'), 'success');
      // Force re-render to reload events
      setEventsKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete event:', error);
      showNotification(t('analytics.notifications.eventDeletedError'), 'error');
    }
  }

  // Handle funnel deletion
  const handleDeleteFunnel = async () => {
    if (!deletingFunnelId) return;

    try {
      await apiClient.request(`/custom-funnel-configurations/test/${deletingFunnelId}`, {
        method: 'DELETE'
      });
      setShowDeleteFunnelModal(false);
      setDeletingFunnelId(null);
      showNotification(t('analytics.notifications.funnelDeletedSuccess'), 'success');
      // Refresh to reload funnels
      setFunnelKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete funnel:', error);
      showNotification(t('analytics.notifications.funnelDeletedError'), 'error');
    }
  }

  // Handle A/B test deletion
  const handleDeleteABTest = async () => {
    if (!deletingABTestId) return;

    try {
      await apiClient.request(`/ab-tests-simple/test/${deletingABTestId}`, {
        method: 'DELETE'
      });
      setShowDeleteABTestModal(false);
      setDeletingABTestId(null);
      showNotification(t('analytics.notifications.abTestDeletedSuccess'), 'success');
      // Refresh to reload tests
      setAbTestKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete A/B test:', error);
      showNotification(t('analytics.notifications.abTestDeletedError'), 'error');
    }
  }

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const data = await apiClient.request('/analytics/dashboard?period=30d');
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        // Set empty data as fallback
        setAnalyticsData({
          recent_events: []
        });
      }
    };

    fetchAnalyticsData();
  }, []);

  // Calculate funnel data from analytics data using custom steps
  const funnelData = React.useMemo(() => {
    if (!analyticsData?.recent_events || customFunnelSteps.length === 0) return null;

    let events = analyticsData.recent_events;

    // Apply filters first
    if (funnelPromptId) {
      events = events.filter((e: any) => e.prompt_id === funnelPromptId);
    }

    if (funnelVersionId) {
      events = events.filter((e: any) => e.prompt_version_id === funnelVersionId);
    }

    // OPTIMIZATION: Group events by type once, instead of filtering for each step
    const eventsByType: Record<string, number> = {};

    // Handle aliases upfront
    const aliases: Record<string, string[]> = {
      'get_prompt': ['get_prompt', 'prompt_request'],
      'prompt_request': ['get_prompt', 'prompt_request'],
    };

    events.forEach((event: any) => {
      const eventType = event.event_type?.toLowerCase();
      const metadataEventName = event.event_metadata?.event_name?.toLowerCase();

      // Count by event_type
      if (eventType) {
        eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
      }

      // Count by metadata event_name
      if (metadataEventName && metadataEventName !== eventType) {
        eventsByType[metadataEventName] = (eventsByType[metadataEventName] || 0) + 1;
      }
    });

    // Build result using pre-computed counts
    const result = [];
    let firstStepCount = 0;

    for (let i = 0; i < customFunnelSteps.length; i++) {
      const stepName = customFunnelSteps[i];
      const stepLower = stepName?.toLowerCase() || '';

      // Get count using aliases
      const stepVariants = aliases[stepLower] || [stepLower];
      const stepEvents = stepVariants.reduce((sum, variant) =>
        sum + (eventsByType[variant] || 0), 0
      );

      if (i === 0) {
        firstStepCount = stepEvents;
      }

      // Calculate conversion rate
      const conversionRate = firstStepCount > 0 ? (stepEvents / firstStepCount) * 100 : 0;

      result.push({
        step: stepName.charAt(0).toUpperCase() + stepName.slice(1),
        users: stepEvents,
        conversion_rate: i === 0 ? 100 : conversionRate
      });
    }

    return result;
  }, [analyticsData, customFunnelSteps, funnelPromptId, funnelVersionId]);


  const renderABTestsSection = () => (
    <div className="space-y-4">
      <SimpleABTestManager
        key={abTestKey}
        showCreateButton={true}
        onNewClick={() => setShowABTestModal(true)}
        showNotification={showNotification}
        onDeleteClick={(testId: string) => {
          setDeletingABTestId(testId);
          setShowDeleteABTestModal(true);
        }}
      />
    </div>
  )

  const renderEventsSection = () => (
    <div className="space-y-4">
      <EventDefinitionBuilder
        key={eventsKey}
        onSave={(definition) => {
          console.log('Saving event definition:', definition);
        }}
        showCreateButton={true}
        onNewClick={() => {
          setEditingEvent(null);
          setShowEventModal(true);
        }}
        onEditClick={(event: EventDefinition) => {
          setEditingEvent(event);
          setShowEventModal(true);
        }}
        onDeleteClick={(eventId: string) => {
          setDeletingEventId(eventId);
          setShowDeleteEventModal(true);
        }}
        showNotification={showNotification}
      />
    </div>
  )

  const renderRecentEventsSection = () => (
    <div className="space-y-4">
      <RecentEventsTable />
    </div>
  )

  const renderFunnelSection = () => {
    return (
      <>
        <FunnelAnalysis
          key={funnelKey}
          data={funnelData}
          onFunnelChange={(steps) => setCustomFunnelSteps(steps)}
          onFilterChange={(promptId, versionId) => {
            setFunnelPromptId(promptId);
            setFunnelVersionId(versionId);
          }}
          showCreateButton={false}
          renderFiltersSeparately={true}
          onNewClick={() => setShowFunnelModal(true)}
          externalShowEditForm={showEditFunnelModal}
          onEditFormClose={() => {
            setShowEditFunnelModal(false);
            setEditingFunnelConfig(null);
            setFunnelKey(prev => prev + 1); // Force re-render to refresh funnel list
          }}
          onEditClick={(config) => {
            setEditingFunnelConfig(config);
            setShowEditFunnelModal(true);
          }}
          showNotification={showNotification}
          onDeleteClick={(configId) => {
            setDeletingFunnelId(configId);
            setShowDeleteFunnelModal(true);
          }}
        />
      </>
    );
  }

  const renderPromptEventsSection = () => {
    return (
      <div className="space-y-4">

        <PromptEventsViewer />
      </div>
    );
  }


  const renderContent = () => {
    switch (activeSubsection) {
      case "recent-events":
        return renderRecentEventsSection()
      case "prompt-events":
        return renderPromptEventsSection()
      case "funnel":
        return renderFunnelSection()
      case "ab-tests":
        return renderABTestsSection()
      case "events":
        return renderEventsSection()
      default:
        return renderRecentEventsSection()
    }
  }

  return (
    <ProtectedRoute>
      <>
        {/* EditorHeader */}
        <div className="px-4 pt-[12px] pb-[12px] h-[65px] bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold">{t('analytics.title')}</h1>
            <p className="text-xs text-muted-foreground">
              {t('analytics.subtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {/* Horizontal tabs navigation */}
          <div className="bg-white border-b border-slate-200 px-4 h-10">
            <div className="flex items-center gap-1 -mb-px">
              {subsections.map((subsection) => {
                const Icon = subsection.icon
                const isActive = activeSubsection === subsection.id
                return (
                  <button
                    key={subsection.id}
                    onClick={() => setActiveSubsection(subsection.id)}
                    className={`flex items-center gap-1.5 px-3 py-[11px] text-xs font-medium border-b-2 transition-colors ${
                      isActive
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t(subsection.labelKey)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-full">{renderContent()}</div>
          </div>
        </div>

        {/* Event Definition Modal */}
        <Dialog open={showEventModal} onOpenChange={(open) => {
          setShowEventModal(open);
          if (!open) setEditingEvent(null);
        }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingEvent ? t('analytics.modals.event.titleEdit') : t('analytics.modals.event.titleCreate')}</DialogTitle>
              <DialogDescription>
                {editingEvent ? t('analytics.modals.event.descriptionEdit') : t('analytics.modals.event.descriptionCreate')}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">
              <NewEventModal
                initialData={editingEvent}
                onSave={(definition) => {
                  console.log('Saving event definition:', definition);
                  setShowEventModal(false);
                  setEditingEvent(null);
                  showNotification(
                    editingEvent ? t('analytics.notifications.eventUpdatedSuccess') : t('analytics.notifications.eventCreatedSuccess'),
                    'success'
                  );
                  // Force re-render to reload events
                  setEventsKey(prev => prev + 1);
                }}
                onCancel={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Funnel Modal - Create */}
        <Dialog open={showFunnelModal} onOpenChange={setShowFunnelModal}>
          <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t('analytics.modals.funnel.createTitle')}</DialogTitle>
              <DialogDescription>
                {t('analytics.modals.funnel.createDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto px-1 flex-1 min-h-[600px]">
              <FunnelAnalysis
                data={null}
                onFunnelChange={() => {}}
                onFilterChange={() => {}}
                showCreateButton={false}
                externalShowCreateForm={true}
                onCreateFormClose={() => {
                  setShowFunnelModal(false);
                  setFunnelKey(prev => prev + 1); // Force re-render to refresh funnel list
                }}
                showNotification={showNotification}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Funnel Modal - Edit */}
        <Dialog open={showEditFunnelModal} onOpenChange={setShowEditFunnelModal}>
          <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t('analytics.modals.funnel.editTitle')}</DialogTitle>
              <DialogDescription>
                {t('analytics.modals.funnel.editDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto px-1 flex-1 min-h-[600px]">
              <FunnelAnalysis
                data={null}
                onFunnelChange={() => {}}
                onFilterChange={() => {}}
                showCreateButton={false}
                externalShowEditForm={true}
                onEditFormClose={() => {
                  setShowEditFunnelModal(false);
                  setEditingFunnelConfig(null);
                  setFunnelKey(prev => prev + 1); // Force re-render to refresh funnel list
                }}
                externalEditingConfiguration={editingFunnelConfig}
                showNotification={showNotification}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* A/B Test Modal */}
        <Dialog open={showABTestModal} onOpenChange={setShowABTestModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t('analytics.modals.abTest.createTitle')}</DialogTitle>
              <DialogDescription>
                {t('analytics.modals.abTest.createDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto px-1">
              <SimpleABTestManager
                showCreateButton={false}
                showTestsList={false}
                externalShowCreateForm={true}
                showNotification={showNotification}
                onCreateFormClose={() => {
                  setShowABTestModal(false);
                  // Force re-render of the main A/B tests list
                  setAbTestKey(prev => prev + 1);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Event Confirmation Modal */}
        <DeleteConfirmationDialog
          open={showDeleteEventModal}
          onOpenChange={(open) => {
            setShowDeleteEventModal(open);
            if (!open) setDeletingEventId(null);
          }}
          onConfirm={handleDeleteEvent}
          title={t('analytics.modals.delete.eventTitle')}
          description={t('analytics.modals.delete.eventDescription')}
        />

        {/* Delete Funnel Confirmation Modal */}
        <DeleteConfirmationDialog
          open={showDeleteFunnelModal}
          onOpenChange={(open) => {
            setShowDeleteFunnelModal(open);
            if (!open) setDeletingFunnelId(null);
          }}
          onConfirm={handleDeleteFunnel}
          title={t('analytics.modals.delete.funnelTitle')}
          description={t('analytics.modals.delete.funnelDescription')}
        />

        {/* Delete A/B Test Confirmation Modal */}
        <DeleteConfirmationDialog
          open={showDeleteABTestModal}
          onOpenChange={(open) => {
            setShowDeleteABTestModal(open);
            if (!open) setDeletingABTestId(null);
          }}
          onConfirm={handleDeleteABTest}
          title={t('analytics.modals.delete.abTestTitle')}
          description={t('analytics.modals.delete.abTestDescription')}
        />
      </>
    </ProtectedRoute>
  );
}

export default function AnalyticsPage() {
  return (
    <NotificationProvider>
      <AnalyticsPageContent />
    </NotificationProvider>
  );
}
