<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionController extends Controller
{
    /**
     * Show the form for editing the role's permissions.
     */
    public function edit(Role $role): Response
    {
        // Load role's current permissions
        $role->load('permissions');

        // Fetch all permissions, grouped by module (the prefix before the dot)
        $allPermissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return Inertia::render('role/PermissionMatrix', [
            'role' => $role,
            'groupedPermissions' => $allPermissions,
        ]);
    }

    /**
     * Update the role's permissions.
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('roles.index')->with('success', 'Permissions updated successfully.');
    }
}
