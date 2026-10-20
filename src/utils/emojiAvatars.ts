export interface EmojiAvatarOption {
  emoji: string;
  name: string;
  description: string;
}

export const DEFAULT_AVATAR_EMOJI = '🏅';

export const EMOJI_AVATAR_OPTIONS: EmojiAvatarOption[] = [
  { emoji: '🏃‍♀️', name: 'Sprinter', description: 'Speed on the track' },
  { emoji: '🦅', name: 'Eagle', description: 'Soaring vision' },
  { emoji: '🚴', name: 'Cyclist', description: 'Endurance on wheels' },
  { emoji: '🏊', name: 'Swimmer', description: 'Cross-training athlete' },
  { emoji: '🧗', name: 'Climber', description: 'Hill specialist' },
  { emoji: '🏅', name: 'Medal', description: 'Race finisher' },
];
