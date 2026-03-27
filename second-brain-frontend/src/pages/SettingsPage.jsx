import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Eraser, LogOut, MoonStar, ShieldCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import UserForm from '../components/user/UserForm';
import SettingsSection from '../components/settings/SettingsSection';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useChangePassword, useDeleteAccount, useLogout, useUpdateProfile } from '../hooks/useAuth';
import { useClearAllContent } from '../hooks/useContent';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { landingRouteOptions } from '../utils/userPreferences';
import { notify } from '../utils/toast';

const MotionDiv = motion.div;

const SettingsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { updateProfile, loading: updateProfileLoading } = useUpdateProfile();
  const { changePassword, loading: changePasswordLoading } = useChangePassword();
  const { performLogout, loading: logoutLoading } = useLogout();
  const { deleteAccount, loading: deleteAccountLoading } = useDeleteAccount();
  const { clearAllContent, loading: clearAllContentLoading } = useClearAllContent();
  const { preferences, setDefaultLandingRoute, setReduceMotion } = useUserPreferences();
  const navigate = useNavigate();
  const nameInputRef = useRef(null);

  const [profileValues, setProfileValues] = useState({
    username: user?.username || '',
    avatar: user?.avatar || '',
  });
  const [passwordValues, setPasswordValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    setProfileValues({
      username: user?.username || '',
      avatar: user?.avatar || '',
    });
  }, [user?.avatar, user?.username]);

  const isDeleteEnabled = deleteConfirmation.trim().toUpperCase() === 'DELETE';
  const selectedLandingDescription = useMemo(
    () => landingRouteOptions.find((option) => option.value === preferences.defaultLandingRoute)?.description || '',
    [preferences.defaultLandingRoute],
  );

  const handleProfileChange = (field, value) => {
    setProfileValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    await updateProfile({
      username: profileValues.username.trim(),
      avatar: profileValues.avatar.trim(),
    });
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordValues.currentPassword.trim() || !passwordValues.newPassword.trim()) {
      notify.warning('Enter your current and new password first.', { toastId: 'settings-password-empty' });
      return;
    }

    if (passwordValues.newPassword.trim().length < 6) {
      notify.warning('Use a password with at least 6 characters.', { toastId: 'settings-password-length' });
      return;
    }

    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      notify.warning('New password and confirmation must match.', { toastId: 'settings-password-confirm' });
      return;
    }

    const result = await changePassword({
      currentPassword: passwordValues.currentPassword,
      newPassword: passwordValues.newPassword,
    });

    if (result.success) {
      setPasswordValues({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  const handleClearArchive = async () => {
    const confirmed = window.confirm('Clear all saved content from your archive? This action cannot be undone.');

    if (!confirmed) {
      return;
    }

    await clearAllContent();
  };

  const handleDeleteAccount = async () => {
    if (!isDeleteEnabled) {
      notify.warning('Type DELETE to confirm account removal.', { toastId: 'settings-delete-confirmation' });
      return;
    }

    const confirmed = window.confirm('Delete your account permanently? This will remove your saved content and sign you out.');

    if (!confirmed) {
      return;
    }

    const result = await deleteAccount();

    if (result.success) {
      navigate('/login', { replace: true });
    }
  };

  return (
    <MainLayout
      user={user}
      showSearch={false}
      categories={[]}
      selectedCategory=""
      onCategoryChange={() => {}}
      onPrimaryAction={() => nameInputRef.current?.focus()}
      onLogout={performLogout}
      logoutLoading={logoutLoading}
      rightMetaLabel="Preferences, security, and data controls"
      showFloatingAction={false}
    >
      <div className="mx-auto w-full max-w-6xl">
        <MotionDiv
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-8"
        >
          <section className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              Settings
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-[#fff1d5] sm:text-[3.25rem]">
              Tune your workspace, security, and archive controls.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-obsidian-400 sm:text-[15px]">
              Keep your account up to date, choose how Second Brain opens, and manage destructive actions from one place.
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-6">
              <SettingsSection
                eyebrow="Account"
                title="Account settings"
                description="Update your profile details and keep your authentication secure."
              >
                <div className="space-y-6">
                  <UserForm
                    title="Profile details"
                    description="Change your display name or update the avatar shown in your workspace."
                    values={profileValues}
                    onChange={handleProfileChange}
                    onSubmit={handleProfileSubmit}
                    loading={updateProfileLoading}
                    nameInputRef={nameInputRef}
                    className="border-0 bg-transparent p-0 shadow-none"
                  />

                  <div className="rounded-[28px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">Security</p>
                    <h3 className="mt-3 text-xl font-bold text-[#fff1d5]">Change password</h3>
                    <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
                      <Input
                        type="password"
                        label="Current Password"
                        value={passwordValues.currentPassword}
                        onChange={(event) => handlePasswordFieldChange('currentPassword', event.target.value)}
                        placeholder="Current password"
                      />
                      <Input
                        type="password"
                        label="New Password"
                        value={passwordValues.newPassword}
                        onChange={(event) => handlePasswordFieldChange('newPassword', event.target.value)}
                        placeholder="At least 6 characters"
                      />
                      <Input
                        type="password"
                        label="Confirm New Password"
                        value={passwordValues.confirmPassword}
                        onChange={(event) => handlePasswordFieldChange('confirmPassword', event.target.value)}
                        placeholder="Repeat new password"
                      />

                      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-6 text-obsidian-500">
                          Password updates take effect immediately for your current account.
                        </p>
                        <Button
                          type="submit"
                          variant="surface"
                          className="rounded-2xl px-5 py-3"
                          loading={changePasswordLoading}
                          leadingIcon={!changePasswordLoading ? <ShieldCheck className="h-4 w-4" /> : null}
                        >
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="danger"
                      className="rounded-2xl px-5 py-3"
                      loading={logoutLoading}
                      leadingIcon={!logoutLoading ? <LogOut className="h-4 w-4" /> : null}
                      onClick={performLogout}
                    >
                      Logout
                    </Button>
                    <Button
                      type="button"
                      variant="surface"
                      className="rounded-2xl px-5 py-3"
                      leadingIcon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => navigate('/profile')}
                    >
                      Open Profile
                    </Button>
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection
                eyebrow="Preferences"
                title="Workspace preferences"
                description="Choose how Second Brain should feel when you arrive."
              >
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-[#fff1d5]">Default start page</p>
                    <p className="mt-1 text-sm text-obsidian-400">{selectedLandingDescription}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {landingRouteOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDefaultLandingRoute(option.value)}
                          className={clsx(
                            'rounded-[24px] border px-4 py-4 text-left transition-all duration-200',
                            preferences.defaultLandingRoute === option.value
                              ? 'border-[rgba(255,191,64,0.24)] bg-[rgba(255,174,32,0.08)] text-[#fff1d5] shadow-[0_20px_40px_rgba(0,0,0,0.18)]'
                              : 'border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] text-obsidian-400 hover:border-[rgba(255,191,64,0.14)] hover:text-obsidian-300',
                          )}
                        >
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="mt-2 text-xs leading-6">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#fff1d5]">Reduce motion</p>
                      <p className="mt-1 text-sm text-obsidian-400">
                        Tone down animations and transitions across the workspace.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReduceMotion(!preferences.reduceMotion)}
                      className={clsx(
                        'inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200',
                        preferences.reduceMotion
                          ? 'border-[rgba(255,191,64,0.24)] bg-[rgba(255,174,32,0.08)] text-accent'
                          : 'border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.02)] text-obsidian-400',
                      )}
                    >
                      <span
                        className={clsx(
                          'relative inline-flex h-6 w-11 rounded-full transition-colors duration-200',
                          preferences.reduceMotion ? 'bg-accent/40' : 'bg-[rgba(255,255,255,0.08)]',
                        )}
                      >
                        <span
                          className={clsx(
                            'absolute top-1 h-4 w-4 rounded-full bg-[#fff2d7] transition-all duration-200',
                            preferences.reduceMotion ? 'left-6' : 'left-1',
                          )}
                        />
                      </span>
                      {preferences.reduceMotion ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#fff1d5]">Interface theme</p>
                      <p className="mt-1 text-sm text-obsidian-400">
                        Obsidian Dark is the active product theme in this build.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,191,64,0.18)] bg-[rgba(255,174,32,0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                      <MoonStar className="h-3.5 w-3.5" />
                      Obsidian Dark
                    </div>
                  </div>
                </div>
              </SettingsSection>
            </div>

            <div className="space-y-6">
              <SettingsSection
                eyebrow="Data Controls"
                title="Archive controls"
                description="Use these carefully. These actions change or remove saved data."
              >
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-[rgba(255,204,102,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,174,32,0.08)] text-accent">
                        <Eraser className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#fff1d5]">Clear saved content</h3>
                        <p className="mt-2 text-sm leading-7 text-obsidian-400">
                          Remove every saved link, document, and uploaded file from your archive while keeping the account itself active.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Button
                        type="button"
                        variant="surface"
                        className="rounded-2xl px-5 py-3"
                        loading={clearAllContentLoading}
                        leadingIcon={!clearAllContentLoading ? <Eraser className="h-4 w-4" /> : null}
                        onClick={handleClearArchive}
                      >
                        Clear Archive
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-red-500/18 bg-[rgba(56,12,12,0.18)] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/14 text-red-200">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#fff1d5]">Delete account</h3>
                        <p className="mt-2 text-sm leading-7 text-obsidian-400">
                          Permanently delete your account and sign out. Type <span className="font-semibold text-red-200">DELETE</span> to unlock this action.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <Input
                        label="Confirmation"
                        value={deleteConfirmation}
                        onChange={(event) => setDeleteConfirmation(event.target.value)}
                        placeholder="Type DELETE to confirm"
                      />

                      <Button
                        type="button"
                        variant="danger"
                        className="rounded-2xl px-5 py-3"
                        loading={deleteAccountLoading}
                        leadingIcon={!deleteAccountLoading ? <AlertTriangle className="h-4 w-4" /> : null}
                        disabled={!isDeleteEnabled}
                        onClick={handleDeleteAccount}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </SettingsSection>
            </div>
          </section>
        </MotionDiv>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
