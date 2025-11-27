<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\BranchStock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\BranchStockController
 */
final class BranchStockControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function index_displays_view(): void
    {
        $branchStocks = BranchStock::factory()->count(3)->create();

        $response = $this->get(route('branch-stocks.index'));

        $response->assertOk();
        $response->assertViewIs('stock.index');
        $response->assertViewHas('stocks');
    }
}
