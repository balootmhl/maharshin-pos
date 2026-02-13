<?php

namespace App\Models;

use App\Models\Scopes\BranchScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends BaseModel
{
    use HasFactory, SoftDeletes;

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
        'purchase_no',
        'branch_id',
        'supplier_id',
        'purchase_date',
        'subtotal',
        'tax_amount',
        'total_amount',
        'payment_status',
        'paid_amount',
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
        'supplier_id' => 'integer',
        'purchase_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'created_by' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function scopePurchaseDateStart($query, $date)
    {
        return $query->whereDate('purchase_date', '>=', $date);
    }

    public function scopePurchaseDateEnd($query, $date)
    {
        return $query->whereDate('purchase_date', '<=', $date);
    }

    public function scopeTotalAmountMin($query, $amount)
    {
        return $query->where('total_amount', '>=', $amount);
    }

    public function scopeTotalAmountMax($query, $amount)
    {
        return $query->where('total_amount', '<=', $amount);
    }
}
