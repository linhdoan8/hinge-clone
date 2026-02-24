import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, differenceInYears, format, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAge(birthday: string | Date): number {
  const birthDate = typeof birthday === 'string' ? new Date(birthday) : birthday;
  return differenceInYears(new Date(), birthDate);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  const km = meters / 1000;
  if (km < 1.5) {
    return '1 km away';
  }
  return `${Math.round(km)} km away`;
}

export function formatDistanceMiles(km: number): string {
  if (km < 1) {
    return 'Less than a mile away';
  }
  const miles = Math.round(km * 0.621371);
  if (miles === 1) {
    return '1 mile away';
  }
  return `${miles} miles away`;
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatMessageTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) {
    return format(d, 'h:mm a');
  }

  if (isYesterday(d)) {
    return `Yesterday ${format(d, 'h:mm a')}`;
  }

  return format(d, 'MMM d, h:mm a');
}

export function formatChatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) {
    return 'Today';
  }

  if (isYesterday(d)) {
    return 'Yesterday';
  }

  return format(d, 'EEEE, MMMM d');
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getHeightDisplay(heightCm?: number): string {
  if (!heightCm) return '';
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

export function generatePlaceholderPhoto(seed: number, width = 400, height = 600): string {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

export function generateAvatarUrl(name: string, size = 200): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=6C47FF&color=fff&bold=true`;
}

export const PROMPT_TEMPLATES = [
  { id: 'pt_01', category: 'ABOUT_ME', text: 'A shower thought I recently had' },
  { id: 'pt_02', category: 'ABOUT_ME', text: 'My simple pleasures' },
  { id: 'pt_03', category: 'ABOUT_ME', text: 'I geek out on' },
  { id: 'pt_04', category: 'ABOUT_ME', text: 'My most irrational fear' },
  { id: 'pt_05', category: 'ABOUT_ME', text: 'The hallmark of a good relationship is' },
  { id: 'pt_06', category: 'ABOUT_ME', text: "I'm looking for" },
  { id: 'pt_07', category: 'ABOUT_ME', text: "I'm known for" },
  { id: 'pt_08', category: 'CREATIVITY', text: 'Two truths and a lie' },
  { id: 'pt_09', category: 'CREATIVITY', text: 'Typical Sunday' },
  { id: 'pt_10', category: 'CREATIVITY', text: 'My go-to karaoke song' },
  { id: 'pt_11', category: 'CREATIVITY', text: 'A life goal of mine' },
  { id: 'pt_12', category: 'OPINIONS', text: 'A hot take I have' },
  { id: 'pt_13', category: 'OPINIONS', text: 'The best way to ask me out is' },
  { id: 'pt_14', category: 'OPINIONS', text: 'The way to win me over is' },
  { id: 'pt_15', category: 'OPINIONS', text: 'My love language is' },
  { id: 'pt_16', category: 'STORYTELLING', text: 'My most embarrassing moment' },
  { id: 'pt_17', category: 'STORYTELLING', text: 'The best trip I ever took' },
  { id: 'pt_18', category: 'STORYTELLING', text: 'An unexpected fact about me' },
  { id: 'pt_19', category: 'STORYTELLING', text: 'The last thing I read that I loved' },
  { id: 'pt_20', category: 'DATING', text: 'Together, we could' },
  { id: 'pt_21', category: 'DATING', text: "I'm convinced that" },
  { id: 'pt_22', category: 'DATING', text: 'Let\'s debate this topic' },
  { id: 'pt_23', category: 'DATING', text: 'You should leave a comment if' },
  { id: 'pt_24', category: 'LIFESTYLE', text: 'My biggest date fail' },
  { id: 'pt_25', category: 'LIFESTYLE', text: 'I recently discovered that' },
  { id: 'pt_26', category: 'LIFESTYLE', text: 'A boundary of mine is' },
  { id: 'pt_27', category: 'LIFESTYLE', text: 'I want someone who' },
  { id: 'pt_28', category: 'LIFESTYLE', text: 'Believe it or not, I' },
];

export type OptionItem = { value: string; label: string };

export const IDENTITY_OPTIONS: Record<string, OptionItem[]> = {
  religion: [
    { value: 'AGNOSTIC', label: 'Agnostic' },
    { value: 'ATHEIST', label: 'Atheist' },
    { value: 'BUDDHIST', label: 'Buddhist' },
    { value: 'CATHOLIC', label: 'Catholic' },
    { value: 'CHRISTIAN', label: 'Christian' },
    { value: 'HINDU', label: 'Hindu' },
    { value: 'JEWISH', label: 'Jewish' },
    { value: 'MUSLIM', label: 'Muslim' },
    { value: 'SPIRITUAL', label: 'Spiritual' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ],
  politics: [
    { value: 'LIBERAL', label: 'Liberal' },
    { value: 'MODERATE', label: 'Moderate' },
    { value: 'CONSERVATIVE', label: 'Conservative' },
    { value: 'NOT_POLITICAL', label: 'Not political' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ],
  drinking: [
    { value: 'YES', label: 'Yes' },
    { value: 'SOMETIMES', label: 'Sometimes' },
    { value: 'NO', label: 'No' },
    { value: 'SOBER', label: 'Sober' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ],
  smoking: [
    { value: 'YES', label: 'Yes' },
    { value: 'SOMETIMES', label: 'Sometimes' },
    { value: 'NO', label: 'No' },
    { value: 'TRYING_TO_QUIT', label: 'Trying to quit' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ],
  drugs: [
    { value: 'YES', label: 'Yes' },
    { value: 'SOMETIMES', label: 'Sometimes' },
    { value: 'NO', label: 'No' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ],
  familyPlans: [
    { value: 'WANT_CHILDREN', label: 'Want children' },
    { value: 'DONT_WANT_CHILDREN', label: "Don't want children" },
    { value: 'HAVE_AND_WANT_MORE', label: 'Have & want more' },
    { value: 'HAVE_AND_DONT_WANT_MORE', label: "Have & don't want more" },
    { value: 'NOT_SURE', label: 'Not sure yet' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ],
};

export const GENDER_OPTIONS: OptionItem[] = [
  { value: 'MAN', label: 'Man' },
  { value: 'WOMAN', label: 'Woman' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Other' },
];

export const GENDER_PREFERENCE_OPTIONS: OptionItem[] = [
  { value: 'MEN', label: 'Men' },
  { value: 'WOMEN', label: 'Women' },
  { value: 'EVERYONE', label: 'Everyone' },
];

export function formatEnumLabel(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
