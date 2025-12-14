<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;

class StockAdjustment extends BaseModel
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'adjustment_no',
        'branch_id',
        'product_id',
        'adjustment_date',
        'adjustment_type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'reason',
        'notes',
        'created_by',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'id' => 'integer',
        'branch_id' => 'integer',
        'product_id' => 'integer',
        'adjustment_date' => 'date',
        'created_by' => 'integer',
    ];

    /**
     * Adjustment reason options
     */
    public const REASONS = [
        'damaged' => 'Damaged Goods',
        'expired' => 'Expired Products',
        'count_error' => 'Count Error/Correction',
        'theft' => 'Theft/Loss',
        'found' => 'Found Stock',
        'initial' => 'Initial Stock Count',
        'other' => 'Other',
    ];

    /**
     * Activity log options
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => "Stock adjustment {$eventName}: {$this->adjustment_no}")
            ->useLogName('stock');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the reason label
     */
    public function getReasonLabelAttribute(): string
    {
        return self::REASONS[$this->reason] ?? $this->reason;
    }
}
