/**
 * JUCE Bridge Interface
 * Коммуникация между WebView (React) и JUCE (C++)
 */

import type { AudioAnalysisResult } from '../../types/audio';

// ============================================
// ТИПЫ ДЛЯ JUCE BRIDGE
// ============================================

/**
 * Типы сообщений от JS -> JUCE
 */
export enum JuceMessageType {
  // Аутентификация
  AUTH_REQUEST = 'auth_request',
  AUTH_LOGOUT = 'auth_logout',
  
  // Анализ аудио
  START_ANALYSIS = 'start_analysis',
  STOP_ANALYSIS = 'stop_analysis',
  GET_ANALYSIS_STATUS = 'get_analysis_status',
  
  // Навигация UI
  NAVIGATE_TO = 'navigate_to',
  
  // Системные
  READY = 'webview_ready',
  LOG = 'log_message',
}

/**
 * Типы сообщений от JUCE -> JS
 */
export enum JuceEventType {
  // Аутентификация
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  
  // Анализ аудио
  ANALYSIS_STARTED = 'analysis_started',
  ANALYSIS_PROGRESS = 'analysis_progress',
  ANALYSIS_COMPLETE = 'analysis_complete',
  ANALYSIS_ERROR = 'analysis_error',
  ANALYSIS_STOPPED = 'analysis_stopped',
  
  // Системные
  PLUGIN_READY = 'plugin_ready',
  ERROR = 'error',
}

/**
 * Структура сообщения от JS -> JUCE
 */
export interface JuceMessage<T = unknown> {
  type: JuceMessageType;
  payload?: T;
  timestamp?: number;
}

/**
 * Структура события от JUCE -> JS
 */
export interface JuceEvent<T = unknown> {
  type: JuceEventType;
  payload?: T;
  timestamp?: number;
}

// ============================================
// PAYLOADS ДЛЯ РАЗНЫХ ТИПОВ СООБЩЕНИЙ
// ============================================

export interface AuthRequestPayload {
  username: string;
  password: string;
}

export interface AnalysisProgressPayload {
  progress: number; // 0-100
  stage: string;
}

export interface NavigationPayload {
  screen: string;
  params?: Record<string, unknown>;
}

// ============================================
// JUCE BRIDGE CLASS
// ============================================

/**
 * Класс для взаимодействия с JUCE через WebView
 */
class JuceBridge {
  private listeners: Map<JuceEventType, Set<(payload: unknown) => void>> = new Map();
  private isJuceAvailable = false;
  private messageQueue: JuceMessage[] = [];

  constructor() {
    this.detectJuce();
    this.setupGlobalListener();
  }

  /**
   * Определяем, запущены ли мы внутри JUCE WebView
   */
  private detectJuce(): void {
    // JUCE WebView будет иметь глобальный объект window.juce или window.webkit
    // Точное имя будет известно при реализации C++ стороны
    this.isJuceAvailable = typeof (window as any).juce !== 'undefined' ||
                           typeof (window as any).webkit !== 'undefined';

    if (this.isJuceAvailable) {
      console.log('✅ JUCE Bridge detected');
      this.sendMessage({ type: JuceMessageType.READY });
    } else {
      console.warn('⚠️ JUCE Bridge NOT detected - running in browser mode');
    }
  }

  /**
   * Отправить сообщение в JUCE
   */
  sendMessage<T>(message: JuceMessage<T>): void {
    const msg: JuceMessage<T> = {
      ...message,
      timestamp: Date.now(),
    };

    if (!this.isJuceAvailable) {
      console.log('🔷 [Mock JUCE Message]:', msg);
      return;
    }

    try {
      // ВАРИАНТ 1: JUCE WebView (window.juce.postMessage)
      if (typeof (window as any).juce?.postMessage === 'function') {
        (window as any).juce.postMessage(JSON.stringify(msg));
        return;
      }

      // ВАРИАНТ 2: WKWebView (iOS/macOS style)
      if (typeof (window as any).webkit?.messageHandlers?.juce?.postMessage === 'function') {
        (window as any).webkit.messageHandlers.juce.postMessage(JSON.stringify(msg));
        return;
      }

      console.error('❌ JUCE bridge method not found');
    } catch (error) {
      console.error('❌ Failed to send message to JUCE:', error);
    }
  }

  /**
   * Подписаться на события от JUCE
   */
  on<T>(eventType: JuceEventType, callback: (payload: T) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback as (payload: unknown) => void);

    // Возвращаем функцию для отписки
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback as (payload: unknown) => void);
      }
    };
  }

  /**
   * Глобальный обработчик сообщений от JUCE
   */
  private setupGlobalListener(): void {
    // JUCE будет вызывать эту функцию при отправке событий
    (window as any).onJuceEvent = (eventJson: string) => {
      try {
        const event: JuceEvent = JSON.parse(eventJson);
        this.handleJuceEvent(event);
      } catch (error) {
        console.error('❌ Failed to parse JUCE event:', error);
      }
    };
  }

  /**
   * Обработка события от JUCE
   */
  private handleJuceEvent(event: JuceEvent): void {
    console.log('📩 JUCE Event:', event.type, event.payload);

    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event.payload);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Проверка доступности JUCE
   */
  isAvailable(): boolean {
    return this.isJuceAvailable;
  }

  /**
   * Очистить все подписки (для cleanup)
   */
  destroy(): void {
    this.listeners.clear();
    delete (window as any).onJuceEvent;
  }
}

// ============================================
// API МЕТОДЫ (HIGH-LEVEL)
// ============================================

const bridge = new JuceBridge();

/**
 * Аутентификация пользователя
 */
export function authenticateUser(username: string, password: string): void {
  bridge.sendMessage<AuthRequestPayload>({
    type: JuceMessageType.AUTH_REQUEST,
    payload: { username, password },
  });
}

/**
 * Начать анализ аудио
 */
export function startAudioAnalysis(): void {
  bridge.sendMessage({
    type: JuceMessageType.START_ANALYSIS,
  });
}

/**
 * Остановить анализ аудио
 */
export function stopAudioAnalysis(): void {
  bridge.sendMessage({
    type: JuceMessageType.STOP_ANALYSIS,
  });
}

/**
 * Получить статус анализа
 */
export function getAnalysisStatus(): void {
  bridge.sendMessage({
    type: JuceMessageType.GET_ANALYSIS_STATUS,
  });
}

/**
 * Навигация между экранами
 */
export function navigateTo(screen: string, params?: Record<string, unknown>): void {
  bridge.sendMessage<NavigationPayload>({
    type: JuceMessageType.NAVIGATE_TO,
    payload: { screen, params },
  });
}

/**
 * Отправить лог в JUCE (для debugging)
 */
export function logToJuce(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  bridge.sendMessage({
    type: JuceMessageType.LOG,
    payload: { message, level },
  });
}

/**
 * Подписаться на события анализа
 */
export function onAnalysisComplete(callback: (result: AudioAnalysisResult) => void): () => void {
  return bridge.on<AudioAnalysisResult>(JuceEventType.ANALYSIS_COMPLETE, callback);
}

export function onAnalysisProgress(callback: (payload: AnalysisProgressPayload) => void): () => void {
  return bridge.on<AnalysisProgressPayload>(JuceEventType.ANALYSIS_PROGRESS, callback);
}

export function onAnalysisError(callback: (error: { message: string }) => void): () => void {
  return bridge.on<{ message: string }>(JuceEventType.ANALYSIS_ERROR, callback);
}

/**
 * Подписаться на события аутентификации
 */
export function onAuthSuccess(callback: (payload: { token: string; user: any }) => void): () => void {
  return bridge.on(JuceEventType.AUTH_SUCCESS, callback);
}

export function onAuthFailure(callback: (payload: { error: string }) => void): () => void {
  return bridge.on(JuceEventType.AUTH_FAILURE, callback);
}

/**
 * Проверка доступности JUCE
 */
export function isJuceAvailable(): boolean {
  return bridge.isAvailable();
}

// Экспортируем bridge для продвинутого использования
export default bridge;

