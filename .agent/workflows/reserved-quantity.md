---
description: Implement reserved quantity feature for stock management
---

# Reserved Quantity Feature

**Status:** Planned for future implementation  
**Discussed:** 2025-12-14

## Current Situation

The `BranchStock/index.tsx` displays a "Reserved" column, but:

- The `reserved_quantity` column does NOT exist in the database
- The `BranchStock` model doesn't have this field
- No logic exists to track reserved quantities

### Current Stock Flow

```
Sale Created → Stock Immediately Deducted → Done
```

Stock is deducted **immediately** when a sale is created. There's no concept of "pending orders" or "reserved stock".

## What Reserved Quantity Would Enable

- Track items in pending orders that haven't been fulfilled
- Prevent overselling (Available = Quantity - Reserved)
- Support order workflows: pending → completed/cancelled

### Proposed Flow with Reserved Quantity

```
Order Created (pending) → Reserved Qty increases (stock unchanged)
                        ↓
Order Completed → Reserved Qty decreases, Actual Qty decreases
        OR
Order Cancelled → Reserved Qty decreases (actual stock unchanged)
```

## Implementation Requirements

### 1. Database Changes

Add `reserved_quantity` column to `branch_stocks` table:

```php
Schema::table('branch_stocks', function (Blueprint $table) {
    $table->integer('reserved_quantity')->default(0)->after('quantity');
});
```

Update `BranchStock` model:

```php
protected $fillable = [
    'product_id',
    'branch_id',
    'quantity',
    'reserved_quantity',  // Add this
];
```

### 2. Add Order Status to Sales

Currently only has `payment_status`. Need to add `order_status`:

```php
// In sales migration or new migration
$table->string('order_status', 50)->default('completed')->index();
// Values: 'pending', 'completed', 'cancelled'
```

### 3. Update Sale Creation Logic

In `SaleController.php`, modify `store()` method:

```php
// If order is pending
if ($validated['order_status'] === 'pending') {
    $branchStock->increment('reserved_quantity', $item['quantity']);
    // Don't deduct actual quantity yet
} else {
    // Current behavior - immediately deduct
    $branchStock->decrement('quantity', $item['quantity']);
}
```

### 4. Add Order Completion Handler

New method in `SaleController.php`:

```php
public function complete(Sale $sale)
{
    DB::transaction(function () use ($sale) {
        foreach ($sale->saleItems as $item) {
            $branchStock = BranchStock::where([
                'branch_id' => $sale->branch_id,
                'product_id' => $item->product_id,
            ])->first();

            $branchStock->decrement('reserved_quantity', $item->quantity);
            $branchStock->decrement('quantity', $item->quantity);
        }

        $sale->update(['order_status' => 'completed']);
    });
}
```

### 5. Add Order Cancellation Handler

```php
public function cancel(Sale $sale)
{
    DB::transaction(function () use ($sale) {
        if ($sale->order_status === 'pending') {
            foreach ($sale->saleItems as $item) {
                $branchStock = BranchStock::where([
                    'branch_id' => $sale->branch_id,
                    'product_id' => $item->product_id,
                ])->first();

                $branchStock->decrement('reserved_quantity', $item->quantity);
            }
        }

        $sale->update(['order_status' => 'cancelled']);
    });
}
```

### 6. Update Frontend

- Add order status field to sale creation form
- Add "Complete Order" and "Cancel Order" buttons on pending orders
- Show available stock = quantity - reserved_quantity

## Files to Modify

- `database/migrations/2025_11_27_013408_create_branch_stocks_table.php` or new migration
- `database/migrations/2025_11_27_013413_create_sales_table.php` or new migration
- `app/Models/BranchStock.php`
- `app/Models/Sale.php`
- `app/Http/Controllers/SaleController.php`
- `resources/js/pages/Sale/create.tsx`
- `resources/js/pages/Sale/show.tsx`
- `resources/js/pages/BranchStock/index.tsx`
- `routes/web.php` (add complete/cancel routes)

## Alternative: Remove Reserved Column

If the business doesn't need pending orders, simply remove the Reserved column from the UI:

In `resources/js/pages/BranchStock/index.tsx`, remove lines 21, 92-96.

## Decision

**Defer implementation** - Will revisit when the business requires pending order functionality.
