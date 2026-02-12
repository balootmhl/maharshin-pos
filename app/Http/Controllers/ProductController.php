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

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::with(['category', 'branchStocks.branch', 'branchStocks.group'])->get();
        $branches = Branch::where('is_active', true)->get(['id', 'name', 'code']);

        return Inertia::render('Product/index', [
            'products' => $products,
            'branches' => $branches,
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
