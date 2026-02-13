<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleStoreRequest;
use App\Http\Requests\SaleUpdateRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerCreditLedger;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $sales = QueryBuilder::for(Sale::class)
            ->with(['branch', 'customer', 'createdBy', 'saleItems.product'])
            ->allowedFilters([
                'invoice_no',
                'payment_status',
                AllowedFilter::callback('customer.name', function ($query, $value) {
                    $query->whereHas('customer', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::scope('sale_date_start'),
                AllowedFilter::scope('sale_date_end'),
                AllowedFilter::scope('total_amount_min'),
                AllowedFilter::scope('total_amount_max'),
            ])
            ->allowedSorts(['invoice_no', 'sale_date', 'total_amount', 'created_at'])
            ->defaultSort('-created_at')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('Sale/index', [
            'sales' => $sales,
        ]);
    }

    public function create(Request $request): Response
    {
        // Generate invoice number - date-based format: INV-YYYYMMDD-XXXX
        $today = now()->format('Ymd');
        $prefix = "INV-{$today}-";
        $maxSeq = Sale::withoutGlobalScopes()
            ->where('invoice_no', 'like', $prefix . '%')
            ->selectRaw('MAX(CAST(SUBSTRING(invoice_no, -4) AS UNSIGNED)) as max_seq')
            ->value('max_seq');
        $nextSeq = ($maxSeq ?? 0) + 1;
        $invoiceNo = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

        $defaultBranch = Branch::where('is_active', true)->first();

        return Inertia::render('Sale/create', [
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'customers' => Customer::where('is_active', true)->get(['id', 'name', 'code', 'credit_limit', 'current_balance']),
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'invoiceNo' => $invoiceNo,
        ]);
    }

    public function store(SaleStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        /** @var Sale $sale */
        $sale = DB::transaction(function () use ($validated) {
            // Generate invoice number - date-based format: INV-YYYYMMDD-XXXX
            $today = now()->format('Ymd');
            $prefix = "INV-{$today}-";
            $maxSeq = Sale::withoutGlobalScopes()
                ->withTrashed()
                ->where('invoice_no', 'like', $prefix . '%')
                ->selectRaw('MAX(CAST(SUBSTRING(invoice_no, -4) AS UNSIGNED)) as max_seq')
                ->value('max_seq');
            $nextSeq = ($maxSeq ?? 0) + 1;
            $invoiceNo = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

            // Create the sale
            $sale = Sale::create([
                'invoice_no' => $invoiceNo,
                'branch_id' => $validated['branch_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'sale_date' => $validated['sale_date'],
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'],
                'discount_amount' => $validated['discount_amount'],
                'total_amount' => $validated['total_amount'],
                'payment_status' => $validated['payment_status'],
                'payment_method' => $validated['payment_method'] ?? null,
                'paid_amount' => $validated['paid_amount'],
                'credit_amount' => $validated['credit_amount'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Create sale items and update stock
            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'],
                    'tax_amount' => $item['tax_amount'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Update branch stock
                $branchStock = BranchStock::withoutGlobalScopes()->firstOrCreate(
                    ['branch_id' => $validated['branch_id'], 'product_id' => $item['product_id']],
                    ['quantity' => 0]
                );

                $oldQuantity = $branchStock->quantity;
                $branchStock->decrement('quantity', $item['quantity']);

                // Record stock movement
                StockMovement::create([
                    'branch_id' => $validated['branch_id'],
                    'product_id' => $item['product_id'],
                    'movement_type' => 'sale',
                    'quantity' => -$item['quantity'],
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => $branchStock->fresh()->quantity,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'notes' => "Sale: {$sale->invoice_no}",
                    'created_by' => Auth::id(),
                ]);
            }

            // Update customer balance if credit sale
            if ($validated['customer_id'] && $validated['credit_amount'] > 0) {
                $customer = Customer::find($validated['customer_id']);
                $customer->increment('current_balance', $validated['credit_amount']);

                // Record credit ledger entry
                CustomerCreditLedger::create([
                    'customer_id' => $validated['customer_id'],
                    'branch_id' => $validated['branch_id'],
                    'transaction_date' => $validated['sale_date'],
                    'transaction_type' => 'credit',
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'reference_no' => $sale->invoice_no,
                    'debit' => $validated['credit_amount'],
                    'credit' => 0,
                    'balance' => $customer->fresh()->current_balance,
                    'description' => "Credit sale: {$sale->invoice_no}",
                    'created_by' => Auth::id(),
                ]);
            }

            return $sale;
        });

        // Load customer for the success dialog
        $sale->load('customer:id,name');

        return redirect()->route('sales.create')->with('completedSale', [
            'id' => $sale->id,
            'invoice_no' => $sale->invoice_no,
            'total_amount' => $sale->total_amount,
            'paid_amount' => $sale->paid_amount,
            'credit_amount' => $sale->credit_amount,
            'payment_status' => $sale->payment_status,
            'customer' => $sale->customer ? [
                'id' => $sale->customer->id,
                'name' => $sale->customer->name,
            ] : null,
        ])->with('success', 'Sale created successfully.');
    }

    public function show(Request $request, Sale $sale): Response
    {
        $sale->load(['branch', 'customer', 'saleItems.product', 'createdBy']);

        return Inertia::render('Sale/show', [
            'sale' => $sale,
        ]);
    }

    public function edit(Request $request, Sale $sale): Response|RedirectResponse
    {
        if ($sale->created_at->diffInDays(now()) > 3) {
            return redirect()->route('sales.index')->with('error', 'Sale cannot be edited after 3 days.');
        }

        $sale->load(['saleItems.product.branch_stocks', 'customer', 'branch']);

        return Inertia::render('Sale/edit', [
            'sale' => $sale,
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'customers' => Customer::where('is_active', true)->get(['id', 'name', 'code', 'credit_limit', 'current_balance']),
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function update(SaleUpdateRequest $request, Sale $sale): RedirectResponse
    {
        if ($sale->created_at->diffInDays(now()) > 3) {
            return redirect()->route('sales.index')->with('error', 'Sale cannot be edited after 3 days.');
        }

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $sale) {
            // 1. REVERSAL PHASE
            // Restore stock for original items
            foreach ($sale->saleItems as $item) {
                // Restore branch stock
                $branchStock = BranchStock::withoutGlobalScopes()->where([
                    'branch_id' => $sale->branch_id,
                    'product_id' => $item->product_id,
                ])->first();

                if ($branchStock) {
                    $oldStock = $branchStock->quantity;
                    $branchStock->increment('quantity', $item->quantity);

                    // Record restorative stock movement
                    StockMovement::create([
                        'branch_id' => $sale->branch_id,
                        'product_id' => $item->product_id,
                        'movement_type' => 'sale_correction',
                        'quantity' => $item->quantity, // Positive to restore
                        'quantity_before' => $oldStock,
                        'quantity_after' => $branchStock->fresh()->quantity,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'notes' => "Correction for Sale: {$sale->invoice_no}",
                        'created_by' => Auth::id(),
                    ]);
                }
            }

            // Revert customer balance if it was a credit sale
            if ($sale->customer_id && $sale->credit_amount > 0) {
                $customer = Customer::find($sale->customer_id);
                if ($customer) {
                    $customer->decrement('current_balance', (float) $sale->credit_amount);

                    // Record credit ledger correction
                    CustomerCreditLedger::create([
                        'customer_id' => $sale->customer_id,
                        'branch_id' => $sale->branch_id,
                        'transaction_date' => now(), // Correction happens now
                        'transaction_type' => 'correction',
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'reference_no' => $sale->invoice_no,
                        'debit' => 0,
                        'credit' => $sale->credit_amount, // Credit to reduce balance
                        'balance' => $customer->fresh()->current_balance,
                        'description' => "Correction for Sale: {$sale->invoice_no}",
                        'created_by' => Auth::id(),
                    ]);
                }
            }

            // Delete original items
            $sale->saleItems()->delete();


            // 2. UPDATE PHASE
            // Update sale details
            $sale->update([
                'branch_id' => $validated['branch_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'sale_date' => $validated['sale_date'],
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'],
                'discount_amount' => $validated['discount_amount'],
                'total_amount' => $validated['total_amount'],
                'payment_status' => $validated['payment_status'],
                'payment_method' => $validated['payment_method'] ?? null,
                'paid_amount' => $validated['paid_amount'],
                'credit_amount' => $validated['credit_amount'],
                'notes' => $validated['notes'] ?? null,
                // created_by preserved
            ]);

            // Create new sale items and update stock
            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'],
                    'tax_amount' => $item['tax_amount'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Update branch stock (deduct)
                $branchStock = BranchStock::withoutGlobalScopes()->firstOrCreate(
                    ['branch_id' => $validated['branch_id'], 'product_id' => $item['product_id']],
                    ['quantity' => 0]
                );

                $oldQuantity = $branchStock->quantity;
                $branchStock->decrement('quantity', $item['quantity']);

                // Record stock movement
                StockMovement::create([
                    'branch_id' => $validated['branch_id'],
                    'product_id' => $item['product_id'],
                    'movement_type' => 'sale',
                    'quantity' => -$item['quantity'],
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => $branchStock->fresh()->quantity,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'notes' => "Sale Updated: {$sale->invoice_no}",
                    'created_by' => Auth::id(),
                ]);
            }

            // Update customer balance if new credit sale
            if ($validated['customer_id'] && $validated['credit_amount'] > 0) {
                $customer = Customer::find($validated['customer_id']);
                $customer->increment('current_balance', $validated['credit_amount']);

                // Record credit ledger entry
                CustomerCreditLedger::create([
                    'customer_id' => $validated['customer_id'],
                    'branch_id' => $validated['branch_id'],
                    'transaction_date' => $validated['sale_date'],
                    'transaction_type' => 'credit',
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'reference_no' => $sale->invoice_no,
                    'debit' => $validated['credit_amount'],
                    'credit' => 0,
                    'balance' => $customer->fresh()->current_balance,
                    'description' => "Credit sale updated: {$sale->invoice_no}",
                    'created_by' => Auth::id(),
                ]);
            }
        });

        return redirect()->route('sales.index')->with('success', 'Sale updated successfully.');
    }

    public function destroy(Request $request, Sale $sale): RedirectResponse
    {
        $sale->delete();

        return redirect()->route('sales.index')->with('success', 'Sale deleted successfully.');
    }

    public function print(Request $request, Sale $sale)
    {
        $sale->load(['branch', 'customer', 'saleItems.product', 'createdBy']);
        $format = $request->query('format', 'a4');

        return view('print.invoice', [
            'sale' => $sale,
            'format' => $format,
        ]);
    }
}
