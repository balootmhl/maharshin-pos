<?php

namespace App\Http\Controllers;

use App\Http\Requests\GroupStoreRequest;
use App\Http\Requests\GroupUpdateRequest;
use App\Models\Branch;
use App\Models\Group;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function index(Request $request): Response
    {
        $groups = Group::with('branch')
            ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
            ->orderBy('branch_id')
            ->orderBy('name')
            ->get();

        $branches = Branch::where('is_active', true)->get();

        return Inertia::render('Group/index', [
            'groups' => $groups,
            'branches' => $branches,
            'filters' => [
                'branch_id' => $request->branch_id,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $branches = Branch::where('is_active', true)->get();

        return Inertia::render('Group/create', [
            'branches' => $branches,
        ]);
    }

    public function store(GroupStoreRequest $request): RedirectResponse
    {
        $group = Group::create($request->validated());

        $request->session()->flash('group.id', $group->id);

        return redirect()->route('groups.index')->with('success', 'Group created successfully.');
    }

    public function show(Request $request, Group $group): Response
    {
        $group->load('branch', 'branchStocks.product');

        return Inertia::render('Group/show', [
            'group' => $group,
        ]);
    }

    public function edit(Request $request, Group $group): Response
    {
        $branches = Branch::where('is_active', true)->get();

        return Inertia::render('Group/edit', [
            'group' => $group,
            'branches' => $branches,
        ]);
    }

    public function update(GroupUpdateRequest $request, Group $group): RedirectResponse
    {
        $group->update($request->validated());

        $request->session()->flash('group.id', $group->id);

        return redirect()->route('groups.index')->with('success', 'Group updated successfully.');
    }

    public function destroy(Request $request, Group $group): RedirectResponse
    {
        $group->delete();

        return redirect()->route('groups.index')->with('success', 'Group deleted successfully.');
    }
}
