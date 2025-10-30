/**
 * Audio Services
 * Экспорт всех аудио сервисов
 */

export { AudioEngine, getAudioEngine } from './audioEngine';
export type * from '../../types/audio';

// JUCE Bridge
export {
  authenticateUser,
  startAudioAnalysis,
  stopAudioAnalysis,
  getAnalysisStatus,
  navigateTo,
  logToJuce,
  onAnalysisComplete,
  onAnalysisProgress,
  onAnalysisError,
  onAuthSuccess,
  onAuthFailure,
  isJuceAvailable,
  JuceMessageType,
  JuceEventType,
} from './juceBridge';

export type {
  JuceMessage,
  JuceEvent,
  AuthRequestPayload,
  AnalysisProgressPayload,
  NavigationPayload,
} from './juceBridge';

