import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, LogOut } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import UserCard from '../components/user/UserCard';
import UserForm from '../components/user/UserForm';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { useLogout, useUpdateProfile } from '../hooks/useAuth';

const MotionDiv = motion.div;

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const { performLogout, loading: logoutLoading } = useLogout();
  const { updateProfile, loading: updateLoading } = useUpdateProfile();
  const navigate = useNavigate();
  const nameInputRef = useRef(null);

  const [formValues, setFormValues] = useState({
    username: user?.username || '',
    avatar: user?.avatar || '',
  });

  useEffect(() => {
    setFormValues({
      username: user?.username || '',
      avatar: user?.avatar || '',
    });
  }, [user?.avatar, user?.username]);

  const handleProfileChange = (field, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    await updateProfile({
      username: formValues.username.trim(),
      avatar: formValues.avatar.trim(),
    });
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
      rightMetaLabel="Profile & account identity"
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
              User Profile
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-[#fff1d5] sm:text-[3.25rem]">
              Manage your identity inside Second Brain.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-obsidian-400 sm:text-[15px]">
              Update how your account appears across the archive, AI chat, and graph views while keeping the rest of the workspace consistent.
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
            <UserCard user={user} />

            <div className="space-y-6">
              <UserForm
                values={formValues}
                onChange={handleProfileChange}
                onSubmit={handleProfileSubmit}
                loading={updateLoading}
                nameInputRef={nameInputRef}
              />

              <GlassCard className="p-6 sm:p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">Quick Actions</p>
                <h2 className="mt-3 text-2xl font-bold text-[#fff1d5]">Account shortcuts</h2>
                <p className="mt-2 text-sm leading-7 text-obsidian-400">
                  Open the broader settings panel or sign out of your current session.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="surface"
                    className="rounded-2xl px-5 py-3"
                    leadingIcon={<Settings className="h-4 w-4" />}
                    onClick={() => navigate('/settings')}
                  >
                    Open Settings
                  </Button>

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
                </div>
              </GlassCard>
            </div>
          </section>
        </MotionDiv>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
