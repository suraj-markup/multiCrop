import PropTypes from "prop-types";
import { useState } from "react";
import StatusSummary from "./StatusSummary";

// Helper function to clean malformed URLs
const cleanImageUrl = (url) => {
  if (!url) return null;

  const baseUrl = "https://jrekcngltfkghrgzgvju.supabase.co/storage/v1/object/public/images/";
  
  // Handle the specific pattern: baseUrl + baseUrl + filename
  if (url.includes(baseUrl + baseUrl)) {
    const cleaned = url.replace(baseUrl + baseUrl, baseUrl);
    return cleaned;
  }
  
  // Handle pattern: baseUrl + https://domain/path/filename  
  if (url.includes(baseUrl + "https://")) {
    const httpsIndex = url.indexOf("https://", baseUrl.length);
    const cleaned = url.substring(httpsIndex);
    return cleaned;
  }
  
  // Return original URL if no issues found
  return url;
};

const QuestionCard = ({ 
  question, 
  boxes, 
  previewMap, 
  fileName,
  onToggleImageType,
  onAddBox,
  onDeleteBox,
  onUpdateQuestion,
  setHasUnsavedChanges
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const questionBoxes = boxes.filter(
    (b) => b.questionId === question._id && b.type === "question"
  );
  
  const optionBoxes = boxes.filter(
    (b) => b.questionId === question._id && b.type === "option"
  );

  // Enhanced handler for adding boxes with loading state
  const handleAddBoxWithLoading = async (questionData, type, optionIndex = null) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onAddBox(questionData, type, optionIndex);
    } finally {
      // Small delay to prevent too rapid clicking
      setTimeout(() => setIsProcessing(false), 100);
    }
  };

  // Enhanced handler for deleting boxes with loading state
  const handleDeleteBoxWithLoading = async (boxId, questionId = null, type = null, optionIndex = null) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onDeleteBox(boxId, questionId, type, optionIndex);
    } finally {
      // Small delay to prevent too rapid clicking
      setTimeout(() => setIsProcessing(false), 100);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Question Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              Question {question.question_number}
            </h3>
            {isProcessing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Image Type Toggle Switches */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-black">
                📷 Question Image:
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={question.isQuestionImage}
                  onChange={(e) =>
                    onToggleImageType(
                      question._id,
                      "isQuestionImage",
                      e.target.checked
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-black">
                🖼️ Option Images:
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={question.isOptionImage}
                  onChange={(e) =>
                    onToggleImageType(
                      question._id,
                      "isOptionImage",
                      e.target.checked
                    )
                  }
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
          <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Question Text
          </h4>
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
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-all font-medium text-sm flex items-center gap-2"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleAddBoxWithLoading(question, "question");
                  }}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      ➕ Add Bounding Box
                    </>
                  )}
                </button>
                {questionBoxes.map((box) => (
                  <button
                    key={box.id}
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteBoxWithLoading(box.id);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-red-600 hover:text-white text-sm font-bold border border-red-300 transition-all"
                    title="Delete bounding box"
                  >
                    🗑️
                  </button>
                ))}
              </div>
            </div>

            {question.question_image ? (
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <img
                    src={
                      previewMap[question.question_image] ||
                      cleanImageUrl(question.question_image)
                    }
                    alt="Question"
                    className="max-w-full max-h-64 mx-auto rounded-lg border border-gray-200 shadow-sm"
                    onError={(e) => {
                      console.error("Failed to load question image:", question.question_image);
                      console.error("Cleaned URL:", cleanImageUrl(question.question_image));
                      // Hide broken image and show placeholder
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                    onLoad={(e) => {
                      // Hide placeholder when image loads successfully
                      e.target.nextElementSibling.style.display = 'none';
                    }}
                  />
                  <div 
                    className="w-full h-32 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-500 text-sm"
                    style={{ display: 'none' }}
                  >
                    ❌ Failed to load image
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-1">
                  Image: {cleanImageUrl(question.question_image)}
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
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onUpdateQuestion(question._id, {
                    option_images: [
                      ...(question.option_images || []),
                      "",
                    ],
                  });
                  setHasUnsavedChanges(true);
                }}
              >
                ➕ Add Option Image
              </button>
            </div>

            {/* Show existing text options as reference when no option images exist */}
            {(!question.option_images || question.option_images.length === 0) && 
             question.options && question.options.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="text-sm font-semibold text-blue-700 mb-2">
                  📝 Existing Text Options (for reference)
                </h5>
                <p className="text-xs text-blue-600 mb-3">
                  You can create option images for these text options, or toggle back to use text options only.
                </p>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">
                          {option?.text || option}
                        </span>
                      </div>
                      <button
                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          // Auto-create option image slot for this text option
                          const newOpts = [...(question.option_images || [])];
                          while (newOpts.length <= index) {
                            newOpts.push("");
                          }
                          newOpts[index] = `${question.question_number}_option${index + 1}_${fileName}`;
                          onUpdateQuestion(question._id, { option_images: newOpts });
                          setHasUnsavedChanges(true);
                        }}
                      >
                        Create Image Slot
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!question.option_images || question.option_images.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700 text-sm">
                  ℹ️ No option images yet. Click "Add Option Image" or "Create Image Slot" above to start.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {question.option_images.map((opt, idx) => {
                  const optionBoxesForThis = optionBoxes.filter(
                    (b) => b.optionIndex === idx
                  );
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(question.option_images || [])];
                            newOpts[idx] = e.target.value;
                            onUpdateQuestion(question._id, { option_images: newOpts });
                            setHasUnsavedChanges(true);
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder={`Option Image ${idx + 1} name`}
                        />
                        <button
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-all font-medium text-sm"
                          disabled={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleAddBoxWithLoading(question, "option", idx);
                          }}
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              Adding...
                            </>
                          ) : (
                            "📦 Add Box"
                          )}
                        </button>
                        {optionBoxesForThis.map((box) => (
                          <button
                            key={box.id}
                            disabled={isProcessing}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteBoxWithLoading(box.id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-red-600 hover:text-white text-sm font-bold border border-red-300 transition-all"
                            title="Delete bounding box"
                          >
                            🗑️
                          </button>
                        ))}
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white text-sm font-bold border border-red-300 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const newOpts = [...(question.option_images || [])];
                            newOpts.splice(idx, 1);
                            handleDeleteBoxWithLoading(null, question._id, "option", idx);
                            onUpdateQuestion(question._id, { option_images: newOpts });
                            setHasUnsavedChanges(true);
                          }}
                          title="Remove option image"
                        >
                          ❌
                        </button>
                      </div>

                      {opt && (previewMap[opt] || cleanImageUrl(opt)) && (
                        <div className="mt-3">
                          <img
                            src={previewMap[opt] || cleanImageUrl(opt)}
                            alt={`Option ${idx + 1}`}
                            className="max-w-full max-h-32 rounded-lg border border-gray-200 shadow-sm"
                            onError={() => {
                              console.error("Failed to load option image:", opt);
                              console.error("Cleaned URL:", cleanImageUrl(opt));
                            }}
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
                <h5 className="text-sm font-medium text-gray-600 mb-2">
                  Preview Grid
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  {question.option_images.map((opt, index) => {
                    const src = previewMap[opt] || cleanImageUrl(opt);
                    return (
                      <div
                        key={index}
                        className="border-2 border-gray-200 rounded-lg p-3 bg-white hover:border-blue-300 transition-colors"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={`Option ${index + 1}`}
                            className="w-full h-auto object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            No preview
                          </div>
                        )}
                        <p className="mt-2 text-center text-sm font-medium text-gray-700">
                          {index + 1}.{" "}
                          {question.options?.[index]?.text ||
                            question.options?.[index] ||
                            "Option text"}
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
        {!question.isOptionImage &&
          question.options &&
          question.options.length > 0 && (
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
                    <span className="text-gray-800">
                      {option?.text || option}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Status Summary */}
        <StatusSummary 
          question={question}
          questionBoxes={questionBoxes}
          optionBoxes={optionBoxes}
        />
      </div>
    </div>
  );
};

QuestionCard.propTypes = {
  question: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    question_number: PropTypes.number.isRequired,
    question_text: PropTypes.string.isRequired,
    isQuestionImage: PropTypes.bool.isRequired,
    isOptionImage: PropTypes.bool.isRequired,
    question_image: PropTypes.string,
    option_images: PropTypes.array,
    options: PropTypes.array,
  }).isRequired,
  boxes: PropTypes.array.isRequired,
  previewMap: PropTypes.object.isRequired,
  fileName: PropTypes.string.isRequired,
  onToggleImageType: PropTypes.func.isRequired,
  onAddBox: PropTypes.func.isRequired,
  onDeleteBox: PropTypes.func.isRequired,
  onUpdateQuestion: PropTypes.func.isRequired,
  setHasUnsavedChanges: PropTypes.func.isRequired,
};

export default QuestionCard; 