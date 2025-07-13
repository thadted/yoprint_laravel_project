<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    /**
     * Get products with search and sorting
     */
    public function getProducts(Request $request): LengthAwarePaginator
    {
        $query = Product::query();

        // Apply search filters
        $this->applySearchFilters($query, $request);

        // Apply sorting
        $this->applySorting($query, $request);

        // Return paginated results
        return $query->paginate(50)->withQueryString();
    }

    /**
     * Get a single product with relationships
     */
    public function getProductWithRelations(Product $product): Product
    {
        return $product->load(['updatedByUpload.user']);
    }

    /**
     * Apply search filters to the query
     */
    private function applySearchFilters(Builder $query, Request $request): void
    {
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('unique_key', 'like', "%{$search}%")
                  ->orWhere('product_title', 'like', "%{$search}%")
                  ->orWhere('product_description', 'like', "%{$search}%")
                  ->orWhere('style_number', 'like', "%{$search}%")
                  ->orWhere('color_name', 'like', "%{$search}%")
                  ->orWhere('mainframe_color', 'like', "%{$search}%")
                  ->orWhere('size', 'like', "%{$search}%");
            });
        }
    }

    /**
     * Apply sorting to the query
     */
    private function applySorting(Builder $query, Request $request): void
    {
        $sortField = $request->get('sort', 'updated_at');
        $sortDirection = $request->get('direction', 'desc');
        
        $allowedSortFields = [
            'unique_key',
            'product_title',
            'style_number',
            'piece_price',
            'created_at',
            'updated_at'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('updated_at', 'desc');
        }
    }

    /**
     * Get filter parameters for the frontend
     */
    public function getFilters(Request $request): array
    {
        return [
            'search' => $request->get('search', ''),
            'sort' => $request->get('sort', 'updated_at'),
            'direction' => $request->get('direction', 'desc'),
        ];
    }
}
