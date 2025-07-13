<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'unique_key',
        'product_title',
        'product_description',
        'style_number',
        'mainframe_color',
        'size',
        'color_name',
        'piece_price',
        'updated_by_upload_id',
    ];

    public function fileUpload(): BelongsTo
    {
        return $this->belongsTo(FileUpload::class, 'updated_by_upload_id');
    }
}
