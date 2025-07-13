<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ProductCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'current_page' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->currentPage()
            ),
            'first_page_url' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->url(1)
            ),
            'from' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->firstItem()
            ),
            'last_page' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->lastPage()
            ),
            'last_page_url' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->url($this->resource->lastPage())
            ),
            'links' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->linkCollection()->toArray()
            ),
            'next_page_url' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->nextPageUrl()
            ),
            'path' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->path()
            ),
            'per_page' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->perPage()
            ),
            'prev_page_url' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->previousPageUrl()
            ),
            'to' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->lastItem()
            ),
            'total' => $this->when($this->resource instanceof \Illuminate\Pagination\LengthAwarePaginator, 
                fn() => $this->resource->total()
            ),
        ];
    }

    /**
     * Create a new resource instance.
     */
    public function __construct($resource)
    {
        // Transform each item using ProductResource
        parent::__construct($resource);
    }

    /**
     * Get additional data that should be returned with the resource array.
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'total_products' => $this->total(),
            ],
        ];
    }
}
