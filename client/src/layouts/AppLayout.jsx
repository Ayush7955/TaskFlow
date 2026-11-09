import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Columns3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useWorkspaceStore from '../stores/workspaceStore';
import useUiStore from '../stores/uiStore';
import Avatar from '../components/Avatar';
import DropdownMenu from '../components/DropdownMenu';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/boards', label: 'Boards', icon: Columns3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { workspaces, currentWorkspace, setCurrentWorkspace } =
    useWorkspaceStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const workspaceSwitchItems = workspaces.map((ws) => ({
    label: ws.name || 'Untitled Workspace',
    onClick: () => setCurrentWorkspace(ws),
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-surface border-r border-border h-screen
          flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `.trim()}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-display font-light text-xl text-ink tracking-tight">
              TaskFlow
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-ink" />
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-muted hover:text-ink hover:bg-stone-100 transition-colors duration-150"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace selector */}
        <div className="px-3 py-3 border-b border-border">
          <DropdownMenu
            align="left"
            trigger={
              <div className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors duration-150 cursor-pointer">
                <span className="text-sm font-body font-medium text-ink truncate">
                  {currentWorkspace?.name || 'Select workspace'}
                </span>
                <ChevronDown size={14} className="text-muted shrink-0 ml-2" />
              </div>
            }
            items={
              workspaceSwitchItems.length > 0
                ? workspaceSwitchItems
                : [{ label: 'No workspaces', onClick: () => {} }]
            }
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body transition-colors duration-150 ${
                  isActive
                    ? 'bg-stone-100 text-ink font-medium'
                    : 'text-secondary hover:bg-stone-50 hover:text-ink'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom — user */}
        <div className="shrink-0 border-t border-border px-3 py-3">
          <div className="flex items-center gap-3 px-2">
            <Avatar
              name={user?.name}
              src={user?.avatar}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium text-ink truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted font-body truncate">
                {user?.email || ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-muted hover:text-ink hover:bg-stone-100 transition-colors duration-150"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-canvas">
        {/* Mobile header bar */}
        <div className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-surface">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:text-ink hover:bg-stone-100 transition-colors duration-150"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-display font-light text-lg text-ink">
            TaskFlow
          </span>
        </div>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
