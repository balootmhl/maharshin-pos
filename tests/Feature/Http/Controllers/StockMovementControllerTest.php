<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\StockMovementController
 */
final class StockMovementControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function index_displays_view(): void
    {
        $stockMovements = StockMovement::factory()->count(3)->create();

        $response = $this->get(route('stock-movements.index'));

        $response->assertOk();
        $response->assertViewIs('stock-movement.index');
        $response->assertViewHas('movements');
    }
}
