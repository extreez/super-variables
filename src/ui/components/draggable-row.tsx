import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

interface DraggableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  type: string; // e.g., 'VARIABLE_ROW'
  index: number;
  groupPath: string;
  onMove: (draggedId: string, targetId: string, dropPosition: 'before' | 'after' | 'inside') => void;
  innerRef?: (element: HTMLElement | null) => void;
  isSelected?: boolean;
  isEditing?: boolean;
}

export const DraggableRow: React.FC<DraggableRowProps> = ({
  id,
  type,
  index,
  groupPath,
  onMove,
  innerRef,
  isSelected,
  isEditing,
  children,
  className,
  style,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type,
    item: { id, index, groupPath },
    canDrag: !isEditing,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, dropDirection }, drop] = useDrop({
    accept: type,
    hover(item: any, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragId = item.id;
      const hoverId = id;

      if (dragId === hoverId) return;
    },
    drop(item: any, monitor) {
      if (!ref.current) return;
      const dragId = item.id;
      const hoverId = id;
      if (dragId === hoverId) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      const dropPosition = hoverClientY < hoverMiddleY ? 'before' : 'after';
      onMove(dragId, hoverId, dropPosition);
    },
    collect: (monitor) => {
      const clientOffset = monitor.getClientOffset();
      let dropDirection = null;
      if (ref.current && clientOffset && monitor.isOver()) {
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        dropDirection = hoverClientY < hoverMiddleY ? 'top' : 'bottom';
      }
      return {
        isOver: monitor.isOver(),
        dropDirection,
      };
    },
  });

  const setRefs = (node: HTMLDivElement | null) => {
    ref.current = node;
    drag(node);
    drop(node);
    if (innerRef) {
      innerRef(node);
    }
  };

  return (
    <div
      ref={setRefs}
      className={`relative ${className || ''} ${isDragging ? 'opacity-50 bg-[#f5f5f5]' : ''}`}
      style={style}
      {...rest}
    >
      {/* Drop indicators */}
      {isOver && dropDirection === 'top' && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0d99ff] z-10 pointer-events-none" />
      )}
      {isOver && dropDirection === 'bottom' && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0d99ff] z-10 pointer-events-none" />
      )}
      {children}
    </div>
  );
};
