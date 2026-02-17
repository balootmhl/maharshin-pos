<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'nullable|string|max:100',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'category_id' => 'nullable|integer|exists:categories,id',
            'limit' => 'nullable|integer|min:1|max:100',
            'for' => 'nullable|in:sale,purchase',
        ]);

        $query = Product::query()
            ->where('is_active', true)
            ->with(['category:id,name']);

        // Only load the specific branch stock to minimize payload
        if ($request->filled('branch_id')) {
            $branchId = $request->input('branch_id');
            $query->with(['branchStocks' => function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)->with('group:id,name');
            }]);
        } else {
            $query->with(['branchStocks.group:id,name']);
        }

        // Search by name, code, or barcode
        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        $limit = $request->input('limit', 30);
        $context = $request->input('for', 'sale');

        // Select only the fields needed for the context
        $fields = ['id', 'name', 'code', 'barcode', 'tax_rate', 'category_id', 'unit'];
        if ($context === 'sale') {
            $fields[] = 'selling_price';
            $fields[] = 'cost_price';
        } else {
            $fields[] = 'cost_price';
        }

        $products = $query->select($fields)
            ->orderBy('code')
            ->limit($limit)
            ->get();

        return response()->json([
            'products' => $products,
        ]);
    }

    /**
     * Lookup a product by exact barcode or code match.
     */
    public function barcodeLookup(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:100',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        $code = $request->input('code');

        $query = Product::query()
            ->where('is_active', true)
            ->where(function ($q) use ($code) {
                $q->where('barcode', $code)
                  ->orWhere('code', $code);
            })
            ->with(['category:id,name']);

        if ($request->filled('branch_id')) {
            $branchId = $request->input('branch_id');
            $query->with(['branchStocks' => function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            }]);
        } else {
            $query->with('branchStocks');
        }

        $product = $query->first();

        if (!$product) {
            return response()->json(['product' => null], 404);
        }

        return response()->json(['product' => $product]);
    }
}
