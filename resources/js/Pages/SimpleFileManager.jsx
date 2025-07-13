import { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import useWebSocket from '@/hooks/useWebSocket';

export default function SimpleFileManager({ uploads: initialUploads = [], flash = {} }) {
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploads, setUploads] = useState(initialUploads);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
    
    const { auth } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        file: null,
    });

    // Enhanced WebSocket message handler - same structure as main FileManager
    const handleWebSocketMessage = useCallback((message) => {
        
        if (message.event === 'file-upload.status-changed') {
            
            let uploadData;
            
            try {              
                // Parse the data if it's a string
                if (typeof message.data === 'string') {
                    uploadData = JSON.parse(message.data);
                } else {
                    uploadData = message.data;
                }
                
                if (uploadData && uploadData.upload) {
                    const updatedUpload = uploadData.upload;
                    
                    setUploads(prevUploads => {
                        const existingIndex = prevUploads.findIndex(upload => {
                            return parseInt(upload.id) === parseInt(updatedUpload.id);
                        });
                        
                        if (existingIndex !== -1) {
                            // Update existing upload
                            const newUploads = [...prevUploads];
                            const oldStatus = newUploads[existingIndex].status;
                            
                            newUploads[existingIndex] = {
                                ...newUploads[existingIndex],
                                ...updatedUpload
                            };
                            return newUploads;
                        } else {
                            return [updatedUpload, ...prevUploads];
                        }
                    });
                    
                    // Update last update time to trigger re-render
                    setLastUpdateTime(Date.now());
                }
            } catch (error) {
                console.error('Failed to parse WebSocket data:', error);
                console.error('Error message:', error.message);
            }
        }
    }, []);

    const { socket, connected } = useWebSocket(handleWebSocketMessage);

    // Update uploads when props change
    useEffect(() => {
        setUploads(initialUploads);
    }, [initialUploads]);

    // Log connection status
    useEffect(() => {
    }, [connected]);

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
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a CSV or Excel file');
            return;
        }

        setData('file', file);
    };

    // Submit file upload
    const submit = (e) => {
        e.preventDefault();
        setIsUploading(true);
        
        post(route('file-uploads.store'), {
            onProgress: (progress) => {
                setUploadProgress(progress.percentage || 0);
            },
            onSuccess: (page) => {
                setIsUploading(false);
                setUploadProgress(0);
                setData('file', null);
                // Reset file input
                const fileInput = document.getElementById('file-input');
                if (fileInput) fileInput.value = '';
                // Refresh uploads data
                refreshUploads();
            },
            onError: (errors) => {
                setIsUploading(false);
                setUploadProgress(0);
                console.error('Upload failed:', errors);
            }
        });
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    // Get status badge color with animation for processing
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    // Refresh uploads
    const refreshUploads = () => {
        router.reload({ only: ['uploads'] });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        File Manager
                    </h2>
                    <div className="flex items-center space-x-4">
                        {/* WebSocket Status */}
                        <div className="flex items-center space-x-2">
                            <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                            <span className="text-sm text-gray-600">
                                {connected ? 'Live Updates' : 'Disconnected'}
                            </span>
                        </div>
                        
                        {/* Last Update Indicator */}
                        <span className="text-xs text-gray-500">
                            Last: {new Date(lastUpdateTime).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="File Manager" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            {flash.error}
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Upload Product File
                            </h3>
                            
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
                                        id="file-input"
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
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
                                            CSV or Excel files (no size limit)
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
                                                onClick={() => {
                                                    setData('file', null);
                                                    document.getElementById('file-input').value = '';
                                                }}
                                                className="text-red-600 hover:text-red-800"
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
                                    {processing || isUploading ? 'Uploading...' : 'Upload File'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Upload History Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Upload History ({uploads.length})
                                </h3>
                                <div className="flex space-x-3">
                                    {/* Universal View Products Button */}
                                    <button
                                        onClick={() => router.get(route('products.index'))}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                                        </svg>
                                        View All Products
                                    </button>
                                    
                                    {/* Refresh Button */}
                                    <button
                                        onClick={refreshUploads}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <svg
                                            className="-ml-0.5 mr-2 h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            {uploads.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    File Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Upload Time
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {uploads.map((upload) => (
                                                <tr key={`upload-${upload.id}-${lastUpdateTime}`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        #{upload.id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <svg
                                                                className="h-5 w-5 text-gray-400 mr-3"
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
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {upload.original_name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {upload.filename}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(upload.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                                    upload.status
                                                                )}`}
                                                            >
                                                                {upload.status}
                                                            </span>
                                                            {upload.status === 'processing' && (
                                                                <svg className="animate-spin ml-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            {/* Only show error button for failed uploads */}
                                                            {upload.status === 'failed' && upload.error_message && (
                                                                <button
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title={upload.error_message}
                                                                    onClick={() => alert(upload.error_message)}
                                                                >
                                                                    View Error
                                                                </button>
                                                            )}
                                                            {/* Empty cell for other statuses to maintain table alignment */}
                                                            {(upload.status !== 'failed' || !upload.error_message) && (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No uploads found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Get started by uploading your first file.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
