import React from 'react';
import clsx from 'clsx';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Archive,
  BookOpenText,
  BrainCircuit,
  Compass,
  FolderArchive,
  LifeBuoy,
  PanelLeftClose,
  Settings,
  Share2,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';
import Button from '../ui/Button';

const navigationItems = [
  { label: 'Knowledge Graph', icon: Share2, path: '/graph' },
  { label: 'Library', icon: BookOpenText, path: '/dashboard' },
  { label: 'Deep Focus', icon: BrainCircuit, path: '/deep-focus' },
  { label: 'Recent Discoveries', icon: Compass },
  { label: 'Archived Thoughts', icon: FolderArchive },
  { label: 'Settings', icon: Settings },
];

// Fixed app navigation that matches the reference dashboard and collapses on smaller viewports.
// Input: current user info, compact/mobile flags, and interaction callbacks for close and primary actions.
// Output: sidebar shell with navigation, status area, and primary capture button.
const Sidebar = ({
  user,
  isCompact = false,
  isMobile = false,
  onToggleCompact,
  onClose,
  onPrimaryAction,
}) => {
  const location = useLocation();

  return (
    <aside
      className={clsx(
        'relative flex h-full flex-col border-r border-[rgba(255,204,102,0.08)] bg-[rgba(14,11,9,0.8)] px-4 py-6 backdrop-blur-2xl',
        isCompact && !isMobile ? 'w-24 items-center px-3' : 'w-[17.5rem]',
      )}
    >
      <div className={clsx('flex items-start gap-3', isCompact && !isMobile && 'w-full justify-center')}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(248,174,29,0.14)] text-accent">
          <Archive className="h-5 w-5" />
        </div>

        {!isCompact || isMobile ? (
          <div className="min-w-0 flex-1">
            <p className="text-[1.45rem] font-extrabold leading-tight text-[#f8e5c5]">The Obsidian Archive</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-obsidian-500">Second Brain</p>
          </div>
        ) : null}

        {isMobile ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-obsidian-400 transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-obsidian-300"
          >
            <X className="h-4 w-4" />
          </button>
        ) : onToggleCompact ? (
          <button
            type="button"
            onClick={onToggleCompact}
            className={clsx(
              'rounded-xl p-2 text-obsidian-500 transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-obsidian-300',
              isCompact && 'absolute right-3 top-5',
            )}
            title={isCompact ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeftClose className={clsx('h-4 w-4 transition-transform', isCompact && 'rotate-180')} />
          </button>
        ) : null}
      </div>

      {!isCompact || isMobile ? (
        <div className="mt-6 inline-flex w-fit items-center rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Curator
        </div>
      ) : null}

      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {navigationItems.map((item) => {
          const NavIcon = item.icon;
          const isActive = item.path ? location.pathname.startsWith(item.path) : false;
          const baseClassName = clsx(
            'flex items-center rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200',
            isActive
              ? 'bg-[rgba(248,174,29,0.14)] text-accent shadow-[inset_0_0_0_1px_rgba(255,191,64,0.1)]'
              : 'text-obsidian-500 hover:bg-[rgba(255,255,255,0.04)] hover:text-obsidian-300',
            isCompact && !isMobile && 'justify-center px-0',
          );

          if (item.path) {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={isMobile ? onClose : undefined}
                className={baseClassName}
              >
                {React.createElement(NavIcon, {
                  className: clsx('h-4 w-4 shrink-0', !isCompact || isMobile ? 'mr-3' : ''),
                })}
                {!isCompact || isMobile ? <span>{item.label}</span> : null}
              </NavLink>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={baseClassName}
            >
              {React.createElement(NavIcon, {
                className: clsx('h-4 w-4 shrink-0', !isCompact || isMobile ? 'mr-3' : ''),
              })}
              {!isCompact || isMobile ? <span>{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto w-full">
        <Button
          type="button"
          variant="amber"
          className={clsx('w-full rounded-2xl py-3 text-sm font-bold', isCompact && !isMobile && 'px-0')}
          leadingIcon={<Sparkles className="h-4 w-4" />}
          onClick={onPrimaryAction}
        >
          {!isCompact || isMobile ? 'Capture Thought' : null}
        </Button>

        {!isCompact || isMobile ? (
          <div className="mt-5 space-y-3 border-t border-[rgba(255,204,102,0.08)] pt-5 text-xs text-obsidian-500">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5" />
                Sync Status
              </span>
              <span className="font-semibold italic text-accent">{user ? 'online' : 'idle'}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <LifeBuoy className="h-3.5 w-3.5" />
              Support
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
};

export default Sidebar;
