<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\SettingController
 */
final class SettingControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $response = $this->get(route('settings.index'));

        $response->assertOk();
        $response->assertViewIs('setting.index');
        $response->assertViewHas('settings');
    }


    #[Test]
    public function update_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\SettingController::class,
            'update',
            \App\Http\Requests\SettingUpdateRequest::class
        );
    }

    #[Test]
    public function update_saves(): void
    {
        $setting = Setting::factory()->create();
        $key = fake()->word();
        $value = fake()->text();

        $response = $this->put(route('settings.update', $setting), [
            'key' => $key,
            'value' => $value,
        ]);

        $settings = Setting::query()
            ->where('key', $key)
            ->where('value', $value)
            ->get();
        $this->assertCount(1, $settings);
        $setting = $settings->first();
    }
}
