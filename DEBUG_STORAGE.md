# 🔍 Отладка сохранения данных

## ✅ Что сделано

1. **Добавлено логирование:**
   - `[Storage]` - проверка localStorage
   - `[JUCE Bridge]` - обнаружение bridge и отправка сообщений
   - `[Helper]` - перехват сообщений в helper script
   - `handleCustomScheme` - обработка в JUCE C++

2. **Исправлена проблема с iframe:**
   - Теперь используется `window.top.location.href` для выхода из iframe в wrapper

---

## 🔍 Как проверить

### 1. Откройте консоль браузера в WebView

В JUCE WebView консоль может быть недоступна напрямую. Проверьте логи JUCE:

**macOS:**
```
~/Library/Application Support/Sairyne/Sairyne.log
```

### 2. Что искать в логах

**При входе в систему:**
```
[Storage] localStorage test: available/not available
[JUCE Bridge] Detection attempt 1 - juceAvailable: true/false
[JUCE Bridge] ✅ JUCE bridge detected!
[Storage] Saving to JUCE PropertiesFile: sairyne_users
[JUCE Bridge] Sending message via window.juce.postMessage: save_data payload size: ...
[Helper] Intercepted SAVE_DATA: sairyne_users value length: ...
[Helper] Setting location.href to: sairyne://save_data?key=...
handleCustomScheme: detected sairyne://save_data
handleCustomScheme: Saved data: sairyne_users = ...
```

**При загрузке данных:**
```
[Storage] localStorage test: not available
[JUCE Bridge] isJuceAvailable: true
[Storage] Saving to JUCE PropertiesFile: sairyne_users
[Helper] Intercepted LOAD_DATA: sairyne_users
handleCustomScheme: detected sairyne://load_data
handleCustomScheme: Loaded data: sairyne_users = ...
```

---

## 🐛 Возможные проблемы

### Проблема 1: JUCE bridge не определяется

**Симптомы:**
- `[JUCE Bridge] ⚠️ JUCE bridge not detected`
- `[Storage] No storage available`

**Решение:**
- Проверьте, что helper script загружается
- Проверьте, что `window.juce.postMessage` существует

### Проблема 2: Сообщения не перехватываются

**Симптомы:**
- `[JUCE Bridge] Sending message` есть
- Но `[Helper] Intercepted SAVE_DATA` нет

**Решение:**
- Helper script может не успеть перехватить `window.juce.postMessage`
- Нужно проверить порядок загрузки скриптов

### Проблема 3: location.href не работает

**Симптомы:**
- `[Helper] Setting location.href` есть
- Но `handleCustomScheme: detected sairyne://save_data` нет

**Решение:**
- `window.top.location.href` может быть заблокирован cross-origin политикой
- Нужно использовать другой способ (postMessage в wrapper)

---

## 🔧 Следующие шаги

1. **Пересоберите JUCE проект**
2. **Протестируйте сохранение:**
   - Войдите в систему
   - Создайте проект
   - Закройте плагин
   - Откройте плагин снова
3. **Проверьте логи:**
   - Консоль браузера (если доступна)
   - `~/Library/Application Support/Sairyne/Sairyne.log`
4. **Пришлите логи** - помогу разобраться!

---

**Проект задеплоен с логированием. Теперь можно увидеть, где именно проблема! 🚀**

