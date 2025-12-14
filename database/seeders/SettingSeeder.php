<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['key' => 'company_name', 'value' => 'Mahar Shin POS', 'group' => 'general'],
            ['key' => 'company_address', 'value' => 'Yangon, Myanmar', 'group' => 'general'],
            ['key' => 'company_phone', 'value' => '+95 9 123 456 789', 'group' => 'general'],
            ['key' => 'company_email', 'value' => 'contact@maharshin.com', 'group' => 'general'],
            ['key' => 'currency', 'value' => 'MMK', 'group' => 'general'],
            ['key' => 'currency_symbol', 'value' => 'Ks', 'group' => 'general'],
            ['key' => 'tax_rate', 'value' => '0', 'group' => 'tax'],
            ['key' => 'receipt_footer', 'value' => 'Thank you for shopping with us!', 'group' => 'receipt'],
            ['key' => 'low_stock_threshold', 'value' => '10', 'group' => 'inventory'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }
    }
}
