<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductStoreRequest;
use App\Http\Requests\ProductUpdateRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ProductController extends Controller
{
    public function index(Request $request): View
    {
        $products = Product::all();

        return view('product.index', [
            'products' => $products,
        ]);
    }

    public function create(Request $request): View
    {
        return view('product.create');
    }

    public function store(ProductStoreRequest $request): RedirectResponse
    {
        $product = Product::create($request->validated());

        $request->session()->flash('product.id', $product->id);

        return redirect()->route('products.index');
    }

    public function show(Request $request, Product $product): View
    {
        return view('product.show', [
            'product' => $product,
        ]);
    }

    public function edit(Request $request, Product $product): View
    {
        return view('product.edit', [
            'product' => $product,
        ]);
    }

    public function update(ProductUpdateRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        $request->session()->flash('product.id', $product->id);

        return redirect()->route('products.index');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('products.index');
    }
}
