<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierStoreRequest;
use App\Http\Requests\SupplierUpdateRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SupplierController extends Controller
{
    public function index(Request $request): View
    {
        $suppliers = Supplier::all();

        return view('supplier.index', [
            'suppliers' => $suppliers,
        ]);
    }

    public function create(Request $request): View
    {
        return view('supplier.create');
    }

    public function store(SupplierStoreRequest $request): RedirectResponse
    {
        $supplier = Supplier::create($request->validated());

        $request->session()->flash('supplier.id', $supplier->id);

        return redirect()->route('suppliers.index');
    }

    public function show(Request $request, Supplier $supplier): View
    {
        return view('supplier.show', [
            'supplier' => $supplier,
        ]);
    }

    public function edit(Request $request, Supplier $supplier): View
    {
        return view('supplier.edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(SupplierUpdateRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        $request->session()->flash('supplier.id', $supplier->id);

        return redirect()->route('suppliers.index');
    }

    public function destroy(Request $request, Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()->route('suppliers.index');
    }
}
