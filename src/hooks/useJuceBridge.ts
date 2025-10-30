/**
 * React Hook для работы с JUCE Bridge
 * Упрощает интеграцию JUCE в React компонентах
 */

import { useEffect, useState, useCallback } from 'react';
import {
  authenticateUser as juceAuth,
  startAudioAnalysis as juceStartAnalysis,
  stopAudioAnalysis as juceStopAnalysis,
  getAnalysisStatus as juceGetStatus,
  isJuceAvailable,
  onAnalysisComplete,
  onAnalysisProgress,
  onAnalysisError,
  onAuthSuccess,
  onAuthFailure,
  logToJuce,
  type AnalysisProgressPayload,
} from '../services/audio';
import type { AudioAnalysisResult } from '../types/audio';

// ============================================
// ТИПЫ
// ============================================

interface UseJuceBridgeReturn {
  // Статус
  isAvailable: boolean;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStage: string;
  
  // Результаты
  analysisResult: AudioAnalysisResult | null;
  analysisError: string | null;
  
  // Методы
  startAnalysis: () => void;
  stopAnalysis: () => void;
  authenticate: (username: string, password: string) => void;
  
  // Аутентификация
  isAuthenticated: boolean;
  authError: string | null;
}

// ============================================
// HOOK
// ============================================

/**
 * Хук для работы с JUCE Bridge
 * Автоматически подписывается на события и управляет состоянием
 */
export function useJuceBridge(): UseJuceBridgeReturn {
  const [isAvailable] = useState(() => isJuceAvailable());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Подписываемся на события анализа
  useEffect(() => {
    const unsubProgress = onAnalysisProgress((payload: AnalysisProgressPayload) => {
      setAnalysisProgress(payload.progress);
      setAnalysisStage(payload.stage);
      setIsAnalyzing(true);
    });

    const unsubComplete = onAnalysisComplete((result: AudioAnalysisResult) => {
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      logToJuce('Analysis completed successfully', 'info');
    });

    const unsubError = onAnalysisError((error: { message: string }) => {
      setAnalysisError(error.message);
      setIsAnalyzing(false);
      logToJuce(`Analysis error: ${error.message}`, 'error');
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, []);

  // Подписываемся на события аутентификации
  useEffect(() => {
    const unsubSuccess = onAuthSuccess((payload: { token: string; user: any }) => {
      setIsAuthenticated(true);
      setAuthError(null);
      logToJuce(`User authenticated: ${payload.user?.email || 'unknown'}`, 'info');
    });

    const unsubFailure = onAuthFailure((payload: { error: string }) => {
      setIsAuthenticated(false);
      setAuthError(payload.error);
      logToJuce(`Auth failed: ${payload.error}`, 'error');
    });

    return () => {
      unsubSuccess();
      unsubFailure();
    };
  }, []);

  // Методы
  const startAnalysis = useCallback(() => {
    if (!isAvailable) {
      console.warn('⚠️ JUCE not available - cannot start analysis');
      return;
    }
    
    setAnalysisError(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setAnalysisStage('Initializing...');
    juceStartAnalysis();
    logToJuce('Starting audio analysis', 'info');
  }, [isAvailable]);

  const stopAnalysis = useCallback(() => {
    if (!isAvailable) {
      console.warn('⚠️ JUCE not available - cannot stop analysis');
      return;
    }
    
    juceStopAnalysis();
    setIsAnalyzing(false);
    logToJuce('Stopping audio analysis', 'info');
  }, [isAvailable]);

  const authenticate = useCallback((username: string, password: string) => {
    if (!isAvailable) {
      console.warn('⚠️ JUCE not available - cannot authenticate');
      return;
    }
    
    setAuthError(null);
    juceAuth(username, password);
    logToJuce(`Authentication attempt for user: ${username}`, 'info');
  }, [isAvailable]);

  return {
    isAvailable,
    isAnalyzing,
    analysisProgress,
    analysisStage,
    analysisResult,
    analysisError,
    startAnalysis,
    stopAnalysis,
    authenticate,
    isAuthenticated,
    authError,
  };
}

export default useJuceBridge;

