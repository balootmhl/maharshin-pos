<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\ProductController
 */
final class ProductControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $products = Product::factory()->count(3)->create();

        $response = $this->get(route('products.index'));

        $response->assertOk();
        $response->assertViewIs('product.index');
        $response->assertViewHas('products');
    }


    #[Test]
    public function create_displays_view(): void
    {
        $response = $this->get(route('products.create'));

        $response->assertOk();
        $response->assertViewIs('product.create');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\ProductController::class,
            'store',
            \App\Http\Requests\ProductStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $code = fake()->word();
        $name = fake()->name();
        $category = Category::factory()->create();
        $unit = fake()->word();
        $cost_price = fake()->randomFloat(/** decimal_attributes **/);
        $selling_price = fake()->randomFloat(/** decimal_attributes **/);
        $tax_rate = fake()->randomFloat(/** decimal_attributes **/);
        $low_stock_alert = fake()->numberBetween(-10000, 10000);
        $is_active = fake()->boolean();
        $creator = User::factory()->create();
        $updater = User::factory()->create();

        $response = $this->post(route('products.store'), [
            'code' => $code,
            'name' => $name,
            'category_id' => $category->id,
            'unit' => $unit,
            'cost_price' => $cost_price,
            'selling_price' => $selling_price,
            'tax_rate' => $tax_rate,
            'low_stock_alert' => $low_stock_alert,
            'is_active' => $is_active,
            'creator_id' => $creator->id,
            'updater_id' => $updater->id,
        ]);

        $products = Product::query()
            ->where('code', $code)
            ->where('name', $name)
            ->where('category_id', $category->id)
            ->where('unit', $unit)
            ->where('cost_price', $cost_price)
            ->where('selling_price', $selling_price)
            ->where('tax_rate', $tax_rate)
            ->where('low_stock_alert', $low_stock_alert)
            ->where('is_active', $is_active)
            ->where('creator_id', $creator->id)
            ->where('updater_id', $updater->id)
            ->get();
        $this->assertCount(1, $products);
        $product = $products->first();

        $response->assertRedirect(route('products.index'));
        $response->assertSessionHas('product.id', $product->id);
    }


    #[Test]
    public function show_displays_view(): void
    {
        $product = Product::factory()->create();

        $response = $this->get(route('products.show', $product));

        $response->assertOk();
        $response->assertViewIs('product.show');
        $response->assertViewHas('product');
    }


    #[Test]
    public function edit_displays_view(): void
    {
        $product = Product::factory()->create();

        $response = $this->get(route('products.edit', $product));

        $response->assertOk();
        $response->assertViewIs('product.edit');
        $response->assertViewHas('product');
    }


    #[Test]
    public function update_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\ProductController::class,
            'update',
            \App\Http\Requests\ProductUpdateRequest::class
        );
    }

    #[Test]
    public function update_redirects(): void
    {
        $product = Product::factory()->create();
        $code = fake()->word();
        $name = fake()->name();
        $category = Category::factory()->create();
        $unit = fake()->word();
        $cost_price = fake()->randomFloat(/** decimal_attributes **/);
        $selling_price = fake()->randomFloat(/** decimal_attributes **/);
        $tax_rate = fake()->randomFloat(/** decimal_attributes **/);
        $low_stock_alert = fake()->numberBetween(-10000, 10000);
        $is_active = fake()->boolean();
        $creator = User::factory()->create();
        $updater = User::factory()->create();

        $response = $this->put(route('products.update', $product), [
            'code' => $code,
            'name' => $name,
            'category_id' => $category->id,
            'unit' => $unit,
            'cost_price' => $cost_price,
            'selling_price' => $selling_price,
            'tax_rate' => $tax_rate,
            'low_stock_alert' => $low_stock_alert,
            'is_active' => $is_active,
            'creator_id' => $creator->id,
            'updater_id' => $updater->id,
        ]);

        $product->refresh();

        $response->assertRedirect(route('products.index'));
        $response->assertSessionHas('product.id', $product->id);

        $this->assertEquals($code, $product->code);
        $this->assertEquals($name, $product->name);
        $this->assertEquals($category->id, $product->category_id);
        $this->assertEquals($unit, $product->unit);
        $this->assertEquals($cost_price, $product->cost_price);
        $this->assertEquals($selling_price, $product->selling_price);
        $this->assertEquals($tax_rate, $product->tax_rate);
        $this->assertEquals($low_stock_alert, $product->low_stock_alert);
        $this->assertEquals($is_active, $product->is_active);
        $this->assertEquals($creator->id, $product->creator_id);
        $this->assertEquals($updater->id, $product->updater_id);
    }


    #[Test]
    public function destroy_deletes_and_redirects(): void
    {
        $product = Product::factory()->create();

        $response = $this->delete(route('products.destroy', $product));

        $response->assertRedirect(route('products.index'));

        $this->assertSoftDeleted($product);
    }
}
