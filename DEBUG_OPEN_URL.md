# 🔍 Отладка OPEN_URL

## 📍 Точный путь к логам

**macOS:**
```
~/Library/Application Support/Sairyne/Sairyne.log
```

**Полный путь:**
```
/Users/trilium/Library/Application Support/Sairyne/Sairyne.log
```

**Если папка не существует:**
- Запустите плагин в Ableton хотя бы один раз
- Папка и файл создадутся автоматически

---

## 🔍 Как проверить логи

### Вариант 1: Через Terminal
```bash
# Открыть лог в реальном времени
tail -f ~/Library/Application\ Support/Sairyne/Sairyne.log

# Или посмотреть последние 50 строк
tail -50 ~/Library/Application\ Support/Sairyne/Sairyne.log
```

### Вариант 2: Через Finder
1. Нажмите `Cmd + Shift + G` в Finder
2. Введите: `~/Library/Application Support/Sairyne`
3. Откройте файл `Sairyne.log` в текстовом редакторе

### Вариант 3: Через Xcode Console
- Если запускаете из Xcode, логи также видны в консоли Xcode

---

## 📝 Что искать в логах

После нажатия на ссылку в UserMenu, в логах должно появиться:

### Если helper script перехватил сообщение:
```
[Helper] Intercepted OPEN_URL: https://www.sairyne.net
[Helper] handleOpenUrl called with: https://www.sairyne.net
[Helper] Using bridge.emitEvent
```

### Если JUCE получил событие:
```
handleOpenUrlEvent called
handleOpenUrlEvent: payload is object
handleOpenUrlEvent: extracted url from object: https://www.sairyne.net
handleOpenUrlEvent: Opening URL in system browser: https://www.sairyne.net
handleOpenUrlEvent: launchInDefaultBrowser returned: true
```

### Если используется fallback (custom scheme):
```
handleCustomScheme: detected sairyne://open_url
handleCustomScheme: query string: url=https%3A%2F%2Fwww.sairyne.net
handleCustomScheme: extracted url (encoded): https%3A%2F%2Fwww.sairyne.net
handleCustomScheme: decoded URL: https://www.sairyne.net
handleCustomScheme: Opening URL in system browser: https://www.sairyne.net (success: true)
```

---

## ❌ Возможные проблемы

### 1. Нет логов вообще
**Проблема:** Плагин не запускался или логи не создаются
**Решение:** 
- Запустите плагин в Ableton
- Проверьте, что папка создалась

### 2. Нет сообщений о перехвате
**Проблема:** Helper script не перехватывает `window.juce.postMessage()`
**Решение:**
- Проверьте, что helper script загружается
- Ищите в логах: `[Helper] window.juce.postMessage intercepted` или `[Helper] window.juce.postMessage not found`

### 3. Нет сообщений о handleOpenUrlEvent
**Проблема:** Событие не доходит до JUCE
**Решение:**
- Проверьте, что `bridge.emitEvent('openUrl')` вызывается
- Проверьте, что `withEventListener` правильно настроен

### 4. URL пустой
**Проблема:** URL не извлекается из payload
**Решение:**
- Проверьте формат сообщения от frontend
- Должно быть: `{ type: 'open_url', payload: { url: '...' } }`

### 5. launchInDefaultBrowser возвращает false
**Проблема:** Не удается открыть браузер
**Решение:**
- Проверьте права доступа плагина
- Попробуйте открыть URL вручную: `open https://www.sairyne.net`

---

## 🧪 Тестирование

1. **Откройте плагин в Ableton**
2. **Откройте Terminal и запустите:**
   ```bash
   tail -f ~/Library/Application\ Support/Sairyne/Sairyne.log
   ```
3. **В плагине нажмите на ссылку**
4. **Смотрите логи в реальном времени**

---

## 📋 Чеклист отладки

- [ ] Плагин запущен в Ableton
- [ ] Лог-файл существует: `~/Library/Application Support/Sairyne/Sairyne.log`
- [ ] В логах есть сообщения при запуске плагина
- [ ] При нажатии на ссылку появляются новые сообщения в логах
- [ ] Видно, какой путь используется (bridge.emitEvent или custom scheme)
- [ ] URL правильно декодируется
- [ ] `launchInDefaultBrowser()` возвращает `true`

---

**После проверки логов станет ясно, где именно проблема! 🔍**

