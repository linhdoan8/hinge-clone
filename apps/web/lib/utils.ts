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
  { id: '1', category: 'personality', text: 'A shower thought I recently had' },
  { id: '2', category: 'personality', text: 'My simple pleasures' },
  { id: '3', category: 'personality', text: 'I geek out on' },
  { id: '4', category: 'dating', text: "I'm looking for" },
  { id: '5', category: 'dating', text: 'The hallmark of a good relationship is' },
  { id: '6', category: 'dating', text: 'Dating me is like' },
  { id: '7', category: 'personality', text: 'My most irrational fear' },
  { id: '8', category: 'personality', text: 'Two truths and a lie' },
  { id: '9', category: 'lifestyle', text: 'Typical Sunday' },
  { id: '10', category: 'lifestyle', text: 'A life goal of mine' },
  { id: '11', category: 'personality', text: "I'm convinced that" },
  { id: '12', category: 'dating', text: 'Together, we could' },
  { id: '13', category: 'lifestyle', text: "I won't shut up about" },
  { id: '14', category: 'personality', text: 'My greatest strength' },
  { id: '15', category: 'dating', text: 'The way to win me over is' },
  { id: '16', category: 'lifestyle', text: 'One thing I\'d love to know about you' },
  { id: '17', category: 'personality', text: 'Believe it or not, I' },
  { id: '18', category: 'lifestyle', text: 'My go-to karaoke song' },
  { id: '19', category: 'dating', text: 'Green flags I look for' },
  { id: '20', category: 'personality', text: 'The key to my heart is' },
];

export const IDENTITY_OPTIONS = {
  religion: [
    'Agnostic', 'Atheist', 'Buddhist', 'Catholic', 'Christian', 'Hindu',
    'Jewish', 'Muslim', 'Sikh', 'Spiritual', 'Other', 'Prefer not to say',
  ],
  politics: [
    'Liberal', 'Moderate', 'Conservative', 'Not political', 'Other', 'Prefer not to say',
  ],
  drinking: ['Yes', 'Sometimes', 'No', 'Prefer not to say'],
  smoking: ['Yes', 'Sometimes', 'No', 'Prefer not to say'],
  drugs: ['Yes', 'Sometimes', 'No', 'Prefer not to say'],
  familyPlans: [
    'Want children', 'Don\'t want children', 'Have children', 'Open to children', 'Not sure yet',
  ],
};

export const GENDER_OPTIONS = [
  'Man', 'Woman', 'Non-binary', 'Prefer not to say',
];

export const GENDER_PREFERENCE_OPTIONS = [
  'Men', 'Women', 'Everyone',
];
