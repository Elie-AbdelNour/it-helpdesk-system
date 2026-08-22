<?php

namespace Tests\Feature;

use App\Mail\TicketNotificationMail;
use App\Models\Category;
use App\Models\Priority;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\CategoriesSeeder;
use Database\Seeders\PrioritiesSeeder;
use Database\Seeders\RolesSeeder;
use Database\Seeders\StatusesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_read_and_update_settings(): void
    {
        $this->seed(RolesSeeder::class);
        $admin = $this->createUser('Admin', 'admin@example.test');

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/settings')->assertOk()->assertJsonPath('email_notifications_enabled', '1');

        $this->patchJson('/api/admin/settings', [
            'key' => 'email_notifications_enabled',
            'value' => '0',
        ])->assertOk();

        $this->assertDatabaseHas('settings', [
            'settingkey' => 'email_notifications_enabled',
            'settingvalue' => '0',
        ]);
    }

    public function test_non_admin_cannot_update_settings(): void
    {
        $this->seed(RolesSeeder::class);
        $employee = $this->createUser('Employee', 'employee@example.test');

        Sanctum::actingAs($employee);

        $this->patchJson('/api/admin/settings', [
            'key' => 'email_notifications_enabled',
            'value' => '0',
        ])->assertForbidden();
    }

    public function test_disabling_email_notifications_stops_emails_but_keeps_in_app_notifications(): void
    {
        Mail::fake();
        $this->seed([RolesSeeder::class, CategoriesSeeder::class, PrioritiesSeeder::class, StatusesSeeder::class]);

        $admin = $this->createUser('Admin', 'admin@example.test');
        $employee = $this->createUser('Employee', 'employee@example.test');
        $agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();

        Sanctum::actingAs($admin);
        $this->patchJson('/api/admin/settings', [
            'key' => 'email_notifications_enabled',
            'value' => '0',
        ])->assertOk();

        Sanctum::actingAs($employee);
        $ticketId = $this->postJson('/api/tickets', [
            'subject' => 'Cannot reach file share',
            'description' => 'Network drive unreachable.',
            'categoryid' => $category->id,
            'priorityid' => $priority->id,
        ])->assertCreated()->json('id');

        Sanctum::actingAs($agent);
        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $agent->id])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'userid' => $agent->id,
            'ticketid' => $ticketId,
            'type' => 'assignment',
        ]);
        Mail::assertNotSent(TicketNotificationMail::class);
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
