<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_their_own_profile(): void
    {
        $this->seed(RolesSeeder::class);
        $user = $this->createUser('Employee', 'employee@example.test');

        Sanctum::actingAs($user);

        $this->patchJson('/api/profile', [
            'fullname' => 'New Name',
            'phone' => '+961 71 000000',
        ])->assertOk()->assertJsonPath('fullname', 'New Name');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'fullname' => 'New Name']);
    }

    public function test_user_can_change_their_password_with_correct_current_password(): void
    {
        $this->seed(RolesSeeder::class);
        $user = $this->createUser('Employee', 'employee@example.test');

        Sanctum::actingAs($user);

        $this->postJson('/api/profile/password', [
            'current_password' => 'Password123!',
            'password' => 'NewPassword456!',
            'password_confirmation' => 'NewPassword456!',
        ])->assertOk();

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('NewPassword456!', $user->fresh()->passwordhash));
    }

    public function test_password_change_rejected_with_wrong_current_password(): void
    {
        $this->seed(RolesSeeder::class);
        $user = $this->createUser('Employee', 'employee@example.test');

        Sanctum::actingAs($user);

        $this->postJson('/api/profile/password', [
            'current_password' => 'WrongPassword!',
            'password' => 'NewPassword456!',
            'password_confirmation' => 'NewPassword456!',
        ])->assertStatus(422);
    }

    private function createUser(string $roleName, string $email): User
    {
        return User::create([
            'roleid' => Role::where('rolename', $roleName)->firstOrFail()->id,
            'fullname' => $roleName.' User',
            'email' => $email,
            'passwordhash' => 'Password123!',
            'isactive' => true,
        ]);
    }
}
