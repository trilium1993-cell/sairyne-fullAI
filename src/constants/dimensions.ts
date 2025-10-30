/**
 * UI Constants
 * Централизованное хранение размеров, отступов и других числовых значений
 */

// Размеры окон
export const WINDOW = {
  // Внешние размеры
  OUTER_WIDTH: 383,
  OUTER_HEIGHT: 847,
  OUTER_BORDER_RADIUS: 10,
  
  // Внутренние размеры
  INNER_WIDTH: 377,
  INNER_HEIGHT: 810,
  INNER_BORDER_RADIUS: 7,
  INNER_LEFT: 3,
  INNER_TOP: 34,
  
  // Расширенное окно (с Visual Tips или Analysis)
  EXPANDED_WIDTH: 766,
  
  // Правая панель
  RIGHT_PANEL_WIDTH: 383,
  RIGHT_PANEL_LEFT: 383,
  
  // Вертикальный разделитель
  DIVIDER_WIDTH: 2,
  DIVIDER_LEFT: 383,
} as const;

// Размеры header
export const HEADER = {
  HEIGHT: 20,
  TOP: 7,
  LEFT: 11,
  RIGHT: 11,
  
  // Иконки в header
  ICON_CONTAINER_SIZE: 20,
  MINIMIZE_ICON_SIZE: 18,
  CLOSE_ICON_SIZE: 14,
  
  // Заголовок
  TITLE_TOP: 10,
} as const;

// Размеры чата
export const CHAT = {
  CONTAINER_TOP: 95,
  CONTAINER_LEFT: 10,
  CONTAINER_BOTTOM: 140,
  CONTAINER_WIDTH: 357,
  
  // Поле ввода
  INPUT_HEIGHT: 80,
  INPUT_BOTTOM: 40,
} as const;

// Анимации
export const ANIMATION = {
  DURATION: 500, // ms
  TIMING_FUNCTION: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  TYPING_SPEED: 30, // ms между символами
} as const;

// Цвета
export const COLORS = {
  PRIMARY_PURPLE: '#6e24ab',
  SECONDARY_PURPLE: '#7343aa',
  BACKGROUND_DARK: '#141414',
  BACKGROUND_MODAL: '#110a17',
  BORDER_LIGHT: '#ffffff1f',
  TEXT_WHITE: '#ffffff',
  TEXT_GRAY: '#ffffff80',
} as const;

// Z-индексы
export const Z_INDEX = {
  DIVIDER: 50,
  MODAL: 50,
  SIDEBAR: 100,
} as const;

