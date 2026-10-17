<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Product;
use App\Services\PriceHistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ProductPricingController extends Controller implements HasMiddleware
{
    public function __construct(
        protected PriceHistoryService $priceHistoryService
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('permission:products.view', only: ['index', 'history']),
            new Middleware('permission:products.edit', only: ['update']),
        ];
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $branches = Branch::where('is_active', true)->get(['id', 'name', 'code']);

        // Superadmin can pick any branch; normal users see their own
        $branchId = $user->is_super_admin
            ? ($request->input('branch_id') ?? $branches->first()?->id)
            : $user->branch_id;

        $search = $request->input('search');
        $categoryId = $request->input('category_id');

        // Only fetch products if search or category filter is applied
        if (!$search && (!$categoryId || $categoryId === 'all')) {
            $products = [];
        } else {
            $products = Product::with([
                'category:id,name',
                'branchStocks' => function ($query) use ($branchId) {
                    $query->withoutGlobalScopes()
                        ->where('branch_id', $branchId)
                        ->select(['id', 'product_id', 'branch_id', 'group_id', 'quantity', 'cost_price', 'selling_price'])
                        ->with('group:id,name');
                }
            ])
                ->where('is_active', true)
                ->when($search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
                })
                ->when($categoryId && $categoryId !== 'all', function ($query, $id) {
                    $query->where('category_id', $id);
                })
                ->orderBy('code')
                ->limit(150) // Limit to 150 to keep memory low and prevent overload
                ->get(['id', 'code', 'name', 'category_id', 'cost_price', 'selling_price', 'unit']);
        }

        $categories = Category::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Product/pricing', [
            'products' => $products,
            'branches' => $branches,
            'categories' => $categories,
            'selectedBranchId' => (int) $branchId,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
            ],
            'adjustmentReasons' => \App\Models\StockAdjustment::REASONS,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'prices' => 'required|array',
            'prices.*.product_id' => 'required|exists:products,id',
            'prices.*.cost_price' => 'nullable|numeric|min:0',
            'prices.*.selling_price' => 'nullable|numeric|min:0',
        ]);

        $branchId = $request->user()->is_super_admin
            ? $request->input('branch_id')
            : $request->user()->branch_id;

        $userId = $request->user()->id;

        foreach ($request->input('prices') as $priceData) {
            $branchStock = BranchStock::withoutGlobalScopes()
                ->where('product_id', $priceData['product_id'])
                ->where('branch_id', $branchId)
                ->first();

            $oldCost = $branchStock?->cost_price;
            $oldSelling = $branchStock?->selling_price;
            $newCost = $priceData['cost_price'] !== null ? (float) $priceData['cost_price'] : null;
            $newSelling = $priceData['selling_price'] !== null ? (float) $priceData['selling_price'] : null;

            if ($branchStock) {
                $branchStock->update([
                    'cost_price' => $newCost,
                    'selling_price' => $newSelling,
                ]);
            } else {
                BranchStock::withoutGlobalScopes()->create([
                    'product_id' => $priceData['product_id'],
                    'branch_id' => $branchId,
                    'cost_price' => $newCost,
                    'selling_price' => $newSelling,
                    'quantity' => 0,
                ]);
            }

            // Record price history audit log
            $this->priceHistoryService->recordChange(
                productId: (int) $priceData['product_id'],
                branchId: (int) $branchId,
                oldCostPrice: $oldCost !== null ? (float) $oldCost : null,
                newCostPrice: $newCost,
                oldSellingPrice: $oldSelling !== null ? (float) $oldSelling : null,
                newSellingPrice: $newSelling,
                changeType: 'branch_pricing',
                reason: 'Updated in Branch Pricing Table',
                userId: $userId
            );
        }

        return redirect()->back()->with('success', 'Prices updated successfully.');
    }

    /**
     * Get price history audit log for a product.
     */
    public function history(Request $request, Product $product): JsonResponse
    {
        $branchId = $request->query('branch_id');

        $histories = $product->priceHistories()
            ->with(['branch:id,name,code', 'changedBy:id,name'])
            ->when($branchId && $branchId !== 'all', function ($q) use ($branchId) {
                $q->where(function ($sub) use ($branchId) {
                    $sub->where('branch_id', $branchId)
                        ->orWhereNull('branch_id');
                });
            })
            ->limit(100)
            ->get();

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'unit' => $product->unit,
            ],
            'histories' => $histories,
        ]);
    }
}
