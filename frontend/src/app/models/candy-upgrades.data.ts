import { CandyUpgrade } from './candy-factory.interface';

export const CANDY_UPGRADES: CandyUpgrade[] = [
  // Tier 1 - Basic Tools
  {
    id: 'candy-wrapper-bot',
    name: 'Candy Wrapper Bot',
    description: 'A tiny robot that helps you wrap candy faster',
    basePrice: 15,
    tier: 1,
    type: 'click',
    powerPerLevel: 1,
    unlockRequirement: { type: 'candy', value: 10 },
    icon: '🤖'
  },
  {
    id: 'sugar-sprinkler',
    name: 'Sugar Sprinkler',
    description: 'Automatically sprinkles sugar to create candy',
    basePrice: 100,
    tier: 1,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 1,
    unlockRequirement: { type: 'candy', value: 50 },
    icon: '💧'
  },
  {
    id: 'lollipop-cyclotron',
    name: 'Lollipop Cyclotron',
    description: 'Spins lollipops at incredible speeds for better clicking',
    basePrice: 1100,
    tier: 1,
    type: 'click',
    powerPerLevel: 25,
    unlockRequirement: { type: 'upgrade', value: 'candy-wrapper-bot' },
    icon: '🍭'
  },
  
  // Tier 2 - Factory Equipment
  {
    id: 'gummy-bear-army',
    name: 'Gummy Bear Army',
    description: 'An army of gummy bears working tirelessly',
    basePrice: 1100,
    tier: 2,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 8,
    unlockRequirement: { type: 'production', value: 10 },
    icon: '🐻'
  },
  {
    id: 'chocolate-fountain',
    name: 'Chocolate Fountain',
    description: 'Endless flowing chocolate creates endless candy',
    basePrice: 12000,
    tier: 2,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 47,
    unlockRequirement: { type: 'candy', value: 5000 },
    icon: '⛲'
  },
  {
    id: 'taffy-puller-5000',
    name: 'Taffy Puller 5000',
    description: 'Industrial-grade taffy pulling for massive click power',
    basePrice: 120000,
    tier: 2,
    type: 'click',
    powerPerLevel: 500,
    unlockRequirement: { type: 'candy', value: 50000 },
    icon: '🏭'
  },
  
  // Tier 3 - Cosmic Technology
  {
    id: 'cotton-candy-clouds',
    name: 'Cotton Candy Clouds',
    description: 'Fluffy clouds that rain down cotton candy',
    basePrice: 130000,
    tier: 3,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 260,
    unlockRequirement: { type: 'production', value: 100 },
    icon: '☁️'
  },
  {
    id: 'jawbreaker-accelerator',
    name: 'Jawbreaker Accelerator',
    description: 'Accelerates jawbreakers to near light speed',
    basePrice: 1400000,
    tier: 3,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 1400,
    unlockRequirement: { type: 'candy', value: 500000 },
    icon: '⚡'
  },
  {
    id: 'bubblegum-reactor',
    name: 'Bubblegum Reactor',
    description: 'Nuclear-powered bubblegum production',
    basePrice: 20000000,
    tier: 3,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 7800,
    unlockRequirement: { type: 'production', value: 1000 },
    icon: '☢️'
  },
  {
    id: 'quantum-sugar-entangler',
    name: 'Quantum Sugar Entangler',
    description: 'Quantum mechanics applied to sugar manipulation',
    basePrice: 10000000,
    tier: 3,
    type: 'click',
    powerPerLevel: 15000,
    unlockRequirement: { type: 'candy', value: 1000000 },
    icon: '⚛️'
  },
  
  // Tier 4 - Interdimensional Systems
  {
    id: 'cosmic-candy-portal',
    name: 'Cosmic Candy Portal',
    description: 'Portal to dimensions made entirely of candy',
    basePrice: 330000000,
    tier: 4,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 44000,
    unlockRequirement: { type: 'production', value: 10000 },
    icon: '🌀'
  },
  {
    id: 'interdimensional-sweet-shop',
    name: 'Interdimensional Sweet Shop',
    description: 'A shop that exists in multiple realities',
    basePrice: 5100000000,
    tier: 4,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 260000,
    unlockRequirement: { type: 'candy', value: 100000000 },
    icon: '🏪'
  },
  {
    id: 'black-hole-gobstopper',
    name: 'Black Hole Gobstopper',
    description: 'Uses gravitational forces to create eternal candy',
    basePrice: 75000000000,
    tier: 4,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 1600000,
    unlockRequirement: { type: 'production', value: 100000 },
    icon: '🕳️'
  },
  
  // Tier 5 - Universe-Manipulating Devices
  {
    id: 'time-dilating-toffee',
    name: 'Time-Dilating Toffee',
    description: 'Manipulates time itself to produce candy faster',
    basePrice: 1000000000000,
    tier: 5,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 10000000,
    unlockRequirement: { type: 'candy', value: 10000000000 },
    icon: '⏰'
  },
  {
    id: 'universe-candy-synthesizer',
    name: 'Universe Candy Synthesizer',
    description: 'Converts the fabric of reality into pure candy',
    basePrice: 14000000000000,
    tier: 5,
    type: 'production',
    powerPerLevel: 0,
    productionPerSecond: 65000000,
    unlockRequirement: { type: 'production', value: 10000000 },
    icon: '🌌'
  }
];

export const UPGRADE_TIERS = [
  { tier: 1, name: 'Basic Tools', color: '#8bc34a' },
  { tier: 2, name: 'Factory Equipment', color: '#ff9800' }, 
  { tier: 3, name: 'Cosmic Technology', color: '#9c27b0' },
  { tier: 4, name: 'Interdimensional Systems', color: '#e91e63' },
  { tier: 5, name: 'Universe Manipulation', color: '#f44336' }
];