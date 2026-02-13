<?php

namespace App\Models;

use App\Models\Scopes\BranchScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;

class BranchStock extends BaseModel
{
    use HasFactory;

    protected static function booted(): void
    {
        static::addGlobalScope(new BranchScope);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'product_id',
        'branch_id',
        'group_id',
        'quantity',
        'cost_price',
        'selling_price',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'id' => 'integer',
        'product_id' => 'integer',
        'branch_id' => 'integer',
        'group_id' => 'integer',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'updated_at' => 'timestamp',
    ];

    /**
     * Activity log options
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['quantity'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => "Branch stock {$eventName}")
            ->useLogName('stock');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function scopeLowStock($query, $isLowStock = true)
    {
        if ($isLowStock) {
            return $query->whereHas('product', function ($q) {
                $q->whereColumn('branch_stocks.quantity', '<=', 'products.low_stock_alert');
            });
        }

        return $query;
    }
}
