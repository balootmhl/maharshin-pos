<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchModulePassword;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ModulePasswordGatingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['project.super_admin' => 'god']);
        Role::findOrCreate('god');
        Role::findOrCreate('manager');
    }

    public function test_normal_user_is_not_gated_when_no_password_configured()
    {
        $branch = Branch::factory()->create(['is_active' => true]);
        /** @var User $manager */
        $manager = User::factory()->create([
            'branch_id' => $branch->id,
        ]);
        $manager->assignRole('manager');

        $this->actingAs($manager);

        // Access purchases list - should pass without gating redirect
        $response = $this->get(route('purchases.index'));
        $response->assertOk();
    }

    public function test_normal_user_is_gated_and_redirected_when_password_configured()
    {
        $branch = Branch::factory()->create(['is_active' => true]);
        /** @var User $manager */
        $manager = User::factory()->create([
            'branch_id' => $branch->id,
        ]);
        $manager->assignRole('manager');

        // Lock purchase module
        BranchModulePassword::create([
            'branch_id' => $branch->id,
            'module' => 'purchase',
            'password' => bcrypt('secret-lock'),
        ]);

        $this->actingAs($manager);

        // Try to access purchases list - should redirect to prompt
        $response = $this->get(route('purchases.index'));
        $response->assertRedirect(route('modules.unlock.prompt', ['module' => 'purchase']));

        // Assert session intended url is saved
        $this->assertEquals(route('purchases.index'), session('module_unlock_intended_url'));
    }

    public function test_normal_user_can_unlock_module_with_correct_password()
    {
        $branch = Branch::factory()->create(['is_active' => true]);
        /** @var User $manager */
        $manager = User::factory()->create([
            'branch_id' => $branch->id,
        ]);
        $manager->assignRole('manager');

        // Lock purchase module
        BranchModulePassword::create([
            'branch_id' => $branch->id,
            'module' => 'purchase',
            'password' => bcrypt('secret-lock'),
        ]);

        $this->actingAs($manager);

        // Store intended URL in session
        session(['module_unlock_intended_url' => route('purchases.index')]);

        // Submit correct password
        $response = $this->post(route('modules.unlock.submit', ['module' => 'purchase']), [
            'password' => 'secret-lock',
        ]);

        $response->assertRedirect(route('purchases.index'));
        $this->assertTrue(session("unlocked_modules.{$branch->id}.purchase"));

        // subsequent accesses pass
        $responseIndex = $this->get(route('purchases.index'));
        $responseIndex->assertOk();
    }

    public function test_unlock_fails_with_incorrect_password()
    {
        $branch = Branch::factory()->create(['is_active' => true]);
        /** @var User $manager */
        $manager = User::factory()->create([
            'branch_id' => $branch->id,
        ]);
        $manager->assignRole('manager');

        // Lock purchase module
        BranchModulePassword::create([
            'branch_id' => $branch->id,
            'module' => 'purchase',
            'password' => bcrypt('secret-lock'),
        ]);

        $this->actingAs($manager);

        // Submit incorrect password
        $response = $this->post(route('modules.unlock.submit', ['module' => 'purchase']), [
            'password' => 'wrong-pass',
        ]);

        $response->assertSessionHasErrors(['password']);
        $this->assertFalse(session()->has("unlocked_modules.{$branch->id}.purchase"));
    }

    public function test_god_user_bypasses_all_gates()
    {
        $branch = Branch::factory()->create(['is_active' => true]);
        /** @var User $god */
        $god = User::factory()->create([
            'branch_id' => null,
        ]);
        $god->assignRole('god');

        // Lock purchase module for the branch
        BranchModulePassword::create([
            'branch_id' => $branch->id,
            'module' => 'purchase',
            'password' => bcrypt('secret-lock'),
        ]);

        $this->actingAs($god);

        // God user should access purchases list without gate redirect
        $response = $this->get(route('purchases.index'));
        $response->assertOk();
    }

    public function test_password_configuration_is_restricted_to_god_users()
    {
        $branch = Branch::factory()->create(['is_active' => true]);
        /** @var User $manager */
        $manager = User::factory()->create([
            'branch_id' => $branch->id,
        ]);
        $manager->assignRole('manager');

        /** @var User $god */
        $god = User::factory()->create([
            'branch_id' => null,
        ]);
        $god->assignRole('god');

        // 1. Manager attempts to save module passwords - should return 403 (restricted by god middleware)
        $this->actingAs($manager);
        $response = $this->post(route('branches.module-passwords.update', ['branch' => $branch->id]), [
            'sale' => ['locked' => true, 'password' => 'new-pass-123'],
            'purchase' => ['locked' => false, 'password' => ''],
            'inventory' => ['locked' => false, 'password' => ''],
            'customer' => ['locked' => false, 'password' => ''],
            'supplier' => ['locked' => false, 'password' => ''],
        ]);
        $response->assertForbidden();

        // 2. God user saves module passwords - should succeed
        $this->actingAs($god);
        $responseGod = $this->post(route('branches.module-passwords.update', ['branch' => $branch->id]), [
            'sale' => ['locked' => true, 'password' => 'new-pass-123'],
            'purchase' => ['locked' => false, 'password' => ''],
            'inventory' => ['locked' => false, 'password' => ''],
            'customer' => ['locked' => false, 'password' => ''],
            'supplier' => ['locked' => false, 'password' => ''],
        ]);
        $responseGod->assertRedirect(route('branches.edit', $branch->id));

        $this->assertTrue(BranchModulePassword::where('branch_id', $branch->id)->where('module', 'sale')->exists());
    }
}
