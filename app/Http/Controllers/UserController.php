<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserFormRequest;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with('branch')->get();

        return Inertia::render('user/index', [
            'users' => $users,
        ]);
    }

    public function create(Request $request): Response
    {
        $roles = Role::whereNot('name', config('project.super_admin'))->pluck('name');

        if ($request->user()->is_super_admin) {
            $roles = Role::get()->pluck('name');
        }

        $branches = Branch::where('is_active', true)->get(['id', 'name', 'code']);

        return Inertia::render('user/create', [
            'roles' => $roles,
            'branches' => $branches,
        ]);
    }

    public function store(UserFormRequest $request): RedirectResponse
    {
        $user = User::create($request->safe()->except(['main_role']));

        $user->assignRole($request->input('main_role'));

        $request->session()->flash('user.id', $user->id);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function show(Request $request, User $user): Response
    {
        $user->load('branch');

        return Inertia::render('user/show', [
            'user' => $user,
        ]);
    }

    public function edit(Request $request, User $user): Response
    {
        $roles = Role::whereNot('name', config('project.super_admin'))->pluck('name');

        if ($request->user()->is_super_admin) {
            $roles = Role::get()->pluck('name');
        }

        $branches = Branch::where('is_active', true)->get(['id', 'name', 'code']);

        return Inertia::render('user/edit', [
            'user' => $user->load('branch'),
            'roles' => $roles,
            'branches' => $branches,
        ]);
    }

    public function update(UserFormRequest $request, User $user): RedirectResponse
    {
        $user->update($request->safe()->except(['main_role']));

        // Sync the role if provided
        if ($request->filled('main_role')) {
            $user->syncRoles([$request->input('main_role')]);
        }

        $request->session()->flash('user.id', $user->id);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
}
