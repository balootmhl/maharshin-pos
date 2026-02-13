<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleFormRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $roles = QueryBuilder::for(Role::class)
            ->allowedFilters([
                'name',
            ])
            ->allowedSorts(['name', 'created_at'])
            ->defaultSort('name')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('role/index', [
            'roles' => $roles,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('role/create');
    }

    public function store(RoleFormRequest $request): RedirectResponse
    {
        $role = Role::create($request->validated());

        $request->session()->flash('role.id', $role->id);

        return redirect()->route('roles.index')->with('success', 'Role created successfully.');
    }

    public function show(Request $request, Role $role): Response
    {
        return Inertia::render('role/show', [
            'role' => $role,
        ]);
    }

    public function edit(Request $request, Role $role): Response
    {
        return Inertia::render('role/edit', [
            'role' => $role,
        ]);
    }

    public function update(RoleFormRequest $request, Role $role): RedirectResponse
    {
        $role->update($request->validated());

        $request->session()->flash('role.id', $role->id);

        return redirect()->route('roles.index')->with('success', 'Role updated successfully.');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        $role->delete();

        return redirect()->route('roles.index')->with('success', 'Role deleted successfully.');
    }
}
