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

class TicketFixesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $agent;

    private User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        // Sanctum only starts a session for requests it recognizes as coming
        // from the SPA (matched against SANCTUM_STATEFUL_DOMAINS); without
        // this header, session()-dependent endpoints like /register and
        // /login blow up in tests even though they work fine from the browser.
        $this->withHeader('referer', 'http://localhost:5173');

        $this->seed([
            RolesSeeder::class,
            CategoriesSeeder::class,
            PrioritiesSeeder::class,
            StatusesSeeder::class,
        ]);

        $this->admin = $this->createUser('Admin', 'admin@example.test');
        $this->agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $this->employee = $this->createUser('Employee', 'employee@example.test');
    }

    public function test_reopening_a_resolved_ticket_clears_resolution_state(): void
    {
        $ticketId = $this->createTicket('Medium');

        Sanctum::actingAs($this->admin);
        $resolved = Status::where('name', 'Resolved')->firstOrFail();
        $inProgress = Status::where('name', 'In Progress')->firstOrFail();

        $this
            ->postJson("/api/tickets/{$ticketId}/status", ['statusid' => $resolved->id])
            ->assertOk()
            ->assertJsonPath('resolutionstate', 'resolved_within_target')
            ->assertJsonPath('resolvedat', fn ($value) => $value !== null);

        $this
            ->postJson("/api/tickets/{$ticketId}/status", ['statusid' => $inProgress->id, 'notes' => 'Issue recurred'])
            ->assertOk()
            ->assertJsonPath('resolvedat', null)
            ->assertJsonPath('resolutionstate', fn ($value) => in_array($value, ['open', 'overdue'], true));
    }

    public function test_employee_can_only_delete_their_own_untouched_ticket(): void
    {
        $ticketId = $this->createTicket('Low');

        Sanctum::actingAs($this->employee);
        $this->deleteJson("/api/tickets/{$ticketId}")->assertNoContent();
        $this->assertDatabaseMissing('tickets', ['id' => $ticketId]);

        $touchedTicketId = $this->createTicket('Low');
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/tickets/{$touchedTicketId}/assign", ['assignedto' => $this->agent->id])->assertOk();

        Sanctum::actingAs($this->employee);
        $this->deleteJson("/api/tickets/{$touchedTicketId}")->assertForbidden();
        $this->assertDatabaseHas('tickets', ['id' => $touchedTicketId]);

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/tickets/{$touchedTicketId}")->assertNoContent();
        $this->assertDatabaseMissing('tickets', ['id' => $touchedTicketId]);
    }

    public function test_escalation_requires_a_higher_priority_and_is_restricted_to_managing_roles(): void
    {
        $ticketId = $this->createTicket('Low');
        $low = Priority::where('name', 'Low')->firstOrFail();
        $high = Priority::where('name', 'High')->firstOrFail();

        Sanctum::actingAs($this->employee);
        $this
            ->postJson("/api/tickets/{$ticketId}/escalate", ['priorityid' => $high->id, 'notes' => 'Please help'])
            ->assertForbidden();

        Sanctum::actingAs($this->agent);
        $this
            ->postJson("/api/tickets/{$ticketId}/escalate", ['priorityid' => $low->id, 'notes' => 'Same priority'])
            ->assertUnprocessable();

        $this
            ->postJson("/api/tickets/{$ticketId}/escalate", [
                'priorityid' => $high->id,
                'assignedto' => $this->admin->id,
                'notes' => 'Customer is blocked, needs immediate attention',
            ])
            ->assertOk()
            ->assertJsonPath('priorityid', $high->id)
            ->assertJsonPath('assignedto', $this->admin->id)
            ->assertJsonPath('targetresolutionhours', $high->targetresolutionhours);

        $this->assertDatabaseHas('activitylogs', [
            'entitytype' => 'ticket',
            'entityid' => $ticketId,
            'action' => 'ticket_escalated',
        ]);
        $this->assertDatabaseHas('assignmenthistories', [
            'ticketid' => $ticketId,
            'assignedto' => $this->admin->id,
        ]);
    }

    public function test_authentication_events_are_recorded_in_activity_log(): void
    {
        $this
            ->postJson('/api/register', [
                'fullname' => 'New Person',
                'email' => 'new.person@example.test',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ])
            ->assertCreated();

        $newUser = User::where('email', 'new.person@example.test')->firstOrFail();
        $this->assertDatabaseHas('activitylogs', ['userid' => $newUser->id, 'action' => 'user_registered']);

        $this
            ->postJson('/api/login', ['email' => 'wrong@example.test', 'password' => 'wrong-password'])
            ->assertUnprocessable();
        $this->assertDatabaseHas('activitylogs', ['action' => 'user_login_failed']);

        $this
            ->postJson('/api/login', ['email' => $this->employee->email, 'password' => 'Password123!'])
            ->assertOk();
        $this->assertDatabaseHas('activitylogs', ['userid' => $this->employee->id, 'action' => 'user_login']);

        Sanctum::actingAs($this->employee);
        $this->postJson('/api/logout')->assertNoContent();
        $this->assertDatabaseHas('activitylogs', ['userid' => $this->employee->id, 'action' => 'user_logout']);
    }

    private function createTicket(string $priorityName): int
    {
        Sanctum::actingAs($this->employee);

        $category = Category::firstOrFail();
        $priority = Priority::where('name', $priorityName)->firstOrFail();

        return $this
            ->postJson('/api/tickets', [
                'subject' => 'Test ticket',
                'description' => 'Test description',
                'categoryid' => $category->id,
                'priorityid' => $priority->id,
            ])
            ->assertCreated()
            ->json('id');
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
