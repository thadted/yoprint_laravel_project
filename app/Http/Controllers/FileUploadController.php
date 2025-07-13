<?php

namespace App\Http\Controllers;

use App\Models\FileUpload;
use App\Http\Resources\FileUploadResource;
use App\Http\Resources\FileUploadCollection;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class FileUploadController extends Controller
{
    protected FileUploadService $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    public function store(Request $request)
    {
        // Validate through service
        $this->fileUploadService->validateUploadRequest($request);

        try {
            // Upload file through service
            $fileUpload = $this->fileUploadService->uploadFile(
                $request->file('file'),
                auth()->id()
            );
            
            return redirect()->back()->with('success', 'File uploaded successfully and is being processed!');
            
        } catch (\Exception $e) {
            Log::error('File upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Upload failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Get uploads for the authenticated user
     */
    public function index()
    {
        // Get uploads through service
        $uploads = $this->fileUploadService->getUserUploads(auth()->id());
            
        return new FileUploadCollection($uploads);
    }
    
    /**
     * Show a specific upload
     */
    public function show(FileUpload $fileUpload)
    {
        // Check ownership through service
        if (!$this->fileUploadService->userOwnsUpload($fileUpload, auth()->id())) {
            abort(403);
        }
        
        // Get upload with relationships through service
        $uploadWithRelations = $this->fileUploadService->getUploadWithRelations($fileUpload);
        
        return new FileUploadResource($uploadWithRelations);
    }
    
    /**
     * Delete an upload
     */
    public function destroy(FileUpload $fileUpload)
    {
        // Check ownership through service
        if (!$this->fileUploadService->userOwnsUpload($fileUpload, auth()->id())) {
            abort(403);
        }
        
        try {
            // Delete through service
            $this->fileUploadService->deleteUpload($fileUpload);
            
            return redirect()->back()->with('success', 'Upload deleted successfully!');
            
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete upload: ' . $e->getMessage());
        }
    }
    
    /**
     * File manager page
     */
    public function fileManager()
    {
        // Get all uploads with user and products count for file manager view
        $uploads = $this->fileUploadService->getAllUploadsForFileManager();
        
        return Inertia::render('SimpleFileManager', [
            'uploads' => $uploads
        ]);
    }
}