<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleItem extends BaseModel
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name',
        'product_code',
        'unit',
        'quantity',
        'unit_price',
        'cost_price',
        'tax_rate',
        'tax_amount',
        'subtotal',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'id' => 'integer',
        'sale_id' => 'integer',
        'product_id' => 'integer',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    /**
     * Get the item profit.
     */
    public function getProfitAttribute(): float
    {
        return (float) (($this->unit_price - $this->cost_price) * $this->quantity);
    }

    /**
     * Get the item profit per unit.
     */
    public function getProfitPerUnitAttribute(): float
    {
        return (float) ($this->unit_price - $this->cost_price);
    }

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

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function saleReturnItems(): HasMany
    {
        return $this->hasMany(SaleReturnItem::class);
    }
}
