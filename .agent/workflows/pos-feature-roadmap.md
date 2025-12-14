---
description: Complete POS feature roadmap and implementation guide
---

# Complete POS Feature Roadmap

**Status:** Feature planning document  
**Created:** 2025-12-14  
**Project:** maharshin-pos

---

## Current Features (Already Implemented)

| Module           | Features                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| **Sales**        | Create, view, edit sales with items, payment status, credit tracking   |
| **Purchases**    | Record purchases from suppliers                                        |
| **Sale Returns** | Process customer returns                                               |
| **Customers**    | CRUD, credit limits, credit ledger, payment tracking, export CSV/Excel |
| **Suppliers**    | CRUD for suppliers                                                     |
| **Products**     | CRUD with categories, pricing, tax rates                               |
| **Inventory**    | Branch stocks, stock movements, low stock alerts                       |
| **Branches**     | Multi-branch support                                                   |
| **Reports**      | Sales report, Low stock report                                         |
| **Users/Roles**  | User management with role-based permissions                            |
| **Settings**     | Basic settings management                                              |

---

## HIGH PRIORITY Features

### 1. Receipt/Invoice Printing

**Why:** Essential for customer transactions - thermal printer support

**Implementation:**

- Create print-friendly invoice template
- Support thermal receipt format (58mm/80mm)
- Add print button to Sale show page

**Files to create/modify:**

- `resources/js/pages/Sale/print.tsx` - Print template
- `resources/js/pages/Sale/show.tsx` - Add print button
- `app/Http/Controllers/SaleController.php` - Print route

---

### 2. Purchase Returns

**Why:** You have sale returns but not purchase returns to suppliers

**Database:**

```php
// purchase_returns table
Schema::create('purchase_returns', function (Blueprint $table) {
    $table->id();
    $table->string('return_no', 50)->unique();
    $table->foreignId('purchase_id')->constrained();
    $table->foreignId('branch_id')->constrained();
    $table->foreignId('supplier_id')->nullable()->constrained();
    $table->date('return_date');
    $table->decimal('total_amount', 15, 2);
    $table->decimal('refund_amount', 15, 2)->default(0);
    $table->string('refund_method', 50)->nullable();
    $table->text('reason')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->timestamps();
    $table->softDeletes();
});

// purchase_return_items table
Schema::create('purchase_return_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('purchase_return_id')->constrained();
    $table->foreignId('purchase_item_id')->constrained();
    $table->foreignId('product_id')->constrained();
    $table->integer('quantity');
    $table->decimal('unit_cost', 15, 2);
    $table->decimal('subtotal', 15, 2);
    $table->timestamps();
});
```

**Files to create:**

- `app/Models/PurchaseReturn.php`
- `app/Models/PurchaseReturnItem.php`
- `app/Http/Controllers/PurchaseReturnController.php`
- `resources/js/pages/PurchaseReturn/index.tsx`
- `resources/js/pages/PurchaseReturn/create.tsx`
- `resources/js/pages/PurchaseReturn/show.tsx`

---

### 3. Supplier Credit Ledger

**Why:** Track what you owe suppliers (mirror of customer credit ledger)

**Database:**

```php
Schema::create('supplier_credit_ledgers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('supplier_id')->constrained();
    $table->foreignId('branch_id')->constrained();
    $table->date('transaction_date');
    $table->string('transaction_type', 50); // purchase, payment, refund
    $table->nullableMorphs('reference');
    $table->string('reference_no', 50)->nullable();
    $table->decimal('debit', 15, 2)->default(0);   // We pay (our balance decreases)
    $table->decimal('credit', 15, 2)->default(0);  // We owe (our balance increases)
    $table->decimal('balance', 15, 2)->default(0); // Running balance we owe
    $table->text('description')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->timestamps();
    $table->softDeletes();
});
```

**Add to Supplier model:**

```php
protected $fillable = [
    // ... existing
    'credit_limit',
    'current_balance',
];
```

**Files to create/modify:**

- `app/Models/SupplierCreditLedger.php`
- `app/Http/Controllers/SupplierController.php` - Show ledger
- `resources/js/pages/Supplier/show.tsx` - Display ledger
- Update `PurchaseController.php` to record ledger entries

---

### 4. Supplier Payments

**Why:** Record payments made to suppliers

**Database:**

```php
Schema::create('supplier_payments', function (Blueprint $table) {
    $table->id();
    $table->string('payment_no', 50)->unique();
    $table->foreignId('supplier_id')->constrained();
    $table->foreignId('branch_id')->constrained();
    $table->date('payment_date');
    $table->decimal('amount', 15, 2);
    $table->string('payment_method', 50);
    $table->text('notes')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->timestamps();
    $table->softDeletes();
});
```

**Files to create:**

- `app/Models/SupplierPayment.php`
- `app/Http/Controllers/SupplierPaymentController.php`
- `resources/js/pages/SupplierPayment/index.tsx`
- `resources/js/pages/SupplierPayment/create.tsx`

---

### 5. Cash Register / Daily Closing

**Why:** Track cash in drawer, daily reconciliation

**Database:**

```php
Schema::create('cash_registers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('branch_id')->constrained();
    $table->foreignId('user_id')->constrained();
    $table->date('register_date');
    $table->decimal('opening_balance', 15, 2)->default(0);
    $table->decimal('cash_sales', 15, 2)->default(0);
    $table->decimal('cash_received', 15, 2)->default(0);
    $table->decimal('cash_expenses', 15, 2)->default(0);
    $table->decimal('expected_balance', 15, 2)->default(0);
    $table->decimal('actual_balance', 15, 2)->nullable();
    $table->decimal('difference', 15, 2)->nullable();
    $table->enum('status', ['open', 'closed'])->default('open');
    $table->timestamp('closed_at')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

**Files to create:**

- `app/Models/CashRegister.php`
- `app/Http/Controllers/CashRegisterController.php`
- `resources/js/pages/CashRegister/index.tsx`
- `resources/js/pages/CashRegister/open.tsx`
- `resources/js/pages/CashRegister/close.tsx`

---

### 6. Barcode Scanning

**Why:** Quick product lookup during sales

**Implementation:**

- Add barcode field focus on sale create page
- Listen for barcode scanner input (rapid keystrokes)
- Auto-add product when barcode detected

**Files to modify:**

- `resources/js/pages/Sale/create.tsx` - Add barcode listener
- `resources/js/pages/Purchase/create.tsx` - Add barcode listener

---

### 7. Expense Tracking

**Why:** Record business expenses (rent, utilities, salaries, etc.)

**Database:**

```php
Schema::create('expense_categories', function (Blueprint $table) {
    $table->id();
    $table->string('name', 100);
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

Schema::create('expenses', function (Blueprint $table) {
    $table->id();
    $table->string('expense_no', 50)->unique();
    $table->foreignId('expense_category_id')->constrained();
    $table->foreignId('branch_id')->constrained();
    $table->date('expense_date');
    $table->decimal('amount', 15, 2);
    $table->string('payment_method', 50);
    $table->text('description')->nullable();
    $table->string('receipt_image')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->timestamps();
    $table->softDeletes();
});
```

**Files to create:**

- `app/Models/ExpenseCategory.php`
- `app/Models/Expense.php`
- `app/Http/Controllers/ExpenseController.php`
- `resources/js/pages/Expense/index.tsx`
- `resources/js/pages/Expense/create.tsx`

---

## MEDIUM PRIORITY Features

### 8. Stock Transfer

**Why:** Move stock between branches

**Database:**

```php
Schema::create('stock_transfers', function (Blueprint $table) {
    $table->id();
    $table->string('transfer_no', 50)->unique();
    $table->foreignId('from_branch_id')->constrained('branches');
    $table->foreignId('to_branch_id')->constrained('branches');
    $table->date('transfer_date');
    $table->enum('status', ['pending', 'in_transit', 'received', 'cancelled'])->default('pending');
    $table->text('notes')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->foreignId('received_by')->nullable()->constrained('users');
    $table->timestamp('received_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

Schema::create('stock_transfer_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('stock_transfer_id')->constrained();
    $table->foreignId('product_id')->constrained();
    $table->integer('quantity');
    $table->integer('received_quantity')->nullable();
    $table->timestamps();
});
```

---

### 9. Stock Adjustment

**Why:** Manual corrections (damaged goods, count discrepancies)

**Database:**

```php
Schema::create('stock_adjustments', function (Blueprint $table) {
    $table->id();
    $table->string('adjustment_no', 50)->unique();
    $table->foreignId('branch_id')->constrained();
    $table->foreignId('product_id')->constrained();
    $table->date('adjustment_date');
    $table->enum('adjustment_type', ['add', 'subtract']);
    $table->integer('quantity');
    $table->integer('quantity_before');
    $table->integer('quantity_after');
    $table->string('reason', 100); // damaged, expired, count_error, theft, other
    $table->text('notes')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->timestamps();
});
```

---

### 10. Profit/Loss Report

**Why:** See actual profit margins

**Implementation:**

- Calculate: Revenue - COGS - Expenses = Net Profit
- Filter by date range, branch
- Show breakdown by category/product

**Files to create:**

- `resources/js/pages/Report/ProfitLossReport.tsx`
- Add method in `ReportController.php`

---

### 11. Inventory Valuation Report

**Why:** Total stock value at cost price

**Implementation:**

- Sum of (quantity × cost_price) for all products
- Group by branch, category
- Support FIFO/LIFO/Average cost methods

---

### 12. Customer Statement

**Why:** Print customer account statement

**Implementation:**

- Add print button to customer credit ledger
- Show opening balance, transactions, closing balance
- Date range filter

---

### 13. Purchase Report

**Why:** Summary of purchases by period/supplier

**Implementation:**

- Similar to sales report
- Filter by date, supplier, branch
- Show totals, averages

---

### 14. Discounts

**Why:** Per-item discounts, promo codes

**Database additions:**

```php
// Add to sale_items
$table->decimal('discount_percent', 5, 2)->default(0);
$table->decimal('discount_amount', 15, 2)->default(0);

// Promo codes table
Schema::create('promo_codes', function (Blueprint $table) {
    $table->id();
    $table->string('code', 50)->unique();
    $table->enum('discount_type', ['percent', 'fixed']);
    $table->decimal('discount_value', 15, 2);
    $table->decimal('min_order_amount', 15, 2)->nullable();
    $table->integer('usage_limit')->nullable();
    $table->integer('used_count')->default(0);
    $table->date('valid_from');
    $table->date('valid_until');
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

---

### 15. Tax Configuration

**Why:** Multiple tax rates, tax reports

**Database:**

```php
Schema::create('tax_rates', function (Blueprint $table) {
    $table->id();
    $table->string('name', 50);
    $table->decimal('rate', 5, 2);
    $table->boolean('is_default')->default(false);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

---

## NICE TO HAVE Features

### 16. Quotations/Estimates

**Why:** Generate quotes before converting to sales

**Database:** Similar to sales table with `status` field (draft, sent, accepted, converted)

---

### 17. Product Variants

**Why:** Size, color variations

**Database:**

```php
Schema::create('product_variants', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained();
    $table->string('sku', 50)->unique();
    $table->string('name', 100); // e.g., "Red - Large"
    $table->decimal('price_adjustment', 15, 2)->default(0);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

---

### 18. Product Bundles/Kits

**Why:** Sell multiple items as one

**Database:**

```php
Schema::create('product_bundles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('bundle_product_id')->constrained('products');
    $table->foreignId('component_product_id')->constrained('products');
    $table->integer('quantity');
    $table->timestamps();
});
```

---

### 19. Audit Log

**Why:** Track who changed what

**Implementation:**

- Use Spatie Activity Log (already installed based on migrations)
- Enable logging on all models

---

### 20. Backup Export

**Why:** Full database export for backup

**Implementation:**

- Export all data to JSON/Excel
- Scheduled backups

---

### 21. Dashboard Widgets

**Why:** Top selling products, sales trends

**Implementation:**

- Top 10 selling products
- Sales by category pie chart
- Weekly/monthly trends
- Pending payments widget
- Low stock count (already have)

---

## Implementation Priority Order

### Phase 1 (Essential)

1. Receipt/Invoice Printing
2. Purchase Returns
3. Supplier Credit Ledger + Payments
4. Expense Tracking

### Phase 2 (Operations)

5. Stock Transfer
6. Stock Adjustment
7. Cash Register / Daily Closing
8. Barcode Scanning

### Phase 3 (Reports & Analytics)

9. Profit/Loss Report
10. Inventory Valuation Report
11. Customer Statement
12. Purchase Report

### Phase 4 (Advanced)

13. Discounts & Promo Codes
14. Tax Configuration
15. Quotations
16. Dashboard Widgets

### Phase 5 (Optional)

17. Product Variants
18. Product Bundles
19. Audit Log
20. Backup Export
21. Reserved Quantity (see /reserved-quantity workflow)

---

## Notes

- Each feature should follow existing patterns in the codebase
- Use Laravel resource controllers
- Use Inertia.js with React for frontend
- Follow existing TypeScript types pattern
- Add proper validation with Form Requests
- Record stock movements for inventory changes
- Record credit ledger entries for financial transactions
