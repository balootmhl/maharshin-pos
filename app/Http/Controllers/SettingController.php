<?php

namespace App\Http\Controllers;

use App\Http\Requests\SettingUpdateRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(Request $request): Response
    {
        $settings = Setting::all()->pluck('value', 'key');

        return Inertia::render('Setting/index', [
            'settings' => $settings,
        ]);
    }

    public function update(SettingUpdateRequest $request, Setting $setting): RedirectResponse
    {
        $setting->update($request->validated());

        return redirect()->route('settings.index');
    }
}
