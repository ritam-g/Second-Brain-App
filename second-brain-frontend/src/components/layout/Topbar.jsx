import React from 'react';
import clsx from 'clsx';
import { Bell, LogOut, Menu, PanelLeft, Search, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Sticky topbar with search, high-level content categories, and user actions.
// Input: search/filter state, sidebar controls, current user info, and logout callback.
// Output: responsive dashboard header matching the reference product shell.
const Topbar = ({
  user,
  searchValue,
  onSearchChange,
  showSearch = true,
  categories = [],
  selectedCategory,
  onCategoryChange,
  onOpenSidebar,
  onToggleCompact,
  onLogout,
  logoutLoading,
  isSidebarCompact = false,
  searchPlaceholder = 'Search the archive...',
  rightMetaLabel,
}) => {
  const initials = getUserInitials(user);
  const hasCategories = Array.isArray(categories) && categories.length > 0;

  return (
    <header className={clsx('fixed right-0 top-0 z-30 left-0', isSidebarCompact ? 'lg:left-24' : 'lg:left-[17.5rem]')}>
      <div className="border-b border-[rgba(255,204,102,0.06)] bg-[rgba(17,13,11,0.72)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="icon"
              className="lg:hidden"
              onClick={onOpenSidebar}
              leadingIcon={<Menu className="h-4 w-4" />}
              aria-label="Open navigation"
            />

            <Button
              type="button"
              variant="icon"
              className="hidden xl:inline-flex"
              onClick={onToggleCompact}
              leadingIcon={<PanelLeft className="h-4 w-4" />}
              aria-label="Toggle sidebar"
            />

            {showSearch ? (
              <div className="min-w-0 flex-1">
                <Input
                  value={searchValue || ''}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  placeholder={searchPlaceholder}
                  icon={Search}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="hidden items-center gap-2 md:flex">
              <Button variant="icon" leadingIcon={<Bell className="h-4 w-4" />} aria-label="Notifications" />
              <Button variant="icon" leadingIcon={<Sparkles className="h-4 w-4" />} aria-label="Automation" />
              <Button
                variant="icon"
                loading={logoutLoading}
                leadingIcon={!logoutLoading ? <LogOut className="h-4 w-4" /> : null}
                onClick={onLogout}
                aria-label="Logout"
              />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] text-sm font-bold text-[#fff2d7]"
                title={user?.username || user?.email || 'Profile'}
              >
                {initials}
              </button>
            </div>
          </div>

          {hasCategories || rightMetaLabel ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="obsidian-scroll flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onCategoryChange(category)}
                    className={clsx(
                      'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                      selectedCategory === category
                        ? 'text-accent'
                        : 'text-obsidian-500 hover:text-obsidian-300',
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="hidden text-xs uppercase tracking-[0.22em] text-obsidian-500 md:block">
                {rightMetaLabel || `Curated for ${user?.username || 'your library'}`}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

function getUserInitials(user) {
  const source = String(user?.username || user?.name || user?.email || 'SB').trim();
  const segments = source.split(/[\s@._-]+/).filter(Boolean);

  if (!segments.length) {
    return 'SB';
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('');
}

export default Topbar;
