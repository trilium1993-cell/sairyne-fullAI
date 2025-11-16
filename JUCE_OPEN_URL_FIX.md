# 🔧 Исправление OPEN_URL - Перехват window.juce.postMessage

## 🔴 Проблема

Frontend использует `window.juce.postMessage()` для отправки сообщений, но helper script перехватывал только `window.postMessage()`. Поэтому сообщения `OPEN_URL` не обрабатывались.

---

## ✅ Решение

Добавлен перехват методов:
1. `window.juce.postMessage()` - основной метод для JUCE
2. `window.webkit.messageHandlers.juce.postMessage()` - для iOS/macOS WebKit
3. `window.postMessage()` - fallback

---

## 🔧 Изменения

### В `getHelperScript()`:

```javascript
// Перехватываем window.juce.postMessage
if (window.juce && typeof window.juce.postMessage === 'function') {
  var originalJucePostMessage = window.juce.postMessage;
  window.juce.postMessage = function(message) {
    try {
      if (typeof message === 'string') {
        var parsed = JSON.parse(message);
        if (parsed && parsed.type === 'open_url' && parsed.payload && parsed.payload.url) {
          handleOpenUrl(parsed.payload.url);
          return; // Не отправляем в JUCE, обрабатываем сами
        }
      }
    } catch (e) {
      // Не JSON или не OPEN_URL, продолжаем с оригинальным методом
    }
    return originalJucePostMessage.apply(this, arguments);
  };
}
```

---

## 📝 Как это работает

1. Frontend вызывает `openUrlInSystemBrowser(url)`
2. `juceBridge.sendMessage()` отправляет JSON через `window.juce.postMessage()`
3. Helper script перехватывает вызов
4. Проверяет, является ли сообщение `OPEN_URL`
5. Если да - вызывает `handleOpenUrl()` → `bridge.emitEvent('openUrl')` → JUCE обрабатывает
6. Если нет - передает оригинальному методу

---

## ✅ Проверка

После пересборки:

1. Откройте плагин в Ableton
2. Нажмите на значок пользователя
3. Нажмите "Sairyne Website" → должен открыться браузер
4. Нажмите "Leave feedback" → должен открыться Google Form

---

## 🔍 Отладка

Если все еще не работает:

1. **Проверьте логи JUCE:**
   - `~/Library/Application Support/Sairyne/Sairyne.log`
   - Должно быть: `"handleOpenUrlEvent: ..."` или `"Opening URL in system browser: ..."`

2. **Проверьте консоль браузера (если доступна):**
   - Должно быть: `[juceBridge] backend detected`
   - Не должно быть ошибок при вызове `openUrlInSystemBrowser()`

3. **Проверьте, что helper script загружается:**
   - Добавьте `console.log('Helper script loaded');` в начало `getHelperScript()`

---

**Теперь должно работать! 🚀**

