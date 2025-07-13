import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function FileUploadComponent({ 
    onSuccess = () => {}, 
    onError = () => {}, 
    acceptedTypes = ['.csv', '.xlsx', '.xls'],
    mimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    uploadUrl = 'file-uploads.store',
    className = ''
}) {
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const { data, setData, post, processing, errors, progress } = useForm({
        file: null,
    });

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // Handle file input change
    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    // Process selected file
    const handleFile = (file) => {
        // Validate file type
        if (!mimeTypes.includes(file.type)) {
            const typeNames = acceptedTypes.join(', ');
            alert(`Please select a valid file type: ${typeNames}`);
            return;
        }

        setData('file', file);
    };

    // Submit file upload
    const submit = (e) => {
        e.preventDefault();
        setIsUploading(true);
        
        post(route(uploadUrl), {
            onProgress: (progress) => {
                setUploadProgress(progress.percentage || 0);
            },
            onSuccess: (page) => {
                setIsUploading(false);
                setUploadProgress(0);
                setData('file', null);
                // Reset file input
                const fileInput = document.getElementById('file-upload-input');
                if (fileInput) fileInput.value = '';
                onSuccess(page);
            },
            onError: (errors) => {
                setIsUploading(false);
                setUploadProgress(0);
                onError(errors);
            }
        });
    };

    // Remove selected file
    const removeFile = () => {
        setData('file', null);
        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <form onSubmit={submit} className="space-y-4">
                {/* Drag and Drop Area */}
                <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        id="file-upload-input"
                        type="file"
                        accept={acceptedTypes.join(',')}
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={processing || isUploading}
                    />
                    
                    <div className="space-y-2">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="text-gray-600">
                            <span className="font-medium text-blue-600 hover:text-blue-500">
                                Click to upload
                            </span>{' '}
                            or drag and drop
                        </div>
                        <p className="text-sm text-gray-500">
                            {acceptedTypes.join(', ').toUpperCase()} files only
                        </p>
                    </div>
                </div>

                {/* Selected File Display */}
                {data.file && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <svg
                                    className="h-8 w-8 text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {data.file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(data.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {errors.file && (
                    <div className="text-red-600 text-sm">
                        {errors.file}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!data.file || processing || isUploading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing || isUploading ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </div>
                    ) : (
                        'Upload File'
                    )}
                </button>
            </form>
        </div>
    );
}
