/**
 * Geometric Vector Elements Collection
 * Primitives, badges, framing polygons, and structural accents for card design.
 */

export interface ElementItem {
  id: string;
  name: string;
  category: 'shapes' | 'lines' | 'badges' | 'frames';
  type: 'rect' | 'circle' | 'line' | 'svg' | 'polygon';
  svg?: string;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  points?: Array<{ x: number; y: number }>;
}

export const ELEMENTS_COLLECTION: ElementItem[] = [
  // Basic Shapes
  {
    id: 'elem_rect_solid',
    name: 'Solid Rectangle',
    category: 'shapes',
    type: 'rect',
    width: 200,
    height: 120,
    fill: '#D4AF37',
    rx: 0,
    ry: 0,
  },
  {
    id: 'elem_rect_rounded',
    name: 'Rounded Rectangle',
    category: 'shapes',
    type: 'rect',
    width: 220,
    height: 100,
    fill: '#D4AF37',
    rx: 16,
    ry: 16,
  },
  {
    id: 'elem_pill',
    name: 'Pill Shape',
    category: 'shapes',
    type: 'rect',
    width: 200,
    height: 48,
    fill: '#D4AF37',
    rx: 24,
    ry: 24,
  },
  {
    id: 'elem_circle',
    name: 'Circle',
    category: 'shapes',
    type: 'circle',
    width: 120,
    height: 120,
    fill: '#D4AF37',
  },

  // Lines & Dividers
  {
    id: 'elem_line_solid',
    name: 'Solid Divider',
    category: 'lines',
    type: 'line',
    width: 300,
    height: 2,
    stroke: '#D4AF37',
    strokeWidth: 2,
  },
  {
    id: 'elem_line_thick',
    name: 'Accent Bar',
    category: 'lines',
    type: 'rect',
    width: 140,
    height: 6,
    fill: '#D4AF37',
    rx: 3,
    ry: 3,
  },
  {
    id: 'elem_line_vertical',
    name: 'Vertical Rule',
    category: 'lines',
    type: 'line',
    width: 2,
    height: 160,
    stroke: '#D4AF37',
    strokeWidth: 2,
  },

  // Badges & Geometric Accents
  {
    id: 'elem_badge_hexagon',
    name: 'Hexagon Badge',
    category: 'badges',
    type: 'svg',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="currentColor" stroke="#D4AF37" stroke-width="4"/>
    </svg>`,
    width: 80,
    height: 80,
    fill: '#121216',
    stroke: '#D4AF37',
  },
  {
    id: 'elem_badge_shield',
    name: 'Shield Seal',
    category: 'badges',
    type: 'svg',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 8L15 22V50C15 72 30 90 50 96C70 90 85 72 85 50V22L50 8Z" fill="currentColor" stroke="#D4AF37" stroke-width="4"/>
    </svg>`,
    width: 76,
    height: 90,
    fill: '#121216',
    stroke: '#D4AF37',
  },
  {
    id: 'elem_frame_corner_bracket',
    name: 'Architectural Frame',
    category: 'frames',
    type: 'svg',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 30V5H30M70 5H95V30M95 70V95H70M30 95H5V70" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
    </svg>`,
    width: 90,
    height: 90,
    stroke: '#D4AF37',
  },
];

