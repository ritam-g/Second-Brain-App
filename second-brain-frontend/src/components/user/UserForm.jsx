import React from 'react';
import clsx from 'clsx';
import { Save } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Input from '../ui/Input';
import Button from '../ui/Button';

// Reusable profile editor shared by the Profile and Settings surfaces.
const UserForm = ({
  title = 'Edit profile',
  description = 'Update how your account appears inside Second Brain.',
  values,
  onChange,
  onSubmit,
  loading = false,
  submitLabel = 'Save Changes',
  className = '',
  showAvatarField = true,
  nameInputRef,
}) => (
  <GlassCard className={clsx('p-6 sm:p-7', className)}>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">Profile Editor</p>
      <h2 className="mt-3 text-2xl font-bold text-[#fff1d5]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-obsidian-400">{description}</p>
    </div>

    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Input
        ref={nameInputRef}
        label="Display Name"
        value={values?.username || ''}
        onChange={(event) => onChange('username', event.target.value)}
        placeholder="How your name should appear"
      />

      {showAvatarField ? (
        <Input
          label="Avatar URL"
          value={values?.avatar || ''}
          onChange={(event) => onChange('avatar', event.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />
      ) : null}

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-obsidian-500">
          Avatar accepts a public image URL. Leave it empty to keep the monogram avatar.
        </p>

        <Button
          type="submit"
          variant="amber"
          className="rounded-2xl px-5 py-3"
          loading={loading}
          leadingIcon={!loading ? <Save className="h-4 w-4" /> : null}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  </GlassCard>
);

export default UserForm;
