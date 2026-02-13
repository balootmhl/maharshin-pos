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

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class StockAdjustmentController extends Controller
{
    public function index(Request $request): Response
    {
        $stockAdjustments = QueryBuilder::for(StockAdjustment::class)
            ->with(['product', 'branch', 'createdBy'])
            ->allowedFilters([
                'adjustment_no',
                'adjustment_type',
                'reason',
                AllowedFilter::callback('product.name', function ($query, $value) {
                    $query->whereHas('product', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%")
                          ->orWhere('code', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::callback('branch.name', function ($query, $value) {
                    $query->whereHas('branch', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::scope('adjustment_date_start'),
                AllowedFilter::scope('adjustment_date_end'),
            ])
            ->allowedSorts(['adjustment_no', 'adjustment_date', 'quantity', 'created_at'])
            ->defaultSort('-created_at')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

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
                $stock = $defaultBranch ? BranchStock::withoutGlobalScopes()
                    ->where('branch_id', $defaultBranch->id)
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
        $this->createAdjustment($request->validated());

        return redirect()->route('stock-adjustments.index')->with('success', 'Stock adjustment recorded successfully.');
    }

    public function quickStore(StockAdjustmentStoreRequest $request): RedirectResponse
    {
        $this->createAdjustment($request->validated());

        return redirect()->back()->with('success', 'Stock adjustment recorded successfully.');
    }

    private function createAdjustment(array $validated): void
    {
        DB::transaction(function () use ($validated) {
            // Generate adjustment number - date-based format: ADJ-YYYYMMDD-XXXX
            $today = now()->format('Ymd');
            $prefix = "ADJ-{$today}-";
            $maxSeq = StockAdjustment::withoutGlobalScopes()
                ->withTrashed()
                ->where('adjustment_no', 'like', $prefix . '%')
                ->selectRaw('MAX(CAST(SUBSTRING(adjustment_no, -4) AS UNSIGNED)) as max_seq')
                ->value('max_seq');
            $nextSeq = ($maxSeq ?? 0) + 1;
            $adjustmentNo = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

            // Get or create branch stock - bypass scope
            $branchStock = BranchStock::withoutGlobalScopes()->firstOrCreate(
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
