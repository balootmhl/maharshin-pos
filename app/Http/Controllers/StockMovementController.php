<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\View\View;

class StockMovementController extends Controller
{
    public function index(Request $request): View
    {
        $stockMovements = StockMovement::with(product,branch)->get();

        return view('stock-movement.index', [
            'movements' => $movements,
        ]);
    }
}
