<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseStoreRequest;
use App\Http\Requests\PurchaseUpdateRequest;
use App\Models\Branch;
use App\Models\BranchStock;
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

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $purchases = Purchase::with(['branch', 'supplier', 'createdBy', 'purchaseItems.product'])->latest()->get();

        return Inertia::render('Purchase/index', [
            'purchases' => $purchases,
        ]);
    }

    public function create(Request $request): Response
    {
        // Generate purchase number
        $lastPurchase = Purchase::latest()->first();
        $nextNumber = $lastPurchase ? (int) preg_replace('/[^0-9]/', '', $lastPurchase->purchase_no) + 1 : 1;
        $purchaseNo = 'PO-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

        return Inertia::render('Purchase/create', [
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name', 'code']),
            'products' => Product::with('category:id,name')
                ->where('is_active', true)
                ->get(['id', 'name', 'code', 'barcode', 'cost_price', 'tax_rate', 'category_id', 'unit']),
            'purchaseNo' => $purchaseNo,
        ]);
    }

    public function store(PurchaseStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            // Generate unique purchase number by finding the max existing number
            $maxPurchaseNo = Purchase::withTrashed()
                ->selectRaw('MAX(CAST(SUBSTRING(purchase_no, 4) AS UNSIGNED)) as max_num')
                ->value('max_num');
            $nextNumber = ($maxPurchaseNo ?? 0) + 1;
            $purchaseNo = 'PO-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

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

                // Update branch stock
                $branchStock = BranchStock::firstOrCreate(
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
        });

        return redirect()->route('purchases.index')->with('success', 'Purchase recorded successfully.');
    }

    public function show(Request $request, Purchase $purchase): Response
    {
        $purchase->load(['branch', 'supplier', 'purchaseItems.product', 'createdBy']);

        return Inertia::render('Purchase/show', [
            'purchase' => $purchase,
        ]);
    }

    public function edit(Request $request, Purchase $purchase): Response
    {
        $purchase->load('purchaseItems.product');

        return Inertia::render('Purchase/edit', [
            'purchase' => $purchase,
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name', 'code']),
            'products' => Product::with('category:id,name')
                ->where('is_active', true)
                ->get(['id', 'name', 'code', 'barcode', 'cost_price', 'tax_rate', 'category_id', 'unit']),
        ]);
    }

    public function update(PurchaseUpdateRequest $request, Purchase $purchase): RedirectResponse
    {
        $purchase->update($request->validated());

        $request->session()->flash('purchase.id', $purchase->id);

        return redirect()->route('purchases.index');
    }

    public function destroy(Request $request, Purchase $purchase): RedirectResponse
    {
        $purchase->delete();

        return redirect()->route('purchases.index');
    }
}
