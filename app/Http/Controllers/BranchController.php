<?php

namespace App\Http\Controllers;

use App\Http\Requests\BranchStoreRequest;
use App\Http\Requests\BranchUpdateRequest;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(Request $request): Response
    {
        $branches = Branch::all();

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

        $request->session()->flash('branch.id', $branch->id);

        return redirect()->route('branches.index');
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

        return redirect()->route('branches.index');
    }

    public function destroy(Request $request, Branch $branch): RedirectResponse
    {
        $branch->delete();

        return redirect()->route('branches.index');
    }
}
