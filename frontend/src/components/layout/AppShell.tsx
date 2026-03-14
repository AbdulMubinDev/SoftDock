import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const COLLAPSED_WIDTH = 52;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 280;
const WIDTH_STORAGE = 'softdock-sidebar-width';
const COLLAPSED_STORAGE = 'softdock-sidebar-collapsed';

function getInitialWidth(): number {
  try {
    const saved = localStorage.getItem(WIDTH_STORAGE);
    if (saved) {
      const n = parseInt(saved, 10);
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
    }
  } catch {}
  return DEFAULT_WIDTH;
}

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE) === 'true';
  } catch {}
  return false;
}

export function AppShell() {
  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth);
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [isDragging, setIsDragging] = useState(false);

  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : sidebarWidth;

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSED_STORAGE, String(next));
      return next;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (collapsed) return;
    setIsDragging(true);
  }, [collapsed]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem(WIDTH_STORAGE, String(sidebarWidth));
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, sidebarWidth]);

  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(WIDTH_STORAGE, String(sidebarWidth));
    }
  }, [isDragging, sidebarWidth]);

  return (
    <div className="min-h-screen bg-background text-[var(--text)]">
      <Sidebar
        width={effectiveWidth}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Resize handle — only when expanded */}
      {!collapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="fixed top-0 bottom-0 z-50 w-1 cursor-col-resize group"
          style={{ left: effectiveWidth - 2 }}
        >
          <div
            className={`absolute inset-y-0 left-0 w-[3px] transition-colors ${
              isDragging ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/50'
            }`}
          />
        </div>
      )}

      <div className="flex flex-col min-h-screen transition-[padding-left] duration-200" style={{ paddingLeft: effectiveWidth }}>
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
