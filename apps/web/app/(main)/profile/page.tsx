'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Edit3, Camera, Heart, Eye, TrendingUp, Settings,
  LogOut, Pause, Shield, MapPin, Briefcase, GraduationCap,
  Ruler, ChevronRight, Check, X, Loader2, Bell, Lock,
  SlidersHorizontal, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, type User as UserType, type Photo, type UserPrompt } from '@/lib/store';
import {
  cn, getHeightDisplay, generatePlaceholderPhoto, generateAvatarUrl,
  PROMPT_TEMPLATES, IDENTITY_OPTIONS, formatEnumLabel,
} from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserType>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setEditData({
        firstName: user.firstName,
        lastName: user.lastName,
        jobTitle: user.jobTitle || '',
        company: user.company || '',
        school: user.school || '',
        hometown: user.hometown || '',
        height: user.height,
        religion: user.religion || '',
        politics: user.politics || '',
        drinking: user.drinking || '',
        smoking: user.smoking || '',
        drugs: user.drugs || '',
        familyPlans: user.familyPlans || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/users/me', editData);
      updateProfile(editData);
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePauseProfile = async () => {
    try {
      const newState = !user?.isPaused;
      await api.patch('/users/me', { isPaused: newState });
      updateProfile({ isPaused: newState });
      toast.success(newState ? 'Profile paused' : 'Profile resumed');
    } catch {
      toast.success(user?.isPaused ? 'Profile resumed' : 'Profile paused');
      updateProfile({ isPaused: !user?.isPaused });
    }
  };

  // Demo stats
  const stats = {
    likesReceived: 23,
    likesGiven: 47,
    matches: 8,
    profileViews: 156,
  };

  const demoPhotos: Photo[] = user?.photos?.length
    ? user.photos
    : [
        { id: 'd1', url: generatePlaceholderPhoto(901), position: 1 },
        { id: 'd2', url: generatePlaceholderPhoto(902), position: 2 },
        { id: 'd3', url: generatePlaceholderPhoto(903), position: 3 },
        { id: 'd4', url: generatePlaceholderPhoto(904), position: 4 },
        { id: 'd5', url: generatePlaceholderPhoto(905), position: 5 },
        { id: 'd6', url: generatePlaceholderPhoto(906), position: 6 },
      ];

  const demoPrompts: (UserPrompt & { promptText: string })[] = user?.prompts?.length
    ? user.prompts.map((p) => ({
        ...p,
        promptText:
          p.promptText || PROMPT_TEMPLATES.find((t) => t.id === p.promptTemplateId)?.text || '',
      }))
    : [
        { id: 'dp1', promptTemplateId: '1', promptText: 'A shower thought I recently had', answer: 'If time travel existed, everyone would just go back and invest in Bitcoin.', position: 1 },
        { id: 'dp2', promptTemplateId: '6', promptText: 'Dating me is like', answer: 'A surprise concert - you never know what genre, but it is always a good time.', position: 2 },
        { id: 'dp3', promptTemplateId: '3', promptText: 'I geek out on', answer: 'Space documentaries, craft coffee, and perfecting my pasta from scratch.', position: 3 },
      ];

  const displayName = user?.firstName || 'Your';
  const displayAge = user?.birthday ? new Date().getFullYear() - new Date(user.birthday).getFullYear() : 28;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-hinge-primary" />
            <h1 className="text-lg font-bold">Profile</h1>
          </div>
          <button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
              isEditing
                ? 'bg-hinge-primary text-white'
                : 'border border-hinge-border text-hinge-text-secondary hover:border-hinge-primary'
            )}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              <>
                <Check className="w-4 h-4" />
                Save
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Edit
              </>
            )}
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Profile preview card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-card overflow-hidden"
        >
          {/* Main photo */}
          <div className="relative aspect-[4/3]">
            <Image
              src={demoPhotos[0]?.url || generateAvatarUrl(displayName)}
              alt="Profile"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-card" />

            {isEditing && (
              <button className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors">
                <Camera className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Paused badge */}
            {user?.isPaused && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hinge-warning/20 border border-hinge-warning/30">
                <Pause className="w-3.5 h-3.5 text-hinge-warning" />
                <span className="text-xs font-medium text-hinge-warning">Paused</span>
              </div>
            )}

            {/* Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="text-2xl font-bold text-white">
                {displayName}, {displayAge}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
                {(user?.hometown || editData.hometown) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {isEditing ? editData.hometown : user?.hometown}
                  </span>
                )}
                {(user?.height || editData.height) && (
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5" />
                    {getHeightDisplay(isEditing ? editData.height : user?.height)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info section */}
          <div className="p-5 space-y-4">
            {/* Work & Education */}
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-hinge-text-muted mb-1 block">Job title</label>
                    <input
                      type="text"
                      value={editData.jobTitle || ''}
                      onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })}
                      className="input-field text-sm py-2"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-hinge-text-muted mb-1 block">Company</label>
                    <input
                      type="text"
                      value={editData.company || ''}
                      onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      className="input-field text-sm py-2"
                      placeholder="e.g. Google"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-hinge-text-muted mb-1 block">School</label>
                    <input
                      type="text"
                      value={editData.school || ''}
                      onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                      className="input-field text-sm py-2"
                      placeholder="e.g. Stanford University"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-hinge-text-muted mb-1 block">Hometown</label>
                    <input
                      type="text"
                      value={editData.hometown || ''}
                      onChange={(e) => setEditData({ ...editData, hometown: e.target.value })}
                      className="input-field text-sm py-2"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {(user?.jobTitle || user?.company) && (
                    <div className="flex items-center gap-2 text-sm text-hinge-text-secondary">
                      <Briefcase className="w-4 h-4 text-hinge-text-muted" />
                      {user.jobTitle}
                      {user.company && ` at ${user.company}`}
                    </div>
                  )}
                  {user?.school && (
                    <div className="flex items-center gap-2 text-sm text-hinge-text-secondary">
                      <GraduationCap className="w-4 h-4 text-hinge-text-muted" />
                      {user.school}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Photos grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-hinge-text-secondary">Photos</h3>
            {isEditing && (
              <span className="text-xs text-hinge-text-muted">{demoPhotos.length}/6</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {demoPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-hinge-surface"
              >
                <Image
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="33vw"
                />
                <div className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-[10px] font-bold">
                  {index + 1}
                </div>
                {isEditing && (
                  <button className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-hinge-danger transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Prompts */}
        <div>
          <h3 className="text-sm font-semibold text-hinge-text-secondary mb-3">Prompts</h3>
          <div className="space-y-3">
            {demoPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-hinge-surface border border-hinge-border"
              >
                <p className="text-sm font-medium text-hinge-primary mb-1.5">
                  {prompt.promptText}
                </p>
                {isEditing ? (
                  <textarea
                    defaultValue={prompt.answer}
                    className="input-field text-sm py-2 resize-none"
                    rows={2}
                  />
                ) : (
                  <p className="text-white leading-relaxed">{prompt.answer}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Identity Badges */}
        {!isEditing && (
          <div>
            <h3 className="text-sm font-semibold text-hinge-text-secondary mb-3">
              About Me
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                user?.religion && formatEnumLabel(user.religion),
                user?.politics && formatEnumLabel(user.politics),
                user?.drinking && `Drinks: ${formatEnumLabel(user.drinking)}`,
                user?.smoking && `Smokes: ${formatEnumLabel(user.smoking)}`,
                user?.familyPlans && formatEnumLabel(user.familyPlans),
              ]
                .filter(Boolean)
                .map((badge, i) => (
                  <span key={i} className="badge-primary">
                    {badge}
                  </span>
                ))}
              {/* Show placeholder badges if none exist */}
              {![user?.religion, user?.politics, user?.drinking, user?.smoking, user?.familyPlans].some(Boolean) && (
                <>
                  <span className="badge-primary">Spiritual</span>
                  <span className="badge-primary">Moderate</span>
                  <span className="badge-primary">Drinks: Sometimes</span>
                  <span className="badge-primary">Open to children</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Profile Insights */}
        <div>
          <h3 className="text-sm font-semibold text-hinge-text-secondary mb-3">
            Profile Insights
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Heart, label: 'Likes received', value: stats.likesReceived, color: 'text-hinge-secondary' },
              { icon: Heart, label: 'Likes given', value: stats.likesGiven, color: 'text-hinge-primary' },
              { icon: TrendingUp, label: 'Matches', value: stats.matches, color: 'text-hinge-success' },
              { icon: Eye, label: 'Profile views', value: stats.profileViews, color: 'text-hinge-accent' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl bg-hinge-surface border border-hinge-border"
              >
                <stat.icon className={cn('w-5 h-5 mb-2', stat.color)} fill="currentColor" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-hinge-text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div>
          <h3 className="text-sm font-semibold text-hinge-text-secondary mb-3">Settings</h3>
          <div className="rounded-xl bg-hinge-surface border border-hinge-border overflow-hidden divide-y divide-hinge-border/50">
            <SettingsItem
              icon={SlidersHorizontal}
              label="Preferences"
              sublabel="Age, distance, dealbreakers"
              onClick={() => toast('Preferences coming soon!')}
            />
            <SettingsItem
              icon={Bell}
              label="Notifications"
              sublabel="Manage push notifications"
              onClick={() => toast('Notifications settings coming soon!')}
            />
            <SettingsItem
              icon={Shield}
              label="Verification"
              sublabel={user?.isVerified ? 'Verified' : 'Get verified'}
              onClick={() => toast('Verification coming soon!')}
              badge={user?.isVerified ? 'Verified' : undefined}
            />
            <SettingsItem
              icon={Pause}
              label="Pause Profile"
              sublabel={user?.isPaused ? 'Your profile is hidden' : 'Hide from discovery'}
              onClick={handlePauseProfile}
              isWarning={user?.isPaused}
            />
            <SettingsItem
              icon={Lock}
              label="Privacy & Security"
              sublabel="Password, blocked users"
              onClick={() => toast('Privacy settings coming soon!')}
            />
            <SettingsItem
              icon={LogOut}
              label="Log Out"
              sublabel=""
              onClick={() => setShowLogoutConfirm(true)}
              isDanger
            />
          </div>
        </div>
      </div>

      {/* Logout confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-hinge-surface border border-hinge-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-hinge-danger/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-hinge-danger" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Log out?</h3>
                  <p className="text-sm text-hinge-text-secondary">
                    You can always log back in.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 btn-ghost border border-hinge-border py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-full bg-hinge-danger text-white font-semibold hover:bg-hinge-danger/90 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsItem({
  icon: Icon,
  label,
  sublabel,
  onClick,
  isDanger = false,
  isWarning = false,
  badge,
}: {
  icon: typeof Settings;
  label: string;
  sublabel: string;
  onClick: () => void;
  isDanger?: boolean;
  isWarning?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-hinge-surface-light transition-colors text-left"
    >
      <Icon
        className={cn(
          'w-5 h-5 flex-shrink-0',
          isDanger ? 'text-hinge-danger' : isWarning ? 'text-hinge-warning' : 'text-hinge-text-muted'
        )}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            isDanger ? 'text-hinge-danger' : 'text-white'
          )}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-hinge-text-muted mt-0.5">{sublabel}</p>
        )}
      </div>
      {badge && (
        <span className="badge-primary text-[10px]">{badge}</span>
      )}
      {!isDanger && <ChevronRight className="w-4 h-4 text-hinge-text-muted flex-shrink-0" />}
    </button>
  );
}
