# 🎨 Frontend Changes for AI Integration

## 📋 Overview

Minimal changes required to integrate AI chat functionality into existing Sairyne frontend.

**Core Principle:** Change as little as possible to avoid breaking existing functionality.

---

## 🎯 What Stays the Same

✅ **UI Components:** All existing components remain unchanged  
✅ **Visual Tips:** `VisualTips1` and `VisualTips2` stay exactly as is  
✅ **Learn Mode:** Guided tutorial (Steps 1-7) continues to work  
✅ **Layout:** Left chat panel + right Visual Tips panel structure  
✅ **Styling:** No CSS/Tailwind changes needed

---

## 🛠️ Required Changes

### 1. Add Mode Detection in FunctionalChat

**File:** `src/components/FunctionalChat/FunctionalChat.tsx`

**Current behavior:**
- Chat always uses `chatSteps.ts` for responses
- Responses are hardcoded based on step number

**New behavior:**
- Detect current mode (Learn/Pro) from parent
- If Learn mode → use existing logic (chatSteps)
- If Pro mode → call backend API for AI response

#### Change 1: Add mode prop

```typescript
// Add to interface
interface FunctionalChatProps {
  // ... existing props
  currentMode?: 'learn' | 'create' | 'pro'; // NEW
}

export const FunctionalChat = ({ 
  currentMode = 'learn', // NEW - default to learn
  // ... other props 
}: FunctionalChatProps) => {
  // ... component code
```

#### Change 2: Modify sendMessage function

**Before:**
```typescript
const handleSendMessage = () => {
  // Get response from chatSteps
  const nextMessage = chatSteps[currentStep]?.messages[messageIndex];
  setMessages([...messages, { role: 'assistant', content: nextMessage }]);
};
```

**After:**
```typescript
const handleSendMessage = async () => {
  const userMessage = inputValue;
  
  // Add user message to chat
  setMessages([...messages, { role: 'user', content: userMessage }]);
  setInputValue('');

  // LEARN MODE: Use existing chatSteps logic
  if (currentMode === 'learn') {
    const nextMessage = chatSteps[currentStep]?.messages[messageIndex];
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: nextMessage 
    }]);
    return;
  }

  // PRO MODE: Call backend API
  if (currentMode === 'pro') {
    try {
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          mode: 'pro',
          context: {
            previousMessages: messages.slice(-10) // Last 10 for context
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply
        }]);
      } else {
        // Error handling
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('API Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please check your internet and try again.'
      }]);
    }
  }
};
```

---

### 2. Add API URL Configuration

**File:** `src/config/api.ts` (NEW FILE)

```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CHAT_MESSAGE: '/api/chat/message',
  HEALTH: '/api/health'
} as const;
```

**File:** `.env` (UPDATE)

Add to existing `.env`:
```bash
VITE_API_URL=https://api.sairyne.com
```

For local development (`.env.local`):
```bash
VITE_API_URL=http://localhost:3001
```

---

### 3. Pass Mode from ScreenManager

**File:** `src/components/ScreenManager.tsx`

**Find where `FunctionalChat` is rendered and add mode prop:**

```typescript
// Assuming you have mode state somewhere in ScreenManager or parent
const [currentMode, setCurrentMode] = useState<'learn' | 'create' | 'pro'>('learn');

// When rendering FunctionalChat:
<FunctionalChat
  currentMode={currentMode} // PASS MODE HERE
  // ... other existing props
/>
```

**Note:** You'll need to check where the Learn/Create/Pro mode selection happens in your existing code and wire up the state properly.

---

### 4. Update Visual Tips Display Logic

**File:** `src/components/VisualTips/VisualTips.tsx`

**Current behavior:**
- Shows Visual Tips for Step 1 and Step 2

**New behavior:**
- Only show Visual Tips in Learn mode
- Hide in Pro mode (or show placeholder)

```typescript
export const VisualTips = ({ 
  tipId, 
  currentStep,
  currentMode // NEW PROP
}: VisualTipsProps) => {
  
  // Don't show visual tips in Pro mode
  if (currentMode === 'pro') {
    return (
      <div className="relative w-[383px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden flex items-center justify-center">
        <div className="text-white/50 text-center px-8">
          <p className="text-lg font-semibold mb-2">Pro Mode Active</p>
          <p className="text-sm">Ask me anything about Ableton Live!</p>
        </div>
      </div>
    );
  }

  // Existing Learn mode logic
  const rawStep = Number(currentStep);
  const displayStep = rawStep === 4 ? 1 : 2;
  
  return (
    <div className="relative w-[383px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
      {displayStep === 1 && <VisualTips1 currentStep={currentStep} />}
      {displayStep === 2 && <VisualTips2 currentStep={currentStep} />}
    </div>
  );
};
```

---

## 📁 New Files to Create

### 1. API Service (Optional but Recommended)

**File:** `src/services/api/chatService.ts`

```typescript
import { API_URL, API_ENDPOINTS } from '../../config/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  mode: 'learn' | 'pro';
  context?: {
    currentStep?: number;
    previousMessages?: ChatMessage[];
  };
}

export interface ChatResponse {
  success: boolean;
  mode: string;
  reply: string;
  showVisualTips?: boolean;
  error?: string;
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}${API_ENDPOINTS.CHAT_MESSAGE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}${API_ENDPOINTS.HEALTH}`);
    return response.ok;
  } catch {
    return false;
  }
}
```

### 2. Types for Chat

**File:** `src/types/chat.ts` (UPDATE EXISTING)

Add to existing types:
```typescript
export type ChatMode = 'learn' | 'create' | 'pro';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  currentMode: ChatMode;
  isLoading: boolean;
  error?: string;
}
```

---

## 🎨 Optional UI Enhancements

### 1. Mode Indicator in Chat

Add a subtle indicator showing current mode:

```tsx
// In FunctionalChat.tsx header area
{currentMode === 'pro' && (
  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border-l-2 border-purple-500">
    <span className="text-xs text-purple-400">🤖 AI Pro Mode Active</span>
  </div>
)}
```

### 2. Loading State for AI Responses

```tsx
{isLoadingAI && (
  <div className="flex items-center gap-2 px-4 py-2 text-white/60">
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/60"></div>
    <span className="text-sm">AI is thinking...</span>
  </div>
)}
```

### 3. Error State

```tsx
{error && (
  <div className="mx-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
    <p className="text-sm text-red-400">{error}</p>
    <button 
      onClick={handleRetry}
      className="text-xs text-red-300 underline mt-1"
    >
      Retry
    </button>
  </div>
)}
```

---

## 🧪 Testing Checklist

### Learn Mode (Should NOT Change)
- [ ] Steps 1-7 still work as before
- [ ] Visual Tips appear for Step 1 and Step 2
- [ ] Chat progresses through guided flow
- [ ] No API calls are made in Learn mode

### Pro Mode (New Functionality)
- [ ] User can type free-form questions
- [ ] AI responses appear in chat
- [ ] Loading indicator shows while waiting
- [ ] Error handling works if API fails
- [ ] Visual Tips panel shows placeholder or is empty
- [ ] Chat history is maintained

### Edge Cases
- [ ] Network offline: shows error message
- [ ] API timeout: shows error after 10s
- [ ] Empty message: doesn't send to API
- [ ] Very long message: truncated or rejected
- [ ] Rapid messages: queued properly

---

## 🚀 Deployment Updates

### Update Vercel Environment Variables

Add to Vercel dashboard:
```
VITE_API_URL=https://your-backend.railway.app
```

### Update Build Command (if needed)

`vercel.json` should remain the same:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## 📊 Monitoring Frontend

### Track AI Usage

Add simple analytics:
```typescript
// When AI response received
if (currentMode === 'pro') {
  // Log to analytics (Mixpanel, GA, etc.)
  analytics.track('AI_Message_Sent', {
    messageLength: userMessage.length,
    responseTime: responseTime,
    success: true
  });
}
```

---

## 🔧 Troubleshooting

### Issue: CORS Error
**Solution:** Ensure backend has correct CORS configuration:
```typescript
// Backend
app.use(cors({
  origin: 'https://sairyne.vercel.app',
  credentials: true
}));
```

### Issue: API URL Not Found
**Solution:** Check `.env` file and restart dev server:
```bash
npm run dev
```

### Issue: Learn Mode Broken
**Solution:** Ensure default mode is 'learn':
```typescript
const [currentMode, setCurrentMode] = useState<ChatMode>('learn');
```

---

## 📝 Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `FunctionalChat.tsx` | Modify | Add mode prop, update sendMessage logic |
| `VisualTips.tsx` | Modify | Add Pro mode placeholder |
| `ScreenManager.tsx` | Modify | Pass mode to FunctionalChat |
| `config/api.ts` | New | API configuration |
| `services/api/chatService.ts` | New | API service layer |
| `types/chat.ts` | Update | Add ChatMode type |
| `.env` | Update | Add API_URL |

**Total Files Modified:** 4  
**Total New Files:** 2  
**Estimated Time:** 2-3 hours for experienced developer

---

## ✅ Implementation Order

1. ✅ Create `config/api.ts` and add environment variable
2. ✅ Create `services/api/chatService.ts`
3. ✅ Update `types/chat.ts`
4. ✅ Modify `FunctionalChat.tsx` (sendMessage function)
5. ✅ Update `VisualTips.tsx` (Pro mode placeholder)
6. ✅ Wire up mode state in `ScreenManager.tsx`
7. ✅ Test Learn mode (ensure nothing broke)
8. ✅ Test Pro mode (with backend running)
9. ✅ Deploy to Vercel with new env variables

---

**Version:** 1.0.0  
**Last Updated:** October 30, 2025  
**Status:** Ready for Implementation ✅

