import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

const DraggableBox = ({
  id,
  x,
  y,
  width,
  height,
  label,
  onUpdate,
  onDelete,
}) => {
  const boxRef = useRef(null);
  const isResizingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const resizeDirectionRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialBoxRef = useRef({ x, y, width, height });
  const [hideLabel, setHideLabel] = useState(false);

  // Handle resize from different directions
  const handleResizeMouseDown = useCallback((e, direction) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text/image selection
    isResizingRef.current = true;
    resizeDirectionRef.current = direction;
    setHideLabel(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialBoxRef.current = { x, y, width, height };
    
    // Prevent selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }, [x, y, width, height]);

  const handleMouseDown = useCallback((e) => {
    // If user clicked a resize handle, skip normal drag
    if (e.target.classList.contains("resize-handle")) return;
    e.preventDefault(); // Prevent text/image selection
    e.stopPropagation(); // Prevent bubbling
    isDraggingRef.current = true;
    setHideLabel(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialBoxRef.current = { x, y, width, height };
    
    // Prevent selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }, [x, y, width, height]);

  const handleMouseMove = useCallback((e) => {
    if (!boxRef.current) return;
    
    // Prevent default to avoid image dragging
    if (isDraggingRef.current || isResizingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      onUpdate(id, {
        x: initialBoxRef.current.x + deltaX,
        y: initialBoxRef.current.y + deltaY,
      });
    } else if (isResizingRef.current && resizeDirectionRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const direction = resizeDirectionRef.current;
      
      let newProps = {};
      
      // Handle resize based on direction
      switch (direction) {
        case 'nw': // top-left
          newProps = {
            x: initialBoxRef.current.x + deltaX,
            y: initialBoxRef.current.y + deltaY,
            width: initialBoxRef.current.width - deltaX,
            height: initialBoxRef.current.height - deltaY,
          };
          break;
        case 'ne': // top-right
          newProps = {
            y: initialBoxRef.current.y + deltaY,
            width: initialBoxRef.current.width + deltaX,
            height: initialBoxRef.current.height - deltaY,
          };
          break;
        case 'sw': // bottom-left
          newProps = {
            x: initialBoxRef.current.x + deltaX,
            width: initialBoxRef.current.width - deltaX,
            height: initialBoxRef.current.height + deltaY,
          };
          break;
        case 'se': // bottom-right
          newProps = {
            width: initialBoxRef.current.width + deltaX,
            height: initialBoxRef.current.height + deltaY,
          };
          break;
        case 'n': // top
          newProps = {
            y: initialBoxRef.current.y + deltaY,
            height: initialBoxRef.current.height - deltaY,
          };
          break;
        case 's': // bottom
          newProps = {
            height: initialBoxRef.current.height + deltaY,
          };
          break;
        case 'w': // left
          newProps = {
            x: initialBoxRef.current.x + deltaX,
            width: initialBoxRef.current.width - deltaX,
          };
          break;
        case 'e': // right
          newProps = {
            width: initialBoxRef.current.width + deltaX,
          };
          break;
      }
      
      // Ensure minimum size
      if (newProps.width !== undefined && newProps.width < 30) {
        if (newProps.x !== undefined) {
          newProps.x = initialBoxRef.current.x + initialBoxRef.current.width - 30;
        }
        newProps.width = 30;
      }
      if (newProps.height !== undefined && newProps.height < 30) {
        if (newProps.y !== undefined) {
          newProps.y = initialBoxRef.current.y + initialBoxRef.current.height - 30;
        }
        newProps.height = 30;
      }
      
      onUpdate(id, newProps);
    }
  }, [id, onUpdate]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
    resizeDirectionRef.current = null;
    setHideLabel(false);
    
    // Restore selection capability
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  }, []);

  // Right-click to confirm deletion
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Don't show context menu if we're dragging or resizing
    if (isDraggingRef.current || isResizingRef.current) return;
    
    const confirmDelete = window.confirm("Delete this box?");
    if (confirmDelete) {
      onDelete(id);
    }
  }, [id, onDelete]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Ensure selection is restored on unmount
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  // Render resize handles
  const renderResizeHandles = useCallback(() => {
    const handleSize = 8;
    const handles = [
      { direction: 'nw', cursor: 'nw-resize', style: { top: -handleSize/2, left: -handleSize/2 } },
      { direction: 'ne', cursor: 'ne-resize', style: { top: -handleSize/2, right: -handleSize/2 } },
      { direction: 'sw', cursor: 'sw-resize', style: { bottom: -handleSize/2, left: -handleSize/2 } },
      { direction: 'se', cursor: 'se-resize', style: { bottom: -handleSize/2, right: -handleSize/2 } },
      { direction: 'n', cursor: 'n-resize', style: { top: -handleSize/2, left: '50%', transform: 'translateX(-50%)' } },
      { direction: 's', cursor: 's-resize', style: { bottom: -handleSize/2, left: '50%', transform: 'translateX(-50%)' } },
      { direction: 'w', cursor: 'w-resize', style: { top: '50%', left: -handleSize/2, transform: 'translateY(-50%)' } },
      { direction: 'e', cursor: 'e-resize', style: { top: '50%', right: -handleSize/2, transform: 'translateY(-50%)' } },
    ];
    
    return handles.map(({ direction, cursor, style }) => (
      <div
        key={direction}
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, direction)}
        style={{
          position: 'absolute',
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          background: 'white',
          border: '1px solid #1976D2',
          cursor,
          zIndex: 2,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          ...style,
        }}
      />
    ));
  }, [handleResizeMouseDown]);

  return (
    <div
      ref={boxRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        border: "2px solid #1976D2",
        boxSizing: "border-box",
        cursor: "move",
        zIndex: 10,
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      {/* Label at top-left (hidden while dragging/resizing) */}
      {!hideLabel && (
        <div
            style={{
              position: "absolute",
            top: -28,
            left: 0,
            background: "#1976D2",
              color: "white",
            fontSize: "12px",
            padding: "2px 8px",
            whiteSpace: "nowrap",
            borderRadius: "4px 4px 0 0",
            pointerEvents: "none", // Prevent interfering with drag
          }}
        >
          {label || `Box #${id}`}
        </div>
      )}
      
      {/* Action buttons in top-right corner */}
      {!hideLabel && (
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
              display: "flex",
            gap: "4px",
            pointerEvents: "none", // Prevent interfering with drag
          }}
        >
        </div>
      )}

      {/* Resize handles on all corners and edges */}
      {renderResizeHandles()}
    </div>
  );
};

// Add PropTypes validation
DraggableBox.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  label: PropTypes.string,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default DraggableBox;