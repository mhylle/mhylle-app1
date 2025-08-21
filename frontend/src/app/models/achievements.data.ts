import { Achievement, CollectibleCandy } from './candy-factory.interface';

export const ACHIEVEMENTS: Achievement[] = [
  // Production Achievements
  {
    id: 'first_candy',
    name: 'Sweet Beginning',
    description: 'Earn your first candy',
    category: 'production',
    icon: '🍭',
    rarity: 'common',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    requirements: [{ type: 'candy_total', value: 1 }],
    rewards: [{ type: 'click_multiplier', value: 1.1, permanent: true }]
  },
  {
    id: 'candy_hundred',
    name: 'Century of Sweetness',
    description: 'Earn 100 total candy',
    category: 'production',
    icon: '💯',
    rarity: 'common',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    requirements: [{ type: 'candy_total', value: 100 }],
    rewards: [{ type: 'production_multiplier', value: 1.05, permanent: true }]
  },
  {
    id: 'candy_thousand',
    name: 'Candy Magnate',
    description: 'Earn 1,000 total candy',
    category: 'production',
    icon: '🏭',
    rarity: 'rare',
    unlocked: false,
    progress: 0,
    maxProgress: 1000,
    requirements: [{ type: 'candy_total', value: 1000 }],
    rewards: [
      { type: 'click_multiplier', value: 1.15, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'sugar_crystal', permanent: true }
    ]
  },
  {
    id: 'candy_million',
    name: 'Sugar Empire',
    description: 'Earn 1,000,000 total candy',
    category: 'production',
    icon: '👑',
    rarity: 'epic',
    unlocked: false,
    progress: 0,
    maxProgress: 1000000,
    requirements: [{ type: 'candy_total', value: 1000000 }],
    rewards: [
      { type: 'production_multiplier', value: 1.25, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'golden_gummy', permanent: true }
    ]
  },

  // Clicking Achievements
  {
    id: 'first_click',
    name: 'Planet Toucher',
    description: 'Click the candy planet',
    category: 'clicking',
    icon: '👆',
    rarity: 'common',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    requirements: [{ type: 'candy_click', value: 1 }],
    rewards: [{ type: 'candy_bonus', value: 10, permanent: false }]
  },
  {
    id: 'hundred_clicks',
    name: 'Finger Workout',
    description: 'Click 100 times',
    category: 'clicking',
    icon: '💪',
    rarity: 'common',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    requirements: [{ type: 'candy_click', value: 100 }],
    rewards: [{ type: 'click_multiplier', value: 1.1, permanent: true }]
  },
  {
    id: 'thousand_clicks',
    name: 'Click Master',
    description: 'Click 1,000 times',
    category: 'clicking',
    icon: '🎯',
    rarity: 'rare',
    unlocked: false,
    progress: 0,
    maxProgress: 1000,
    requirements: [{ type: 'candy_click', value: 1000 }],
    rewards: [
      { type: 'click_multiplier', value: 1.2, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'click_burst', permanent: true }
    ]
  },

  // Flying Candy Achievements
  {
    id: 'first_flying_catch',
    name: 'Sky Fisher',
    description: 'Catch your first flying candy',
    category: 'collection',
    icon: '🎣',
    rarity: 'common',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    requirements: [{ type: 'flying_candy_caught', value: 1 }],
    rewards: [{ type: 'candy_bonus', value: 50, permanent: false }]
  },
  {
    id: 'ten_flying_catch',
    name: 'Cosmic Hunter',
    description: 'Catch 10 flying candies',
    category: 'collection',
    icon: '🏹',
    rarity: 'rare',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    requirements: [{ type: 'flying_candy_caught', value: 10 }],
    rewards: [
      { type: 'production_multiplier', value: 1.1, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'flying_mint', permanent: true }
    ]
  },
  {
    id: 'golden_catch',
    name: 'Golden Opportunity',
    description: 'Catch a golden flying candy',
    category: 'collection',
    icon: '⭐',
    rarity: 'epic',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    requirements: [{ type: 'custom', value: 1 }], // Special tracking needed
    rewards: [
      { type: 'click_multiplier', value: 1.5, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'golden_star', permanent: true }
    ]
  },

  // Prestige Achievements
  {
    id: 'first_prestige',
    name: 'Restart Pioneer',
    description: 'Perform your first prestige',
    category: 'prestige',
    icon: '🔄',
    rarity: 'rare',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    requirements: [{ type: 'prestige_level', value: 1 }],
    rewards: [
      { type: 'prestige_bonus', value: 1.1, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'prestige_pearl', permanent: true }
    ]
  },
  {
    id: 'prestige_master',
    name: 'Infinite Loop',
    description: 'Reach prestige level 5',
    category: 'prestige',
    icon: '♾️',
    rarity: 'legendary',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    requirements: [{ type: 'prestige_level', value: 5 }],
    rewards: [
      { type: 'prestige_bonus', value: 1.25, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'infinity_crystal', permanent: true }
    ]
  },

  // Collection Achievements
  {
    id: 'collector_novice',
    name: 'Candy Collector',
    description: 'Discover 5 different candy types',
    category: 'collection',
    icon: '📚',
    rarity: 'common',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    requirements: [{ type: 'collection_count', value: 5 }],
    rewards: [{ type: 'production_multiplier', value: 1.05, permanent: true }]
  },
  {
    id: 'collector_expert',
    name: 'Sweet Archivist',
    description: 'Discover 15 different candy types',
    category: 'collection',
    icon: '🗂️',
    rarity: 'epic',
    unlocked: false,
    progress: 0,
    maxProgress: 15,
    requirements: [{ type: 'collection_count', value: 15 }],
    rewards: [
      { type: 'click_multiplier', value: 1.3, permanent: true },
      { type: 'production_multiplier', value: 1.15, permanent: true }
    ]
  },

  // Secret Achievements
  {
    id: 'rapid_clicker',
    name: 'Speed Demon',
    description: 'Click 10 times in 1 second',
    category: 'secret',
    icon: '⚡',
    rarity: 'legendary',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    requirements: [{ type: 'custom', value: 1 }], // Special tracking needed
    rewards: [
      { type: 'click_multiplier', value: 2.0, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'lightning_pop', permanent: true }
    ],
    hidden: true
  },
  {
    id: 'patience_master',
    name: 'Zen Master',
    description: 'Play for 1 hour without clicking',
    category: 'secret',
    icon: '🧘',
    rarity: 'mythic',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    requirements: [{ type: 'custom', value: 1 }], // Special tracking needed
    rewards: [
      { type: 'production_multiplier', value: 3.0, permanent: true },
      { type: 'unlock_candy', value: 1, candyType: 'zen_drop', permanent: true }
    ],
    hidden: true
  }
];

export const COLLECTIBLE_CANDIES: CollectibleCandy[] = [
  // Common Flying Candies
  {
    id: 'basic_candy',
    name: 'Cosmic Candy',
    description: 'The most basic candy from your factory',
    rarity: 'common',
    icon: '🍬',
    color: '#ff69b4',
    count: 0,
    source: 'flying',
    passiveBonuses: [
      { type: 'click_power', multiplier: 1.01, description: '+1% click power' }
    ]
  },
  {
    id: 'sugar_crystal',
    name: 'Sugar Crystal',
    description: 'A crystalline structure of pure sweetness',
    rarity: 'rare',
    icon: '💎',
    color: '#87ceeb',
    count: 0,
    source: 'achievement',
    passiveBonuses: [
      { type: 'click_power', multiplier: 1.05, description: '+5% click power' },
      { type: 'production_rate', multiplier: 1.02, description: '+2% production rate' }
    ]
  },

  // Rare Candies
  {
    id: 'flying_mint',
    name: 'Flying Mint',
    description: 'A refreshing candy that soars through space',
    rarity: 'rare',
    icon: '🌿',
    color: '#98fb98',
    count: 0,
    source: 'achievement',
    passiveBonuses: [
      { type: 'flying_candy_spawn', multiplier: 1.1, description: '+10% flying candy spawn rate' }
    ]
  },
  {
    id: 'click_burst',
    name: 'Click Burst',
    description: 'Explosive candy that amplifies your clicking power',
    rarity: 'rare',
    icon: '💥',
    color: '#ffa500',
    count: 0,
    source: 'achievement',
    passiveBonuses: [
      { type: 'click_power', multiplier: 1.1, description: '+10% click power' }
    ]
  },

  // Epic Candies
  {
    id: 'golden_gummy',
    name: 'Golden Gummy',
    description: 'A legendary gummy bear made of pure gold',
    rarity: 'epic',
    icon: '🧸',
    color: '#ffd700',
    count: 0,
    source: 'achievement',
    passiveBonuses: [
      { type: 'production_rate', multiplier: 1.15, description: '+15% production rate' },
      { type: 'click_power', multiplier: 1.1, description: '+10% click power' }
    ]
  },
  {
    id: 'golden_star',
    name: 'Golden Star',
    description: 'A star-shaped candy that fell from the heavens',
    rarity: 'epic',
    icon: '⭐',
    color: '#ffff00',
    count: 0,
    source: 'achievement',
    passiveBonuses: [
      { type: 'flying_candy_spawn', multiplier: 1.25, description: '+25% flying candy spawn rate' },
      { type: 'special', multiplier: 1.1, description: '+10% chance for golden flying candies' }
    ]
  },

  // Legendary Candies
  {
    id: 'prestige_pearl',
    name: 'Prestige Pearl',
    description: 'A perfect sphere containing the essence of rebirth',
    rarity: 'legendary',
    icon: '⚪',
    color: '#f0f8ff',
    count: 0,
    source: 'prestige',
    passiveBonuses: [
      { type: 'prestige_bonus', multiplier: 1.05, description: '+5% prestige point gain' }
    ]
  },
  {
    id: 'infinity_crystal',
    name: 'Infinity Crystal',
    description: 'A crystal that contains infinite possibilities',
    rarity: 'legendary',
    icon: '♾️',
    color: '#9370db',
    count: 0,
    source: 'prestige',
    passiveBonuses: [
      { type: 'click_power', multiplier: 1.25, description: '+25% click power' },
      { type: 'production_rate', multiplier: 1.2, description: '+20% production rate' },
      { type: 'prestige_bonus', multiplier: 1.1, description: '+10% prestige point gain' }
    ]
  },
  {
    id: 'lightning_pop',
    name: 'Lightning Pop',
    description: 'Electrifying candy that crackles with energy',
    rarity: 'legendary',
    icon: '⚡',
    color: '#ffff80',
    count: 0,
    source: 'achievement',
    passiveBonuses: [
      { type: 'click_power', multiplier: 1.5, description: '+50% click power' },
      { type: 'special', multiplier: 1.2, description: '+20% chance for critical clicks' }
    ]
  },

  // Mythic Candies
  {
    id: 'zen_drop',
    name: 'Zen Drop',
    description: 'Perfect harmony in candy form, achieved through patience',
    rarity: 'mythic',
    icon: '🧘',
    color: '#dda0dd',
    count: 0,
    source: 'achievement',
    passiveBonuses: [
      { type: 'production_rate', multiplier: 2.0, description: '+100% production rate' },
      { type: 'special', multiplier: 1.5, description: 'Passive candy generation increases over time' }
    ]
  }
];

export const RARITY_COLORS = {
  common: '#ffffff',
  rare: '#00ff00',
  epic: '#8a2be2',
  legendary: '#ffa500',
  mythic: '#ff1493'
};

export const RARITY_GLOW = {
  common: 'rgba(255, 255, 255, 0.3)',
  rare: 'rgba(0, 255, 0, 0.4)',
  epic: 'rgba(138, 43, 226, 0.5)',
  legendary: 'rgba(255, 165, 0, 0.6)',
  mythic: 'rgba(255, 20, 147, 0.7)'
};