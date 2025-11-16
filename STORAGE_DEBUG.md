# 🔍 Диагностика сохранения данных

## ✅ Что сделано

1. **Добавлено подробное логирование на каждом этапе:**
   - `[Auth] 🔄 createSession called:` - вход в систему
   - `[Auth] 🔄 saveUser called:` - сохранение пользователя
   - `[Auth] 🔄 persistUsers called:` - сохранение списка пользователей
   - `[Storage] 🔄 Saving to JUCE PropertiesFile:` - отправка в JUCE
   - `[JUCE Bridge] 📤 Attempting to send message:` - отправка сообщения
   - `[Helper] 🔄 Intercepted SAVE_DATA:` - перехват в helper script
   - `handleSaveDataEvent called` - получение в JUCE C++

2. **Проект задеплоен с новым логированием**

---

## 🔍 Как проверить

### 1. Обновите URL в JUCE проекте

В `PluginProcessor.cpp` найдите:
```cpp
const juce::String siteUrl = "https://sairyne-ai.vercel.app/embed-chat.html";
```

И замените на:
```cpp
const juce::String siteUrl = "https://sairyne-ogbimqc7p-viacheslavs-projects-041ada6a.vercel.app/embed-chat.html";
```

Или используйте основной домен (если настроен):
```cpp
const juce::String siteUrl = "https://sairyne-ai.vercel.app/embed-chat.html";
```

### 2. Пересоберите JUCE проект

### 3. Протестируйте

1. **Войдите в систему** (введите email и пароль)
2. **Создайте проект** (введите название)
3. **Проверьте логи:**

**macOS:**
```
~/Library/Application Support/Sairyne/Sairyne.log
```

**Ищите в логах:**
- `[Auth] 🔄 createSession called:` - функция вызвана
- `[Storage] 🔄 Saving to JUCE PropertiesFile:` - отправка в JUCE
- `[Helper] 🔄 Intercepted SAVE_DATA:` - перехват в helper script
- `handleSaveDataEvent called` - получение в JUCE C++
- `handleSaveDataEvent: Saved data:` - данные сохранены

### 4. Проверьте файл PropertiesFile

**macOS:**
```
~/Library/Application Support/Sairyne/Sairyne.properties
```

Если файла нет, значит данные не сохраняются.

---

## 🐛 Диагностика проблем

### Если нет `[Auth] 🔄 createSession called:`
- Функция не вызывается из frontend
- Проверьте, вызывается ли `onNext()` после входа

### Если есть `[Auth]` но нет `[Storage]`
- `isJuceAvailable()` возвращает `false`
- Проверьте, определяется ли `window.juce.postMessage`

### Если есть `[Storage]` но нет `[Helper]`
- Helper script не перехватывает сообщения
- Проверьте, загружается ли helper script

### Если есть `[Helper]` но нет `handleSaveDataEvent`
- События не доходят до JUCE
- Проверьте, работает ли `bridge.emitEvent`

---

## 📝 Что прислать для диагностики

1. **Последние 100 строк логов JUCE:**
   ```
   tail -100 ~/Library/Application\ Support/Sairyne/Sairyne.log
   ```

2. **Сообщения из консоли браузера** (если доступна):
   - Откройте DevTools в WebView (если возможно)
   - Или используйте `console.log` в helper script

3. **Проверьте, существует ли файл PropertiesFile:**
   ```bash
   ls -la ~/Library/Application\ Support/Sairyne/
   ```

---

**С новым логированием мы точно увидим, где именно проблема! 🚀**

