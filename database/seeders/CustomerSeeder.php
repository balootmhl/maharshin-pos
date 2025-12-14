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
                'name' => 'Aung Kyaw',
                'phone' => '+95 9 111 222 333',
                'email' => 'aungkyaw@email.com',
                'address' => '123 Shwedagon Road, Yangon',
                'credit_limit' => 500000,
                'current_balance' => 0,
            ],
            [
                'code' => 'CUST002',
                'name' => 'Ma Thida',
                'phone' => '+95 9 222 333 444',
                'email' => 'mathida@email.com',
                'address' => '456 Bogyoke Street, Yangon',
                'credit_limit' => 300000,
                'current_balance' => 50000,
            ],
            [
                'code' => 'CUST003',
                'name' => 'Ko Zaw',
                'phone' => '+95 9 333 444 555',
                'email' => 'kozaw@email.com',
                'address' => '789 Anawrahta Road, Yangon',
                'credit_limit' => 200000,
                'current_balance' => 0,
            ],
            [
                'code' => 'CUST004',
                'name' => 'Daw Mya',
                'phone' => '+95 9 444 555 666',
                'email' => null,
                'address' => '111 35th Street, Mandalay',
                'credit_limit' => 100000,
                'current_balance' => 25000,
            ],
            [
                'code' => 'CUST005',
                'name' => 'U Hla Myint',
                'phone' => '+95 9 555 666 777',
                'email' => 'hlamyint@email.com',
                'address' => '222 Pyay Road, Yangon',
                'credit_limit' => 1000000,
                'current_balance' => 0,
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create(array_merge($customer, ['is_active' => true]));
        }
    }
}
