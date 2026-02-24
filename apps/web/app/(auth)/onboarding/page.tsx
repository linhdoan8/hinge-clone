'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ArrowLeft, ArrowRight, Camera, Check, Loader2,
  Calendar, MapPin, Ruler, Briefcase, GraduationCap, Building2,
  Plus, X, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  cn, PROMPT_TEMPLATES, IDENTITY_OPTIONS, GENDER_OPTIONS,
  GENDER_PREFERENCE_OPTIONS, generatePlaceholderPhoto,
} from '@/lib/utils';

const TOTAL_STEPS = 6;

interface OnboardingData {
  birthday: string;
  gender: string;
  genderPreference: string;
  location: string;
  height: string;
  jobTitle: string;
  company: string;
  school: string;
  photos: string[];
  prompts: { templateId: string; answer: string }[];
  religion: string;
  politics: string;
  drinking: string;
  smoking: string;
  drugs: string;
  familyPlans: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    birthday: '',
    gender: '',
    genderPreference: '',
    location: '',
    height: '',
    jobTitle: '',
    company: '',
    school: '',
    photos: [],
    prompts: [],
    religion: '',
    politics: '',
    drinking: '',
    smoking: '',
    drugs: '',
    familyPlans: '',
  });

  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string | null>(null);
  const [currentPromptAnswer, setCurrentPromptAnswer] = useState('');

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!data.birthday && !!data.gender && !!data.genderPreference;
      case 2:
        return !!data.location;
      case 3:
        return true;
      case 4:
        return data.photos.length >= 6;
      case 5:
        return data.prompts.length >= 3;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const addPhoto = () => {
    if (data.photos.length < 6) {
      const seed = Math.floor(Math.random() * 1000) + data.photos.length;
      const url = generatePlaceholderPhoto(seed);
      updateData({ photos: [...data.photos, url] });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...data.photos];
    newPhotos.splice(index, 1);
    updateData({ photos: newPhotos });
  };

  const addPrompt = () => {
    if (selectedPromptTemplate && currentPromptAnswer.trim() && data.prompts.length < 3) {
      updateData({
        prompts: [
          ...data.prompts,
          { templateId: selectedPromptTemplate, answer: currentPromptAnswer.trim() },
        ],
      });
      setSelectedPromptTemplate(null);
      setCurrentPromptAnswer('');
    }
  };

  const removePrompt = (index: number) => {
    const newPrompts = [...data.prompts];
    newPrompts.splice(index, 1);
    updateData({ prompts: newPrompts });
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const payload = {
        birthday: data.birthday || '1998-01-15',
        gender: data.gender,
        genderPreference: data.genderPreference,
        hometown: data.location,
        height: data.height ? parseInt(data.height, 10) : undefined,
        jobTitle: data.jobTitle || undefined,
        company: data.company || undefined,
        school: data.school || undefined,
        religion: data.religion || undefined,
        politics: data.politics || undefined,
        drinking: data.drinking || undefined,
        smoking: data.smoking || undefined,
        drugs: data.drugs || undefined,
        familyPlans: data.familyPlans || undefined,
        photos: data.photos.map((url, i) => ({ url, position: i + 1 })),
        prompts: data.prompts.map((p, i) => ({
          promptTemplateId: p.templateId,
          answer: p.answer,
          position: i + 1,
        })),
        profileComplete: true,
      };

      const response = await api.patch('/users/me', payload);
      const updatedUser = response.data?.data || response.data;
      updateProfile({ ...updatedUser, profileComplete: true });
      toast.success('Profile complete! Start discovering.');
      router.push('/discover');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPromptText = (templateId: string): string => {
    return PROMPT_TEMPLATES.find((t) => t.id === templateId)?.text || '';
  };

  const usedTemplateIds = data.prompts.map((p) => p.templateId);

  return (
    <div className="min-h-screen flex flex-col bg-hinge-dark">
      <div className="absolute inset-0 bg-gradient-to-br from-hinge-primary/5 via-transparent to-transparent" />

      <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className={cn(
                'p-2 rounded-full hover:bg-hinge-surface-light transition-colors',
                step === 1 && 'opacity-0 pointer-events-none'
              )}
            >
              <ArrowLeft className="w-5 h-5 text-hinge-text-secondary" />
            </button>
            <div className="flex items-center gap-1">
              <Heart className="w-5 h-5 text-hinge-primary" fill="currentColor" />
              <span className="text-sm font-medium text-hinge-text-secondary">
                Step {step} of {TOTAL_STEPS}
              </span>
            </div>
            <div className="w-9" />
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-hinge-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-hinge rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Birthday, Gender */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">The basics</h2>
                    <p className="text-hinge-text-secondary">Let us know a bit about you.</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-hinge-text-secondary mb-3">
                      <Calendar className="w-4 h-4" />
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={data.birthday}
                      onChange={(e) => updateData({ birthday: e.target.value })}
                      className="input-field"
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                        .toISOString()
                        .split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-hinge-text-secondary mb-3 block">
                      I am a...
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {GENDER_OPTIONS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => updateData({ gender: g.value })}
                          className={cn(
                            'px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                            data.gender === g.value
                              ? 'border-hinge-primary bg-hinge-primary/10 text-hinge-primary'
                              : 'border-hinge-border bg-hinge-surface text-hinge-text-secondary hover:border-hinge-primary/50'
                          )}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-hinge-text-secondary mb-3 block">
                      Interested in...
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {GENDER_PREFERENCE_OPTIONS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => updateData({ genderPreference: g.value })}
                          className={cn(
                            'px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                            data.genderPreference === g.value
                              ? 'border-hinge-primary bg-hinge-primary/10 text-hinge-primary'
                              : 'border-hinge-border bg-hinge-surface text-hinge-text-secondary hover:border-hinge-primary/50'
                          )}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location, Height */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Where are you?</h2>
                    <p className="text-hinge-text-secondary">Help us find people near you.</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-hinge-text-secondary mb-3">
                      <MapPin className="w-4 h-4" />
                      City
                    </label>
                    <input
                      type="text"
                      value={data.location}
                      onChange={(e) => updateData({ location: e.target.value })}
                      placeholder="e.g. San Francisco, CA"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-hinge-text-secondary mb-3">
                      <Ruler className="w-4 h-4" />
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={data.height}
                      onChange={(e) => updateData({ height: e.target.value })}
                      placeholder="e.g. 175"
                      className="input-field"
                      min={120}
                      max={230}
                    />
                    {data.height && (
                      <p className="mt-2 text-sm text-hinge-text-muted">
                        {Math.floor(parseInt(data.height) / 2.54 / 12)}&apos;
                        {Math.round((parseInt(data.height) / 2.54) % 12)}&quot;
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Work & Education */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Work & education</h2>
                    <p className="text-hinge-text-secondary">Optional, but helps people know you better.</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-hinge-text-secondary mb-3">
                      <Briefcase className="w-4 h-4" />
                      Job title
                    </label>
                    <input
                      type="text"
                      value={data.jobTitle}
                      onChange={(e) => updateData({ jobTitle: e.target.value })}
                      placeholder="e.g. Software Engineer"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-hinge-text-secondary mb-3">
                      <Building2 className="w-4 h-4" />
                      Company
                    </label>
                    <input
                      type="text"
                      value={data.company}
                      onChange={(e) => updateData({ company: e.target.value })}
                      placeholder="e.g. Google"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-hinge-text-secondary mb-3">
                      <GraduationCap className="w-4 h-4" />
                      School
                    </label>
                    <input
                      type="text"
                      value={data.school}
                      onChange={(e) => updateData({ school: e.target.value })}
                      placeholder="e.g. Stanford University"
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Photos */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Add your photos</h2>
                    <p className="text-hinge-text-secondary">
                      Add 6 photos to complete your profile. For demo purposes, click the slots to add placeholder images.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, index) => {
                      const photo = data.photos[index];
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {photo ? (
                            <div className="photo-slot-filled">
                              <Image
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 33vw, 150px"
                              />
                              <button
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-hinge-danger transition-colors z-10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-hinge-primary flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                            </div>
                          ) : (
                            <div className="photo-slot" onClick={addPhoto}>
                              <div className="text-center">
                                <Camera className="w-6 h-6 text-hinge-text-muted mx-auto mb-1" />
                                <span className="text-xs text-hinge-text-muted">Add</span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="text-sm text-hinge-text-muted text-center">
                    {data.photos.length}/6 photos added
                    {data.photos.length < 6 && (
                      <span className="text-hinge-secondary ml-1">
                        ({6 - data.photos.length} more required)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Step 5: Prompts */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your prompts</h2>
                    <p className="text-hinge-text-secondary">
                      Pick 3 prompts and write your answers. This is how people get to know you.
                    </p>
                  </div>

                  {/* Added prompts */}
                  {data.prompts.map((prompt, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-hinge-surface border border-hinge-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-hinge-primary">
                          {getPromptText(prompt.templateId)}
                        </p>
                        <button
                          onClick={() => removePrompt(index)}
                          className="p-1 rounded-full hover:bg-hinge-surface-light"
                        >
                          <X className="w-4 h-4 text-hinge-text-muted" />
                        </button>
                      </div>
                      <p className="text-white">{prompt.answer}</p>
                    </motion.div>
                  ))}

                  {/* Add new prompt */}
                  {data.prompts.length < 3 && (
                    <div className="space-y-4">
                      {!selectedPromptTemplate ? (
                        <div>
                          <p className="text-sm font-medium text-hinge-text-secondary mb-3">
                            Choose a prompt ({3 - data.prompts.length} remaining)
                          </p>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {PROMPT_TEMPLATES.filter(
                              (t) => !usedTemplateIds.includes(t.id)
                            ).map((template) => (
                              <button
                                key={template.id}
                                onClick={() => setSelectedPromptTemplate(template.id)}
                                className="w-full text-left p-3.5 rounded-xl border border-hinge-border bg-hinge-surface hover:border-hinge-primary/50 hover:bg-hinge-surface-light transition-all text-sm"
                              >
                                <span className="text-white">{template.text}</span>
                                <span className="block text-xs text-hinge-text-muted mt-1 capitalize">
                                  {template.category}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-hinge-surface border border-hinge-primary/30">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-hinge-primary">
                              {getPromptText(selectedPromptTemplate)}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedPromptTemplate(null);
                                setCurrentPromptAnswer('');
                              }}
                              className="text-xs text-hinge-text-muted hover:text-white"
                            >
                              Change
                            </button>
                          </div>
                          <textarea
                            value={currentPromptAnswer}
                            onChange={(e) => setCurrentPromptAnswer(e.target.value)}
                            placeholder="Write your answer..."
                            className="input-field resize-none h-24"
                            maxLength={300}
                          />
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-hinge-text-muted">
                              {currentPromptAnswer.length}/300
                            </span>
                            <button
                              onClick={addPrompt}
                              disabled={!currentPromptAnswer.trim()}
                              className="btn-primary py-2 px-5 text-sm disabled:opacity-40"
                            >
                              Add prompt
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Identity */}
              {step === 6 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Almost done!</h2>
                    <p className="text-hinge-text-secondary">
                      These are optional, but help find compatible matches.
                    </p>
                  </div>

                  {Object.entries(IDENTITY_OPTIONS).map(([key, options]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-hinge-text-secondary mb-3 block capitalize">
                        {key === 'familyPlans' ? 'Family plans' : key}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {options.map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              updateData({
                                [key]: data[key as keyof OnboardingData] === option.value ? '' : option.value,
                              } as Partial<OnboardingData>)
                            }
                            className={cn(
                              'px-3.5 py-2 rounded-full text-sm font-medium transition-all border',
                              data[key as keyof OnboardingData] === option.value
                                ? 'border-hinge-primary bg-hinge-primary/10 text-hinge-primary'
                                : 'border-hinge-border bg-hinge-surface text-hinge-text-secondary hover:border-hinge-primary/50'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-hinge-dark via-hinge-dark to-transparent">
          <div className="max-w-lg mx-auto">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : step === TOTAL_STEPS ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Complete Profile
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
            {step === 3 || step === 6 ? (
              <button
                onClick={handleNext}
                className="w-full mt-3 text-center text-sm text-hinge-text-muted hover:text-hinge-text-secondary transition-colors"
              >
                Skip for now
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
