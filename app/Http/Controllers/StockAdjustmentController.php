<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockAdjustmentStoreRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockAdjustmentController extends Controller
{
    public function index(Request $request): Response
    {
        $stockAdjustments = StockAdjustment::with(['product', 'branch', 'createdBy'])
            ->latest()
            ->get();

        return Inertia::render('StockAdjustment/index', [
            'stockAdjustments' => $stockAdjustments,
            'reasons' => StockAdjustment::REASONS,
        ]);
    }

    public function create(Request $request): Response
    {
        $defaultBranch = Branch::where('is_active', true)->first();

        // Get products with stock for the default branch
        $products = Product::with('category:id,name')
            ->where('is_active', true)
            ->get(['id', 'name', 'code', 'category_id', 'unit'])
            ->map(function ($product) use ($defaultBranch) {
                $stock = $defaultBranch ? BranchStock::where('branch_id', $defaultBranch->id)
                    ->where('product_id', $product->id)
                    ->value('quantity') ?? 0 : 0;
                $product->stock = $stock;

                return $product;
            });

        return Inertia::render('StockAdjustment/create', [
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'products' => $products,
            'reasons' => StockAdjustment::REASONS,
        ]);
    }

    public function store(StockAdjustmentStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            // Generate unique adjustment number
            $maxAdjustmentNo = StockAdjustment::withTrashed()
                ->selectRaw('MAX(CAST(SUBSTRING(adjustment_no, 5) AS UNSIGNED)) as max_num')
                ->value('max_num');
            $nextNumber = ($maxAdjustmentNo ?? 0) + 1;
            $adjustmentNo = 'ADJ-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Get or create branch stock
            $branchStock = BranchStock::firstOrCreate(
                ['branch_id' => $validated['branch_id'], 'product_id' => $validated['product_id']],
                ['quantity' => 0]
            );

            $quantityBefore = $branchStock->quantity;

            // Apply adjustment
            if ($validated['adjustment_type'] === 'add') {
                $branchStock->increment('quantity', $validated['quantity']);
                $movementQty = $validated['quantity'];
            } else {
                $branchStock->decrement('quantity', $validated['quantity']);
                $movementQty = -$validated['quantity'];
            }

            $quantityAfter = $branchStock->fresh()->quantity;

            // Create stock adjustment record
            $adjustment = StockAdjustment::create([
                'adjustment_no' => $adjustmentNo,
                'branch_id' => $validated['branch_id'],
                'product_id' => $validated['product_id'],
                'adjustment_date' => $validated['adjustment_date'],
                'adjustment_type' => $validated['adjustment_type'],
                'quantity' => $validated['quantity'],
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Record stock movement
            StockMovement::create([
                'branch_id' => $validated['branch_id'],
                'product_id' => $validated['product_id'],
                'movement_type' => 'adjustment',
                'quantity' => $movementQty,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'reference_type' => StockAdjustment::class,
                'reference_id' => $adjustment->id,
                'notes' => "Adjustment ({$validated['reason']}): {$adjustmentNo}",
                'created_by' => Auth::id(),
            ]);
        });

        return redirect()->route('stock-adjustments.index')->with('success', 'Stock adjustment recorded successfully.');
    }

    public function show(Request $request, StockAdjustment $stockAdjustment): Response
    {
        $stockAdjustment->load(['product', 'branch', 'createdBy']);

        return Inertia::render('StockAdjustment/show', [
            'stockAdjustment' => $stockAdjustment,
            'reasons' => StockAdjustment::REASONS,
        ]);
    }
}
