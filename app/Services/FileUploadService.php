<?php

namespace App\Services;

use App\Models\FileUpload;
use App\Jobs\ProcessFileUploadJob;
use App\Jobs\SetFileUploadProcessingJob;
use App\Events\FileUploadStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Bus;

class FileUploadService
{
    /**
     * Get uploads for a specific user
     */
    public function getUserUploads(int $userId): Collection
    {
        return FileUpload::where('user_id', $userId)
            ->withCount('products')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all uploads for file manager view (with user and products count)
     */
    public function getAllUploadsForFileManager(): Collection
    {
        return FileUpload::with('user')
            ->withCount('products')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get a single upload with relationships
     */
    public function getUploadWithRelations(FileUpload $fileUpload): FileUpload
    {
        return $fileUpload->load(['user', 'products']);
    }

    /**
     * Handle file upload and processing
     */
    public function uploadFile(UploadedFile $file, int $userId): FileUpload
    {
        $originalName = $file->getClientOriginalName();
        $filename = $this->generateUniqueFilename($file);
        
        Log::info('Starting file upload process', [
            'original_name' => $originalName,
            'filename' => $filename,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'user_id' => $userId
        ]);
        
        // Store the file
        $filePath = $file->storeAs('uploads', $filename, 'local');
        Log::info('File stored successfully', ['file_path' => $filePath]);
        
        // Create file upload record with 'pending' status
        $fileUpload = FileUpload::create([
            'user_id' => $userId,
            'filename' => $filename,
            'original_name' => $originalName,
            'file_path' => $filePath,
            'status' => 'pending',
        ]);
        
        Log::info('FileUpload record created', [
            'id' => $fileUpload->id,
            'file_path' => $fileUpload->file_path,
            'status' => $fileUpload->status
        ]);
        
        Bus::chain([
            new SetFileUploadProcessingJob($fileUpload->id),
            new ProcessFileUploadJob($fileUpload, $filePath),
        ])->dispatch();
        
        Log::info('SetFileUploadProcessingJob and ProcessFileUploadJob dispatched in chain', [
            'upload_id' => $fileUpload->id,
        ]);
        
        return $fileUpload;
    }

    /**
     * Delete a file upload and its associated file
     */
    public function deleteUpload(FileUpload $fileUpload): bool
    {
        try {
            // Delete the physical file
            if ($fileUpload->file_path && Storage::disk('local')->exists($fileUpload->file_path)) {
                Storage::disk('local')->delete($fileUpload->file_path);
                Log::info('Physical file deleted', ['file_path' => $fileUpload->file_path]);
            }
            
            // Delete the database record
            $fileUpload->delete();
            
            Log::info('FileUpload record deleted', ['id' => $fileUpload->id]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete upload', [
                'upload_id' => $fileUpload->id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * Check if user owns the upload
     */
    public function userOwnsUpload(FileUpload $fileUpload, int $userId): bool
    {
        return $fileUpload->user_id === $userId;
    }

    /**
     * Update status to processing and broadcast
     */
    private function updateStatusToProcessing(FileUpload $fileUpload): void
    {
        $fileUpload->update(['status' => 'processing']);
        
        broadcast(new FileUploadStatusChanged($fileUpload, [
            'message' => 'File upload completed, processing started'
        ]));
        
        Log::info('File processing job dispatched and status updated to processing', [
            'upload_id' => $fileUpload->id,
            'file_path' => $fileUpload->file_path
        ]);
    }

    /**
     * Generate a unique filename for the uploaded file
     */
    private function generateUniqueFilename(UploadedFile $file): string
    {
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $nameWithoutExtension = pathinfo($originalName, PATHINFO_FILENAME);
        
        return time() . '_' . Str::slug($nameWithoutExtension) . '.' . $extension;
    }

    /**
     * Validate file upload request
     */
    public function validateUploadRequest(Request $request): array
    {
        return $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls',
        ]);
    }
}
