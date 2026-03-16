import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export type DropPosition = 'top' | 'middle' | 'bottom' | null;

interface SidebarDnDItemProps {
  id: string;
  type: string;
  accept: string[];
  data: any;
  draggable?: boolean;
  onDropItem: (droppedData: any, position: DropPosition) => void;
  children: (props: {
    isDragging: boolean;
    isOver: boolean;
    position: DropPosition;
    setNodeRef: (node: HTMLDivElement | null) => void;
  }) => React.ReactNode;
}

export const SidebarDnDItem: React.FC<SidebarDnDItemProps> = ({
  id,
  type,
  accept,
  data,
  draggable = true,
  onDropItem,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropPosition>(null);

  const [{ isDragging }, drag] = useDrag({
    type,
    item: { id, data },
    canDrag: draggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept,
    hover(item: any, monitor) {
      if (!ref.current) return;
      if (item.id === id) {
        setPosition(null);
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      let pos: DropPosition = 'middle';
      if (id === 'All') {
        pos = 'middle';
      } else {
        if (hoverClientY < hoverBoundingRect.height * 0.25) pos = 'top';
        else if (hoverClientY > hoverBoundingRect.height * 0.75) pos = 'bottom';
      }

      setPosition(pos);
    },
    drop(item: any, monitor) {
      if (!ref.current) return;
      if (item.id === id) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      let finalPos: DropPosition = 'middle';
      if (id === 'All') {
        finalPos = 'middle';
      } else {
        if (hoverClientY < hoverBoundingRect.height * 0.25) finalPos = 'top';
        else if (hoverClientY > hoverBoundingRect.height * 0.75) finalPos = 'bottom';
      }

      onDropItem(item.data, finalPos);
      setPosition(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }) && monitor.getItem()?.id !== id,
    }),
  });

  // Reset position when not over
  React.useEffect(() => {
    if (!isOver && position !== null) {
      setPosition(null);
    }
  }, [isOver, position]);

  const setNodeRef = (node: HTMLDivElement | null) => {
    ref.current = node;
    drag(node);
    drop(node);
  };

  return (
    <>
      {children({ isDragging, isOver, position, setNodeRef })}
    </>
  );
};
