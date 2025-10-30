/**
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ JUCE BRIDGE
 * Этот файл показывает, как интегрировать JUCE Bridge в любой компонент
 * 
 * ⚠️ Это только пример - не используется в продакшене
 */

import React from 'react';
import { useJuceBridge } from '../hooks/useJuceBridge';

export function JuceBridgeExample() {
  const {
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
  } = useJuceBridge();

  return (
    <div className="p-8 bg-[#1a1a1a] text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-6">JUCE Bridge Status</h2>

      {/* Статус подключения */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-lg">
            {isAvailable ? '✅ JUCE Connected' : '⚠️ Running in Browser Mode'}
          </span>
        </div>
      </div>

      {/* Аутентификация */}
      <div className="mb-6 p-4 bg-[#252525] rounded">
        <h3 className="text-lg font-semibold mb-3">Authentication</h3>
        
        {!isAuthenticated ? (
          <div className="flex gap-3">
            <button
              onClick={() => authenticate('user@example.com', 'password123')}
              disabled={!isAvailable}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50"
            >
              Test Login
            </button>
            {authError && <span className="text-red-500">{authError}</span>}
          </div>
        ) : (
          <span className="text-green-500">✅ Authenticated</span>
        )}
      </div>

      {/* Анализ аудио */}
      <div className="mb-6 p-4 bg-[#252525] rounded">
        <h3 className="text-lg font-semibold mb-3">Audio Analysis</h3>
        
        {!isAnalyzing ? (
          <button
            onClick={startAnalysis}
            disabled={!isAvailable}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          >
            Start Analysis
          </button>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-[#1a1a1a] rounded-full h-2">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <span className="text-sm">{analysisProgress}%</span>
            </div>
            
            <p className="text-sm text-gray-400 mb-3">{analysisStage}</p>
            
            <button
              onClick={stopAnalysis}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              Stop Analysis
            </button>
          </div>
        )}

        {/* Результаты */}
        {analysisResult && (
          <div className="mt-4 p-3 bg-[#1a1a1a] rounded">
            <h4 className="font-semibold mb-2">Analysis Results:</h4>
            <pre className="text-xs text-gray-300 overflow-auto">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Ошибки */}
        {analysisError && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded">
            <span className="text-red-500">❌ {analysisError}</span>
          </div>
        )}
      </div>

      {/* Документация */}
      <div className="text-sm text-gray-400">
        <p className="mb-2">📖 Для интеграции в другие компоненты:</p>
        <code className="block bg-[#0a0a0a] p-3 rounded">
          {`import { useJuceBridge } from '@/hooks/useJuceBridge';

function MyComponent() {
  const { startAnalysis, analysisResult } = useJuceBridge();
  
  return (
    <button onClick={startAnalysis}>Analyze</button>
  );
}`}
        </code>
      </div>
    </div>
  );
}

export default JuceBridgeExample;

