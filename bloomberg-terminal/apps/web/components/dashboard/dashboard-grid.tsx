'use client';

import { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Lock, 
  Unlock, 
  Save, 
  RotateCcw, 
  Download, 
  Upload,
  Grid3X3,
  Maximize2,
  X
} from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Widget {
  id: string;
  component: React.ReactNode;
}

interface DashboardGridProps {
  widgets: Widget[];
  defaultLayout: Layout[];
  className?: string;
}

// Grid configuration
const GRID_COLS = { lg: 16, md: 12, sm: 8, xs: 4, xxs: 2 };
const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const ROW_HEIGHT = 30;
const GRID_MARGIN: [number, number] = [8, 8];

export function DashboardGrid({ widgets, defaultLayout, className }: DashboardGridProps) {
  const [layouts, setLayouts] = useState<Layouts>({});
  const [isLocked, setIsLocked] = useState(false);
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);

  // Load saved layout on mount
  useEffect(() => {
    const savedLayouts = localStorage.getItem('bloomberg-dashboard-layouts');
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch (e) {
        console.error('Failed to load saved layouts');
      }
    } else {
      // Set default layout for all breakpoints
      const defaultLayouts: Layouts = {};
      Object.keys(GRID_COLS).forEach((breakpoint) => {
        defaultLayouts[breakpoint] = defaultLayout;
      });
      setLayouts(defaultLayouts);
    }
  }, [defaultLayout]);

  const handleLayoutChange = useCallback((layout: Layout[], layouts: Layouts) => {
    setLayouts(layouts);
    // Debounced save to localStorage
    const timeoutId = setTimeout(() => {
      localStorage.setItem('bloomberg-dashboard-layouts', JSON.stringify(layouts));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const resetLayout = () => {
    const defaultLayouts: Layouts = {};
    Object.keys(GRID_COLS).forEach((breakpoint) => {
      defaultLayouts[breakpoint] = defaultLayout;
    });
    setLayouts(defaultLayouts);
    localStorage.removeItem('bloomberg-dashboard-layouts');
  };

  const exportLayout = () => {
    const dataStr = JSON.stringify(layouts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `bloomberg-layout-${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importLayout = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            setLayouts(imported);
            localStorage.setItem('bloomberg-dashboard-layouts', JSON.stringify(imported));
          } catch (err) {
            console.error('Failed to import layout:', err);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const toggleMaximize = (widgetId: string) => {
    setMaximizedWidget(maximizedWidget === widgetId ? null : widgetId);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Grid controls */}
      <div className="absolute top-0 right-0 z-50 flex items-center gap-2 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLocked(!isLocked)}
          className="h-8 bg-bloomberg-black border-bloomberg-border text-bloomberg-gray hover:text-bloomberg-amber"
        >
          {isLocked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
          {isLocked ? 'Locked' : 'Unlocked'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetLayout}
          className="h-8 bg-bloomberg-black border-bloomberg-border text-bloomberg-gray hover:text-bloomberg-amber"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportLayout}
          className="h-8 bg-bloomberg-black border-bloomberg-border text-bloomberg-gray hover:text-bloomberg-amber"
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={importLayout}
          className="h-8 bg-bloomberg-black border-bloomberg-border text-bloomberg-gray hover:text-bloomberg-amber"
        >
          <Upload className="w-4 h-4" />
        </Button>
      </div>

      {/* Maximized widget overlay */}
      <AnimatePresence>
        {maximizedWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bloomberg-black"
          >
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaximizedWidget(null)}
                className="h-8 bg-bloomberg-black border-bloomberg-border text-bloomberg-gray hover:text-bloomberg-amber"
              >
                <X className="w-4 h-4 mr-1" />
                Exit Fullscreen
              </Button>
            </div>
            <div className="h-full p-4">
              {widgets.find(w => w.id === maximizedWidget)?.component}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        cols={GRID_COLS}
        rowHeight={ROW_HEIGHT}
        breakpoints={GRID_BREAKPOINTS}
        margin={GRID_MARGIN}
        isDraggable={!isLocked}
        isResizable={!isLocked}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        transformScale={1}
        preventCollision={false}
        compactType="vertical"
        draggableHandle=".widget-drag-handle"
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={cn(
              "bloomberg-grid-item",
              "bg-bloomberg-black border border-bloomberg-border rounded-sm",
              "overflow-hidden transition-all duration-200",
              !isLocked && "hover:border-bloomberg-amber/50"
            )}
          >
            {/* Widget wrapper with controls */}
            <div className="h-full flex flex-col">
              {/* Drag handle */}
              {!isLocked && (
                <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 cursor-move z-10">
                  <div className="flex items-center justify-center h-full">
                    <Grid3X3 className="w-3 h-3 text-bloomberg-gray opacity-50" />
                  </div>
                </div>
              )}
              
              {/* Maximize button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 z-20 text-bloomberg-gray hover:text-bloomberg-amber"
                onClick={() => toggleMaximize(widget.id)}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>

              {/* Widget content */}
              <div className="flex-1 overflow-auto">
                {widget.component}
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>

      <style jsx global>{`
        .react-grid-layout {
          position: relative;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        
        .react-grid-item.resizing {
          z-index: 100;
          will-change: width, height;
        }
        
        .react-grid-item.dragging {
          z-index: 100;
          will-change: transform;
          cursor: move !important;
        }
        
        .react-grid-item.dropping {
          visibility: hidden;
        }
        
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }
        
        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid rgb(var(--bloomberg-amber));
          border-bottom: 2px solid rgb(var(--bloomberg-amber));
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        
        .react-grid-item:hover > .react-resizable-handle::after {
          opacity: 1;
        }
        
        .react-grid-placeholder {
          background: rgb(var(--bloomberg-amber));
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          user-select: none;
        }
      `}</style>
    </div>
  );
}