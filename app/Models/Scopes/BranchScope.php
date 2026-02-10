<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class BranchScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * Branch filtering is applied for non-super-admin users.
     * Super admins (god role) can see all branches.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $user = Auth::user();

        // Don't apply scope if no user logged in or if super admin
        if (!$user || $user->is_super_admin) {
            return;
        }

        // Only filter if user has a branch assigned
        if ($user->branch_id) {
            $builder->where($model->getTable() . '.branch_id', $user->branch_id);
        }
    }
}
