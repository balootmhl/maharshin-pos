<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Branch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\BranchController
 */
final class BranchControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $branches = Branch::factory()->count(3)->create();

        $response = $this->get(route('branches.index'));

        $response->assertOk();
        $response->assertViewIs('branch.index');
        $response->assertViewHas('branches');
    }


    #[Test]
    public function create_displays_view(): void
    {
        $response = $this->get(route('branches.create'));

        $response->assertOk();
        $response->assertViewIs('branch.create');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\BranchController::class,
            'store',
            \App\Http\Requests\BranchStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $code = fake()->word();
        $name = fake()->name();
        $is_active = fake()->boolean();

        $response = $this->post(route('branches.store'), [
            'code' => $code,
            'name' => $name,
            'is_active' => $is_active,
        ]);

        $branches = Branch::query()
            ->where('code', $code)
            ->where('name', $name)
            ->where('is_active', $is_active)
            ->get();
        $this->assertCount(1, $branches);
        $branch = $branches->first();

        $response->assertRedirect(route('branches.index'));
        $response->assertSessionHas('branch.id', $branch->id);
    }


    #[Test]
    public function show_displays_view(): void
    {
        $branch = Branch::factory()->create();

        $response = $this->get(route('branches.show', $branch));

        $response->assertOk();
        $response->assertViewIs('branch.show');
        $response->assertViewHas('branch');
    }


    #[Test]
    public function edit_displays_view(): void
    {
        $branch = Branch::factory()->create();

        $response = $this->get(route('branches.edit', $branch));

        $response->assertOk();
        $response->assertViewIs('branch.edit');
        $response->assertViewHas('branch');
    }


    #[Test]
    public function update_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\BranchController::class,
            'update',
            \App\Http\Requests\BranchUpdateRequest::class
        );
    }

    #[Test]
    public function update_redirects(): void
    {
        $branch = Branch::factory()->create();
        $code = fake()->word();
        $name = fake()->name();
        $is_active = fake()->boolean();

        $response = $this->put(route('branches.update', $branch), [
            'code' => $code,
            'name' => $name,
            'is_active' => $is_active,
        ]);

        $branch->refresh();

        $response->assertRedirect(route('branches.index'));
        $response->assertSessionHas('branch.id', $branch->id);

        $this->assertEquals($code, $branch->code);
        $this->assertEquals($name, $branch->name);
        $this->assertEquals($is_active, $branch->is_active);
    }


    #[Test]
    public function destroy_deletes_and_redirects(): void
    {
        $branch = Branch::factory()->create();

        $response = $this->delete(route('branches.destroy', $branch));

        $response->assertRedirect(route('branches.index'));

        $this->assertSoftDeleted($branch);
    }
}
