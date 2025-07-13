<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class FileUploadCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection->transform(function ($upload) {
                return [
                    'id' => $upload->id,
                    'filename' => $upload->filename,
                    'original_name' => $upload->original_name,
                    'file_path' => $upload->file_path,
                    'file_hash' => $upload->file_hash,
                    'status' => $upload->status,
                    'processed_at' => $upload->processed_at,
                    'error_message' => $upload->error_message,
                    'created_at' => $upload->created_at,
                    'updated_at' => $upload->updated_at,
                    'products_count' => $upload->products_count ?? 0,
                ];
            }),
        ];
    }

    /**
     * Get additional data that should be returned with the resource array.
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [];
    }
}
