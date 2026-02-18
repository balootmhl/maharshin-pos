<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductPricingController extends Controller
{
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
            $products = Product::with(['category', 'branchStocks' => function ($query) use ($branchId) {
                    $query->withoutGlobalScopes()
                          ->where('branch_id', $branchId)
                          ->with('group');
                }])
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
                ->limit(500) // Limit results to prevent overload
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

        $branchId = $request->input('branch_id');

        foreach ($request->input('prices') as $priceData) {
            BranchStock::withoutGlobalScopes()
                ->where('product_id', $priceData['product_id'])
                ->where('branch_id', $branchId)
                ->update([
                    'cost_price' => $priceData['cost_price'],
                    'selling_price' => $priceData['selling_price'],
                ]);
        }

        return redirect()->back()->with('success', 'Prices updated successfully.');
    }
}
