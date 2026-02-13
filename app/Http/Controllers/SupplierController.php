<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierStoreRequest;
use App\Http\Requests\SupplierUpdateRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $suppliers = QueryBuilder::for(Supplier::class)
            ->allowedFilters([
                'code',
                'name',
                'phone',
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['code', 'name', 'created_at'])
            ->defaultSort('name')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

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
