<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturnItem extends BaseModel
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'sale_return_id',
        'sale_item_id',
        'product_id',
        'product_name',
        'product_code',
        'quantity',
        'unit_price',
        'cost_price',
        'subtotal',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'id' => 'integer',
        'sale_return_id' => 'integer',
        'sale_item_id' => 'integer',
        'product_id' => 'integer',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    /**
     * Get display product name (snapshot fallback to product).
     */
    public function getDisplayProductNameAttribute(): string
    {
        return $this->product_name ?: ($this->product?->name ?? 'Unknown Product');
    }

    /**
     * Get display product code (snapshot fallback to product).
     */
    public function getDisplayProductCodeAttribute(): string
    {
        return $this->product_code ?: ($this->product?->code ?? '');
    }

    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
