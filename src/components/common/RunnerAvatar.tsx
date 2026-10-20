import React from 'react';
import { DEFAULT_AVATAR_EMOJI } from '../../utils/emojiAvatars';

interface RunnerAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  sizeClassName?: string;
  className?: string;
  textSizeClassName?: string;
}

export const RunnerAvatar: React.FC<RunnerAvatarProps> = ({
  avatarUrl,
  name = 'Runner',
  sizeClassName = 'w-10 h-10',
  className = '',
  textSizeClassName = 'text-xl',
}) => {
  const isHttpUrl = Boolean(avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')));

  if (isHttpUrl) {
    return (
      <img
        src={avatarUrl!}
        alt={name}
        className={`${sizeClassName} rounded-full object-cover bg-slate-100 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Treat as Emoji Avatar
  const emoji = avatarUrl && avatarUrl.trim().length > 0 ? avatarUrl.trim() : DEFAULT_AVATAR_EMOJI;

  return (
    <div
      className={`${sizeClassName} rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-300/80 flex items-center justify-center select-none shadow-xs ${className}`}
      title={name}
    >
      <span className={`${textSizeClassName} leading-none flex items-center justify-center`}>
        {emoji}
      </span>
    </div>
  );
};
