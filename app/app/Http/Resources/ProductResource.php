<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'unique_key' => $this->unique_key,
            'product_title' => $this->product_title,
            'product_description' => $this->product_description,
            'style_number' => $this->style_number,
            'mainframe_color' => $this->mainframe_color,
            'size' => $this->size,
            'color_name' => $this->color_name,
            'piece_price' => $this->piece_price ? number_format($this->piece_price, 2) : null,
            'updated_by_upload_id' => $this->updated_by_upload_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Relationships
            'updated_by_upload' => $this->whenLoaded('updatedByUpload', function () {
                return [
                    'id' => $this->updatedByUpload->id,
                    'original_name' => $this->updatedByUpload->original_name,
                    'filename' => $this->updatedByUpload->filename,
                    'status' => $this->updatedByUpload->status,
                    'processed_at' => $this->updatedByUpload->processed_at,
                    'user' => $this->whenLoaded('updatedByUpload.user', function () {
                        return [
                            'id' => $this->updatedByUpload->user->id,
                            'name' => $this->updatedByUpload->user->name,
                        ];
                    }),
                ];
            }),
        ];
    }
}
