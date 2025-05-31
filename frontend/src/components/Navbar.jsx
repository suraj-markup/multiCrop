import PropTypes from "prop-types";

const Navbar = ({ 
  fileName, 
  imageSrc, 
  hasUnsavedChanges, 
  isUploading, 
  onFileChange, 
  onUpload, 
  onReset,
  file
}) => {
  return (
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
                  onChange={onFileChange} 
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
                  onClick={onUpload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
                  disabled={!file || isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      ⬆️ Upload Boxes
                      {hasUnsavedChanges && (
                        <span className="text-xs bg-yellow-400 text-gray-800 px-2 py-0.5 rounded-full">
                          Unsaved changes
                        </span>
                      )}
                    </>
                  )}
                </button>
                <button
                  onClick={onReset}
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
  );
};

Navbar.propTypes = {
  fileName: PropTypes.string,
  imageSrc: PropTypes.string,
  hasUnsavedChanges: PropTypes.bool.isRequired,
  isUploading: PropTypes.bool.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  file: PropTypes.object,
};

export default Navbar; 