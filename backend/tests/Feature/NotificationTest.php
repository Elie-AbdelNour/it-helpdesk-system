<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Priority;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Database\Seeders\CategoriesSeeder;
use Database\Seeders\PrioritiesSeeder;
use Database\Seeders\RolesSeeder;
use Database\Seeders\StatusesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_assignment_comment_and_status_change_create_notifications(): void
    {
        $this->seed([RolesSeeder::class, CategoriesSeeder::class, PrioritiesSeeder::class, StatusesSeeder::class]);

        $employee = $this->createUser('Employee', 'employee@example.test');
        $agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();
        $inProgress = Status::where('name', 'In Progress')->firstOrFail();

        Sanctum::actingAs($employee);
        $ticketId = $this->postJson('/api/tickets', [
            'subject' => 'VPN down',
            'description' => 'Cannot connect.',
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

        $this->postJson("/api/tickets/{$ticketId}/status", ['statusid' => $inProgress->id])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'userid' => $employee->id,
            'ticketid' => $ticketId,
            'type' => 'status',
        ]);

        $this->postJson("/api/tickets/{$ticketId}/comments", [
            'commenttext' => 'Working on it',
        ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'userid' => $employee->id,
            'ticketid' => $ticketId,
            'type' => 'comment',
        ]);

        Sanctum::actingAs($employee);
        $response = $this->getJson('/api/notifications')->assertOk();
        $this->assertGreaterThanOrEqual(2, $response->json('unreadcount'));

        $notificationId = $response->json('data.0.id');
        $this->postJson("/api/notifications/{$notificationId}/read")->assertOk();
        $this->assertDatabaseHas('notifications', ['id' => $notificationId, 'isread' => true]);

        $this->postJson('/api/notifications/read-all')->assertNoContent();
        $this->assertDatabaseMissing('notifications', ['userid' => $employee->id, 'isread' => false]);
    }

    public function test_user_cannot_mark_another_users_notification_read(): void
    {
        $this->seed(RolesSeeder::class);
        $owner = $this->createUser('Employee', 'owner@example.test');
        $intruder = $this->createUser('Employee', 'intruder@example.test');

        $notification = \App\Models\Notification::create([
            'userid' => $owner->id,
            'message' => 'test',
            'type' => 'general',
        ]);

        Sanctum::actingAs($intruder);
        $this->postJson("/api/notifications/{$notification->id}/read")->assertForbidden();
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
