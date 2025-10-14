import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart3, LineChart, PieChart, Table,
  TrendingUp, Activity,
  Save, Calendar, Download, Move
} from 'lucide-react';

interface ReportWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'funnel';
  config: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

const WIDGET_TYPES = [
  { id: 'line-chart', name: 'Line Chart', icon: LineChart, type: 'chart' },
  { id: 'bar-chart', name: 'Bar Chart', icon: BarChart3, type: 'chart' },
  { id: 'pie-chart', name: 'Pie Chart', icon: PieChart, type: 'chart' },
  { id: 'metric-card', name: 'Metric Card', icon: TrendingUp, type: 'metric' },
  { id: 'data-table', name: 'Data Table', icon: Table, type: 'table' },
  { id: 'funnel', name: 'Funnel', icon: Activity, type: 'funnel' },
];

export default function ReportBuilder() {
  const [reportName, setReportName] = useState('');
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<ReportWidget | null>(null);
  const [schedule, setSchedule] = useState({
    enabled: false,
    frequency: 'weekly',
    recipients: ['']
  });

  const addWidget = (widgetType: typeof WIDGET_TYPES[0]) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType.type as any,
      config: {
        title: widgetType.name,
        dataSource: '',
        metrics: []
      },
      position: { x: 0, y: widgets.length * 200 },
      size: { width: 400, height: 300 }
    };
    setWidgets([...widgets, newWidget]);
  };

  const WidgetComponent = ({ widget }: { widget: ReportWidget }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Document-level drag handlers for smooth dragging
    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        const newPosition = {
          x: Math.max(0, e.clientX - dragStart.x),
          y: Math.max(0, e.clientY - dragStart.y)
        };
        setWidgets(widgets.map(w =>
          w.id === widget.id ? { ...w, position: newPosition } : w
        ));
      };

      const handleMouseUp = () => setIsDragging(false);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragStart, widget.id]);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - widget.position.x, y: e.clientY - widget.position.y });
    };

    return (
      <div
        className={`absolute cursor-move ${isDragging ? 'opacity-50' : ''}`}
        style={{
          left: widget.position.x,
          top: widget.position.y,
          width: widget.size.width,
          height: widget.size.height
        }}
        onMouseDown={handleMouseDown}
      >
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">{widget.config.title}</CardTitle>
            <Move className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Widget preview content */}
            <div className="bg-muted rounded h-full flex items-center justify-center">
              {widget.type === 'chart' && <LineChart className="h-8 w-8 text-muted-foreground" />}
              {widget.type === 'metric' && <TrendingUp className="h-8 w-8 text-muted-foreground" />}
              {widget.type === 'table' && <Table className="h-8 w-8 text-muted-foreground" />}
              {widget.type === 'funnel' && <Activity className="h-8 w-8 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const ReportCanvas = () => {
    return (
      <div
        className="relative bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700"
        style={{ height: '600px' }}
      >
        {widgets.map(widget => (
          <WidgetComponent key={widget.id} widget={widget} />
        ))}
        {widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Build Your First Report</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Drag and drop widgets from the left panel to create custom reports.
              Start with a metric card or chart.
            </p>
            <Button onClick={() => addWidget(WIDGET_TYPES[0])} className="widget-palette">
              Add First Widget
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <Label htmlFor="report-name">Report Name</Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g., Weekly Performance Report"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {/* Widget Palette */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Widgets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {WIDGET_TYPES.map(widget => (
                    <Button
                      key={widget.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => addWidget(widget)}
                    >
                      <widget.icon className="h-4 w-4 mr-2" />
                      {widget.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Canvas */}
          <div className="col-span-9">
            <ReportCanvas />
          </div>
        </div>
    </div>
  )
}