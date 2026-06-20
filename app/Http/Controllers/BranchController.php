<?php

namespace App\Http\Controllers;

use App\Http\Requests\BranchStoreRequest;
use App\Http\Requests\BranchUpdateRequest;
use App\Models\Branch;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class BranchController extends Controller
{
    public function index(Request $request): Response
    {
        $branches = QueryBuilder::for(Branch::class)
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

        return Inertia::render('Branch/index', [
            'branches' => $branches,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Branch/create');
    }

    public function store(BranchStoreRequest $request): RedirectResponse
    {
        $branch = Branch::create($request->validated());

        // Create default branch stock records for all existing products for the new branch
        $products = Product::all();
        foreach ($products as $product) {
            $product->branchStocks()->create([
                'branch_id' => $branch->id,
                'group_id' => null,
                'cost_price' => $product->cost_price,
                'selling_price' => $product->selling_price,
                'quantity' => 0,
            ]);
        }

        $request->session()->flash('branch.id', $branch->id);

        return redirect()->route('branches.index')->with('success', 'Branch created successfully.');
    }

    public function show(Request $request, Branch $branch): Response
    {
        return Inertia::render('Branch/show', [
            'branch' => $branch,
        ]);
    }

    public function edit(Request $request, Branch $branch): Response
    {
        return Inertia::render('Branch/edit', [
            'branch' => $branch,
        ]);
    }

    public function update(BranchUpdateRequest $request, Branch $branch): RedirectResponse
    {
        $branch->update($request->validated());

        $request->session()->flash('branch.id', $branch->id);

        return redirect()->route('branches.index')->with('success', 'Branch updated successfully.');
    }

    public function destroy(Request $request, Branch $branch): RedirectResponse
    {
        $branch->delete();

        return redirect()->route('branches.index')->with('success', 'Branch deleted successfully.');
    }
}
