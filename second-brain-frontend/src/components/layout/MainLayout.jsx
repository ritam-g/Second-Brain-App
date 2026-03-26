import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// Main dashboard shell that coordinates the fixed sidebar, sticky topbar, and floating action button.
// Input: current user data, topbar props, page content, and a primary action callback.
// Output: fully responsive application layout for the dashboard experience.
const MainLayout = ({
  user,
  searchValue,
  onSearchChange,
  showSearch = true,
  categories = [],
  selectedCategory,
  onCategoryChange,
  onPrimaryAction,
  onLogout,
  logoutLoading,
  searchPlaceholder,
  rightMetaLabel,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);
  const MotionDiv = motion.div;
  const MotionMain = motion.main;
  const MotionButton = motion.button;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');

    const handleMediaChange = (event) => {
      if (event.matches) {
        setIsSidebarCompact(false);
      }
    };

    handleMediaChange(mediaQuery);
    mediaQuery.addEventListener?.('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener?.('change', handleMediaChange);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-obsidian-900 text-obsidian-300">
      <div className="pointer-events-none fixed inset-0 bg-obsidian-glow opacity-90" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,179,62,0.08),_transparent_28%)]" />

      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-[rgba(255,204,102,0.08)] lg:block',
          isSidebarCompact ? 'w-24' : 'w-[17.5rem]',
        )}
      >
        <Sidebar
          user={user}
          isCompact={isSidebarCompact}
          onToggleCompact={() => setIsSidebarCompact((previous) => !previous)}
          onPrimaryAction={onPrimaryAction}
        />
      </div>

      <AnimatePresence>
        {isMobileSidebarOpen ? (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/55 lg:hidden"
          >
            <button type="button" className="absolute inset-0" onClick={() => setIsMobileSidebarOpen(false)} aria-label="Close navigation" />
            <MotionDiv
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -28, opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="relative h-full w-[18rem] max-w-[85vw]"
            >
              <Sidebar
                user={user}
                isMobile
                onClose={() => setIsMobileSidebarOpen(false)}
                onPrimaryAction={() => {
                  setIsMobileSidebarOpen(false);
                  onPrimaryAction?.();
                }}
              />
            </MotionDiv>
          </MotionDiv>
        ) : null}
      </AnimatePresence>

      <div className={clsx('relative min-h-screen transition-[padding] duration-300', isSidebarCompact ? 'lg:pl-24' : 'lg:pl-[17.5rem]')}>
        <Topbar
          user={user}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          showSearch={showSearch}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleCompact={() => setIsSidebarCompact((previous) => !previous)}
          onLogout={onLogout}
          logoutLoading={logoutLoading}
          isSidebarCompact={isSidebarCompact}
          searchPlaceholder={searchPlaceholder}
          rightMetaLabel={rightMetaLabel}
        />

        <MotionMain
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative px-4 pb-20 pt-32 sm:px-6 lg:px-8 xl:px-10"
        >
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </MotionMain>
      </div>

      <MotionButton
        type="button"
        whileHover={{ y: -2, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onPrimaryAction}
        className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-obsidian-950 shadow-[0_24px_45px_rgba(248,174,29,0.24)]"
        aria-label="Capture thought"
      >
        <Sparkles className="h-5 w-5" />
      </MotionButton>
    </div>
  );
};

export default MainLayout;
