import PropTypes from "prop-types";
import QuestionCard from "./QuestionCard";

const QuestionsPreview = ({ 
  isLoadingQuestions, 
  filteredData, 
  fileName, 
  boxes,
  previewMap,
  onToggleImageType,
  onAddBox,
  onDeleteBox,
  onUpdateQuestion,
  setHasUnsavedChanges
}) => {
  return (
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              🔍 Fetching Questions
            </h3>
            <p className="text-gray-500 mb-4">
              Searching for questions related to{" "}
              <span className="font-medium text-blue-600">{fileName}</span>
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      ) : filteredData && filteredData.length > 0 ? (
        <div className="space-y-6">
          {filteredData.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              boxes={boxes}
              previewMap={previewMap}
              fileName={fileName}
              onToggleImageType={onToggleImageType}
              onAddBox={onAddBox}
              onDeleteBox={onDeleteBox}
              onUpdateQuestion={onUpdateQuestion}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Questions Found
          </h3>
          <p className="text-gray-500">
            No questions available for this image. Please select a different
            image or check your data.
          </p>
        </div>
      )}
    </div>
  );
};

QuestionsPreview.propTypes = {
  isLoadingQuestions: PropTypes.bool.isRequired,
  filteredData: PropTypes.array.isRequired,
  fileName: PropTypes.string.isRequired,
  boxes: PropTypes.array.isRequired,
  previewMap: PropTypes.object.isRequired,
  onToggleImageType: PropTypes.func.isRequired,
  onAddBox: PropTypes.func.isRequired,
  onDeleteBox: PropTypes.func.isRequired,
  onUpdateQuestion: PropTypes.func.isRequired,
  setHasUnsavedChanges: PropTypes.func.isRequired,
};

export default QuestionsPreview; 