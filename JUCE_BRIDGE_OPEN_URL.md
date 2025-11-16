# 🔗 JUCE Bridge: Открытие URL в системном браузере

## 📋 Проблема

В JUCE WebView `window.open()` не работает для открытия внешних ссылок. Нужно использовать JUCE bridge для открытия URL в системном браузере.

---

## ✅ Решение

Добавлен новый тип сообщения `OPEN_URL` в JUCE bridge.

### Frontend (уже реализовано)

В `src/services/audio/juceBridge.ts`:
- Добавлен `JuceMessageType.OPEN_URL`
- Добавлена функция `openUrlInSystemBrowser(url: string)`
- Функция автоматически определяет, запущен ли код в JUCE WebView

В `src/components/UserMenu/UserMenu.tsx`:
- Ссылки используют `openUrlInSystemBrowser()` вместо `window.open()`
- Работает как в JUCE WebView, так и в обычном браузере

---

## 🔧 Реализация в JUCE (C++)

### Шаг 1: Обработка сообщения OPEN_URL

В вашем C++ коде (обычно в `PluginProcessor.cpp` или `PluginEditor.cpp`), где обрабатываются сообщения от WebView:

```cpp
void SairyneAudioProcessor::handleWebViewMessage(const juce::String& messageJson) {
    auto json = juce::JSON::parse(messageJson);
    
    juce::String messageType = json["type"].toString();
    
    if (messageType == "open_url") {
        // Получаем URL из payload
        auto payload = json["payload"];
        juce::String url = payload["url"].toString();
        
        // Открываем URL в системном браузере
        juce::URL(url).launchInDefaultBrowser();
        
        return;
    }
    
    // ... остальная обработка сообщений
}
```

### Шаг 2: Альтернативный вариант (если используется другой метод)

Если у вас другой способ обработки сообщений:

```cpp
// В методе, который получает сообщения от WebView
if (messageType == "open_url") {
    auto url = json["payload"]["url"].toString();
    
    // macOS
    #if JUCE_MAC
        juce::URL(url).launchInDefaultBrowser();
    
    // Windows
    #elif JUCE_WINDOWS
        juce::URL(url).launchInDefaultBrowser();
    
    // Linux
    #elif JUCE_LINUX
        juce::URL(url).launchInDefaultBrowser();
    #endif
}
```

---

## 📝 Формат сообщения

Когда пользователь нажимает на ссылку, frontend отправляет:

```json
{
  "type": "open_url",
  "payload": {
    "url": "https://www.sairyne.net"
  },
  "timestamp": 1234567890
}
```

Или для Google Form:
```json
{
  "type": "open_url",
  "payload": {
    "url": "https://docs.google.com/forms/d/e/1FAIpQLSeUkIn9y-ZyWIjv03umKLl8x-NcD-JIoTDOneHPmHTciu6VpQ/viewform?usp=dialog"
  },
  "timestamp": 1234567890
}
```

---

## ✅ Проверка

После реализации в JUCE:

1. ✅ Нажмите на "Sairyne Website" → должен открыться системный браузер с www.sairyne.net
2. ✅ Нажмите на "Leave feedback" → должен открыться системный браузер с Google Form
3. ✅ В обычном браузере (не в JUCE) → должно работать через `window.open()`

---

## 🔍 Отладка

Если ссылки не открываются:

1. Проверьте, что сообщение `OPEN_URL` приходит в JUCE:
   - Добавьте `DBG("Received OPEN_URL: " << url);`
   - Проверьте логи

2. Проверьте, что `juce::URL::launchInDefaultBrowser()` работает:
   - Попробуйте открыть простой URL: `juce::URL("https://www.google.com").launchInDefaultBrowser();`

3. Проверьте, что frontend определяет JUCE правильно:
   - В консоли браузера должно быть: `[juceBridge] backend detected`

---

## 📋 Чеклист для JUCE разработчика

- [ ] Добавлена обработка `messageType == "open_url"`
- [ ] URL извлекается из `json["payload"]["url"]`
- [ ] Используется `juce::URL(url).launchInDefaultBrowser()`
- [ ] Протестировано на macOS
- [ ] Протестировано на Windows (если нужно)
- [ ] Ссылки открываются в системном браузере

---

**После реализации в JUCE ссылки будут открываться в системном браузере! 🚀**

