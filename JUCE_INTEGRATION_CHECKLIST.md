# 🎯 JUCE INTEGRATION CHECKLIST

## ✅ Фаза 1-2: JS Bridge & Build готов (ЗАВЕРШЕНО)

### Что сделано на JS стороне:

- ✅ **vite.config.ts** - Оптимизирован для WebView (ES2015, inline assets)
- ✅ **src/services/audio/juceBridge.ts** - Полный JS <-> C++ Bridge
- ✅ **src/hooks/useJuceBridge.ts** - React Hook для JUCE
- ✅ **src/types/audio.ts** - TypeScript типы для анализа
- ✅ **src/services/audio/README.md** - Полная документация для C++ разработчика
- ✅ **dist/** - Production билд готов для загрузки в JUCE WebView

---

## 📂 Структура проекта для C++ разработчика

```
/dist/
  ├── index.html                 ← Главный входной файл для WebView
  ├── assets/
  │   ├── main-*.js              ← React приложение (90KB)
  │   ├── react-vendor-*.js      ← React библиотеки (141KB)
  │   └── *.css                  ← Стили
  └── ...

/src/services/audio/
  ├── juceBridge.ts              ← Протокол коммуникации
  └── README.md                  ← Инструкция для C++

/src/types/
  └── audio.ts                   ← Структуры данных
```

---

## 🔌 Протокол JS ↔ C++

### Глобальные объекты:

**C++ создает:**
```javascript
window.juce.postMessage(msg)  // JS вызывает для отправки в C++
```

**JS создает:**
```javascript
window.onJuceEvent(eventJson)  // C++ вызывает для отправки в JS
```

---

### Сообщения JS → C++ (sendMessage):

| Тип | Payload | Описание |
|-----|---------|----------|
| `start_analysis` | `{}` | Начать FFT анализ |
| `stop_analysis` | `{}` | Остановить анализ |
| `get_analysis_status` | `{}` | Запросить статус |
| `auth_request` | `{username, password}` | Аутентификация |
| `webview_ready` | `{}` | WebView инициализирован |
| `log_message` | `{message, level}` | Лог от JS |

---

### События C++ → JS (onEvent):

| Тип | Payload | Описание |
|-----|---------|----------|
| `plugin_ready` | `{}` | JUCE готов |
| `analysis_started` | `{}` | Анализ начат |
| `analysis_progress` | `{progress: 0-100, stage: string}` | Прогресс FFT |
| `analysis_complete` | `AudioAnalysisResult` | Результаты |
| `analysis_error` | `{message: string}` | Ошибка |
| `auth_success` | `{token, user}` | Успешная авторизация |
| `auth_failure` | `{error: string}` | Ошибка авторизации |

---

## 🛠️ TODO для C++ разработчика (Следующие шаги)

### 1️⃣ Создать JUCE плагин (VST3/AU)

```cpp
// CMakeLists.txt
juce_add_plugin(SairynePlugin
    PLUGIN_MANUFACTURER_CODE Sair
    PLUGIN_CODE Sain
    FORMATS VST3 AU
    ...
)

target_link_libraries(SairynePlugin
    PRIVATE
        juce::juce_gui_extra      # WebBrowserComponent
        juce::juce_dsp            # FFT
        juce::juce_audio_plugin   # VST3/AU
)
```

---

### 2️⃣ Загрузить WebView в PluginEditor

```cpp
// PluginEditor.cpp
#include <juce_gui_extra/juce_gui_extra.h>

class PluginEditor : public AudioProcessorEditor
{
public:
    PluginEditor(AudioProcessor& p) : AudioProcessorEditor(p)
    {
        webView = std::make_unique<juce::WebBrowserComponent>();
        addAndMakeVisible(webView.get());
        
        // Загрузить билд React
        juce::String htmlPath = juce::File::getSpecialLocation(
            juce::File::currentApplicationFile
        ).getChildFile("Contents/Resources/dist/index.html").getFullPathName();
        
        webView->goToURL("file://" + htmlPath);
        
        setSize(383, 847); // Размер главного окна
    }

private:
    std::unique_ptr<juce::WebBrowserComponent> webView;
};
```

---

### 3️⃣ Реализовать JS Bridge в C++

Создать файл `JuceBridge.h`:

```cpp
#pragma once
#include <JuceHeader.h>

class JuceBridge
{
public:
    JuceBridge(juce::WebBrowserComponent* browser);
    
    // Отправка событий в JS
    void sendEvent(const juce::String& type, const juce::var& payload);
    
    // Обработка сообщений от JS
    void handleMessage(const juce::String& messageJson);

private:
    juce::WebBrowserComponent* webBrowser;
    
    void handleStartAnalysis();
    void handleStopAnalysis();
    void handleAuthRequest(const juce::var& payload);
};
```

**Реализация `JuceBridge.cpp`:**

```cpp
#include "JuceBridge.h"

JuceBridge::JuceBridge(juce::WebBrowserComponent* browser)
    : webBrowser(browser)
{
    // Регистрируем window.juce.postMessage
    webBrowser->evaluateJavascript(R"(
        window.juce = {
            postMessage: function(msg) {
                // Это вызывает C++ callback
                window.webkit.messageHandlers.juce.postMessage(msg);
            }
        };
    )");
}

void JuceBridge::sendEvent(const juce::String& type, const juce::var& payload)
{
    juce::var event;
    event["type"] = type;
    event["payload"] = payload;
    event["timestamp"] = juce::Time::currentTimeMillis();

    juce::String json = juce::JSON::toString(event);
    
    // Вызываем JS функцию window.onJuceEvent
    webBrowser->evaluateJavascript("window.onJuceEvent('" + json + "');");
}

void JuceBridge::handleMessage(const juce::String& messageJson)
{
    auto json = juce::JSON::parse(messageJson);
    
    if (!json.isObject()) return;
    
    juce::String type = json["type"].toString();
    juce::var payload = json["payload"];
    
    if (type == "start_analysis")
        handleStartAnalysis();
    else if (type == "stop_analysis")
        handleStopAnalysis();
    else if (type == "auth_request")
        handleAuthRequest(payload);
}

void JuceBridge::handleStartAnalysis()
{
    // Запустить FFT анализ
    // ... ваш код ...
    
    sendEvent("analysis_started", juce::var());
}

void JuceBridge::handleStopAnalysis()
{
    // Остановить анализ
    sendEvent("analysis_stopped", juce::var());
}

void JuceBridge::handleAuthRequest(const juce::var& payload)
{
    juce::String username = payload["username"].toString();
    juce::String password = payload["password"].toString();
    
    // Проверка...
    bool success = true; // TODO: реальная проверка
    
    if (success)
    {
        juce::var successPayload;
        successPayload["token"] = "mock_token";
        successPayload["user"]["email"] = username;
        sendEvent("auth_success", successPayload);
    }
    else
    {
        juce::var errorPayload;
        errorPayload["error"] = "Invalid credentials";
        sendEvent("auth_failure", errorPayload);
    }
}
```

---

### 4️⃣ FFT Анализ на Master Channel

```cpp
// AudioProcessor.cpp
class SairyneProcessor : public AudioProcessor
{
public:
    void processBlock(AudioBuffer<float>& buffer, MidiBuffer&) override
    {
        // Master channel получает весь микс
        const int numSamples = buffer.getNumSamples();
        
        if (isAnalyzing)
        {
            // Передаем данные в FFT анализатор
            fftAnalyzer.processAudio(buffer);
            
            if (fftAnalyzer.hasResult())
            {
                auto result = fftAnalyzer.getResult();
                sendResultToUI(result);
            }
        }
    }

private:
    FFTAnalyzer fftAnalyzer;
    JuceBridge* bridge = nullptr;
    bool isAnalyzing = false;

    void sendResultToUI(const FFTResult& result)
    {
        juce::var payload;
        payload["bpm"] = result.bpm;
        payload["key"] = result.key;
        payload["peakFrequency"] = result.peakFreq;
        payload["rmsLevel"] = result.rmsLevel;
        payload["spectralCentroid"] = result.spectralCentroid;
        
        // Отправляем в JS
        bridge->sendEvent("analysis_complete", payload);
    }
};
```

---

### 5️⃣ FFT Analyzer (пример)

```cpp
class FFTAnalyzer
{
public:
    FFTAnalyzer() : fft(fftOrder)
    {
        reset();
    }

    void processAudio(const AudioBuffer<float>& buffer)
    {
        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            // Mono mix
            float monoSample = (buffer.getSample(0, sample) + 
                               buffer.getSample(1, sample)) * 0.5f;
            
            fftData[writeIndex++] = monoSample;
            
            if (writeIndex >= fftSize)
            {
                performFFT();
                writeIndex = 0;
            }
        }
    }

    bool hasResult() const { return resultReady; }
    
    FFTResult getResult()
    {
        resultReady = false;
        return currentResult;
    }

private:
    static constexpr int fftOrder = 12;
    static constexpr int fftSize = 1 << fftOrder; // 4096
    
    juce::dsp::FFT fft;
    std::array<float, fftSize * 2> fftData;
    int writeIndex = 0;
    bool resultReady = false;
    FFTResult currentResult;

    void performFFT()
    {
        fft.performFrequencyOnlyForwardTransform(fftData.data());
        
        // Анализ спектра
        currentResult.peakFreq = findPeakFrequency();
        currentResult.bpm = estimateBPM();
        currentResult.key = detectKey();
        currentResult.rmsLevel = calculateRMS();
        currentResult.spectralCentroid = calculateCentroid();
        
        resultReady = true;
    }

    float findPeakFrequency() { /* ... */ }
    float estimateBPM() { /* ... */ }
    juce::String detectKey() { /* ... */ }
    float calculateRMS() { /* ... */ }
    float calculateCentroid() { /* ... */ }
};

struct FFTResult
{
    float bpm = 0.0f;
    juce::String key;
    float peakFreq = 0.0f;
    float rmsLevel = 0.0f;
    float spectralCentroid = 0.0f;
};
```

---

## 🧪 Тестирование

### В браузере (Mock режим):

```bash
cd /Users/trilium/Downloads/SairyneSignIn
npm run dev
```

- Bridge автоматически определит отсутствие JUCE
- Все вызовы будут логироваться в консоль

### В JUCE плагине:

1. Скомпилировать плагин
2. Загрузить в Ableton/Logic на Master канал
3. Открыть UI плагина
4. Проверить консоль JUCE на сообщения от JS

---

## 📦 Финальный билд для JUCE

### Папка для C++ интеграции:

```
/dist/
  ├── index.html          ← Загружать этот файл
  └── assets/             ← Все ассеты инлайнены или загружаются относительно
```

### Копировать в JUCE проект:

```bash
# В CMakeLists.txt или XCode
cp -r dist/ ${PLUGIN_BUNDLE}/Contents/Resources/
```

---

## 🔗 Связь с фронтенд разработчиком

### Если нужно добавить новые события:

1. Добавить тип в `src/services/audio/juceBridge.ts` (`JuceMessageType` / `JuceEventType`)
2. Обновить протокол в `src/services/audio/README.md`
3. Перебилдить: `npm run build`

### Структура данных `AudioAnalysisResult`:

См. `src/types/audio.ts`:

```typescript
export interface AudioAnalysisResult {
  bpm: number;
  key: string;
  peakFrequency: number;
  rmsLevel: number;
  spectralCentroid: number;
  channels: ChannelAnalysis[];
}
```

---

## 🎉 Готово к интеграции!

JS сторона полностью готова. Следующий шаг — C++ разработчик создает JUCE плагин и подключает WebView.

---

## 📞 Контакты

- **Фронтенд**: Готов помочь с протоколом и добавлением новых событий
- **C++ Dev**: Используй `src/services/audio/README.md` как референс

**Удачи с интеграцией! 🚀**

