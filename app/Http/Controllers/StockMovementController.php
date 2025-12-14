<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    public function index(Request $request): Response
    {
        $stockMovements = StockMovement::with(['product', 'branch', 'createdBy'])->latest()->get();

        return Inertia::render('StockMovement/index', [
            'stockMovements' => $stockMovements,
        ]);
    }
}
