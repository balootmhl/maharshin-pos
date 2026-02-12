<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierStoreRequest;
use App\Http\Requests\SupplierUpdateRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $suppliers = Supplier::all();

        return Inertia::render('Supplier/index', [
            'suppliers' => $suppliers,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Supplier/create');
    }

    public function store(SupplierStoreRequest $request): RedirectResponse
    {
        $supplier = Supplier::create($request->validated());

        $request->session()->flash('supplier.id', $supplier->id);

        return redirect()->route('suppliers.index')->with('success', 'Supplier created successfully.');
    }

    public function show(Request $request, Supplier $supplier): Response
    {
        return Inertia::render('Supplier/show', [
            'supplier' => $supplier,
        ]);
    }

    public function edit(Request $request, Supplier $supplier): Response
    {
        return Inertia::render('Supplier/edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(SupplierUpdateRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        $request->session()->flash('supplier.id', $supplier->id);

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Request $request, Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted successfully.');
    }
}
