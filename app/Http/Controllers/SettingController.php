<?php

namespace App\Http\Controllers;

use App\Http\Requests\SettingUpdateRequest;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;

class SettingController extends Controller
{
    public function index(Request $request): View
    {
        return view('setting.index', [
            'settings' => $settings,
        ]);
    }

    public function update(SettingUpdateRequest $request, Setting $setting): Response
    {
        $setting->save();
    }
}
