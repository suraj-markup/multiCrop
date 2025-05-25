import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import PropTypes from 'prop-types';
import supabase from '../utils/subapabse';

// DraggableBox component
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
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialBoxRef = useRef({ x, y, width, height });
  const [hideLabel, setHideLabel] = useState(false);

  const handleMouseDown = (e) => {
    // If user clicked the resize handle, skip normal drag
    if (e.target.classList.contains("resize-handle")) return;
    isDraggingRef.current = true;
    setHideLabel(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialBoxRef.current = { x, y, width, height };
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    isResizingRef.current = true;
    setHideLabel(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialBoxRef.current = { x, y, width, height };
  };

  const handleMouseMove = (e) => {
    if (!boxRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      onUpdate(id, {
        x: initialBoxRef.current.x + deltaX,
        y: initialBoxRef.current.y + deltaY,
      });
    } else if (isResizingRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      onUpdate(id, {
        width: initialBoxRef.current.width + deltaX,
        height: initialBoxRef.current.height + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
    setHideLabel(false);
  };

  // Right-click to confirm deletion
  const handleContextMenu = (e) => {
    e.preventDefault();
    const confirmDelete = window.confirm("Delete this box?");
    if (confirmDelete) {
      onDelete(id);
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  });

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
        border: "2px solid #FF5252",
        boxSizing: "border-box",
        cursor: "move",
        zIndex: 10,
      }}
    >
      {/* Label at top-left (hidden while dragging/resizing) */}
      {!hideLabel && (
        <div
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            background: "#FF5252",
            color: "white",
            fontSize: "12px",
            padding: "0px 4px",
            whiteSpace: "nowrap",
            borderRadius: "4px 4px 4px 0",
          }}
        >
          {label || `Box #${id}`}
        </div>
      )}

      {/* Resize handle at bottom-right corner */} 
      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "15px",
          height: "15px",
          background: "#1976D2",
          cursor: "se-resize",
        }}
      />
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

const ImageMultipleRegions = () => {
  // File + local preview
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [imageSrc, setImageSrc] = useState(null);

  // Data from API
  const [fetchedData, setFetchedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Bounding boxes
  const [boxes, setBoxes] = useState([]);
  // Map from imageName => local base64 preview
  const [previewMap, setPreviewMap] = useState({});

  // Original full size of the image (for coordinate math)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const imageRef = useRef(null);
  const offscreenCanvasRef = useRef(document.createElement("canvas"));
  
  const fetchQuestions = useCallback(async () => {
    if (!fileName) return;
    
    setIsLoadingQuestions(true);
    try {
      const response = await axios.get(`https://teacher-backend-xi.vercel.app/api/questions?file_name=${fileName}`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      
      if (response.data.questions && Array.isArray(response.data.questions)) {
        setFetchedData(response.data.questions);
      } else {
        setFetchedData([]);
      }
    } catch (error) {
      alert("Error fetching questions:", error);
      setFetchedData([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [fileName]);
  // Fetch data on mount
  useEffect(() => {
    if (fileName) {
      fetchQuestions();
    }
  }, [fileName, fetchQuestions]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    
    // Clean up the filename by removing any extra extensions
    const originalName = selectedFile.name;
    const cleanName = originalName.replace(/\.(jpg|jpeg|png|gif)\.(jpg|jpeg|png|gif)$/i, '.$1');
    setFileName(cleanName);

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



  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  const updateBox = (id, newProps) => {
    setBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, ...newProps } : box))
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
    setIsLoadingQuestions(false);

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

    try {
      // Create a canvas to crop the images
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = imageSrc;

      // Wait for the image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Upload each cropped image
      const crops = [];
      for (const box of boxCoordinates) {
        // Set canvas size to match the crop dimensions
        canvas.width = box.right - box.left;
        canvas.height = box.bottom - box.top;

        // Draw the cropped portion
        ctx.drawImage(
          img,
          box.left,
          box.top,
          box.right - box.left,
          box.bottom - box.top,
          0,
          0,
          box.right - box.left,
          box.bottom - box.top
        );

        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        
        // Create a file from the blob
        const croppedFile = new File([blob], `${box.name}`, { type: 'image/jpeg' });

        // Upload to Supabase
        const { error } = await supabase.storage
          .from('images')
          .upload(`${box.name}`, croppedFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          continue;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(`${box.name}`);

        crops.push({
          index: box.index,
          name: box.name,
          filename: `${box.name}`,
          url: publicUrl
        });
      }


      // Update local bounding boxes with the new URLs
      const updatedBoxes = boxes.map((box) => {
        const found = crops.find((c) => c.name === box.name);
        if (found) {
          return { ...box, finalUrl: found.url };
        }
        return box;
      });
      setBoxes(updatedBoxes);

      // Update question data with the new image URLs
      const updatedFiltered = filteredData.map((question) => {
        const updatedQ = { ...question };

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
      

      setFilteredData(updatedFiltered);

      // Update questions in the backend with new image URLs
      for (const question of updatedFiltered) {
        if (question.isQuestionImage || question.isOptionImage) {
          try {
            // Prepare the update data according to the backend's expected format
            const updateData = {
              question_number: question.question_number,
              file_name: question.file_name,
              question_text: question.question_text,
              isQuestionImage: question.isQuestionImage,
              question_image: question.isQuestionImage ? question.question_image : null,
              isOptionImage: question.isOptionImage,
              options: question.options || [],
              option_images: question.isOptionImage ? question.option_images : [],
              section_name: question.section_name,
              question_type: question.question_type,
              topic: question.topic,
              exam_name: question.exam_name,
              subject: question.subject_name,
              chapter: question.chapter,
              answer: question.answer
            };

            await axios.put(
              `https://teacher-backend-xi.vercel.app/api/questions/${question._id}`,
              updateData,
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (error) {
            alert(`Failed to update question ${question._id}:`, error.response?.data || error.message);
          }
        }
      }

      alert("Upload successful!");
      resetState();

    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    }
  };

  // Handler to toggle isQuestionImage/isOptionImage
  const handleToggleImageType = (questionId, type, value) => {
    setFilteredData((prev) =>
      prev.map((q) =>
        q._id === questionId ? { ...q, [type]: value } : q
      )
    );
  };

  // Handler to add a box for a question
  const handleAddBoxToQuestion = (question, type, optionIndex = null) => {
    let name = '';
    if (type === 'question') {
      if (question.question_image) {
        name = question.question_image;
      } else {
        name = `${question.question_number}_${fileName}`;
        setFilteredData((prevQ) => prevQ.map((q) => q._id === question._id ? { ...q, question_image: name } : q));
      }
    } else if (type === 'option' && optionIndex !== null) {
      if (question.option_images && question.option_images[optionIndex]) {
        name = question.option_images[optionIndex];
      } else {
        name = `${question.question_number}_option${optionIndex + 1}_${fileName}`;
        setFilteredData((prevQ) => prevQ.map((q) => {
          if (q._id === question._id) {
            const newOpts = [...(q.option_images || [])];
            newOpts[optionIndex] = name;
            return { ...q, option_images: newOpts };
          }
          return q;
        }));
      }
    }
    // Add the box to the main boxes state with metadata
    setBoxes((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        name,
        preview: null,
        questionId: question._id,
        optionIndex: type === 'option' ? optionIndex : null,
        type, // 'question' or 'option'
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Enhanced Navbar */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                🖼️ Multi-Region Crop/Select
              </h1>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center gap-4">
              {/* File Input */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-all border border-gray-300">
                  📁 Choose File
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden"
                  />
                </label>
                {fileName && (
                  <span className="text-sm text-gray-600 max-w-xs truncate">
                    {fileName}
                  </span>
                )}
              </div>

              {/* Action Buttons - Only show when image is selected */}
              {imageSrc && (
                <>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <button
                    onClick={handleUpload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
                    disabled={boxes.length === 0}
                  >
                    ⬆️ Upload Boxes
                  </button>
                  <button
                    onClick={resetState}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
                  >
                    🗑️ Clear & Start New
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

             {/* Main Content */}
      <div className="p-6">
        {!imageSrc ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-8xl mb-4">📷</div>
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Image Selected</h2>
              <p className="text-gray-500 mb-4">
                Choose an image file from the navbar to start cropping and selecting regions
              </p>
              <div className="text-sm text-gray-400">
                Supported formats: JPG, PNG, GIF
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main area: left column (box previews), center (main image), right (question preview) */}
        <div
          className="flex"
          style={{ height: "calc(100vh - 140px)" }}
        >
          {/* Center: the main image with bounding boxes */}
          <div className="flex-1 px-4 flex flex-col relative">
            <h1 className="text-2xl font-bold mb-4">
              Selected image and bounding boxes
            </h1>
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div className="relative max-w-full max-h-full">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Selected"
                  onLoad={handleImageLoad}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "calc(100vh - 150px)",
                    width: "auto",
                    height: "auto",
                    border: "1px solid #ccc",
                    objectFit: "contain",
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
                    onDelete={(id) => setBoxes((prev) => prev.filter((b) => b.id === undefined ? true : b.id !== id))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right column: question preview with updated images */}
          <div className="w-1/2 border-l border-gray-200 pl-6 overflow-y-auto bg-gray-50">
            <div className="sticky top-0 bg-gray-50 pb-4 mb-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📋 Questions Preview
              </h1>
              <p className="text-gray-600 text-sm">
                Configure image settings and manage bounding boxes for each question
              </p>
            </div>
            
            {isLoadingQuestions ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  {/* Spinning loader */}
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  {/* Pulsing inner circle */}
                  <div className="absolute inset-2 bg-blue-100 rounded-full animate-pulse"></div>
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">🔍 Fetching Questions</h3>
                  <p className="text-gray-500 mb-4">
                    Searching for questions related to <span className="font-medium text-blue-600">{fileName}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            ) : filteredData && filteredData.length > 0 ? (
              <div className="space-y-6">
                {filteredData.map((question) => {
                  const questionBoxes = boxes.filter(b => b.questionId === question._id && b.type === 'question');
                  const optionBoxes = boxes.filter(b => b.questionId === question._id && b.type === 'option');
                  
                  return (
                    <div
                      key={question._id}
                      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                    >
                      {/* Question Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">Question {question.question_number}</h3>
                          </div>
                          
                          {/* Image Type Toggle Switches */}
                          <div className="flex gap-3">
                            <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-2">
                              <span className="text-sm font-medium text-black">📷 Question Image:</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={question.isQuestionImage}
                                  onChange={e => handleToggleImageType(question._id, 'isQuestionImage', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                              </label>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-2">
                              <span className="text-sm font-medium text-black">🖼️ Option Images:</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={question.isOptionImage}
                                  onChange={e => handleToggleImageType(question._id, 'isOptionImage', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="p-6">
                        {/* Question Text */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Question Text</h4>
                          <p className="text-gray-800 text-base leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                            {question.question_text}
                          </p>
                        </div>

                        {/* Question Image Section */}
                        {question.isQuestionImage && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-2">
                                📷 Question Image
                              </h4>
                              <div className="flex items-center gap-2">
                                <button
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-all font-medium text-sm flex items-center gap-2"
                                  onClick={() => handleAddBoxToQuestion(question, 'question')}
                                >
                                  ➕ Add Bounding Box
                                </button>
                                {questionBoxes.map((box) => (
                                  <button
                                    key={box.id}
                                    onClick={() => setBoxes((prev) => prev.filter((b) => b.id !== box.id))}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white text-sm font-bold border border-red-300 transition-all"
                                    title="Delete bounding box"
                                  >
                                    🗑️
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {question.question_image ? (
                              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                                <img
                                  src={previewMap[question.question_image] || question.question_image}
                                  alt="Question"
                                  className="max-w-full max-h-64 mx-auto rounded-lg border border-gray-200 shadow-sm"
                                />
                                <p className="text-center text-sm text-gray-500 mt-2">
                                  Image: {question.question_image}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                <p className="text-yellow-700 text-sm">
                                  ⚠️ No question image set. Add a bounding box to generate one.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Option Images Section */}
                        {question.isOptionImage && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                                🖼️ Option Images
                              </h4>
                              <button
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all font-medium text-sm flex items-center gap-2"
                                onClick={() => {
                                  setFilteredData(prev => prev.map(q => {
                                    if (q._id === question._id) {
                                      return { ...q, option_images: [...(q.option_images || []), ""] };
                                    }
                                    return q;
                                  }));
                                }}
                              >
                                ➕ Add Option Image
                              </button>
                            </div>

                            {(!question.option_images || question.option_images.length === 0) ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-blue-700 text-sm">
                                  ℹ️ No option images yet. Click &quot;Add Option Image&quot; to start.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {question.option_images.map((opt, idx) => {
                                  const optionBoxesForThis = optionBoxes.filter(b => b.optionIndex === idx);
                                  return (
                                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                          {idx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={e => {
                                            setFilteredData(prev => prev.map(q => {
                                              if (q._id === question._id) {
                                                const newOpts = [...(q.option_images || [])];
                                                newOpts[idx] = e.target.value;
                                                return { ...q, option_images: newOpts };
                                              }
                                              return q;
                                            }));
                                          }}
                                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                          placeholder={`Option Image ${idx + 1} name`}
                                        />
                                        <button
                                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-all font-medium text-sm"
                                          onClick={() => handleAddBoxToQuestion(question, 'option', idx)}
                                        >
                                          📦 Add Box
                                        </button>
                                        {optionBoxesForThis.map((box) => (
                                          <button
                                            key={box.id}
                                            onClick={() => setBoxes((prev) => prev.filter((b) => b.id !== box.id))}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white text-sm font-bold border border-red-300 transition-all"
                                            title="Delete bounding box"
                                          >
                                            🗑️
                                          </button>
                                        ))}
                                        <button
                                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white text-sm font-bold border border-red-300 transition-all"
                                          onClick={() => {
                                            setFilteredData(prev => prev.map(q => {
                                              if (q._id === question._id) {
                                                const newOpts = [...(q.option_images || [])];
                                                newOpts.splice(idx, 1);
                                                setBoxes(prevBoxes => prevBoxes.filter(b => !(b.questionId === question._id && b.type === 'option' && b.optionIndex === idx)));
                                                return { ...q, option_images: newOpts };
                                              }
                                              return q;
                                            }));
                                          }}
                                          title="Remove option image"
                                        >
                                          ❌
                                        </button>
                                      </div>
                                      
                                      {opt && previewMap[opt] && (
                                        <div className="mt-3">
                                          <img
                                            src={previewMap[opt]}
                                            alt={`Option ${idx + 1}`}
                                            className="max-w-full max-h-32 rounded-lg border border-gray-200 shadow-sm"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Option Images Preview Grid */}
                            {question.option_images && question.option_images.length > 0 && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-600 mb-2">Preview Grid</h5>
                                <div className="grid grid-cols-2 gap-3">
                                  {question.option_images.map((opt, index) => {

                                    const src = previewMap[opt] || opt;
                                    return (
                                      <div
                                        key={index}
                                        className="border-2 border-gray-200 rounded-lg p-3 bg-white hover:border-blue-300 transition-colors"
                                      >
                                        {src ? (
                                          <img src={src} alt={`Option ${index + 1}`} className="w-full h-auto object-cover rounded" />
                                        ) : (
                                          <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                                            No preview
                                          </div>
                                        )}
                                        <p className="mt-2 text-center text-sm font-medium text-gray-700">
                                          {index + 1}. {question.options?.[index] || 'Option text'}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text Options (when not using option images) */}
                        {!question.isOptionImage && question.options && question.options.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                              📝 Text Options
                            </h4>
                            <div className="space-y-2">
                              {question.options.map((option, index) => (
                                <div
                                  key={index}
                                  className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-3"
                                >
                                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <span className="text-gray-800">{option}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Status Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h5 className="text-sm font-semibold text-gray-600 mb-2">📊 Status Summary</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${question.isQuestionImage ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span>Question Image: {question.isQuestionImage ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${question.isOptionImage ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span>Option Images: {question.isOptionImage ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${questionBoxes.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                              <span>Question Boxes: {questionBoxes.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${optionBoxes.length > 0 ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                              <span>Option Boxes: {optionBoxes.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Found</h3>
                <p className="text-gray-500">
                  No questions available for this image. Please select a different image or check your data.
                </p>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageMultipleRegions;
