<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class StockHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        // Get all stock-related activities
        $activities = Activity::where('log_name', 'stock')
            ->with(['causer', 'subject'])
            ->latest()
            ->paginate(50);

        return Inertia::render('StockHistory/index', [
            'activities' => $activities,
        ]);
    }
}
