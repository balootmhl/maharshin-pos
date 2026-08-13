<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductStoreRequest;
use App\Http\Requests\ProductUpdateRequest;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Group;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Exports\ProductsExport;
use Maatwebsite\Excel\Facades\Excel;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ProductController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:products.view', only: ['index', 'show', 'export']),
            new Middleware('permission:products.create', only: ['create', 'store']),
            new Middleware('permission:products.edit', only: ['edit', 'update']),
            new Middleware('permission:products.delete', only: ['destroy']),
        ];
    }

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

    public function export(Request $request)
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
            ->get();

        $user = Auth::user();
        $branches = Branch::where('is_active', true)->get(['id', 'name', 'code']);
        
        $visibleBranches = $user->is_super_admin 
            ? $branches 
            : $branches->filter(fn($b) => $b->id === $user->branch_id);

        return Excel::download(new ProductsExport($products, $visibleBranches), 'products_export_' . now()->format('YmdHis') . '.xlsx');
    }

    public function create(Request $request): Response
    {
        $categories = Category::where('is_active', true)->get();
        $groups = Group::where('is_active', true)->get();

        return Inertia::render('Product/create', [
            'categories' => $categories,
            'groups' => $groups,
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

        // Always create default branch stock records for all active branches
        $branches = Branch::where('is_active', true)->get();
        foreach ($branches as $branch) {
            $product->branchStocks()->create([
                'branch_id' => $branch->id,
                'group_id' => !empty($data['group_id']) ? $data['group_id'] : null,
                'cost_price' => $data['cost_price'] ?? 0,
                'selling_price' => $data['selling_price'] ?? 0,
                'quantity' => 0,
            ]);
        }

        $request->session()->flash('product.id', $product->id);

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }

    public function show(Request $request, Product $product): Response
    {
        $product->load(['category', 'branchStocks.branch', 'branchStocks.group']);

        return Inertia::render('Product/show', [
            'product' => $product,
        ]);
    }

    public function edit(Request $request, Product $product): Response
    {
        $categories = Category::where('is_active', true)->get();
        $groups = Group::where('is_active', true)->get();
        $product->load('branchStocks');

        return Inertia::render('Product/edit', [
            'product' => $product,
            'categories' => $categories,
            'groups' => $groups,
        ]);
    }

    public function update(ProductUpdateRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();

        $product->update($data);

        // Update branch stocks with new group and prices if they exist in the request
        // We accumulate the updates array to allow updating group and prices simultaneously across accessible branches
        $branchStockUpdates = [];
        if ($request->has('group_id')) {
            $branchStockUpdates['group_id'] = $data['group_id'];
        }
        if ($request->has('cost_price')) {
            $branchStockUpdates['cost_price'] = $data['cost_price'];
        }
        if ($request->has('selling_price')) {
            $branchStockUpdates['selling_price'] = $data['selling_price'];
        }

        if (!empty($branchStockUpdates)) {
            $user = Auth::user();
            if ($user && !$user->is_super_admin && $user->branch_id) {
                // If it is a branch-scoped user, ensure the stock record exists and update it
                $product->branchStocks()->updateOrCreate(
                    ['branch_id' => $user->branch_id],
                    $branchStockUpdates
                );
            } else {
                // For super admins, update existing branch stock records
                $product->branchStocks()->update($branchStockUpdates);
            }
        }

        $request->session()->flash('product.id', $product->id);

        return redirect()->route('products.index')->with('success', 'Product updated successfully.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('products.index')->with('success', 'Product deleted successfully.');
    }
}
