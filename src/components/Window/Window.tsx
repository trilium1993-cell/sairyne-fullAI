import React, { ReactNode } from "react";
import { WINDOW, HEADER } from "../../constants/dimensions";
import arrowsIcon from '../../assets/img/arrows-in-simple-light-1.svg';
import closeIcon from '../../assets/img/vector.svg';

interface WindowProps {
  /** Заголовок окна */
  title?: string;
  /** Контент окна */
  children: ReactNode;
  /** Показывать ли header с кнопками */
  showHeader?: boolean;
  /** Обработчик сворачивания */
  onMinimize?: () => void;
  /** Обработчик закрытия */
  onClose?: () => void;
  /** Дополнительный className для кастомизации */
  className?: string;
  /** Высота окна (по умолчанию из констант) */
  height?: number;
  /** Ширина окна (по умолчанию из констант) */
  width?: number;
}

/**
 * Переиспользуемый компонент окна с header
 * Используется для всех основных окон приложения
 */
export const Window = ({
  title = "Sairyne",
  children,
  showHeader = true,
  onMinimize,
  onClose,
  className = "",
  height = WINDOW.OUTER_HEIGHT,
  width = WINDOW.OUTER_WIDTH,
}: WindowProps): JSX.Element => {
  return (
    <div 
      className={`relative bg-[#413f42] overflow-hidden ${className}`}
      style={{
        height: `${height}px`,
        width: `${width}px`,
        borderRadius: `${WINDOW.OUTER_BORDER_RADIUS}px`,
      }}
    >
      {/* Header */}
      {showHeader && (
        <header className="absolute top-[calc(50.00%_-_416px)] left-0 right-0 flex items-center justify-between px-3 h-5 min-h-[20px]">
          <h1 className="[font-family:'Inter',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
            {title}
          </h1>
          
          <div className="flex items-center gap-2">
            {/* Minimize button */}
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Minimize window"
              >
                <img
                  className="w-[18px] h-[18px]"
                  alt="Minimize"
                  src={arrowsIcon}
                />
              </button>
            )}

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Close window"
              >
                <img
                  className="w-[14px] h-[14px]"
                  alt="Close"
                  src={closeIcon}
                />
              </button>
            )}
          </div>
        </header>
      )}

      {/* Content */}
      {children}
    </div>
  );
};

