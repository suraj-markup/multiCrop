import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import supabase from "../utils/subapabse";

// Import all the new components
import ProgressModal from "./ProgressModal";
import Navbar from "./Navbar";
import ImageCanvas from "./ImageCanvas";
import QuestionsPreview from "./QuestionsPreview";

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
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Upload progress tracking
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  // Original full size of the image (for coordinate math)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const imageRef = useRef(null);
  const offscreenCanvasRef = useRef(document.createElement("canvas"));

  const fetchQuestions = useCallback(async () => {
    if (!fileName) return;

    setIsLoadingQuestions(true);
    try {
      const response = await axios.get(
        `https://teacher-backend-xi.vercel.app/api/questions?file_name=${fileName}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      console.log(response.data.questions);
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
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Clear previous state when new image is selected
    setBoxes([]);
    setPreviewMap({});
    setNaturalSize({ width: 0, height: 0 });
    setFilteredData([]);
    setHasUnsavedChanges(false);
    
    setFile(selectedFile);

    // Clean up the filename by removing any extra extensions
    const originalName = selectedFile.name;
    const cleanName = originalName.replace(
      /\.(jpg|jpeg|png|gif)\.(jpg|jpeg|png|gif)$/i,
      ".$1"
    );
    setFileName(cleanName);

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(selectedFile);
  }, []);

  // Filter the fetched data by fileName
  useEffect(() => {
    if (!fileName || fetchedData.length === 0) return;
    const matching = fetchedData.filter((item) => item.file_name === fileName);
    setFilteredData(matching);
  }, [fileName, fetchedData]);

  const handleImageLoad = useCallback((e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  }, []);

  const updateBox = useCallback((id, newProps) => {
    setBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, ...newProps } : box))
    );
  }, []);

  // Generate local previews of each bounding box
  const generateLocalPreviews = useCallback(() => {
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
  }, [imageSrc, naturalSize.width, naturalSize.height, boxes]);

  useEffect(() => {
    if (boxes.length > 0) {
      generateLocalPreviews();
    }
  }, [generateLocalPreviews]);

  const resetState = useCallback(() => {
    setFile(null);
    setFileName("");
    setImageSrc(null);
    setBoxes([]);
    setPreviewMap({});
    setNaturalSize({ width: 0, height: 0 });
    setFilteredData([]);
    setIsLoadingQuestions(false);
    setHasUnsavedChanges(false);

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      alert("Please select an image");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: filteredData.length });

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
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
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
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg")
        );

        // Create a file from the blob
        const croppedFile = new File([blob], `${box.name}`, {
          type: "image/jpeg",
        });

        // Upload to Supabase
        const { error } = await supabase.storage
          .from("images")
          .upload(`${box.name}`, croppedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          continue;
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(`${box.name}`);

        crops.push({
          index: box.index,
          name: box.name,
          filename: `${box.name}`,
          url: publicUrl,
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
      for (let i = 0; i < updatedFiltered.length; i++) {
        const question = updatedFiltered[i];
        setUploadProgress({ current: i + 1, total: updatedFiltered.length });

        try {
          // Prepare the update data according to the backend's expected format
          const updateData = {
            question_number: question.question_number,
            file_name: question.file_name,
            question_text: question.question_text,
            isQuestionImage: question.isQuestionImage,
            question_image: question.isQuestionImage
              ? question.question_image
              : null,
            isOptionImage: question.isOptionImage,
            options: question.options || [],
            option_images: question.isOptionImage ? question.option_images : [],
            section_name: question.section_name,
            question_type: question.question_type,
            topic: question.topic,
            exam_name: question.exam_name,
            subject: question.subject_name,
            chapter: question.chapter,
            answer: question.answer,
          };

          await axios.put(
            `https://teacher-backend-xi.vercel.app/api/questions/${question._id}`,
            updateData,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        } catch (error) {
          alert(
            `Failed to update question ${question._id}:`,
            error.response?.data || error.message
          );
        }
      }

      setHasUnsavedChanges(false);
      resetState();
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  }, [file, filteredData, boxes, imageSrc, naturalSize, resetState]);

  // Handler to toggle isQuestionImage/isOptionImage
  const handleToggleImageType = useCallback((questionId, type, value) => {
    setFilteredData((prev) =>
      prev.map((q) => (q._id === questionId ? { ...q, [type]: value } : q))
    );
    setHasUnsavedChanges(true);
  }, []);

  // Handler to update question data
  const handleUpdateQuestion = useCallback((questionId, updates) => {
    setFilteredData((prev) =>
      prev.map((q) => (q._id === questionId ? { ...q, ...updates } : q))
    );
  }, []);

  // Handler to add a box for a question - OPTIMIZED
  const handleAddBoxToQuestion = useCallback((question, type, optionIndex = null) => {
    // Prevent multiple rapid clicks
    if (isUploading) return;

    let name = "";
    let updatedFilteredData = null;

    if (type === "question") {
      if (question.question_image) {
        name = question.question_image;
      } else {
        name = `${question.question_number}_${fileName}`;
        updatedFilteredData = (prevQ) =>
          prevQ.map((q) =>
            q._id === question._id ? { ...q, question_image: name } : q
          );
      }
    } else if (type === "option" && optionIndex !== null) {
      if (question.option_images && question.option_images[optionIndex]) {
        name = question.option_images[optionIndex];
      } else {
        name = `${question.question_number}_option${
          optionIndex + 1
        }_${fileName}`;
        updatedFilteredData = (prevQ) =>
          prevQ.map((q) => {
            if (q._id === question._id) {
              const newOpts = [...(q.option_images || [])];
              newOpts[optionIndex] = name;
              return { ...q, option_images: newOpts };
            }
            return q;
          });
      }
    }

    // Create new box object
    const newBox = {
      id: Date.now() + Math.random(),
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      name,
      preview: null,
      questionId: question._id,
      optionIndex: type === "option" ? optionIndex : null,
      type, // 'question' or 'option'
    };

    // Batch all state updates together
    if (updatedFilteredData) {
      setFilteredData(updatedFilteredData);
    }
    setBoxes((prev) => [...prev, newBox]);
    setHasUnsavedChanges(true);
  }, [fileName, isUploading]);

  // Handler to delete boxes - OPTIMIZED
  const handleDeleteBox = useCallback((boxId, questionId = null, type = null, optionIndex = null) => {
    // Prevent multiple rapid clicks
    if (isUploading) return;

    if (boxId) {
      // Delete specific box by ID
      setBoxes((prev) => prev.filter((b) => b.id !== boxId));
    } else if (questionId && type && optionIndex !== null) {
      // Delete all boxes for a specific option
      setBoxes((prev) =>
        prev.filter(
          (b) =>
            !(
              b.questionId === questionId &&
              b.type === type &&
              b.optionIndex === optionIndex
            )
        )
      );
    }
    setHasUnsavedChanges(true);
  }, [isUploading]);

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        {/* Navbar */}
        <Navbar
          fileName={fileName}
          imageSrc={imageSrc}
          hasUnsavedChanges={hasUnsavedChanges}
          isUploading={isUploading}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          onReset={resetState}
          file={file}
        />

        {/* Main Content */}
        <div className="p-6">
          {!imageSrc ? (
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
          ) : (
            <>
              {/* Main area: left column (image), right (question preview) */}
              <div className="flex" style={{ height: "calc(100vh - 140px)" }}>
                {/* Center: the main image with bounding boxes */}
                <ImageCanvas
                  ref={imageRef}
                  imageSrc={imageSrc}
                  boxes={boxes}
                  onImageLoad={handleImageLoad}
                  onUpdateBox={updateBox}
                  onDeleteBox={handleDeleteBox}
                />

                {/* Right column: question preview with updated images */}
                <QuestionsPreview
                  isLoadingQuestions={isLoadingQuestions}
                  filteredData={filteredData}
                  fileName={fileName}
                  boxes={boxes}
                  previewMap={previewMap}
                  onToggleImageType={handleToggleImageType}
                  onAddBox={handleAddBoxToQuestion}
                  onDeleteBox={handleDeleteBox}
                  onUpdateQuestion={handleUpdateQuestion}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Modal */}
      <ProgressModal isUploading={isUploading} uploadProgress={uploadProgress} />
    </>
  );
};

export default ImageMultipleRegions; 