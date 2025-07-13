<?php

namespace App\Jobs;

use App\Models\FileUpload;
use App\Events\FileUploadStatusChanged;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SetFileUploadProcessingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $fileUploadId;

    public function __construct($fileUploadId)
    {
        $this->fileUploadId = $fileUploadId;
    }

    public function handle()
    {
        $fileUpload = FileUpload::find($this->fileUploadId);
        if ($fileUpload) {
            $fileUpload->update(['status' => 'processing']);
            broadcast(new FileUploadStatusChanged($fileUpload, [
                'message' => 'File processing started'
            ]));
        }
    }
}