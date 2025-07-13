<?php

namespace App\Jobs;

use App\Models\FileUpload;
use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Events\FileUploadStatusChanged;

class ProcessFileUploadJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $fileUpload;
    protected $filePath;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The maximum number of unhandled exceptions to allow before failing.
     */
    public $maxExceptions = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(FileUpload $fileUpload, string $filePath)
    {
        $this->fileUpload = $fileUpload;
        $this->filePath = $filePath;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Starting file processing job', [
                'upload_id' => $this->fileUpload->id,
                'current_status' => $this->fileUpload->status,
                'original_name' => $this->fileUpload->original_name,
                'path' => $this->filePath
            ]);
            
            // Refresh the model to get the latest data
            $this->fileUpload->refresh();
            
            $this->updateStatusAndBroadcast('processing', [
                'message' => 'File processing started'
            ]);
            
            // Generate and store file hash for tracking purposes only
            $this->storeFileHash();
            
            // Add a small delay to ensure the processing status is visible
            sleep(2);
            
            $this->processFile();
            
            $this->updateStatusAndBroadcast('completed', [
                'message' => 'File processing completed successfully'
            ]);
            
            Log::info('File processing job completed successfully', [
                'upload_id' => $this->fileUpload->id
            ]);
            
        } catch (\Exception $e) {
            Log::error('File processing job failed', [
                'upload_id' => $this->fileUpload->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Update status to failed and broadcast
            $this->updateStatusAndBroadcast('failed', [
                'message' => 'File processing failed: ' . $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * Store file hash for tracking purposes (no duplication check)
     */
    private function storeFileHash(): void
    {
        try {
            $fileHash = $this->getFileHash();
            
            // Update current upload with file hash for tracking only
            $this->fileUpload->update(['file_hash' => $fileHash]);
            
            Log::info('File hash stored for tracking', [
                'upload_id' => $this->fileUpload->id,
                'file_hash' => $fileHash
            ]);
            
        } catch (\Exception $e) {
            Log::warning('Could not generate file hash, continuing without it', [
                'upload_id' => $this->fileUpload->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get the full file path
     */
    private function getFullFilePath(): string
    {
        // Use the file_path from the database record
        $filePath = $this->fileUpload->file_path ?? $this->filePath;
        
        Log::info('Getting full file path', [
            'upload_id' => $this->fileUpload->id,
            'db_file_path' => $this->fileUpload->file_path,
            'job_file_path' => $this->filePath,
            'using_path' => $filePath
        ]);
        
        $fullPath = Storage::disk('local')->path($filePath);
        
        if (!file_exists($fullPath)) {
            // Try alternative path construction
            $alternativePath = storage_path('app' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $filePath));
            if (file_exists($alternativePath)) {
                $fullPath = $alternativePath;
                Log::info('Using alternative path', ['alternative_path' => $alternativePath]);
            } else {
                Log::error('File not found at any path', [
                    'primary_path' => $fullPath,
                    'alternative_path' => $alternativePath,
                    'file_path' => $filePath
                ]);
                throw new \Exception("File does not exist at path: {$fullPath}");
            }
        }
        
        Log::info('File found', ['full_path' => $fullPath]);
        return $fullPath;
    }

    /**
     * Generate a hash of the file content for tracking purposes
     */
    private function getFileHash(): string
    {
        $fullPath = $this->getFullFilePath();
        
        if (!is_readable($fullPath)) {
            throw new \Exception("File is not readable at path: {$fullPath}");
        }
        
        $hash = hash_file('sha256', $fullPath);
        
        Log::info('Generated file hash', [
            'upload_id' => $this->fileUpload->id,
            'file_path' => $fullPath,
            'hash' => $hash
        ]);
        
        return $hash;
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('File processing job permanently failed', [
            'upload_id' => $this->fileUpload->id,
            'error' => $exception->getMessage(),
        ]);
        
        $this->updateStatusAndBroadcast('failed', [
            'message' => 'Job failed after maximum retries'
        ]);
    }

    /**
     * Update status and broadcast change with improved reliability
     */
    private function updateStatusAndBroadcast(string $status, array $additionalData = []): void
    {
        $oldStatus = $this->fileUpload->status;
        
        Log::info('Updating status and broadcasting', [
            'upload_id' => $this->fileUpload->id,
            'old_status' => $oldStatus,
            'new_status' => $status,
            'additional_data' => $additionalData
        ]);
        
        // Update the status in the database first
        $this->fileUpload->update([
            'status' => $status,
            'updated_at' => now()
        ]);
        
        // Refresh the model to ensure we have the latest data
        $this->fileUpload->refresh();
        
        Log::info('Status updated in database', [
            'upload_id' => $this->fileUpload->id,
            'current_db_status' => $this->fileUpload->status,
            'requested_status' => $status
        ]);
        
        // Create and broadcast the event
        try {
            $event = new FileUploadStatusChanged($this->fileUpload, $additionalData);
            
            Log::info('Creating broadcast event', [
                'upload_id' => $this->fileUpload->id,
                'event_class' => get_class($event),
                'upload_status' => $this->fileUpload->status
            ]);
            
            // Broadcast without .toOthers() to ensure it reaches all listeners
            broadcast($event);
            
            Log::info('Broadcast event sent successfully', [
                'upload_id' => $this->fileUpload->id,
                'status_change' => $oldStatus . ' → ' . $status,
                'event_class' => get_class($event)
            ]);
            
            // Add a delay to ensure broadcast is processed
            sleep(1);
            
        } catch (\Exception $e) {
            Log::error('Broadcast failed', [
                'upload_id' => $this->fileUpload->id,
                'status_change' => $oldStatus . ' → ' . $status,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Process the uploaded file with idempotent product upsert operations
     */
    private function processFile(): void
    {
        $fullPath = $this->getFullFilePath();
        Log::info('Processing file', ['full_path' => $fullPath]);
        
        if (!is_readable($fullPath)) {
            throw new \Exception("File is not readable at path: {$fullPath}");
        }
        
        if (($handle = fopen($fullPath, "r")) !== FALSE) {
            $header = fgetcsv($handle);
            if (!$header) {
                throw new \Exception("Could not read header row from CSV file");
            }
            
            $cleanedHeader = [];
            foreach ($header as $col) {
                $cleaned = $this->cleanCellValue($col);
                $cleaned = $this->normalizeFieldName($cleaned);
                $cleanedHeader[] = $cleaned;
            }
            
            Log::info('CSV header processed', [
                'original_header' => $header,
                'cleaned_header' => $cleanedHeader
            ]);
            
            $productsCount = 0;
            $updatedCount = 0;
            $createdCount = 0;
            $skippedCount = 0;
            $duplicateInFileCount = 0;
            $rowNumber = 1;
            $totalRows = 0;
            
            // First pass to count total rows (for progress calculation)
            $currentPosition = ftell($handle);
            while (fgetcsv($handle) !== FALSE) {
                $totalRows++;
            }
            fseek($handle, $currentPosition); // Reset to start of data
            
            Log::info('Total rows to process', ['total_rows' => $totalRows]);
            
            // Track processed unique keys to avoid duplicates within the same file
            $processedUniqueKeys = [];
            
            while (($data = fgetcsv($handle)) !== FALSE) {
                $rowNumber++;
                
                if (count($data) >= count($cleanedHeader)) {
                    $cleanedData = [];
                    foreach ($data as $cellValue) {
                        $cleanedData[] = $this->cleanCellValue($cellValue);
                    }
                    
                    $row = array_combine($cleanedHeader, $cleanedData);
                    
                    if ($row === false || empty($row['unique_key']) || trim($row['unique_key']) === '') {
                        $skippedCount++;
                        continue;
                    }
                    
                    $uniqueKey = trim($row['unique_key']);
                    
                    // Skip if we've already processed this unique key in this file
                    if (in_array($uniqueKey, $processedUniqueKeys)) {
                        $duplicateInFileCount++;
                        continue;
                    }
                    
                    $processedUniqueKeys[] = $uniqueKey;
                    
                    try {
                        // Prepare data for upsert
                        $productData = [
                            'product_title' => $row['product_title'] ?? null,
                            'product_description' => $row['product_description'] ?? null,
                            'style_number' => $row['style_number'] ?? null,
                            'mainframe_color' => $row['sanmar_mainframe_color'] ?? null,
                            'size' => $row['size'] ?? null,
                            'color_name' => $row['color_name'] ?? null,
                            'piece_price' => $row['piece_price'] ?? null,
                            'updated_by_upload_id' => $this->fileUpload->id,
                            'updated_at' => now(),
                        ];
                        
                        // Check if product exists based on unique_key
                        $existingProduct = Product::where('unique_key', $uniqueKey)->first();
                        
                        if ($existingProduct) {
                            // Product exists - check if data has changed
                            $hasChanges = false;
                            $changedFields = [];
                            
                            foreach ($productData as $field => $value) {
                                if ($field === 'updated_at' || $field === 'updated_by_upload_id') {
                                    continue; // Always update these fields
                                }
                                if ($existingProduct->$field != $value) {
                                    $hasChanges = true;
                                    $changedFields[$field] = [
                                        'old' => $existingProduct->$field,
                                        'new' => $value
                                    ];
                                }
                            }
                            
                            if ($hasChanges) {
                                // Update existing product with changes
                                $existingProduct->update($productData);
                                $updatedCount++;
                                
                                Log::debug('Updated existing product', [
                                    'unique_key' => $uniqueKey,
                                    'product_id' => $existingProduct->id,
                                    'changed_fields' => $changedFields
                                ]);
                            } else {
                                // No data changes, but still update the upload tracking
                                $existingProduct->update([
                                    'updated_by_upload_id' => $this->fileUpload->id,
                                    'updated_at' => now()
                                ]);
                            }
                        } else {
                            // Create new product
                            $productData['unique_key'] = $uniqueKey;
                            $productData['created_at'] = now();
                            
                            Product::create($productData);
                            $createdCount++;
                            
                            Log::debug('Created new product', [
                                'unique_key' => $uniqueKey,
                                'product_data' => $productData
                            ]);
                        }
                        
                        $productsCount++;
                        
                    } catch (\Exception $productError) {
                        Log::error('Failed to create/update product', [
                            'row_number' => $rowNumber,
                            'unique_key' => $uniqueKey,
                            'error' => $productError->getMessage(),
                            'product_data' => $productData ?? null
                        ]);
                        $skippedCount++;
                    }
                }
            }
            
            fclose($handle);
            
            Log::info('File processing completed', [
                'upload_id' => $this->fileUpload->id,
                'total_rows_processed' => $productsCount,
                'products_created' => $createdCount,
                'products_updated' => $updatedCount,
                'rows_skipped' => $skippedCount,
                'duplicate_in_file' => $duplicateInFileCount,
                'total_data_rows' => $rowNumber - 1
            ]);
            
            // Update processed_at timestamp
            $this->fileUpload->update(['processed_at' => now()]);
            
            // Final progress update with detailed summary
            $this->updateStatusAndBroadcast('processing', [
                'progress' => 100,
                'message' => "Processing complete. Created: {$createdCount}, Updated: {$updatedCount}, Skipped: {$skippedCount}"
            ]);
            
        } else {
            throw new \Exception("Could not open file for reading: {$fullPath}");
        }
    }

    /**
     * Clean cell value by removing BOM, HTML entities, and normalizing whitespace
     */
    private function cleanCellValue($value)
    {
        if ($value === null) return null;
        
        $value = (string) $value;
        $value = preg_replace('/^\xEF\xBB\xBF/', '', $value);
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML401, 'UTF-8');
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
        $value = trim($value);
        
        return $value === '' ? null : $value;
    }
    
    /**
     * Normalize field names to match database columns
     */
    private function normalizeFieldName($fieldName)
    {
        $normalized = strtolower(trim($fieldName));
        $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized);
        $normalized = trim($normalized, '_');
        
        $fieldMapping = [
            'unique_key' => 'unique_key',
            'product_title' => 'product_title',
            'product_description' => 'product_description',
            'style' => 'style_number',
            'style_number' => 'style_number',
            'sanmar_mainframe_color' => 'sanmar_mainframe_color',
            'mainframe_color' => 'sanmar_mainframe_color',
            'size' => 'size',
            'color_name' => 'color_name',
            'piece_price' => 'piece_price',
        ];
        
        return $fieldMapping[$normalized] ?? $normalized;
    }
}