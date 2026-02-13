<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductStoreRequest;
use App\Http\Requests\ProductUpdateRequest;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = QueryBuilder::for(Product::class)
            ->with(['category', 'branchStocks.branch', 'branchStocks.group'])
            ->allowedFilters([
                AllowedFilter::callback('global', function ($query, $value) {
                    $query->where(function ($q) use ($value) {
                        $q->where('code', 'like', "%{$value}%")
                          ->orWhere('name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('category.name'),
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['name', 'code', 'selling_price', 'cost_price', 'is_active', 'created_at'])
            ->defaultSort('-created_at')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        $branches = Branch::where('is_active', true)->get(['id', 'name', 'code']);
        // We need unique category names for the filter dropdown since we can't derive them from paginated data
        $categories = Category::distinct()->pluck('name')->sort()->values();

        return Inertia::render('Product/index', [
            'products' => $products,
            'branches' => $branches,
            'categories' => $categories, // Passed for filter
        ]);
    }

    public function create(Request $request): Response
    {
        $categories = Category::where('is_active', true)->get();

        return Inertia::render('Product/create', [
            'categories' => $categories,
        ]);
    }

    public function store(ProductStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $userId = Auth::id();

        $data['created_by'] = $userId;
        $data['updated_by'] = $userId;

        /** @var Product $product */
        $product = Product::create($data);

        $request->session()->flash('product.id', $product->id);

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }

    public function show(Request $request, Product $product): Response
    {
        $product->load('category');

        return Inertia::render('Product/show', [
            'product' => $product,
        ]);
    }

    public function edit(Request $request, Product $product): Response
    {
        $categories = Category::where('is_active', true)->get();

        return Inertia::render('Product/edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function update(ProductUpdateRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();

        $product->update($data);

        $request->session()->flash('product.id', $product->id);

        return redirect()->route('products.index')->with('success', 'Product updated successfully.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('products.index')->with('success', 'Product deleted successfully.');
    }
}
