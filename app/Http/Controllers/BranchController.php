<?php

namespace App\Http\Controllers;

use App\Http\Requests\BranchStoreRequest;
use App\Http\Requests\BranchUpdateRequest;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class BranchController extends Controller
{
    public function index(Request $request): View
    {
        $branches = Branch::all();

        return view('branch.index', [
            'branches' => $branches,
        ]);
    }

    public function create(Request $request): View
    {
        return view('branch.create');
    }

    public function store(BranchStoreRequest $request): RedirectResponse
    {
        $branch = Branch::create($request->validated());

        $request->session()->flash('branch.id', $branch->id);

        return redirect()->route('branches.index');
    }

    public function show(Request $request, Branch $branch): View
    {
        return view('branch.show', [
            'branch' => $branch,
        ]);
    }

    public function edit(Request $request, Branch $branch): View
    {
        return view('branch.edit', [
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
