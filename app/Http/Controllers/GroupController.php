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

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class GroupController extends Controller
{
    public function index(Request $request): Response
    {
        $groups = QueryBuilder::for(Group::class)
            ->allowedFilters([
                'code',
                'name',
                AllowedFilter::callback('branch.name', function ($query, $value) {
                    $query->whereHas('branch', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('branch_id'),
            ])
            ->allowedSorts(['code', 'name', 'created_at'])
            ->defaultSort('name')
            ->with('branch')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        $branches = Branch::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('Group/index', [
            'groups' => $groups,
            'branches' => $branches,
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
