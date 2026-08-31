export interface CategoryColor {
  bg: string;
  border: string;
  text: string;
  accent: string;
  glow: string;
}

interface ColorDef {
  dark: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    glow: string;
  };
  light: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    glow: string;
  };
}

/**
 * 16 curated high-contrast, vibrant Apple visionOS color definitions.
 * Each node type deterministically maps to one of these permanently.
 */
const COLOR_PALETTE: ColorDef[] = [
  // 0: Vibrant Emerald
  {
    dark: {
      bg: 'rgba(16, 185, 129, 0.16)',
      border: 'rgba(52, 211, 153, 0.35)',
      text: '#34D399',
      accent: '#00F5A0',
      glow: 'rgba(0, 245, 160, 0.25)',
    },
    light: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#065F46',
      accent: '#059669',
      glow: 'rgba(5, 150, 105, 0.15)',
    },
  },
  // 1: Sky Azure
  {
    dark: {
      bg: 'rgba(14, 165, 233, 0.16)',
      border: 'rgba(56, 189, 248, 0.35)',
      text: '#38BDF8',
      accent: '#38BDF8',
      glow: 'rgba(56, 189, 248, 0.25)',
    },
    light: {
      bg: 'rgba(14, 165, 233, 0.12)',
      border: 'rgba(14, 165, 233, 0.3)',
      text: '#0369A1',
      accent: '#0284C7',
      glow: 'rgba(2, 132, 199, 0.15)',
    },
  },
  // 2: Electric Violet
  {
    dark: {
      bg: 'rgba(168, 85, 247, 0.16)',
      border: 'rgba(192, 132, 252, 0.35)',
      text: '#C084FC',
      accent: '#A855F7',
      glow: 'rgba(168, 85, 247, 0.25)',
    },
    light: {
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.3)',
      text: '#6B21A8',
      accent: '#9333EA',
      glow: 'rgba(147, 51, 234, 0.15)',
    },
  },
  // 3: Warm Amber / Gold
  {
    dark: {
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(251, 191, 36, 0.35)',
      text: '#FBBF24',
      accent: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.25)',
    },
    light: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#92400E',
      accent: '#D97706',
      glow: 'rgba(217, 119, 6, 0.15)',
    },
  },
  // 4: Coral Rose
  {
    dark: {
      bg: 'rgba(244, 63, 94, 0.16)',
      border: 'rgba(251, 113, 133, 0.35)',
      text: '#FB7185',
      accent: '#F43F5E',
      glow: 'rgba(244, 63, 94, 0.25)',
    },
    light: {
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.3)',
      text: '#9F1239',
      accent: '#E11D48',
      glow: 'rgba(225, 29, 72, 0.15)',
    },
  },
  // 5: Neon Indigo
  {
    dark: {
      bg: 'rgba(99, 102, 241, 0.16)',
      border: 'rgba(129, 140, 248, 0.35)',
      text: '#818CF8',
      accent: '#6366F1',
      glow: 'rgba(99, 102, 241, 0.25)',
    },
    light: {
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.3)',
      text: '#3730A3',
      accent: '#4F46E5',
      glow: 'rgba(79, 70, 229, 0.15)',
    },
  },
  // 6: Vivid Cyan
  {
    dark: {
      bg: 'rgba(6, 182, 212, 0.16)',
      border: 'rgba(34, 211, 238, 0.35)',
      text: '#22D3EE',
      accent: '#06B6D4',
      glow: 'rgba(6, 182, 212, 0.25)',
    },
    light: {
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.3)',
      text: '#155E75',
      accent: '#0891B2',
      glow: 'rgba(8, 145, 178, 0.15)',
    },
  },
  // 7: Fuchsia Pink
  {
    dark: {
      bg: 'rgba(217, 70, 239, 0.16)',
      border: 'rgba(232, 121, 249, 0.35)',
      text: '#E879F9',
      accent: '#D946EF',
      glow: 'rgba(217, 70, 239, 0.25)',
    },
    light: {
      bg: 'rgba(217, 70, 239, 0.12)',
      border: 'rgba(217, 70, 239, 0.3)',
      text: '#86198F',
      accent: '#C026D3',
      glow: 'rgba(192, 38, 211, 0.15)',
    },
  },
  // 8: Tangerine Orange
  {
    dark: {
      bg: 'rgba(249, 115, 22, 0.16)',
      border: 'rgba(251, 146, 60, 0.35)',
      text: '#FB923C',
      accent: '#F97316',
      glow: 'rgba(249, 115, 22, 0.25)',
    },
    light: {
      bg: 'rgba(249, 115, 22, 0.12)',
      border: 'rgba(249, 115, 22, 0.3)',
      text: '#9A3412',
      accent: '#EA580C',
      glow: 'rgba(234, 88, 12, 0.15)',
    },
  },
  // 9: Spring Lime
  {
    dark: {
      bg: 'rgba(132, 204, 22, 0.16)',
      border: 'rgba(163, 230, 53, 0.35)',
      text: '#A3E635',
      accent: '#84CC16',
      glow: 'rgba(132, 204, 22, 0.25)',
    },
    light: {
      bg: 'rgba(132, 204, 22, 0.12)',
      border: 'rgba(132, 204, 22, 0.3)',
      text: '#3F6212',
      accent: '#65A30D',
      glow: 'rgba(101, 163, 13, 0.15)',
    },
  },
  // 10: Deep Teal
  {
    dark: {
      bg: 'rgba(20, 184, 166, 0.16)',
      border: 'rgba(45, 212, 191, 0.35)',
      text: '#2DD4BF',
      accent: '#14B8A6',
      glow: 'rgba(20, 184, 166, 0.25)',
    },
    light: {
      bg: 'rgba(20, 184, 166, 0.12)',
      border: 'rgba(20, 184, 166, 0.3)',
      text: '#115E59',
      accent: '#0D9488',
      glow: 'rgba(13, 148, 136, 0.15)',
    },
  },
  // 11: Bright Crimson
  {
    dark: {
      bg: 'rgba(239, 68, 68, 0.16)',
      border: 'rgba(248, 113, 113, 0.35)',
      text: '#F87171',
      accent: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.25)',
    },
    light: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#991B1B',
      accent: '#DC2626',
      glow: 'rgba(220, 38, 38, 0.15)',
    },
  },
  // 12: Hot Pink
  {
    dark: {
      bg: 'rgba(236, 72, 153, 0.16)',
      border: 'rgba(244, 114, 182, 0.35)',
      text: '#F472B6',
      accent: '#EC4899',
      glow: 'rgba(236, 72, 153, 0.25)',
    },
    light: {
      bg: 'rgba(236, 72, 153, 0.12)',
      border: 'rgba(236, 72, 153, 0.3)',
      text: '#831843',
      accent: '#DB2777',
      glow: 'rgba(219, 39, 119, 0.15)',
    },
  },
  // 13: Royal Blue
  {
    dark: {
      bg: 'rgba(59, 130, 246, 0.16)',
      border: 'rgba(96, 165, 250, 0.35)',
      text: '#60A5FA',
      accent: '#3B82F6',
      glow: 'rgba(59, 130, 246, 0.25)',
    },
    light: {
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#1E40AF',
      accent: '#2563EB',
      glow: 'rgba(37, 99, 235, 0.15)',
    },
  },
  // 14: Golden Sun
  {
    dark: {
      bg: 'rgba(234, 179, 8, 0.16)',
      border: 'rgba(250, 204, 21, 0.35)',
      text: '#FACC15',
      accent: '#EAB308',
      glow: 'rgba(234, 179, 8, 0.25)',
    },
    light: {
      bg: 'rgba(234, 179, 8, 0.12)',
      border: 'rgba(234, 179, 8, 0.3)',
      text: '#854D0E',
      accent: '#CA8A04',
      glow: 'rgba(202, 138, 4, 0.15)',
    },
  },
  // 15: Deep Purple
  {
    dark: {
      bg: 'rgba(139, 92, 246, 0.16)',
      border: 'rgba(167, 139, 250, 0.35)',
      text: '#A78BFA',
      accent: '#8B5CF6',
      glow: 'rgba(139, 92, 246, 0.25)',
    },
    light: {
      bg: 'rgba(139, 92, 246, 0.12)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: '#5B21B6',
      accent: '#7C3AED',
      glow: 'rgba(124, 58, 237, 0.15)',
    },
  },
];

/**
 * Standard preset slots for common domain types to ensure zero collision.
 */
const PRESET_SLOTS: Record<string, number> = {
  CONCEPT: 0,
  SYSTEM: 1,
  SERVICE: 2,
  DATA_MODEL: 3,
  INFRASTRUCTURE: 4,
  SECURITY_POLICY: 5,
  API_ENDPOINT: 6,
  PERSON: 7,
  ORGANIZATION: 8,
  EVENT: 9,
  PROCESS: 10,
  METRIC: 11,
  LOCATION: 12,
  THEORY: 13,
  TECHNOLOGY: 14,
  RESOURCE: 15,
};

/**
 * Fast, deterministic string hashing function.
 * Ensures any arbitrary node type string is permanently and consistently
 * mapped to the exact same color across sessions and reloads.
 */
function hashString(str: string): number {
  let hash = 5381;
  const upper = str.toUpperCase().trim();
  for (let i = 0; i < upper.length; i++) {
    hash = ((hash << 5) + hash) + upper.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Returns the permanently assigned color theme for any node type/category.
 */
export function getCategoryColor(category: string, isDark = true): CategoryColor {
  if (!category) {
    const def = COLOR_PALETTE[0];
    return isDark ? def.dark : def.light;
  }

  const normalized = category.toUpperCase().trim().replace(/[\s-]+/g, '_');
  const slot =
    PRESET_SLOTS[normalized] !== undefined
      ? PRESET_SLOTS[normalized]
      : hashString(normalized) % COLOR_PALETTE.length;

  const def = COLOR_PALETTE[slot];
  return isDark ? def.dark : def.light;
}

/**
 * Returns inline CSS styling for badges/pills in HTML templates.
 */
export function getCategoryBadgeStyle(
  category: string,
  isDark = true
): { background: string; color: string; borderColor: string } {
  const color = getCategoryColor(category, isDark);
  return {
    background: color.bg,
    color: color.text,
    borderColor: color.border,
  };
}
