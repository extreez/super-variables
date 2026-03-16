import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';

interface DroppableGroupHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  groupPath: string;
  acceptType: string;
  onDropToGroup: (draggedId: string, groupPath: string) => void;
}

export const DroppableGroupHeader: React.FC<DroppableGroupHeaderProps> = ({
  groupPath,
  acceptType,
  onDropToGroup,
  children,
  className,
  style,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: acceptType,
    drop(item: any, monitor) {
      if (item.groupPath === groupPath) return; // Already in this group
      onDropToGroup(item.id, groupPath);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop() && monitor.getItem()?.groupPath !== groupPath,
    }),
  });

  const setRefs = (node: HTMLDivElement | null) => {
    ref.current = node;
    drop(node);
  };

  return (
    <div
      ref={setRefs}
      className={`${className || ''} transition-colors ${isOver && canDrop ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''}`}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
};
