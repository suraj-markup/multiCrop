import { useRef, forwardRef } from "react";
import PropTypes from "prop-types";
import DraggableBox from "./DraggableBox";

const ImageCanvas = forwardRef(({ 
  imageSrc, 
  boxes, 
  onImageLoad, 
  onUpdateBox, 
  onDeleteBox 
}, ref) => {
  if (!imageSrc) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-8xl mb-4">📷</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            No Image Selected
          </h2>
          <p className="text-gray-500 mb-4">
            Choose an image file from the navbar to start cropping and
            selecting regions
          </p>
          <div className="text-sm text-gray-400">
            Supported formats: JPG, PNG, GIF
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 flex flex-col relative">
      <h1 className="text-2xl font-bold mb-4">
        Selected image and bounding boxes
      </h1>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div 
          className="relative max-w-full max-h-full"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
        >
          <img
            ref={ref}
            src={imageSrc}
            alt="Selected"
            onLoad={onImageLoad}
            draggable={false}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "calc(100vh - 150px)",
              width: "auto",
              height: "auto",
              border: "1px solid #ccc",
              objectFit: "contain",
              pointerEvents: "auto",
            }}
            onDragStart={(e) => e.preventDefault()}
          />
          {boxes.map((box) => (
            <DraggableBox
              key={box.id}
              id={box.id}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              label={box.name}
              onUpdate={onUpdateBox}
              onDelete={onDeleteBox}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

ImageCanvas.displayName = "ImageCanvas";

ImageCanvas.propTypes = {
  imageSrc: PropTypes.string,
  boxes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    name: PropTypes.string,
  })).isRequired,
  onImageLoad: PropTypes.func.isRequired,
  onUpdateBox: PropTypes.func.isRequired,
  onDeleteBox: PropTypes.func.isRequired,
};

export default ImageCanvas; 