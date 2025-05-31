import PropTypes from "prop-types";

const ProgressModal = ({ isUploading, uploadProgress }) => {
  if (!isUploading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Animated Upload Icon */}
          <div className="mb-6">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-4 flex items-center justify-center">
                <span className="text-blue-600 text-xl">📤</span>
              </div>
            </div>
          </div>
          
          {/* Progress Text */}
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Uploading Questions...
          </h3>
          <p className="text-gray-600 mb-6">
            Updating {uploadProgress.current} of {uploadProgress.total}{" "}
            questions
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{
                width:
                  uploadProgress.total > 0
                    ? `${
                        (uploadProgress.current / uploadProgress.total) *
                        100
                      }%`
                    : "0%",
              }}
            ></div>
          </div>
          
          {/* Progress Percentage */}
          <div className="text-sm text-gray-500">
            {uploadProgress.total > 0
              ? Math.round(
                  (uploadProgress.current / uploadProgress.total) * 100
                )
              : 0}
            % Complete
          </div>
          
          {/* Progress Details */}
          <div className="mt-4 text-xs text-gray-400">
            Please wait while we save your changes...
          </div>
        </div>
      </div>
    </div>
  );
};

ProgressModal.propTypes = {
  isUploading: PropTypes.bool.isRequired,
  uploadProgress: PropTypes.shape({
    current: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

export default ProgressModal; 