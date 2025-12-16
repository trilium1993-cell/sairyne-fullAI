# 🔧 TECHNICAL IMPROVEMENTS GUIDE

## 1️⃣ **TIMEOUT** (Что это и как добавить)

### Проблема
```
Когда запрос к серверу зависает (network issue, сервер down, etc):
❌ СЕЙЧАС: Браузер ждет бесконечно (может быть 5-10 минут)
✅ НУЖНО: Автоматически выбросить ошибку через 30 секунд
```

### Где нужны timeouts?
1. **Frontend → Backend запросы** (chatService.ts)
2. **Backend → OpenAI запросы** (server.js)
3. **Backend → MongoDB запросы** (mongoose config)

### КОД: Добавить в `src/services/chatService.ts`

```typescript
/**
 * Fetch with timeout wrapper
 * Prevents hanging requests
 */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}

// Затем замени все fetch() вызовы на fetchWithTimeout():
static async sendMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  mode: 'learn' | 'create' | 'pro' = 'create'
): Promise<string> {
  try {
    const url = 'https://sairyne-fullai-5.onrender.com/api/chat/message';
    
    // ✅ ИСПОЛЬЗУЙ fetchWithTimeout вместо fetch
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory.slice(-10),
        mode
      })
    }, 30000); // 30 second timeout

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()).response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server took too long to respond');
    }
    throw error;
  }
}
```

**Это значит:**
- Если ответ не приходит за 30 секунд → автоматически выбросится ошибка
- Пользователь увидит "Timeout" вместо бесконечного ждания
- Браузер сможет восстановиться и попробовать заново

---

## 2️⃣ **RETRY LOGIC** (Попытки заново если сбой)

### Проблема
```
Если сеть на 1 секунду зависла:
❌ СЕЙЧАС: Одна ошибка = полный крах, нужно заново писать
✅ НУЖНО: Автоматически попытаться 3 раза, потом если не помогло - ошибка
```

### Как работает Retry с Exponential Backoff?
```
Попытка 1: Отправляем
  ❌ Ошибка → ждем 1 сек
  
Попытка 2: Отправляем
  ❌ Ошибка → ждем 2 сек
  
Попытка 3: Отправляем
  ❌ Ошибка → ждем 4 сек
  
Попытка 4: Отправляем
  ✅ Успех!
```

### КОД: Добавить в `src/services/chatService.ts`

```typescript
/**
 * Retry with exponential backoff
 * Automatically retry failed requests
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        // Last attempt failed
        break;
      }

      // Calculate delay: 1s, 2s, 4s, 8s...
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      
      console.log(
        `⚠️ Attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`,
        lastError?.message
      );

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// Затем используй retryWithBackoff для критических запросов:
static async sendMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  mode: 'learn' | 'create' | 'pro' = 'create'
): Promise<string> {
  return retryWithBackoff(
    async () => {
      const url = 'https://sairyne-fullai-5.onrender.com/api/chat/message';
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10),
          mode
        })
      }, 30000);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()).response;
    },
    3, // Max 3 retries
    1000 // 1 second initial delay
  );
}
```

**Это значит:**
- Сеть зависла? Автоматически пробуем еще раз через 1 сек
- Еще не помогло? Пробуем через 2 сек, потом 4 сек
- Если все 3 раза не помогло → показываем ошибку пользователю

---

## 3️⃣ **RATE LIMITING** (Защита от спама)

### Проблема
```
Без защиты: Хакер может отправить 1000 запросов на login в секунду
❌ СЕЙЧАС: Сервер упадет от нагрузки
✅ НУЖНО: После 5 неудачных логинов за 15 минут → заблокировать IP на 15 мин
```

### Где нужна защита?
- `/api/auth/simple-login-dev` ← спам login попыток
- `/api/auth/simple-register` ← спам регистраций  
- `/api/chat/message` ← спам AI запросов

### ШАГИ УСТАНОВКИ

**Шаг 1: Установить пакет**
```bash
cd /Users/trilium/Downloads/SairyneSignIn/backend
npm install express-rate-limit
```

**Шаг 2: Добавить в `backend/src/server.js`**

```javascript
import rateLimit from 'express-rate-limit';

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Don't rate limit from localhost (for development)
    return req.ip === '127.0.0.1' || req.ip === 'localhost';
  }
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 registrations per IP per hour
  message: 'Too many accounts created from this IP. Please try again later.'
});

// Rate limiter for AI chat (generous, mostly prevent ddos)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute (very generous)
  message: 'Too many chat requests. Please wait a moment.'
});

// ============================================
// APPLY LIMITERS TO ROUTES
// ============================================

// Protect login endpoint
app.post('/api/auth/simple-login-dev', loginLimiter, async (req, res) => {
  // existing code...
});

// Protect register endpoint
app.post('/api/auth/simple-register', registerLimiter, async (req, res) => {
  // existing code...
});

// Protect chat endpoint
app.post('/api/chat/message', chatLimiter, async (req, res) => {
  // existing code...
});

// Protect learn context endpoint
app.post('/api/chat/analyze-learn-context', chatLimiter, async (req, res) => {
  // existing code...
});
```

**Что это даст?**

| Endpoint | Лимит | Период | Результат |
|----------|-------|--------|-----------|
| Login | 5 попыток | 15 мин | Блокировка после 5 неудачных |
| Register | 10 аккаунтов | 1 час | Защита от спам регистраций |
| Chat | 60 сообщений | 1 мин | DDoS защита |

**Пример что пользователь увидит:**
```
После 5-го попытки логина:
"Too many login attempts. Please try again after 15 minutes."

Response headers:
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1702768234
```

---

## 📋 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Пример 1: Пользователь пытается залогиниться 6 раз за 15 минут
```
1️⃣ Попытка 1: ✅ Неверный пароль → "Invalid password"
2️⃣ Попытка 2: ✅ Неверный пароль → "Invalid password"
3️⃣ Попытка 3: ✅ Неверный пароль → "Invalid password"
4️⃣ Попытка 4: ✅ Неверный пароль → "Invalid password"
5️⃣ Попытка 5: ✅ Неверный пароль → "Invalid password"
6️⃣ Попытка 6: 🚫 ЗАБЛОКИРОВАН → "Too many login attempts"
```

### Пример 2: Сеть нестабильна при отправке сообщения
```
Юзер: "How do I setup kick drum?"
   ↓ fetchWithTimeout + retryWithBackoff
   
Попытка 1: ❌ Network timeout
   → ждем 1 сек
   
Попытка 2: ❌ Connection refused
   → ждем 2 сек
   
Попытка 3: ✅ Успех!
   → "The kick drum is the foundation..."
```

---

## 🎯 ПРИОРИТЕТ ВНЕДРЕНИЯ

### URGENTLY (Сейчас, 30 мин)
1. **Timeout** ← Самое важное, предотвращает зависания
2. **Rate Limiting** ← Защита от атак

### THIS WEEK (На этой неделе)
3. **Retry Logic** ← Nice to have, но улучшает UX

---

## ✅ VERIFICATION CHECKLIST

После внедрения проверь:

- [ ] Timeout: Отключи интернет на 40 сек, должна быть ошибка через 30 сек
- [ ] Rate Limiting: 6 раз попробуй залогиниться с неверным паролем - 6-я попытка должна быть заблокирована
- [ ] Retry Logic: Отключи интернет на 2 сек, затем включи - должно успешно переподключиться

---

## 📊 IMPACT MATRIX

| Фича | Сложность | Время | Гарантия Улучшения | Priority |
|------|-----------|-------|-------------------|----------|
| Timeout | LOW | 15 мин | HIGH ⬆️ UX | 1 |
| Rate Limiting | LOW | 20 мин | HIGH 🛡️ Security | 2 |
| Retry Logic | MEDIUM | 30 мин | MEDIUM ⬆️ UX | 3 |

**Общее время: ~65 минут для всех трех!**


