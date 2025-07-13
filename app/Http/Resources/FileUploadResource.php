<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FileUploadResource extends JsonResource
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
            'filename' => $this->filename,
            'original_name' => $this->original_name,
            'file_path' => $this->file_path,
            'file_hash' => $this->file_hash,
            'status' => $this->status,
            'processed_at' => $this->processed_at,
            'error_message' => $this->error_message,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Relationships
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
            
            'products_count' => $this->when(isset($this->products_count), $this->products_count),
            
            'products' => $this->whenLoaded('products', function () {
                return $this->products->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'unique_key' => $product->unique_key,
                        'product_title' => $product->product_title,
                        'style_number' => $product->style_number,
                        'piece_price' => $product->piece_price,
                    ];
                });
            }),
        ];
    }
}
