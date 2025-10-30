import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../ChatMessage";
import { ChatButton } from "../ChatButton";
import { useTypingAnimation } from "../../hooks/useTypingAnimation";
import arrowsIcon from '../../assets/img/arrows-in-simple-light-1.svg';
import closeIcon from '../../assets/img/vector.svg';

interface FixIssuesChatProps {
  onClose: () => void;
  existingMessages: Message[];
}

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
  isTyping?: boolean;
}

export const FixIssuesChat: React.FC<FixIssuesChatProps> = ({ onClose, existingMessages }) => {
  const [messages, setMessages] = useState<Message[]>(existingMessages);
  const [showOptions, setShowOptions] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Инициализация новых сообщений - только один раз
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Добавляем новое сообщение пользователя к существующим
      const userMessage = {
        id: 'help-issue',
        type: 'user' as const,
        content: "Help me fix the following issue:\nKick & Bass Frequency Clash - Both competing around 60-80Hz\nLead Melody Too Quiet - Getting lost in the mix (-8dB difference)",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Запускаем анимацию для AI ответа через 1 секунду
      setTimeout(() => {
        addAIMessage("Let's Fix Your Critical Issue\n\nI found 2 major problems that are affecting your track's clarity and punch. These are the most important to fix first since they impact the overall sound quality.\n\nHere's what we'll tackle:\n\n1. Kick & Bass Frequency Clash - Your kick and bassline are both fighting for space around 60-80Hz, making the low-end muddy and weak.\n\n2. Lead Melody Too Quiet - Your lead is sitting 8dB below the other elements, so it's getting buried in the mix instead of shining through.\n\nWhich one would you like to fix first?\n\nDon't worry - both issues are easy to fix with the right techniques! Once we solve these, your track will sound much more professional.", () => {
          setShowOptions(true);
        });
      }, 1000);
    }
  }, []); // Пустой массив зависимостей - выполняется только один раз

  // Функция анимации печатания как в основном чате
  const addAIMessage = (content: string, onComplete?: () => void) => {
    const message: Message = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      content: '',
      timestamp: Date.now(),
      isTyping: true
    };

    setMessages(prev => [...prev, message]);
    scrollToBottom();

    let index = 0;
    const typeNextChar = () => {
      if (index < content.length) {
        const currentText = content.substring(0, index + 1);
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, content: currentText }
            : msg
        ));
        index++;
        setTimeout(typeNextChar, 30);
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isTyping: false }
            : msg
        ));
        if (onComplete) {
          setTimeout(onComplete, 300);
        }
      }
    };
    
    setTimeout(typeNextChar, 500);
  };

  // Автоскролл
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Автоскролл при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Обработка кнопок в чате
  const handleChatButton = (buttonText: string) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      type: 'user' as const,
      content: buttonText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // AI ответ
    setTimeout(() => {
      const aiResponse = {
        id: `ai-${Date.now()}`,
        type: 'ai' as const,
        content: "Great choice! Let me show you exactly how to fix this issue step by step...",
        timestamp: Date.now(),
        isTyping: true
      };
      setMessages(prev => [...prev, aiResponse]);
      
      typeMessage(aiResponse, () => {});
    }, 1000);
  };

  return (
    <div className="w-full h-full">
      {/* Chat Messages Container - как в основном чате */}
      <div 
        ref={chatContainerRef} 
        className="w-full h-full overflow-y-auto"
      >
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.content}
              isTyping={message.isTyping}
              isUser={message.type === 'user'}
              avatar={message.type === 'ai' ? "https://c.animaapp.com/hOiZ2IT6/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png" : undefined}
              className={message.id === 'help-issue' ? 'text-right' : ''}
            />
          ))}

          {/* Кнопки опций - показываются только после завершения печатания AI */}
          {showOptions && (
            <div className="flex flex-col gap-3 items-end mb-3">
              <ChatButton
                text="Fix Kick & Bass Clash"
                onClick={() => handleChatButton("Fix Kick & Bass Clash")}
                variant="option"
                isVisible={true}
                className="animate-fadeIn"
              />
              <ChatButton
                text="Boost Lead Melody"
                onClick={() => handleChatButton("Boost Lead Melody")}
                variant="option"
                isVisible={true}
                className="animate-fadeIn"
              />
            </div>
          )}
        </div>
      </div>
  );
};