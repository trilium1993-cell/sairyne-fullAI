# 🔧 Реализация сохранения данных через JUCE PropertiesFile

## ✅ Что сделано

### 1. **Frontend (TypeScript/React)**

#### `src/services/audio/juceBridge.ts`
- ✅ Добавлен `JuceMessageType.SAVE_DATA` и `JuceMessageType.LOAD_DATA`
- ✅ Добавлен `JuceEventType.DATA_LOADED` для получения данных из JUCE
- ✅ Добавлены функции:
  - `saveDataToJuce(key, value)` - сохранить данные
  - `loadDataFromJuce(key)` - загрузить данные
  - `onDataLoaded(callback)` - подписаться на события загрузки

#### `src/utils/storage.ts`
- ✅ `safeSetItem()` теперь использует JUCE fallback если localStorage недоступен
- ✅ `safeGetItem()` запрашивает данные из JUCE если localStorage недоступен

#### `src/App.tsx`
- ✅ Автоматическая загрузка данных при старте если localStorage недоступен
- ✅ Подписка на события `DATA_LOADED` для сохранения в localStorage (если доступен)

---

### 2. **JUCE C++**

#### `PluginProcessor.cpp`

**HashReportingWebBrowser:**
- ✅ Конструктор принимает `SairyneAudioProcessor*` для доступа к PropertiesFile
- ✅ Helper script перехватывает `SAVE_DATA` и `LOAD_DATA` сообщения
- ✅ Конвертирует их в кастомные схемы `sairyne://save_data` и `sairyne://load_data`

**handleCustomScheme():**
- ✅ Обрабатывает `sairyne://save_data?key=...&value=...`
  - Парсит key и value
  - Сохраняет в PropertiesFile через `audioProcessor->getPropertiesFile()`
- ✅ Обрабатывает `sairyne://load_data?key=...`
  - Загружает из PropertiesFile
  - Отправляет обратно через `sairyne://data_loaded?key=...&value=...`
- ✅ Обрабатывает `sairyne://data_loaded` (callback)
  - Wrapper script отправляет данные в iframe через `postMessage`

**Wrapper script:**
- ✅ Мониторит `sairyne://data_loaded` через `pageAboutToLoad`
- ✅ Отправляет данные в iframe через `postMessage({ type: 'juce_data_loaded', key, value })`

**Helper script (внутри iframe):**
- ✅ Слушает `postMessage` с типом `juce_data_loaded`
- ✅ Вызывает `window.onJuceDataLoaded(key, value)`
- ✅ Сохраняет в localStorage если доступен

#### `PluginProcessor.h`
- ✅ Добавлен `getPropertiesFile()` для доступа к PropertiesFile

#### `PluginProcessor.cpp` (getPropertiesFile)
- ✅ Создает PropertiesFile с настройками:
  - `applicationName = "Sairyne"`
  - `filenameSuffix = "settings"`
  - `osxLibrarySubFolder = "Application Support"`
  - `storageFormat = XML`

---

## 🔄 Поток данных

### Сохранение:
1. Frontend: `safeSetItem(key, value)` → `saveDataToJuce(key, value)`
2. JS Bridge: отправляет `{ type: 'save_data', payload: { key, value } }`
3. Helper script: перехватывает и конвертирует в `sairyne://save_data?key=...&value=...`
4. JUCE: `handleCustomScheme()` → сохраняет в PropertiesFile

### Загрузка:
1. Frontend: `safeGetItem(key)` → `loadDataFromJuce(key)`
2. JS Bridge: отправляет `{ type: 'load_data', payload: { key } }`
3. Helper script: перехватывает и конвертирует в `sairyne://load_data?key=...`
4. JUCE: `handleCustomScheme()` → загружает из PropertiesFile
5. JUCE: отправляет обратно через `sairyne://data_loaded?key=...&value=...`
6. Wrapper script: обнаруживает через `pageAboutToLoad` → отправляет в iframe через `postMessage`
7. Helper script: получает `postMessage` → вызывает `window.onJuceDataLoaded(key, value)`
8. Frontend: `onDataLoaded` callback → сохраняет в localStorage (если доступен)

---

## 📝 Ключи хранилища

- `sairyne_users` - список пользователей
- `sairyne_current_user` - текущий пользователь
- `sairyne_access_token` - токен доступа
- `sairyne_projects` - список проектов
- `sairyne_selected_project` - выбранный проект

---

## 🧪 Тестирование

1. **Пересоберите JUCE проект**
2. **Запустите плагин в Ableton**
3. **Войдите в систему** (email + пароль)
4. **Создайте проект**
5. **Закройте и откройте плагин**
6. **Проверьте:**
   - Email и пароль остались
   - Проект остался
   - Данные сохранились

---

## 📍 Расположение PropertiesFile

**macOS:**
```
~/Library/Application Support/Sairyne/Sairyne.settings.xml
```

**Windows:**
```
%APPDATA%\Sairyne\Sairyne.settings.xml
```

---

## 🔍 Логирование

Все операции логируются в:
- `DBG()` - консоль Xcode/Visual Studio
- `juce::Logger::writeToLog()` - файл логов

**Путь к логам:**
```
~/Library/Application Support/Sairyne/Sairyne.log
```

---

## ✅ Готово к тестированию!

Пересоберите проект и протестируйте сохранение данных. Если что-то не работает - проверьте логи! 🚀

