<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Priority;
use App\Models\Role;
use App\Models\Status;
use App\Models\Ticket;
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

    private User $employee;

    private User $agent;

    private User $admin;

    private Ticket $ticket;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            RolesSeeder::class,
            CategoriesSeeder::class,
            PrioritiesSeeder::class,
            StatusesSeeder::class,
        ]);

        $this->employee = $this->createUser('Employee', 'employee@example.test');
        $this->agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $this->admin = $this->createUser('Admin', 'admin@example.test');

        Sanctum::actingAs($this->employee);
        $ticketId = $this
            ->postJson('/api/tickets', [
                'subject' => 'Monitor flickering',
                'description' => 'External monitor flickers on wake.',
                'categoryid' => Category::firstOrFail()->id,
                'priorityid' => Priority::where('name', 'Medium')->firstOrFail()->id,
            ])
            ->assertCreated()
            ->json('id');

        $this->ticket = Ticket::findOrFail($ticketId);
    }

    public function test_assigning_a_ticket_notifies_the_agent(): void
    {
        Sanctum::actingAs($this->admin);

        $this
            ->postJson("/api/tickets/{$this->ticket->id}/assign", ['assignedto' => $this->agent->id])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'userid' => $this->agent->id,
            'ticketid' => $this->ticket->id,
            'type' => 'assignment',
            'isread' => false,
        ]);
    }

    public function test_status_change_notifies_the_creator_but_not_the_actor(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/tickets/{$this->ticket->id}/assign", ['assignedto' => $this->agent->id]);

        $resolvedStatus = Status::where('name', 'In Progress')->firstOrFail();

        Sanctum::actingAs($this->agent);
        $this
            ->postJson("/api/tickets/{$this->ticket->id}/status", ['statusid' => $resolvedStatus->id])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'userid' => $this->employee->id,
            'ticketid' => $this->ticket->id,
            'type' => 'status',
        ]);
        $this->assertDatabaseMissing('notifications', [
            'userid' => $this->agent->id,
            'type' => 'status',
        ]);
    }

    public function test_comment_from_creator_notifies_the_assigned_agent(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/tickets/{$this->ticket->id}/assign", ['assignedto' => $this->agent->id]);

        Sanctum::actingAs($this->employee);
        $this
            ->postJson("/api/tickets/{$this->ticket->id}/comments", ['commenttext' => 'Any update?'])
            ->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'userid' => $this->agent->id,
            'ticketid' => $this->ticket->id,
            'type' => 'comment',
        ]);
    }

    public function test_internal_note_does_not_notify_the_creator(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/tickets/{$this->ticket->id}/assign", ['assignedto' => $this->agent->id]);

        Sanctum::actingAs($this->agent);
        $this
            ->postJson("/api/tickets/{$this->ticket->id}/comments", [
                'commenttext' => 'Internal note only',
                'isinternal' => true,
            ])
            ->assertCreated();

        $this->assertDatabaseMissing('notifications', [
            'userid' => $this->employee->id,
            'type' => 'comment',
        ]);
    }

    public function test_user_can_list_and_mark_their_notifications_read(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/tickets/{$this->ticket->id}/assign", ['assignedto' => $this->agent->id]);

        Sanctum::actingAs($this->agent);
        $notification = $this
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('unreadcount', 1)
            ->json('data.0');

        $this
            ->postJson("/api/notifications/{$notification['id']}/read")
            ->assertOk()
            ->assertJsonPath('isread', true);

        $this
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('unreadcount', 0);
    }

    public function test_user_cannot_mark_another_users_notification_read(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/tickets/{$this->ticket->id}/assign", ['assignedto' => $this->agent->id]);

        $notificationId = \App\Models\Notification::where('userid', $this->agent->id)->firstOrFail()->id;

        Sanctum::actingAs($this->employee);
        $this
            ->postJson("/api/notifications/{$notificationId}/read")
            ->assertForbidden();
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
