import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import DraggableBox from "./DraggableBox";
// DraggableBox remains the same as before
// const DraggableBox = ({
//   id,
//   x,
//   y,
//   width,
//   height,
//   label,
//   onUpdate,
//   onDelete,
// }) => {
//   const boxRef = useRef(null);
//   const isResizingRef = useRef(false);
//   const isDraggingRef = useRef(false);
//   const dragStartRef = useRef({ x: 0, y: 0 });
//   const initialBoxRef = useRef({ x, y, width, height });
//   const [hideLabel, setHideLabel] = useState(false);

//   const handleMouseDown = (e) => {
//     // If user clicked the resize handle, skip normal drag
//     if (e.target.classList.contains("resize-handle")) return;
//     isDraggingRef.current = true;
//     setHideLabel(true);
//     dragStartRef.current = { x: e.clientX, y: e.clientY };
//     initialBoxRef.current = { x, y, width, height };
//   };

//   const handleResizeMouseDown = (e) => {
//     e.stopPropagation();
//     isResizingRef.current = true;
//     setHideLabel(true);
//     dragStartRef.current = { x: e.clientX, y: e.clientY };
//     initialBoxRef.current = { x, y, width, height };
//   };

//   const handleMouseMove = (e) => {
//     if (!boxRef.current) return;

//     if (isDraggingRef.current) {
//       const deltaX = e.clientX - dragStartRef.current.x;
//       const deltaY = e.clientY - dragStartRef.current.y;
//       onUpdate(id, {
//         x: initialBoxRef.current.x + deltaX,
//         y: initialBoxRef.current.y + deltaY,
//       });
//     } else if (isResizingRef.current) {
//       const deltaX = e.clientX - dragStartRef.current.x;
//       const deltaY = e.clientY - dragStartRef.current.y;
//       onUpdate(id, {
//         width: initialBoxRef.current.width + deltaX,
//         height: initialBoxRef.current.height + deltaY,
//       });
//     }
//   };

//   const handleMouseUp = () => {
//     isDraggingRef.current = false;
//     isResizingRef.current = false;
//     setHideLabel(false);
//   };

//   // Right-click to confirm deletion
//   const handleContextMenu = (e) => {
//     e.preventDefault();
//     const confirmDelete = window.confirm("Delete this box?");
//     if (confirmDelete) {
//       onDelete(id);
//     }
//   };

//   useEffect(() => {
//     document.addEventListener("mousemove", handleMouseMove);
//     document.addEventListener("mouseup", handleMouseUp);
//     return () => {
//       document.removeEventListener("mousemove", handleMouseMove);
//       document.removeEventListener("mouseup", handleMouseUp);
//     };
//   });

//   return (
//     <div
//       ref={boxRef}
//       onMouseDown={handleMouseDown}
//       onContextMenu={handleContextMenu}
//       style={{
//         position: "absolute",
//         left: x,
//         top: y,
//         width,
//         height,
//         border: "2px solid #FF5252",
//         boxSizing: "border-box",
//         cursor: "move",
//       }}
//     >
//       {/* Label at top-left (hidden while dragging/resizing) */}
//       {!hideLabel && (
//         <div
//           style={{
//             position: "absolute",
//             top: -20,
//             left: 0,
//             background: "#FF5252",
//             color: "white",
//             fontSize: "12px",
//             padding: "0px 4px",
//             whiteSpace: "nowrap",
//           }}
//         >
//           {label || `Box #${id}`}
//         </div>
//       )}

//       {/* Resize handle at bottom-right corner */}
//       <div
//         className="resize-handle"
//         onMouseDown={handleResizeMouseDown}
//         style={{
//           position: "absolute",
//           bottom: 0,
//           right: 0,
//           width: "15px",
//           height: "15px",
//           background: "#1976D2",
//           cursor: "se-resize",
//         }}
//       />
//     </div>
//   );
// };

const ImageMultipleRegions = () => {
  // File + local preview
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [imageSrc, setImageSrc] = useState(null);

  // Data from API
  const [fetchedData, setFetchedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Bounding boxes
  const [boxes, setBoxes] = useState([]);
  // Map from imageName => local base64 preview
  const [previewMap, setPreviewMap] = useState({});

  // Original full size of the image (for coordinate math)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const imageRef = useRef(null);
  const offscreenCanvasRef = useRef(document.createElement("canvas"));

  // Fetch data on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get("https://side-project-t4jc.vercel.app/api/upload", {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        setFetchedData(response.data);
      } catch (error) {
        console.error("Fetching questions failed:", error);
      }
    };
    fetchQuestions();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileName(selectedFile.name);

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  // Filter the fetched data by fileName
  useEffect(() => {
    if (!fileName || fetchedData.length === 0) return;
    const matching = fetchedData.filter((item) => item.file_name === fileName);
    setFilteredData(matching);
  }, [fileName, fetchedData]);

  // Generate bounding boxes for question images
  const generateBoxesForQuestions = () => {
    if (filteredData.length === 0) return;

    const newBoxes = [];

    filteredData.forEach((pageItem) => {
      pageItem.questions.forEach((question) => {
        // If there's a question_image
        if (question.isQuestionImage && question.question_image) {
          newBoxes.unshift({
            id: Date.now() + Math.random(),
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            name: question.question_image,
            preview: null,
          });
        }
        // If there are option images
        if (question.isOptionImage && question.option_images) {
          question.option_images.forEach((optImg) => {
            newBoxes.unshift({
              id: Date.now() + Math.random(),
              x: 100,
              y: 100,
              width: 100,
              height: 100,
              name: optImg,
              preview: null,
            });
          });
        }
      });
    });

    setBoxes(newBoxes);
  };

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  const updateBox = (id, newProps) => {
    setBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, ...newProps } : box))
    );
  };

  const deleteBox = (id) => {
    setBoxes((prev) => prev.filter((box) => box.id !== id));
  };

  const addNewBox = () => {
    setBoxes((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        name: "",
        preview: null,
      },
    ]);
  };

  const handleNameChange = (id, name) => {
    setBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, name } : box))
    );
  };

  // Generate local previews of each bounding box
  const generateLocalPreviews = () => {
    if (!imageRef.current || !imageSrc) return;

    const rect = imageRef.current.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;

    const scaleX = naturalSize.width / displayW;
    const scaleY = naturalSize.height / displayH;

    const previewImage = new Image();
    previewImage.src = imageSrc;

    previewImage.onload = () => {
      const offscreen = offscreenCanvasRef.current;
      const ctx = offscreen.getContext("2d");

      const newPreviewMap = {};

      const updatedBoxes = boxes.map((box) => {
        const left = box.x * scaleX;
        const top = box.y * scaleY;
        const width = box.width * scaleX;
        const height = box.height * scaleY;

        offscreen.width = width;
        offscreen.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(
          previewImage,
          left,
          top,
          width,
          height,
          0,
          0,
          width,
          height
        );

        const dataUrl = offscreen.toDataURL("image/png");
        if (box.name) {
          newPreviewMap[box.name] = dataUrl;
        }
        return { ...box, preview: dataUrl };
      });

      setBoxes(updatedBoxes);
      setPreviewMap((old) => ({ ...old, ...newPreviewMap }));
    };
  };

  useEffect(() => {
    if (boxes.length > 0) {
      generateLocalPreviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes]);

  const resetState = () => {
    setFile(null);
    setFileName("");
    setImageSrc(null);
    setBoxes([]);
    setPreviewMap({});
    setNaturalSize({ width: 0, height: 0 });
    setFilteredData([]);

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file || boxes.length === 0) {
      alert("Please select an image and add at least one box.");
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;
    const scaleX = naturalSize.width / displayW;
    const scaleY = naturalSize.height / displayH;

    const boxCoordinates = boxes.map((b, index) => ({
      name: b.name,
      left: Math.round(b.x * scaleX),
      top: Math.round(b.y * scaleY),
      right: Math.round((b.x + b.width) * scaleX),
      bottom: Math.round((b.y + b.height) * scaleY),
      index,
    }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("crops", JSON.stringify(boxCoordinates));

    try {
      const response = await axios.post(
        "http://localhost:8000/images/multicrop",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Cache-Control": "no-cache",
          },
        }
      );


      const { crops } = response.data; // array of { index, name, filename, url }

      // 1) Update local bounding boxes if we want
      const updatedBoxes = boxes.map((box) => {
        const found = crops.find((c) => c.name === box.name);
        if (found) {
          return { ...box, finalUrl: found.url };
        }
        return box;
      });
      setBoxes(updatedBoxes);

      // 2) Update question data
      const updatedFiltered = filteredData.map((pageItem) => {
        const newQuestions = pageItem.questions.map((q) => {
          const updatedQ = { ...q };

          if (
            updatedQ.isQuestionImage &&
            updatedQ.question_image &&
            crops.some((c) => c.name === updatedQ.question_image)
          ) {
            const foundCrop = crops.find(
              (c) => c.name === updatedQ.question_image
            );
            updatedQ.question_image = foundCrop.url;
          }

          if (updatedQ.isOptionImage && updatedQ.option_images) {
            updatedQ.option_images = updatedQ.option_images.map((opt) => {
              const foundCrop = crops.find((c) => c.name === opt);
              return foundCrop ? foundCrop.url : opt;
            });
          }
          return updatedQ;
        });
        return { ...pageItem, questions: newQuestions };
      });

      setFilteredData(updatedFiltered);

      // Persist the updated question data
      try {
        const putRes = await axios.put(
          `https://side-project-t4jc.vercel.app/api/upload/${updatedFiltered[0]._id}`,
          updatedFiltered[0]
        );
        if (putRes.data.message === "Question updated successfully") {
          alert("Uploaded and updated successfully!");
          resetState();
        } else {
          alert("Update may have failed - please check the data");
        }
      } catch (error) {
        console.error("Error updating data:", error);
        alert(`Update failed: ${error.response?.data?.error || error.message}`);
      }
    } catch (error) {
      console.error("Error uploading:", error);
      alert(`Upload failed: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="p-4">
      {/* Top bar: file input + generate boxes */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        <div>
          <button
            onClick={generateBoxesForQuestions}
            className="px-3 py-2 bg-purple-600 text-white rounded"
            disabled={!fileName || filteredData.length === 0}
          >
            Generate Boxes from Questions
          </button>
        </div>
      </div>

      {/* If we have an image selected, show the second row of buttons */}
      {imageSrc && (
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={addNewBox}
            className="px-3 py-2 bg-green-600 text-white rounded"
          >
            Add New Box
          </button>
          <button
            onClick={handleUpload}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Upload Boxes
          </button>
          <button
            onClick={resetState}
            className="px-3 py-2 bg-red-600 text-white rounded"
          >
            Clear &amp; Start New
          </button>
        </div>
      )}

      {/* Main area: left column (box previews), center (main image), right (question preview) */}
      {imageSrc && (
        <div
          className="flex"
          style={{ minHeight: "600px", maxHeight: "80vh" }}
        >
          {/* Left column: bounding box previews */}
          <div className="w-1/8 border-r pr-2 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4">Bounding Box Previews</h1>
            {boxes.map((box) => (
              <div
                key={box.id}
                className="mb-4 border p-2 rounded bg-white text-sm"
              >
                {box.preview ? (
                  <img
                    src={box.preview}
                    alt={`Box preview ${box.id}`}
                    style={{ maxWidth: "100%", marginBottom: "0.5rem" }}
                  />
                ) : (
                  <div
                    className="bg-gray-200 flex items-center justify-center text-gray-600"
                    style={{ width: "100%", height: "80px" }}
                  >
                    No Preview
                  </div>
                )}
                <input
                  type="text"
                  value={box.name}
                  onChange={(e) => handleNameChange(box.id, e.target.value)}
                  placeholder="Enter name"
                  className="p-1 border rounded w-full"
                />
              </div>
            ))}
          </div>

          {/* Center: the main image with bounding boxes */}
          <div className="flex-1 px-4 overflow-auto relative">
            <h1 className="text-2xl font-bold mb-4">
              Selected image and bounding boxes
            </h1>
            <div className="inline-block relative">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Selected"
                onLoad={handleImageLoad}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  border: "1px solid #ccc",
                  userSelect: "none",
                  pointerEvents: "none"
                }}
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
                  onUpdate={updateBox}
                  onDelete={deleteBox}
                />
              ))}
            </div>
          </div>

          {/* Right column: question preview with updated images */}
          <div className="w-1/3 border-l pl-2 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4">
              Questions and options preview
            </h1>
            {filteredData.length > 0 &&
              filteredData.map((pageItem) =>
                pageItem.questions.map((question) => (
                  <div
                    key={question._id}
                    className="p-4 bg-white rounded-xl shadow-md space-y-4 mb-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-semibold">
                        Question {question.question_number}
                      </span>
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {question.topic}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-gray-800 text-sm">
                        {question.question_text}
                      </p>

                      {question.isQuestionImage && question.question_image && (
                        <img
                          src={
                            previewMap[question.question_image] ||
                            question.question_image
                          }
                          alt="Question"
                          className="w-full max-w-md mx-auto"
                        />
                      )}

                      {question.isOptionImage && question.option_images && (
                        <div className="flex flex-wrap justify-around gap-2">

                          {question.option_images.map((opt, index) => {
                            const src = previewMap[opt] || opt;
                            return (
                              <div
                                key={index}
                                className="border rounded-lg p-2 flex flex-col items-center text-sm w-1/3 "
                              >
                                <img src={src} alt={`Option ${index + 1}`} />
                                <p className="mt-1">
                                  {index + 1}. {question.options[index]}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!question.isOptionImage &&
                        question.options?.map((option, index) => (
                          <div
                            key={index}
                            className="p-2 border border-gray-200 rounded-lg"
                          >
                            {option}
                          </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 text-xs text-gray-600 border-t border-gray-200">
                      <span>{question["Exam Name"]}</span>
                      <span>Year: {question.Year}</span>
                      <span>Set: {question.set || "Not set"}</span>
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageMultipleRegions;
