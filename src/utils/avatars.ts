export interface AvatarCategory {
  category: string;
  items: Array<{ emoji: string; label: string }>;
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    category: 'Animals',
    items: [
      { emoji: '🦊', label: 'Fox' },
      { emoji: '🐱', label: 'Kitten' },
      { emoji: '🐼', label: 'Panda' },
      { emoji: '🐨', label: 'Koala' },
      { emoji: '🦁', label: 'Lion' },
      { emoji: '🐯', label: 'Tiger' },
      { emoji: '🐰', label: 'Bunny' },
      { emoji: '🐻', label: 'Bear' },
      { emoji: '🐸', label: 'Froggy' },
      { emoji: '🦄', label: 'Unicorn' },
      { emoji: '🐙', label: 'Octo' },
      { emoji: '🐧', label: 'Penguin' },
    ]
  },
  {
    category: 'Gaming & Cyber',
    items: [
      { emoji: '🎮', label: 'Gamepad' },
      { emoji: '👾', label: 'Invader' },
      { emoji: '🕹️', label: 'Arcade' },
      { emoji: '🤖', label: 'Cyborg' },
      { emoji: '⚡', label: 'Volt' },
      { emoji: '🔮', label: 'Crystal' },
      { emoji: '💎', label: 'Diamond' },
      { emoji: '🏆', label: 'Champion' },
      { emoji: '👑', label: 'Royalty' },
      { emoji: '🎯', label: 'Deadeye' },
      { emoji: '🚀', label: 'Rocket' },
      { emoji: '🛸', label: 'Cosmic' },
    ]
  },
  {
    category: 'Aesthetic & Vibes',
    items: [
      { emoji: '🌸', label: 'Blossom' },
      { emoji: '🍓', label: 'Berry' },
      { emoji: '🥑', label: 'Avocado' },
      { emoji: '🍕', label: 'Pizza' },
      { emoji: '🍦', label: 'Sundae' },
      { emoji: '🍀', label: 'Lucky' },
      { emoji: '🌈', label: 'Rainbow' },
      { emoji: '⭐', label: 'Starlight' },
      { emoji: '🌙', label: 'Crescent' },
      { emoji: '🪐', label: 'Planet' },
      { emoji: '🎨', label: 'Artist' },
      { emoji: '🔥', label: 'Inferno' },
    ]
  }
];

export const ALL_AVATARS = AVATAR_CATEGORIES.flatMap(c => c.items.map(i => i.emoji));
