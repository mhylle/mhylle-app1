/**
 * Shared types for Sour Planet components
 */

export interface PHBalanceMechanics {
  level: number;
  naturalAcidification: number;
  productionModifier: number;
  totalAcidEvents: number;
  fermentationActive?: boolean;
  fermentationProgress?: number;
}

export interface SourUpgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costMultiplier: number;
  productionBonus: number;
  unlockRequirement?: {
    candy?: number;
    level?: number;
    other?: string;
  };
}

export interface FloatingNumber {
  x: number;
  y: number;
  value: number;
  color: string;
}

export interface ClickEvent {
  x: number;
  y: number;
  timestamp: number;
}