<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\CustomerCreditLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\CustomerCreditLedgerController
 */
final class CustomerCreditLedgerControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function index_displays_view(): void
    {
        $customerCreditLedgers = CustomerCreditLedger::factory()->count(3)->create();

        $response = $this->get(route('customer-credit-ledgers.index'));

        $response->assertOk();
        $response->assertViewIs('customer-credit.index');
        $response->assertViewHas('ledgers');
    }
}
