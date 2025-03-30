import React, { useState } from "react";
import { Rnd } from "react-rnd";

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
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width, height });

  return (
    <>

      <Rnd
        size={size}
        position={position}
        bounds="parent"

        onDrag={(e, d) => {
          setPosition({ x: d.x, y: d.y });
        }}

        onDragStop={(e, d) => {
          onUpdate(id, { x: d.x, y: d.y, width: size.width, height: size.height });
        }}

        onResize={(e, direction, ref, delta, position) => {
          setSize({
            width: parseFloat(ref.style.width),
            height: parseFloat(ref.style.height),
          });
          setPosition(position);
        }}

        onResizeStop={(e, direction, ref, delta, position) => {
          onUpdate(id, {
            x: position.x,
            y: position.y,
            width: parseFloat(ref.style.width),
            height: parseFloat(ref.style.height),
          });
        }}

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
          backgroundColor: "rgba(0,0,145,0.01)", // Slight overlay for clarity
        }}
      >
        <span className="absolute transform -translate-y-[130%] bg-[#FF5252] whitespace-nowrap px-[4px] w-fit text-[10px]">{label}</span>
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            &#128465;
          </button>
        )}
      </Rnd>
    </>
  );
};

export default DraggableBox;