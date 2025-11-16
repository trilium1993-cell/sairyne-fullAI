# ⚠️ Backend не работает - Решение

## 🔴 Проблема

Backend на Render приостановлен:
- URL: `https://sairyne-full5.onrender.com`
- Статус: **Service Suspended**

---

## ✅ РЕШЕНИЕ 1: Перезапустить Backend на Render (рекомендуется)

### Шаг 1: Зайдите на Render
1. Откройте https://render.com
2. Войдите в аккаунт
3. Найдите сервис **sairyne-full5** (или как он называется)

### Шаг 2: Перезапустите сервис
1. Откройте сервис
2. Нажмите **"Manual Deploy"** → **"Deploy latest commit"**
3. Или нажмите **"Restart"** если есть такая кнопка

### Шаг 3: Проверьте переменные окружения
Убедитесь, что на Render настроены:
- `OPENAI_API_KEY` - ваш ключ OpenAI
- `CORS_ORIGIN` - `https://sairyne-ai.vercel.app`
- `PORT` - обычно `3000` (Render автоматически)

### Шаг 4: Проверьте, что сервис запустился
```bash
curl https://sairyne-full5.onrender.com/api/health
```

Должен вернуть: `{"status":"ok","message":"Backend is running"}`

---

## ✅ РЕШЕНИЕ 2: Запустить Backend локально (для тестирования)

### Шаг 1: Запустите backend локально
```bash
cd /Users/trilium/Downloads/SairyneSignIn/backend
npm install
npm start
```

Backend запустится на `http://localhost:3001`

### Шаг 2: Обновите frontend для локального backend
Создайте файл `.env.local` в корне проекта:
```bash
cd /Users/trilium/Downloads/SairyneSignIn
echo "VITE_API_URL=http://localhost:3001" > .env.local
```

### Шаг 3: Перезапустите frontend
```bash
npm run dev
```

Теперь frontend будет использовать локальный backend.

---

## ✅ РЕШЕНИЕ 3: Использовать другой Backend URL

Если у вас есть другой работающий backend:

1. Обновите `src/config/api.ts`:
```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'https://ваш-новый-backend.com';
```

2. Или установите переменную на Vercel:
   - `VITE_API_URL` = `https://ваш-новый-backend.com`

3. Передеплойте frontend:
```bash
npx vercel --prod
```

---

## 🔧 Проверка Backend

### Проверка health endpoint:
```bash
curl https://sairyne-full5.onrender.com/api/health
```

### Проверка chat endpoint:
```bash
curl -X POST https://sairyne-full5.onrender.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

---

## 📋 Чеклист для Render

1. [ ] Сервис запущен (не suspended)
2. [ ] Переменные окружения настроены:
   - [ ] `OPENAI_API_KEY`
   - [ ] `CORS_ORIGIN` = `https://sairyne-ai.vercel.app`
3. [ ] Health endpoint отвечает: `/api/health`
4. [ ] CORS разрешает запросы с `https://sairyne-ai.vercel.app`

---

## 🚀 После исправления Backend

1. Проверьте, что backend работает
2. Обновите переменную `VITE_API_URL` на Vercel (если нужно)
3. Передеплойте frontend (если меняли URL):
```bash
cd /Users/trilium/Downloads/SairyneSignIn
npx vercel --prod
```

---

**Сначала попробуйте перезапустить backend на Render - это самое простое решение!**

