# Audio Services - JUCE FFT Integration Guide

## 📁 Структура

```
src/services/audio/
  ├── audioEngine.ts      - Главный аудио движок (заглушка для браузера)
  ├── juceBridge.ts       - JS <-> C++ Bridge для JUCE WebView ✅ НОВОЕ
  ├── index.ts            - Экспорты
  └── README.md           - Этот файл

src/hooks/
  └── useJuceBridge.ts    - React Hook для JUCE интеграции ✅ НОВОЕ

src/types/
  └── audio.ts            - TypeScript типы для аудио данных
```

---

## 🔌 JUCE BRIDGE - Интеграция с плагином (ФАЗА 1-2)

### 📋 Что уже готово на JS стороне:

✅ **juceBridge.ts** - Полностью готовый мост для коммуникации  
✅ **useJuceBridge.ts** - React Hook для простого использования  
✅ **TypeScript типы** - Все события и сообщения типизированы  
✅ **Автоопределение** - Проверяет наличие JUCE при запуске  

---

## 🛠️ ИНСТРУКЦИЯ ДЛЯ C++ РАЗРАБОТЧИКА

### 1️⃣ Создать WebView в JUCE

```cpp
// В вашем плагине (PluginEditor.cpp)
#include <juce_gui_extra/juce_gui_extra.h>

class PluginEditor : public AudioProcessorEditor
{
public:
    PluginEditor()
    {
        webView = std::make_unique<juce::WebBrowserComponent>();
        addAndMakeVisible(webView.get());
        
        // Загрузить билд React приложения
        webView->goToURL("file://path/to/dist/index.html");
    }

private:
    std::unique_ptr<juce::WebBrowserComponent> webView;
};
```

---

### 2️⃣ Создать JS Bridge в C++

**Регистрация глобального объекта `window.juce`:**

```cpp
// В PluginEditor.cpp или отдельном классе JuceBridge.cpp
class JuceBridge
{
public:
    JuceBridge(juce::WebBrowserComponent* browser) : webBrowser(browser)
    {
        // Регистрируем глобальный объект window.juce
        webBrowser->evaluateJavascript(R"(
            window.juce = {
                postMessage: function(msg) {
                    // Это будет вызывать C++ метод
                    window.webkit.messageHandlers.juce.postMessage(msg);
                }
            };
        )");
    }

    // Отправить событие в JS
    void sendEventToJS(const juce::String& eventType, const juce::var& payload)
    {
        juce::var event;
        event["type"] = eventType;
        event["payload"] = payload;
        event["timestamp"] = juce::Time::currentTimeMillis();

        juce::String jsonEvent = juce::JSON::toString(event);
        
        // Вызываем JS функцию window.onJuceEvent
        webBrowser->evaluateJavascript(
            "window.onJuceEvent('" + jsonEvent + "');"
        );
    }

    // Обработать сообщение от JS
    void handleMessageFromJS(const juce::String& message)
    {
        auto json = juce::JSON::parse(message);
        
        if (json.isObject())
        {
            juce::String type = json["type"].toString();
            juce::var payload = json["payload"];
            
            // Маршрутизация по типам
            if (type == "start_analysis")
                handleStartAnalysis(payload);
            else if (type == "stop_analysis")
                handleStopAnalysis();
            else if (type == "auth_request")
                handleAuthRequest(payload);
        }
    }

private:
    juce::WebBrowserComponent* webBrowser;

    void handleStartAnalysis(const juce::var& payload)
    {
        // Запуск FFT анализа
        // ... ваш код ...
        
        // Отправляем событие обратно в JS
        sendEventToJS("analysis_started", juce::var());
    }

    void handleStopAnalysis()
    {
        // Остановка анализа
        sendEventToJS("analysis_stopped", juce::var());
    }

    void handleAuthRequest(const juce::var& payload)
    {
        juce::String username = payload["username"].toString();
        juce::String password = payload["password"].toString();
        
        // Проверка аутентификации...
        bool success = authenticateUser(username, password);
        
        if (success)
            sendEventToJS("auth_success", createAuthSuccessPayload());
        else
            sendEventToJS("auth_failure", createAuthFailurePayload());
    }
};
```

---

### 3️⃣ FFT Анализ на Master Channel

```cpp
// В вашем AudioProcessor
class SairyneProcessor : public AudioProcessor
{
public:
    void processBlock(AudioBuffer<float>& buffer, MidiBuffer&) override
    {
        // Это Master channel - получаем весь микс
        const int numChannels = buffer.getNumChannels();
        const int numSamples = buffer.getNumSamples();
        
        // Копируем данные для FFT анализа
        fftAnalyzer.processAudioBlock(buffer);
        
        // Если анализ завершен, отправляем результаты в UI
        if (fftAnalyzer.isReady())
        {
            auto result = fftAnalyzer.getResults();
            sendAnalysisResultToUI(result);
        }
    }

private:
    FFTAnalyzer fftAnalyzer;
    JuceBridge* bridge;

    void sendAnalysisResultToUI(const FFTResult& result)
    {
        juce::var payload;
        payload["bpm"] = result.bpm;
        payload["key"] = result.key;
        payload["peakFrequency"] = result.peakFrequency;
        // ... другие данные ...
        
        bridge->sendEventToJS("analysis_complete", payload);
    }
};
```

---

### 4️⃣ Пример FFT Analyzer (упрощенно)

```cpp
class FFTAnalyzer
{
public:
    FFTAnalyzer() : fft(fftOrder)
    {
        // Инициализация FFT
    }

    void processAudioBlock(const AudioBuffer<float>& buffer)
    {
        // Копируем данные в FFT буфер
        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            float monoSample = (buffer.getSample(0, sample) + 
                               buffer.getSample(1, sample)) * 0.5f;
            
            fftData[fftIndex++] = monoSample;
            
            if (fftIndex >= fftSize)
            {
                performFFT();
                fftIndex = 0;
            }
        }
    }

    bool isReady() const { return resultsReady; }

    FFTResult getResults()
    {
        resultsReady = false;
        return currentResult;
    }

private:
    static constexpr int fftOrder = 12;
    static constexpr int fftSize = 1 << fftOrder; // 4096
    
    juce::dsp::FFT fft;
    std::array<float, fftSize * 2> fftData;
    int fftIndex = 0;
    bool resultsReady = false;
    FFTResult currentResult;

    void performFFT()
    {
        // Выполняем FFT
        fft.performFrequencyOnlyForwardTransform(fftData.data());
        
        // Анализируем спектр
        float peakFreq = findPeakFrequency();
        float bpm = detectBPM();
        
        currentResult.peakFrequency = peakFreq;
        currentResult.bpm = bpm;
        
        resultsReady = true;
    }

    float findPeakFrequency() { /* ... */ }
    float detectBPM() { /* ... */ }
};
```

---

## 📡 Протокол коммуникации

### JS → C++ (Сообщения)

| Тип | Payload | Описание |
|-----|---------|----------|
| `start_analysis` | `{}` | Начать анализ |
| `stop_analysis` | `{}` | Остановить анализ |
| `auth_request` | `{username, password}` | Аутентификация |
| `webview_ready` | `{}` | WebView загружен |

### C++ → JS (События)

| Тип | Payload | Описание |
|-----|---------|----------|
| `analysis_started` | `{}` | Анализ начат |
| `analysis_progress` | `{progress: 0-100, stage: string}` | Прогресс |
| `analysis_complete` | `AudioAnalysisResult` | Результаты |
| `auth_success` | `{token, user}` | Успех |
| `auth_failure` | `{error}` | Ошибка |

---

## 🧪 Тестирование в браузере

JS сторона автоматически определяет отсутствие JUCE:

```typescript
// В браузере
import { isJuceAvailable } from '@/services/audio';

if (!isJuceAvailable()) {
  console.log('⚠️ Running in browser mode - JUCE not available');
  // Показываем mock данные
}
```

---

## 📂 Что нужно C++ разработчику

### Файлы для интеграции:
1. **dist/index.html** - Скомпилированный React билд
2. **src/services/audio/juceBridge.ts** - Референс протокола
3. **src/types/audio.ts** - Структуры данных

### Зависимости JUCE:
```cmake
juce::juce_gui_extra     # WebBrowserComponent
juce::juce_dsp           # FFT
juce::juce_audio_plugin  # VST3/AU
```

---

## 🔧 TODO для C++ разработчика

- [ ] Создать WebView в PluginEditor
- [ ] Реализовать JuceBridge.cpp с методами:
  - [ ] `sendEventToJS(type, payload)`
  - [ ] `handleMessageFromJS(message)`
- [ ] Интегрировать FFT анализ в processBlock()
- [ ] Подключить аутентификацию (если нужна на данном этапе)
- [ ] Протестировать коммуникацию JS ↔ C++

---

## 📞 Контакты

При вопросах по протоколу или структуре данных - обращайтесь к фронтенд разработчику.

