import React from 'react';
import clsx from 'clsx';
import { CalendarDays, Mail, ShieldCheck } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

// Snapshot card for profile/settings surfaces.
// Input: authenticated user object from redux auth state.
// Output: premium profile summary card with avatar, identity, and account metadata.
const UserCard = ({ user, className = '' }) => {
  const initials = getUserInitials(user);
  const joinedLabel = formatJoinDate(user?.createdAt);
  const avatarUrl = String(user?.avatar || '').trim();

  return (
    <GlassCard
      interactive
      className={clsx('overflow-hidden p-6 sm:p-7', className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div className="relative">
        <div className="pointer-events-none absolute -right-14 -top-12 h-32 w-32 rounded-full bg-[rgba(248,174,29,0.1)] blur-3xl" />

        <div className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[30px] border border-[rgba(255,204,102,0.12)] bg-[linear-gradient(135deg,rgba(255,191,64,0.16),rgba(255,255,255,0.03))] text-2xl font-extrabold text-[#fff2d8] shadow-[0_24px_45px_rgba(0,0,0,0.2)]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.username || 'User avatar'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="mt-5">
            <div className="inline-flex items-center rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              Account Profile
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-[#fff1d5]">
              {user?.username || 'Second Brain User'}
            </h1>
            <p className="mt-2 text-sm text-obsidian-400">{user?.email || 'No email available'}</p>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3">
          <ProfileMetaRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={user?.email || 'Not available'}
          />
          <ProfileMetaRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Joined"
            value={joinedLabel}
          />
          <ProfileMetaRow
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Status"
            value="Authenticated"
          />
        </div>
      </div>
    </GlassCard>
  );
};

function ProfileMetaRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,174,32,0.08)] text-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian-500">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#fff1d5]">{value}</p>
      </div>
    </div>
  );
}

function getUserInitials(user) {
  const source = String(user?.username || user?.email || 'SB').trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);

  if (!parts.length) {
    return 'SB';
  }

  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
}

function formatJoinDate(value) {
  if (!value) {
    return 'Recently joined';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Recently joined';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
}

export default UserCard;
