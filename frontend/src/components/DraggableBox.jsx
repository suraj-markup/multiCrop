// src/components/DraggableBox.js
import React from "react";
import { Rnd } from "react-rnd";

const DraggableBox = ({
  id,
  x,
  y,
  width,
  height,
  onUpdate,
  onDelete,
}) => {
  return (
    <Rnd
      // Position & size
      size={{ width, height }}
      position={{ x, y }}
      // Allow free resizing and dragging within a parent container
      bounds="parent"
      // Callback when user stops dragging
      onDragStop={(e, d) => {
        onUpdate(id, { x: d.x, y: d.y, width, height });
      }}
      // Callback when user stops resizing
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(id, {
          x: position.x,
          y: position.y,
          width: parseFloat(ref.style.width),
          height: parseFloat(ref.style.height),
        });
      }}
      // Optionally show resizing handles on all edges
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      style={{
        border: "2px solid blue",
        position: "absolute",
        backgroundColor: "rgba(0,0,255,0.1)", // Slight overlay for clarity
      }}
    >
      {/* 
        You can style or position this button however you like. 
        Here’s a simple “delete” icon in the top-right corner.
      */}
      <button
        onClick={() => onDelete(id)}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          background: "red",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        &#128465; {/* Trash icon */}
      </button>
    </Rnd>
  );
};

export default DraggableBox;
