<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductCollection;
use App\Services\ProductService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    protected ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Get products through service
        $products = $this->productService->getProducts($request);
        
        // Get filters for frontend
        $filters = $this->productService->getFilters($request);

        // Convert to array format that works with Inertia and React
        $productsData = $products->toArray();

        return Inertia::render('ProductsList', [
            'products' => $productsData,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        // Get product with relationships through service
        $productWithRelations = $this->productService->getProductWithRelations($product);
        
        return Inertia::render('ProductDetail', [
            'product' => new ProductResource($productWithRelations),
        ]);
    }
}
