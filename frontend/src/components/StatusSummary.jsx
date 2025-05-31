import PropTypes from "prop-types";

const StatusSummary = ({ question, questionBoxes, optionBoxes }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h5 className="text-sm font-semibold text-gray-600 mb-2">
        📊 Status Summary
      </h5>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              question.isQuestionImage
                ? "bg-green-500"
                : "bg-gray-300"
            }`}
          ></span>
          <span>
            Question Image:{" "}
            {question.isQuestionImage
              ? "Enabled"
              : "Disabled"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              question.isOptionImage
                ? "bg-green-500"
                : "bg-gray-300"
            }`}
          ></span>
          <span>
            Option Images:{" "}
            {question.isOptionImage
              ? "Enabled"
              : "Disabled"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              questionBoxes.length > 0
                ? "bg-blue-500"
                : "bg-gray-300"
            }`}
          ></span>
          <span>
            Question Boxes: {questionBoxes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              optionBoxes.length > 0
                ? "bg-purple-500"
                : "bg-gray-300"
            }`}
          ></span>
          <span>
            Option Boxes: {optionBoxes.length}
          </span>
        </div>
      </div>
    </div>
  );
};

StatusSummary.propTypes = {
  question: PropTypes.shape({
    isQuestionImage: PropTypes.bool.isRequired,
    isOptionImage: PropTypes.bool.isRequired,
  }).isRequired,
  questionBoxes: PropTypes.array.isRequired,
  optionBoxes: PropTypes.array.isRequired,
};

export default StatusSummary; 