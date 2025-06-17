import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import supabase from "../utils/subapabse";
import { getQuestionsUrl, getQuestionByIdUrl } from "../config/api";

// Import all the new components
import ProgressModal from "./ProgressModal";
import Navbar from "./Navbar";
import ImageCanvas from "./ImageCanvas";
import QuestionsPreview from "./QuestionsPreview";

const ImageMultipleRegions = () => {
    // File + local preview
    const [files, setFiles] = useState([]); // Array of all selected files
    const [currentFileIndex, setCurrentFileIndex] = useState(0); // Current file index
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
    // Track which specific questions have been modified
    const [modifiedQuestions, setModifiedQuestions] = useState(new Set());
    // Upload progress tracking
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({
        current: 0,
        total: 0,
    });
    // Success message state
    const [uploadSuccess, setUploadSuccess] = useState(null);

    // Original full size of the image (for coordinate math)
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

    // NEW: Background upload state
    const [backgroundUploads, setBackgroundUploads] = useState([]);
    const [completedUploads, setCompletedUploads] = useState([]);

    const imageRef = useRef(null);
    const offscreenCanvasRef = useRef(document.createElement("canvas"));

    // NEW: Auto-clear completed uploads after 5 seconds
    useEffect(() => {
        if (completedUploads.length > 0) {
            const timer = setTimeout(() => {
                setCompletedUploads([]);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [completedUploads]);

    const fetchQuestions = useCallback(async () => {
        if (!fileName) return;

        setIsLoadingQuestions(true);
        try {
            const response = await axios.get(
                getQuestionsUrl(fileName),
                {
                    headers: {
                        "Cache-Control": "no-cache",
                        Expires: "0",
                    },
                }
            );
            console.log(response.data);
            if (response.data.data && response.data.data.questions && Array.isArray(response.data.data.questions)) {
                setFetchedData(response.data.data.questions);
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
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        // Clear previous state when new image is selected
        setBoxes([]);
        setPreviewMap({});
        setNaturalSize({ width: 0, height: 0 });
        setFilteredData([]);
        setHasUnsavedChanges(false);

        setFiles(selectedFiles);
        setCurrentFileIndex(0);

        // Process the first file
        const firstFile = selectedFiles[0];
        setFile(firstFile);

        // Clean up the filename by removing any extra extensions
        const originalName = firstFile.name;
        const cleanName = originalName.replace(
            /\.(jpg|jpeg|png|gif)\.(jpg|jpeg|png|gif)$/i,
            ".$1"
        );
        setFileName(cleanName);

        const reader = new FileReader();
        reader.onload = () => setImageSrc(reader.result);
        reader.readAsDataURL(firstFile);
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

            // Get current boxes from state to avoid stale closure
            setBoxes((currentBoxes) => {
                const updatedBoxes = currentBoxes.map((box) => {
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

                // Update preview map after boxes are processed
                setPreviewMap((old) => ({ ...old, ...newPreviewMap }));

                return updatedBoxes;
            });
        };
    }, [imageSrc, naturalSize.width, naturalSize.height]);

    // Trigger preview generation when boxes change
    useEffect(() => {
        if (boxes.length > 0) {
            generateLocalPreviews();
        }
    }, [boxes, generateLocalPreviews]);

    // Navigation handlers
    const handlePrevImage = useCallback(() => {
        if (currentFileIndex > 0) {
            const newIndex = currentFileIndex - 1;
            setCurrentFileIndex(newIndex);

            const prevFile = files[newIndex];
            setFile(prevFile);

            const cleanName = prevFile.name.replace(
                /\.(jpg|jpeg|png|gif)\.(jpg|jpeg|png|gif)$/i,
                ".$1"
            );
            setFileName(cleanName);

            // Clear previous state
            setBoxes([]);
            setPreviewMap({});
            setNaturalSize({ width: 0, height: 0 });
            setFilteredData([]);
            setHasUnsavedChanges(false);

            const reader = new FileReader();
            reader.onload = () => setImageSrc(reader.result);
            reader.readAsDataURL(prevFile);
        }
    }, [currentFileIndex, files]);

    const handleNextImage = useCallback(() => {
        if (currentFileIndex < files.length - 1) {
            const newIndex = currentFileIndex + 1;
            setCurrentFileIndex(newIndex);

            const nextFile = files[newIndex];
            setFile(nextFile);

            const cleanName = nextFile.name.replace(
                /\.(jpg|jpeg|png|gif)\.(jpg|jpeg|png|gif)$/i,
                ".$1"
            );
            setFileName(cleanName);

            // Clear previous state
            setBoxes([]);
            setPreviewMap({});
            setNaturalSize({ width: 0, height: 0 });
            setFilteredData([]);
            setHasUnsavedChanges(false);

            const reader = new FileReader();
            reader.onload = () => setImageSrc(reader.result);
            reader.readAsDataURL(nextFile);
        }
    }, [currentFileIndex, files]);

    const resetState = useCallback(() => {
        setFiles([]);
        setCurrentFileIndex(0);
        setFile(null);
        setFileName("");
        setImageSrc(null);
        setBoxes([]);
        setPreviewMap({});
        setNaturalSize({ width: 0, height: 0 });
        setFilteredData([]);
        setIsLoadingQuestions(false);
        setHasUnsavedChanges(false);
        // Clear modified questions tracking
        setModifiedQuestions(new Set());
        // Clear success message
        setUploadSuccess(null);

        const fileInput = document.querySelector('#file-input');
        if (fileInput) {
            fileInput.value = "";
        }
    }, []);

    // Handler for success modal actions
    const handleSelectMoreImages = useCallback(() => {
        // Clear current image but keep the success message briefly
        setFile(null);
        setFileName("");
        setImageSrc(null);
        setBoxes([]);
        setPreviewMap({});
        setNaturalSize({ width: 0, height: 0 });
        setFilteredData([]);
        setIsLoadingQuestions(false);
        setHasUnsavedChanges(false);
        setModifiedQuestions(new Set());

        // Small delay to show transition, then clear success and trigger file input
        setTimeout(() => {
            setUploadSuccess(null);
            const fileInput = document.querySelector('#file-input');
            if (fileInput) {
                fileInput.value = "";
                fileInput.click();
            }
        }, 300);
    }, []);

    const handleCloseSuccess = useCallback(() => {
        setUploadSuccess(null);
        resetState();
        // navigate("/");
    }, [resetState]);

    // NEW: Handler to continue working with the same image after successful upload
    const handleContinueWithSameImage = useCallback(async () => {
        setUploadSuccess(null);
        setIsLoadingQuestions(true);

        // Clear only the boxes and preview data, keep the image
        setBoxes([]);
        setPreviewMap({});
        setHasUnsavedChanges(false);
        setModifiedQuestions(new Set());

        // Refetch the updated questions from the backend
        if (fileName) {
            await fetchQuestions();
        }
    }, [fileName, fetchQuestions]);

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
                console.log("publicUrl", publicUrl);
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

            // UPDATE: Now we DO update question data with URLs for persistence
            // Create a mapping from filename to URL for easy lookup
            const filenameToUrlMap = {};
            crops.forEach(crop => {
                filenameToUrlMap[crop.name] = crop.url;
            });

            // Update filteredData with the actual Supabase URLs
            const updatedQuestionsData = filteredData.map(question => {
                if (!modifiedQuestions.has(question.id)) {
                    return question; // Don't modify unmodified questions
                }

                const updatedQuestion = { ...question };

                // Update question_image with Supabase URL if it exists
                if (updatedQuestion.question_image && filenameToUrlMap[updatedQuestion.question_image]) {
                    updatedQuestion.question_image = filenameToUrlMap[updatedQuestion.question_image];
                }

                // Update option_images with Supabase URLs if they exist
                if (updatedQuestion.option_images && Array.isArray(updatedQuestion.option_images)) {
                    updatedQuestion.option_images = updatedQuestion.option_images.map(optImg => {
                        return filenameToUrlMap[optImg] || optImg;
                    });
                }

                return updatedQuestion;
            });

            setFilteredData(updatedQuestionsData);

            // Update questions in the backend with new image URLs - ONLY MODIFIED QUESTIONS
            const questionsToUpdate = updatedQuestionsData.filter(q => modifiedQuestions.has(q.id));

            if (questionsToUpdate.length === 0) {
                console.log("No questions were modified, skipping backend updates");
                setHasUnsavedChanges(false);
                resetState();
                return;
            }

            console.log(`Updating ${questionsToUpdate.length} modified questions out of ${filteredData.length} total questions`);

            for (let i = 0; i < questionsToUpdate.length; i++) {
                const question = questionsToUpdate[i];
                setUploadProgress({ current: i + 1, total: questionsToUpdate.length });

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
                        // Transform options from objects to strings for backend compatibility
                        options: question.options?.map(opt =>
                            typeof opt === 'object' ? opt.text : opt
                        ) || [],
                        option_images: question.isOptionImage ? question.option_images : [],
                        section_name: question.section_name,
                        question_type: question.question_type,
                        topic: question.topic,
                        exam_name: question.exam_name,
                        subject: question.subject,
                        chapter: question.chapter,
                        answer: question.answer,
                    };
                    console.log("updated Data", updateData);
                    await axios.put(
                        getQuestionByIdUrl(question.id),
                        updateData,
                        {
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );
                } catch (error) {
                    alert(
                        `Failed to update question ${question.id}:`,
                        error.response?.data || error.message
                    );
                }
            }

            // Clear the modified questions set after successful upload
            setModifiedQuestions(new Set());
            setHasUnsavedChanges(false);

            // Show success message instead of automatic reset
            setUploadSuccess({
                questionsUpdated: questionsToUpdate.length,
                totalQuestions: filteredData.length,
                cropsUploaded: crops.length
            });

        } catch (error) {
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    }, [file, filteredData, boxes, imageSrc, naturalSize, resetState, modifiedQuestions]);

    // Handler to toggle isQuestionImage/isOptionImage
    const handleToggleImageType = useCallback((questionId, type, value) => {
        setFilteredData((prev) =>
            prev.map((q) => (q.id === questionId ? { ...q, [type]: value } : q))
        );
        setHasUnsavedChanges(true);
        // Track that this question has been modified
        setModifiedQuestions((prev) => new Set([...prev, questionId]));
    }, []);

    // Handler to update question data
    const handleUpdateQuestion = useCallback((questionId, updates) => {
        setFilteredData((prev) =>
            prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
        );
        // Track that this question has been modified
        setModifiedQuestions((prev) => new Set([...prev, questionId]));
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
                        q.id === question.id ? { ...q, question_image: name } : q
                    );
            }
        } else if (type === "option" && optionIndex !== null) {
            if (question.option_images && question.option_images[optionIndex]) {
                name = question.option_images[optionIndex];
            } else {
                name = `${question.question_number}_option${optionIndex + 1
                    }_${fileName}`;
                updatedFilteredData = (prevQ) =>
                    prevQ.map((q) => {
                        if (q.id === question.id) {
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
            questionId: question.id,
            optionIndex: type === "option" ? optionIndex : null,
            type, // 'question' or 'option'
        };

        // Batch all state updates together
        if (updatedFilteredData) {
            setFilteredData(updatedFilteredData);
        }
        setBoxes((prev) => [...prev, newBox]);
        setHasUnsavedChanges(true);
        // Track that this question has been modified
        setModifiedQuestions((prev) => new Set([...prev, question.id]));

        // Force re-render for existing question images by updating filtered data timestamp
        if (type === "question" && question.question_image) {
            // For existing question images, force a minimal state update to trigger re-render
            setFilteredData((prev) =>
                prev.map((q) =>
                    q.id === question.id
                        ? { ...q, _lastBoxUpdate: Date.now() }
                        : q
                )
            );
        }

        // Trigger preview generation immediately after adding the box
        setTimeout(() => {
            generateLocalPreviews();
        }, 50);
    }, [fileName, isUploading, generateLocalPreviews]);

    // Handler to delete boxes - OPTIMIZED
    const handleDeleteBox = useCallback((boxId, questionId = null, type = null, optionIndex = null) => {
        // Prevent multiple rapid clicks
        if (isUploading) return;

        if (boxId) {
            // Delete specific box by ID
            setBoxes((prev) => prev.filter((b) => b.id !== boxId));
            // Find the question ID from the box being deleted
            const boxToDelete = boxes.find(b => b.id === boxId);
            if (boxToDelete) {
                setModifiedQuestions((prev) => new Set([...prev, boxToDelete.questionId]));
            }
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
            setModifiedQuestions((prev) => new Set([...prev, questionId]));
        }
        setHasUnsavedChanges(true);
    }, [isUploading, boxes]);

    // NEW: Background upload function
    const handleBackgroundUpload = useCallback(async (uploadFileName, uploadBoxes, uploadFilteredData, uploadModifiedQuestions, uploadImageSrc, uploadNaturalSize) => {
        const uploadId = Date.now();
        
        // Add to background uploads
        setBackgroundUploads(prev => [...prev, {
            id: uploadId,
            fileName: uploadFileName,
            status: 'uploading',
            progress: 0,
            total: uploadFilteredData.filter(q => uploadModifiedQuestions.has(q.id)).length
        }]);

        try {
            const rect = imageRef.current.getBoundingClientRect();
            const displayW = rect.width;
            const displayH = rect.height;
            const scaleX = uploadNaturalSize.width / displayW;
            const scaleY = uploadNaturalSize.height / displayH;

            const boxCoordinates = uploadBoxes.map((b, index) => ({
                name: b.name,
                left: Math.round(b.x * scaleX),
                top: Math.round(b.y * scaleY),
                right: Math.round((b.x + b.width) * scaleX),
                bottom: Math.round((b.y + b.height) * scaleY),
                index,
            }));

            // Create a canvas to crop the images
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.src = uploadImageSrc;

            // Wait for the image to load
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // Upload each cropped image
            const crops = [];
            for (const box of boxCoordinates) {
                canvas.width = box.right - box.left;
                canvas.height = box.bottom - box.top;

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

                const blob = await new Promise((resolve) =>
                    canvas.toBlob(resolve, "image/jpeg")
                );

                const croppedFile = new File([blob], `${box.name}`, {
                    type: "image/jpeg",
                });

                const { error } = await supabase.storage
                    .from("images")
                    .upload(`${box.name}`, croppedFile, {
                        cacheControl: "3600",
                        upsert: true,
                    });

                if (error) {
                    continue;
                }

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

            // Create a mapping from filename to URL for easy lookup
            const filenameToUrlMap = {};
            crops.forEach(crop => {
                filenameToUrlMap[crop.name] = crop.url;
            });

            // Update filteredData with the actual Supabase URLs
            const updatedQuestionsData = uploadFilteredData.map(question => {
                if (!uploadModifiedQuestions.has(question.id)) {
                    return question;
                }

                const updatedQuestion = { ...question };

                if (updatedQuestion.question_image && filenameToUrlMap[updatedQuestion.question_image]) {
                    updatedQuestion.question_image = filenameToUrlMap[updatedQuestion.question_image];
                }

                if (updatedQuestion.option_images && Array.isArray(updatedQuestion.option_images)) {
                    updatedQuestion.option_images = updatedQuestion.option_images.map(optImg => {
                        return filenameToUrlMap[optImg] || optImg;
                    });
                }

                return updatedQuestion;
            });

            // Update questions in the backend - ONLY MODIFIED QUESTIONS
            const questionsToUpdate = updatedQuestionsData.filter(q => uploadModifiedQuestions.has(q.id));

            if (questionsToUpdate.length === 0) {
                // Mark as completed
                setBackgroundUploads(prev => prev.filter(u => u.id !== uploadId));
                setCompletedUploads(prev => [...prev, {
                    id: uploadId,
                    fileName: uploadFileName,
                    questionsUpdated: 0,
                    cropsUploaded: crops.length
                }]);
                return;
            }

            for (let i = 0; i < questionsToUpdate.length; i++) {
                const question = questionsToUpdate[i];
                
                // Update progress
                setBackgroundUploads(prev => prev.map(u => 
                    u.id === uploadId 
                        ? { ...u, progress: i + 1 }
                        : u
                ));

                try {
                    const updateData = {
                        question_number: question.question_number,
                        file_name: question.file_name,
                        question_text: question.question_text,
                        isQuestionImage: question.isQuestionImage,
                        question_image: question.isQuestionImage
                            ? question.question_image
                            : null,
                        isOptionImage: question.isOptionImage,
                        options: question.options?.map(opt =>
                            typeof opt === 'object' ? opt.text : opt
                        ) || [],
                        option_images: question.isOptionImage ? question.option_images : [],
                        section_name: question.section_name,
                        question_type: question.question_type,
                        topic: question.topic,
                        exam_name: question.exam_name,
                        subject: question.subject,
                        chapter: question.chapter,
                        answer: question.answer,
                    };
                    
                    await axios.put(
                        getQuestionByIdUrl(question.id),
                        updateData,
                        {
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );
                } catch (error) {
                    console.error(`Failed to update question ${question.id}:`, error.response?.data || error.message);
                }
            }

            // Mark as completed
            setBackgroundUploads(prev => prev.filter(u => u.id !== uploadId));
            setCompletedUploads(prev => [...prev, {
                id: uploadId,
                fileName: uploadFileName,
                questionsUpdated: questionsToUpdate.length,
                cropsUploaded: crops.length
            }]);

        } catch (error) {
            console.error(`Background upload failed for ${uploadFileName}:`, error.message);
            // Mark as failed
            setBackgroundUploads(prev => prev.map(u => 
                u.id === uploadId 
                    ? { ...u, status: 'failed' }
                    : u
            ));
        }
    }, []);

    // NEW: Save and Next handler
    const handleSaveAndNext = useCallback(() => {
        if (!file) {
            // If no file, just move to next image
            handleNextImage();
            return;
        }

        // Check if there are any modifications to upload
        const hasModifications = modifiedQuestions.size > 0;
        
        if (!hasModifications) {
            // No modifications to save, just move to next image
            handleNextImage();
            return;
        }

        // Start background upload with current state (NO AWAIT - runs in background)
        handleBackgroundUpload(
            fileName,
            [...boxes], // Copy current boxes (can be empty array)
            [...filteredData], // Copy current filtered data
            new Set([...modifiedQuestions]), // Copy modified questions set
            imageSrc,
            { ...naturalSize }
        );

        // Immediately move to next image (doesn't wait for upload)
        handleNextImage();
    }, [file, boxes, fileName, filteredData, modifiedQuestions, imageSrc, naturalSize, handleBackgroundUpload, handleNextImage]);

    return (
        <>
            <div className="min-h-screen bg-gray-100">
                {/* Background Upload Progress Indicator - Top Left */}
                {(backgroundUploads.length > 0 || completedUploads.length > 0) && (
                    <div className="fixed top-4 left-4 z-50 space-y-2">
                        {/* Header with Clear All button for completed uploads */}
                        {completedUploads.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-2 flex items-center justify-between">
                                <span className="text-xs text-gray-600 font-medium">
                                    Upload Status ({backgroundUploads.length + completedUploads.length})
                                </span>
                                <button
                                    onClick={() => setCompletedUploads([])}
                                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                        
                        {/* Active uploads */}
                        {backgroundUploads.map((upload) => (
                            <div key={upload.id} className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-3 min-w-64">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium text-gray-700">
                                        📤 Uploading: {upload.fileName}
                                    </div>
                                    {upload.status === 'failed' && (
                                        <div className="text-red-500 text-xs">❌ Failed</div>
                                    )}
                                </div>
                                {upload.status !== 'failed' && (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(upload.progress / upload.total) * 100}%` }}
                                        ></div>
                                    </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                    {upload.status === 'failed' 
                                        ? 'Upload failed'
                                        : `${upload.progress}/${upload.total} questions`
                                    }
                                </div>
                            </div>
                        ))}
                        
                        {/* Completed uploads */}
                        {completedUploads.map((completed) => (
                            <div key={completed.id} className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-3 min-w-64">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium text-gray-700">
                                        ✅ Completed: {completed.fileName}
                                    </div>
                                    <button
                                        onClick={() => setCompletedUploads(prev => prev.filter(c => c.id !== completed.id))}
                                        className="text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {completed.questionsUpdated} questions, {completed.cropsUploaded} images
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
                <div className="">
                    {!imageSrc ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="text-8xl mb-4">📷</div>
                                <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                                    No Image Selected
                                </h2>
                                <p className="text-gray-500 mb-4">
                                    Choose one or more image files from the navbar to start cropping and
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
                                    modifiedQuestions={modifiedQuestions}
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

                <div className="flex justify-between py-4 px-4">
                    <button
                        onClick={handlePrevImage}
                        disabled={currentFileIndex === 0}
                        className={`px-4 py-2 rounded-lg ${currentFileIndex === 0
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                    >
                        ← Previous Image
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-gray-600">
                            Image {currentFileIndex + 1} of {files.length}
                        </div>
                        
                        {/* Save and Next Button */}
                        {files.length > 1 && currentFileIndex < files.length - 1 && (
                            <button
                                onClick={handleSaveAndNext}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
                                disabled={isUploading}
                            >
                                💾➡️ Save & Next
                                {hasUnsavedChanges && (
                                    <span className="text-xs bg-yellow-400 text-gray-800 px-2 py-0.5 rounded-full">
                                        •
                                    </span>
                                )}
                            </button>
                        )}
                        
                        {/* Save Button for Last Image */}
                        {files.length > 1 && currentFileIndex === files.length - 1 && (
                            <button
                                onClick={handleUpload}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        💾 Save
                                        {hasUnsavedChanges && (
                                            <span className="text-xs bg-yellow-400 text-gray-800 px-2 py-0.5 rounded-full">
                                                •
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        )}
                        <button
                        onClick={handleNextImage}
                        disabled={currentFileIndex === files.length - 1}
                        className={`px-4 py-2 rounded-lg ${currentFileIndex === files.length - 1
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                    >
                        Next Image →
                    </button>
                    </div>
                    
                </div>
            </div>

            {/* Progress Modal */}
            <ProgressModal isUploading={isUploading} uploadProgress={uploadProgress} />

            {/* Success Modal */}
            {uploadSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
                            <div className="text-center">
                                <div className="text-4xl mb-2">🎉</div>
                                <h2 className="text-2xl font-bold">Upload Successful!</h2>
                                <p className="text-green-100 mt-1">Your questions have been updated</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-green-700 font-medium">Questions Updated:</span>
                                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                            {uploadSuccess.questionsUpdated}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-2">
                                        <span className="text-green-700 font-medium">Images Uploaded:</span>
                                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                            {uploadSuccess.cropsUploaded}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-2">
                                        <span className="text-green-700 font-medium">Total Questions:</span>
                                        <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                            {uploadSuccess.totalQuestions}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-center text-gray-600 text-sm">
                                    {uploadSuccess.questionsUpdated === uploadSuccess.totalQuestions
                                        ? "All questions were updated successfully!"
                                        : uploadSuccess.questionsUpdated === 0
                                            ? "No questions needed updating - all were already up to date!"
                                            : `Only ${uploadSuccess.questionsUpdated} out of ${uploadSuccess.totalQuestions} questions were updated (optimization: only modified questions are updated).`
                                    }
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="text-xs text-blue-700 font-medium mb-1">💡 What&apos;s next?</div>
                                    <div className="text-xs text-blue-600">
                                        • <strong>Continue with Same Image:</strong> Reload the updated questions to see your changes<br />
                                        • <strong>Select More Images:</strong> Work on different images<br />
                                        • <strong>Done:</strong> Close and start fresh
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-gray-50 px-6 py-4 flex gap-3">
                            <button
                                onClick={handleContinueWithSameImage}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                🔄 Continue with Same Image
                            </button>
                            <button
                                onClick={handleSelectMoreImages}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                📁 Select More Images
                            </button>
                            <button
                                onClick={handleCloseSuccess}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                ✅ Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageMultipleRegions;
