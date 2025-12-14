<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'code' => 'CUST001',
                'name' => 'U Kyaw Win',
                'phone' => '+95 9 111 222 333',
                'email' => 'kyawwin.farm@email.com',
                'address' => 'Pyapon Township, Ayeyarwady Region',
                'credit_limit' => 50000000,
                'current_balance' => 0,
            ],
            [
                'code' => 'CUST002',
                'name' => 'Daw Aye Aye Khin',
                'phone' => '+95 9 222 333 444',
                'email' => 'ayeayekhin@email.com',
                'address' => 'Daik-U Township, Bago Region',
                'credit_limit' => 30000000,
                'current_balance' => 8500000,
            ],
            [
                'code' => 'CUST003',
                'name' => 'Ko Zaw Min Htun',
                'phone' => '+95 9 333 444 555',
                'email' => 'zawminhtun@email.com',
                'address' => 'Monywa Township, Sagaing Region',
                'credit_limit' => 20000000,
                'current_balance' => 0,
            ],
            [
                'code' => 'CUST004',
                'name' => 'U Than Oo (Rice Farm)',
                'phone' => '+95 9 444 555 666',
                'email' => null,
                'address' => 'Kyaukse Township, Mandalay Region',
                'credit_limit' => 15000000,
                'current_balance' => 3200000,
            ],
            [
                'code' => 'CUST005',
                'name' => 'Golden Harvest Agriculture Co.',
                'phone' => '+95 9 555 666 777',
                'email' => 'goldharvest@email.com',
                'address' => 'Industrial Zone, Nay Pyi Taw',
                'credit_limit' => 100000000,
                'current_balance' => 0,
            ],
            [
                'code' => 'CUST006',
                'name' => 'U Hla Myint (Sugarcane)',
                'phone' => '+95 9 666 777 888',
                'email' => null,
                'address' => 'Myingyan Township, Mandalay Region',
                'credit_limit' => 25000000,
                'current_balance' => 5000000,
            ],
            [
                'code' => 'CUST007',
                'name' => 'Ma Thin Thin Aye',
                'phone' => '+95 9 777 888 999',
                'email' => 'thinthinaye@email.com',
                'address' => 'Pathein Township, Ayeyarwady Region',
                'credit_limit' => 10000000,
                'current_balance' => 0,
            ],
            [
                'code' => 'CUST008',
                'name' => 'Ayeyarwady Farmers Group',
                'phone' => '+95 9 888 999 000',
                'email' => 'ayefarmers@email.com',
                'address' => 'Hinthada Township, Ayeyarwady Region',
                'credit_limit' => 80000000,
                'current_balance' => 12000000,
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create(array_merge($customer, ['is_active' => true]));
        }
    }
}
