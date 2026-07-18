<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\BranchModulePassword;

class ModulePasswordGating
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $user = $request->user();

        // 1. Bypass if god role (super admin)
        if (!$user || $user->is_super_admin) {
            return $next($request);
        }

        // 2. Get user's branch
        $branchId = $user->branch_id;
        if (!$branchId) {
            return $next($request);
        }

        // 3. Check if password lock is configured for this branch and module
        $lock = BranchModulePassword::where('branch_id', $branchId)
            ->where('module', $module)
            ->first();

        // If no lock exists, access is allowed
        if (!$lock) {
            return $next($request);
        }

        // 4. Check if the module has already been unlocked in this session
        $sessionKey = "unlocked_modules.{$branchId}.{$module}";
        if (session()->has($sessionKey)) {
            return $next($request);
        }

        // 5. If it expects JSON, return a 403 Forbidden
        if ($request->expectsJson() && !$request->inertia()) {
            return response()->json([
                'message' => 'Module is locked. Please unlock it first.',
                'module' => $module
            ], 403);
        }

        // 6. Otherwise, save intended URL and redirect to unlock page
        session()->put('module_unlock_intended_url', $request->fullUrl());

        return redirect()->route('modules.unlock.prompt', ['module' => $module]);
    }
}
