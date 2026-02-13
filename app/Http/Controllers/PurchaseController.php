<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseStoreRequest;
use App\Http\Requests\PurchaseUpdateRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $purchases = QueryBuilder::for(Purchase::class)
            ->with(['branch', 'supplier', 'createdBy', 'purchaseItems.product'])
            ->allowedFilters([
                'purchase_no',
                'payment_status',
                AllowedFilter::callback('supplier.name', function ($query, $value) {
                    $query->whereHas('supplier', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::scope('purchase_date_start'),
                AllowedFilter::scope('purchase_date_end'),
                AllowedFilter::scope('total_amount_min'),
                AllowedFilter::scope('total_amount_max'),
            ])
            ->allowedSorts(['purchase_no', 'purchase_date', 'total_amount', 'created_at'])
            ->defaultSort('-created_at')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('Purchase/index', [
            'purchases' => $purchases,
        ]);
    }

    public function create(Request $request): Response
    {
        // Generate purchase number - date-based format: PO-YYYYMMDD-XXXX
        $today = now()->format('Ymd');
        $prefix = "PO-{$today}-";
        $maxSeq = Purchase::withoutGlobalScopes()
            ->where('purchase_no', 'like', $prefix . '%')
            ->selectRaw('MAX(CAST(SUBSTRING(purchase_no, -4) AS UNSIGNED)) as max_seq')
            ->value('max_seq');
        $nextSeq = ($maxSeq ?? 0) + 1;
        $purchaseNo = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Purchase/create', [
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name', 'code']),
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'purchaseNo' => $purchaseNo,
        ]);
    }

    public function store(PurchaseStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $purchase = DB::transaction(function () use ($validated) {
            // Generate purchase number - date-based format: PO-YYYYMMDD-XXXX
            $today = now()->format('Ymd');
            $prefix = "PO-{$today}-";
            $maxSeq = Purchase::withoutGlobalScopes()
                ->withTrashed()
                ->where('purchase_no', 'like', $prefix . '%')
                ->selectRaw('MAX(CAST(SUBSTRING(purchase_no, -4) AS UNSIGNED)) as max_seq')
                ->value('max_seq');
            $nextSeq = ($maxSeq ?? 0) + 1;
            $purchaseNo = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

            // Create the purchase
            $purchase = Purchase::create([
                'purchase_no' => $purchaseNo,
                'branch_id' => $validated['branch_id'],
                'supplier_id' => $validated['supplier_id'] ?? null,
                'purchase_date' => $validated['purchase_date'],
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'],
                'total_amount' => $validated['total_amount'],
                'payment_status' => $validated['payment_status'],
                'paid_amount' => $validated['paid_amount'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Create purchase items and update stock
            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'tax_rate' => $item['tax_rate'],
                    'tax_amount' => $item['tax_amount'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Update branch stock - bypass scope to find/create across branches
                $branchStock = BranchStock::withoutGlobalScopes()->firstOrCreate(
                    ['branch_id' => $validated['branch_id'], 'product_id' => $item['product_id']],
                    ['quantity' => 0]
                );

                $oldQuantity = $branchStock->quantity;
                $branchStock->increment('quantity', $item['quantity']);

                // Record stock movement
                StockMovement::create([
                    'branch_id' => $validated['branch_id'],
                    'product_id' => $item['product_id'],
                    'movement_type' => 'purchase',
                    'quantity' => $item['quantity'],
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => $branchStock->fresh()->quantity,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'notes' => "Purchase: {$purchase->purchase_no}",
                    'created_by' => Auth::id(),
                ]);
            }
            return $purchase;
        });

        // Load supplier for the success dialog
        $purchase->load('supplier:id,name');

        return redirect()->route('purchases.create')->with('completedPurchase', [
            'id' => $purchase->id,
            'purchase_no' => $purchase->purchase_no,
            'total_amount' => $purchase->total_amount,
            'paid_amount' => $purchase->paid_amount,
            'payment_status' => $purchase->payment_status,
            'supplier' => $purchase->supplier ? [
                'id' => $purchase->supplier->id,
                'name' => $purchase->supplier->name,
            ] : null,
        ])->with('success', 'Purchase recorded successfully.');
    }

    public function show(Request $request, Purchase $purchase): Response
    {
        $purchase->load(['branch', 'supplier', 'purchaseItems.product', 'createdBy']);

        return Inertia::render('Purchase/show', [
            'purchase' => $purchase,
        ]);
    }

    public function edit(Request $request, Purchase $purchase): Response|RedirectResponse
    {
        if ($purchase->created_at->diffInDays(now()) > 3) {
            return redirect()->route('purchases.index')->with('error', 'Purchase cannot be edited after 3 days.');
        }

        // optimizing load - remove full product eager load, pass categories instead
        $purchase->load(['purchaseItems.product']);

        return Inertia::render('Purchase/edit', [
            'purchase' => $purchase,
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name', 'code']),
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function update(PurchaseUpdateRequest $request, Purchase $purchase): RedirectResponse
    {
        if ($purchase->created_at->diffInDays(now()) > 3) {
            return redirect()->route('purchases.index')->with('error', 'Purchase cannot be edited after 3 days.');
        }

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $purchase) {
            // 1. REVERSAL PHASE
            // Restore (remove) stock for original items
            // Since purchase ADDS stock, reversing it means REMOVING it.
            foreach ($purchase->purchaseItems as $item) {
                $branchStock = BranchStock::where('branch_id', $purchase->branch_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                $oldQuantity = $branchStock ? $branchStock->quantity : 0;

                if ($branchStock) {
                    $branchStock->decrement('quantity', $item->quantity);
                }

                // Record correction movement
                StockMovement::create([
                    'branch_id' => $purchase->branch_id,
                    'product_id' => $item->product_id,
                    'movement_type' => 'purchase_correction',
                    'quantity' => $item->quantity, // Absolute value
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => $branchStock ? $branchStock->quantity : 0,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'notes' => "Correction for Purchase: {$purchase->purchase_no}",
                    'created_by' => Auth::id(),
                ]);
            }

            // Delete original PurchaseItems
            PurchaseItem::where('purchase_id', $purchase->id)->delete();

            // 2. UPDATE PHASE
            // Update Purchase attributes
            $purchase->update([
                'purchase_no' => $validated['purchase_no'],
                'branch_id' => $validated['branch_id'],
                'supplier_id' => $validated['supplier_id'] ?? null,
                'purchase_date' => $validated['purchase_date'],
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'],
                'total_amount' => $validated['total_amount'],
                'payment_status' => $validated['payment_status'],
                'paid_amount' => $validated['paid_amount'],
                'notes' => $validated['notes'] ?? null,
                // created_by preserves original creator
            ]);

            // 3. RE-APPLY PHASE
            // Create new PurchaseItems and add stock
            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
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
                $branchStock->increment('quantity', $item['quantity']);

                // Record stock movement
                StockMovement::create([
                    'branch_id' => $validated['branch_id'],
                    'product_id' => $item['product_id'],
                    'movement_type' => 'purchase',
                    'quantity' => $item['quantity'],
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => $branchStock->fresh()->quantity,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'notes' => "Updated Purchase: {$purchase->purchase_no}",
                    'created_by' => Auth::id(),
                ]);
            }
        });

        return redirect()->route('purchases.index')->with('success', 'Purchase updated successfully.');
    }

    public function destroy(Request $request, Purchase $purchase): RedirectResponse
    {
        $purchase->delete();

        return redirect()->route('purchases.index')->with('success', 'Purchase deleted successfully.');
    }
}
