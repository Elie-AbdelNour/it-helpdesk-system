<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Priority;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\CategoriesSeeder;
use Database\Seeders\PrioritiesSeeder;
use Database\Seeders\RolesSeeder;
use Database\Seeders\StatusesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PriorityUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_priority_sla_target(): void
    {
        $this->seed(RolesSeeder::class);
        $admin = $this->createUser('Admin', 'admin@example.test');
        $priority = Priority::create(['name' => 'Medium', 'level' => 2, 'targetresolutionhours' => 48]);

        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/priorities/{$priority->id}", [
            'targetresolutionhours' => 30,
        ])->assertOk()->assertJsonPath('targetresolutionhours', 30);

        $this->assertDatabaseHas('priorities', ['id' => $priority->id, 'targetresolutionhours' => 30]);
    }

    public function test_non_admin_cannot_update_priority(): void
    {
        $this->seed(RolesSeeder::class);
        $employee = $this->createUser('Employee', 'employee@example.test');
        $priority = Priority::create(['name' => 'Medium', 'level' => 2, 'targetresolutionhours' => 48]);

        Sanctum::actingAs($employee);

        $this->patchJson("/api/admin/priorities/{$priority->id}", [
            'targetresolutionhours' => 30,
        ])->assertForbidden();
    }

    public function test_new_ticket_picks_up_updated_sla_target(): void
    {
        $this->seed([RolesSeeder::class, CategoriesSeeder::class, PrioritiesSeeder::class, StatusesSeeder::class]);

        $admin = $this->createUser('Admin', 'admin@example.test');
        $employee = $this->createUser('Employee', 'employee@example.test');
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();

        Sanctum::actingAs($admin);
        $this->patchJson("/api/admin/priorities/{$priority->id}", [
            'targetresolutionhours' => 30,
        ])->assertOk();

        Sanctum::actingAs($employee);
        $this->postJson('/api/tickets', [
            'subject' => 'Slow laptop',
            'description' => 'Takes minutes to boot.',
            'categoryid' => $category->id,
            'priorityid' => $priority->id,
        ])->assertCreated()->assertJsonPath('targetresolutionhours', 30);
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
