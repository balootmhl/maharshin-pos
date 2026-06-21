<?php

use App\Models\User;
use App\Models\Branch;
use Spatie\Permission\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    config(['project.super_admin' => 'god']);
    Role::findOrCreate('god');
    Role::findOrCreate('manager');
});

test('non-god users are forbidden from accessing restricted pages', function (string $url) {
    $user = User::factory()->create();
    $user->assignRole('manager');

    $this->actingAs($user)
        ->get($url)
        ->assertStatus(403);
})->with([
    '/branches',
    '/users',
    '/roles',
    '/settings',
    '/playground',
]);

test('god users can access restricted pages', function (string $url) {
    $user = User::factory()->create();
    $user->assignRole('god');

    $this->actingAs($user)
        ->get($url)
        ->assertOk();
})->with([
    '/branches',
    '/users',
    '/roles',
    '/settings',
    '/playground',
]);

test('general users can still access profile and appearance settings', function (string $url) {
    $user = User::factory()->create();
    $user->assignRole('manager');

    $this->actingAs($user)
        ->get($url)
        ->assertOk();
})->with([
    '/settings/profile',
    '/settings/password',
    '/settings/appearance',
]);
