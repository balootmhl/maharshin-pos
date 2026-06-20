<?php

namespace App\Models;

use App\Models\Scopes\BranchScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerPayment extends BaseModel
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
        'payment_no',
        'customer_id',
        'branch_id',
        'payment_date',
        'amount',
        'payment_method',
        'reference_no',
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
        'customer_id' => 'integer',
        'branch_id' => 'integer',
        'payment_date' => 'date',
        'amount' => 'decimal:2',
        'created_by' => 'integer',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopePaymentDateStart($query, $date)
    {
        return $query->whereDate('payment_date', '>=', $date);
    }

    public function scopePaymentDateEnd($query, $date)
    {
        return $query->whereDate('payment_date', '<=', $date);
    }

    public function scopeAmountMin($query, $amount)
    {
        return $query->where('amount', '>=', $amount);
    }

    public function scopeAmountMax($query, $amount)
    {
        return $query->where('amount', '<=', $amount);
    }
}
