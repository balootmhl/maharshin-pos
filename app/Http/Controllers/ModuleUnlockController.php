<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BranchModulePassword;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;

class ModuleUnlockController extends Controller
{
    /**
     * Show the password prompt to unlock a module.
     */
    public function showUnlockForm(string $module): InertiaResponse
    {
        return Inertia::render('Module/Unlock', [
            'module' => $module,
        ]);
    }

    /**
     * Process the password validation and unlock the module for session.
     */
    public function unlockModule(Request $request, string $module): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();
        if (!$user || !$user->branch_id) {
            return redirect()->route('dashboard');
        }

        $lock = BranchModulePassword::where('branch_id', $user->branch_id)
            ->where('module', $module)
            ->first();

        // If no lock configuration exists, bypass
        if (!$lock) {
            return redirect()->route('dashboard');
        }

        // Verify module password
        if (Hash::check($request->password, $lock->password)) {
            // Put unlock flag in session
            session()->put("unlocked_modules.{$user->branch_id}.{$module}", true);

            // Redirect back to intended destination page, or default to dashboard
            $intended = session()->pull('module_unlock_intended_url', route('dashboard'));
            return redirect()->to($intended);
        }

        return back()->withErrors([
            'password' => 'Incorrect module access password.',
        ]);
    }
}
