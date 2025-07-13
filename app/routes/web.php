<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FileUploadController;
use App\Http\Controllers\ProductController;
use App\Models\FileUpload;
use App\Models\Product;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirect root to file manager
Route::get('/', function () {
    return redirect()->route('file-manager');
});

// File Manager route
Route::get('/file-manager', [FileUploadController::class, 'fileManager'])
    ->middleware(['auth', 'verified'])
    ->name('file-manager');

// File upload routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/file-uploads', [FileUploadController::class, 'store'])->name('file-uploads.store');
    Route::get('/file-uploads', [FileUploadController::class, 'index'])->name('file-uploads.index');
    Route::get('/file-uploads/{fileUpload}', [FileUploadController::class, 'show'])->name('file-uploads.show');
    Route::delete('/file-uploads/{fileUpload}', [FileUploadController::class, 'destroy'])->name('file-uploads.destroy');
});

// Products routes - Use ProductController
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';