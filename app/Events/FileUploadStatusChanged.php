<?php

namespace App\Events;

use App\Models\FileUpload;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FileUploadStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $fileUpload;
    public $additionalData;

    /**
     * Create a new event instance.
     */
    public function __construct(FileUpload $fileUpload, array $additionalData = [])
    {
        // Load relationships
        $this->fileUpload = $fileUpload->load(['user']);
        $this->additionalData = $additionalData;
        
        Log::info('FileUploadStatusChanged event created', [
            'upload_id' => $fileUpload->id,
            'status' => $fileUpload->status,
            'additional_data' => $additionalData
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('file-uploads'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'file-upload.status-changed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        // Calculate products count dynamically
        $productsCount = $this->fileUpload->products()->count();
        
        $data = [
            'upload' => [
                'id' => $this->fileUpload->id,
                'filename' => $this->fileUpload->filename,
                'original_name' => $this->fileUpload->original_name,
                'status' => $this->fileUpload->status,
                'error_message' => $this->fileUpload->error_message,
                'processed_at' => $this->fileUpload->processed_at,
                'created_at' => $this->fileUpload->created_at,
                'updated_at' => $this->fileUpload->updated_at,
                'products_count' => $productsCount,
                'user' => $this->fileUpload->user ? [
                    'id' => $this->fileUpload->user->id,
                    'name' => $this->fileUpload->user->name,
                ] : null,
            ],
            'progress' => $this->additionalData['progress'] ?? null,
            'message' => $this->additionalData['message'] ?? null,
            'timestamp' => now()->toISOString(),
        ];
        
        Log::info('Broadcasting file upload status change', [
            'upload_id' => $this->fileUpload->id,
            'status' => $this->fileUpload->status,
            'products_count' => $productsCount,
            'broadcast_data' => $data
        ]);
        
        return $data;
    }
}