import React, { ReactNode } from "react";
import { WINDOW } from "../../constants/dimensions";
import arrowsIcon from '../../assets/img/arrows-in-simple-light-1.svg';
import closeIcon from '../../assets/img/vector.svg';
import { resolveIsEmbedded } from "../../utils/embed";

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
  const shouldShowHeader = showHeader && !resolveIsEmbedded();

  return (
    <div 
      className={`sairyne-window relative bg-[#413f42] overflow-hidden ${className}`}
      style={{
        height: `${height}px`,
        width: `${width}px`,
        borderRadius: `${WINDOW.OUTER_BORDER_RADIUS}px`,
        border: 'none',
        boxShadow: 'none',
        outline: 'none',
      }}
    >
      {/* Content */}
      {children}
    </div>
  );
};

