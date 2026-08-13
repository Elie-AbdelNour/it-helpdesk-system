<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_create_and_update_users(): void
    {
        $this->seed(RolesSeeder::class);
        $admin = $this->createUser('Admin', 'admin@example.test');
        $employeeRole = Role::where('rolename', 'Employee')->firstOrFail();

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/users')->assertOk();

        $userId = $this->postJson('/api/admin/users', [
            'fullname' => 'New Hire',
            'email' => 'newhire@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'roleid' => $employeeRole->id,
        ])->assertCreated()->json('id');

        $this->patchJson("/api/admin/users/{$userId}", ['isactive' => false])
            ->assertOk()
            ->assertJsonPath('isactive', false);

        $this->assertDatabaseHas('users', ['id' => $userId, 'isactive' => false]);
    }

    public function test_non_admin_cannot_manage_users(): void
    {
        $this->seed(RolesSeeder::class);
        $employee = $this->createUser('Employee', 'employee@example.test');

        Sanctum::actingAs($employee);

        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_deactivated_user_cannot_log_in_with_password(): void
    {
        $this->withHeader('referer', 'http://localhost:5173');
        $this->seed(RolesSeeder::class);
        $user = $this->createUser('Employee', 'employee@example.test');
        $user->update(['isactive' => false]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123!',
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
