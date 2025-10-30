/**
 * Audio Analysis Types
 * Типы для работы с FFT аудио движком и анализом треков
 */

/**
 * Результат FFT анализа аудио трека
 */
export interface AudioAnalysisResult {
  /** Темп трека (Beats Per Minute) */
  bpm: number;
  /** Музыкальный ключ/тональность */
  key: string;
  /** Длительность трека в секундах */
  duration: number;
  /** Данные частотного спектра */
  frequencyData: Float32Array;
  /** Визуализация waveform (массив амплитуд) */
  waveform: number[];
  /** Пики в треке (для beat detection) */
  peaks: number[];
  /** Громкость (RMS) */
  volume: number;
}

/**
 * Анализ отдельного канала/инструмента
 */
export interface ChannelAnalysis {
  /** ID канала */
  id: string;
  /** Название канала */
  name: string;
  /** Тип инструмента */
  type: 'kick' | 'bass' | 'hihat' | 'snare' | 'melody' | 'pad' | 'fx' | 'other';
  /** Доминирующая частота (Hz) */
  frequency: number;
  /** Диапазон частот (Hz) */
  frequencyRange: {
    min: number;
    max: number;
  };
  /** Громкость канала (0-1) */
  volume: number;
  /** Панорама (-1 left, 0 center, 1 right) */
  pan: number;
}

/**
 * Состояние процесса анализа
 */
export interface AnalysisProgress {
  /** Текущий этап анализа */
  stage: 'loading' | 'decoding' | 'analyzing' | 'processing' | 'completed' | 'error';
  /** Прогресс в процентах (0-100) */
  progress: number;
  /** Текущее сообщение */
  message: string;
}

/**
 * Конфигурация FFT анализа
 */
export interface FFTConfig {
  /** Размер FFT окна (обычно степень двойки: 512, 1024, 2048, 4096) */
  fftSize: number;
  /** Частота дискретизации (обычно 44100 или 48000 Hz) */
  sampleRate: number;
  /** Сглаживание частотных данных (0-1) */
  smoothingTimeConstant: number;
}

/**
 * Параметры для рекомендаций AI на основе анализа
 */
export interface AudioRecommendations {
  /** Рекомендуемые эффекты */
  effects: string[];
  /** Рекомендации по микшированию */
  mixing: string[];
  /** Проблемы в треке */
  issues: string[];
  /** Общая оценка качества (0-10) */
  qualityScore: number;
}

