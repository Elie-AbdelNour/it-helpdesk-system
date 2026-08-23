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

class TicketAssignmentAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $manager;

    private User $agent;

    private User $otherAgent;

    private User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            RolesSeeder::class,
            CategoriesSeeder::class,
            PrioritiesSeeder::class,
            StatusesSeeder::class,
        ]);

        $this->admin = $this->createUser('Admin', 'admin@example.test');
        $this->manager = $this->createUser('Manager', 'manager@example.test');
        $this->agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $this->otherAgent = $this->createUser('IT Support Agent', 'other.agent@example.test');
        $this->employee = $this->createUser('Employee', 'employee@example.test');
    }

    public function test_it_agent_can_only_claim_an_unassigned_ticket_for_themselves(): void
    {
        $ticketId = $this->createTicket();

        Sanctum::actingAs($this->agent);
        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $this->otherAgent->id])
            ->assertUnprocessable();

        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $this->agent->id])
            ->assertOk()
            ->assertJsonPath('assignedto', $this->agent->id);

        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $this->agent->id])
            ->assertUnprocessable();

        $this->assertDatabaseCount('assignmenthistories', 1);
    }

    public function test_manager_and_admin_can_only_assign_tickets_to_it_agents(): void
    {
        $ticketId = $this->createTicket();

        Sanctum::actingAs($this->manager);
        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $this->admin->id])
            ->assertUnprocessable();
        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $this->agent->id])
            ->assertOk()
            ->assertJsonPath('assignedto', $this->agent->id);

        Sanctum::actingAs($this->admin);
        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $this->manager->id])
            ->assertUnprocessable();
        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $this->otherAgent->id])
            ->assertOk()
            ->assertJsonPath('assignedto', $this->otherAgent->id);
    }

    public function test_assignable_user_lookup_is_role_specific(): void
    {
        Sanctum::actingAs($this->agent);
        $this->getJson('/api/assignable-users')
            ->assertForbidden();

        Sanctum::actingAs($this->manager);
        $this->getJson('/api/assignable-users')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['email' => $this->agent->email])
            ->assertJsonFragment(['email' => $this->otherAgent->email])
            ->assertJsonMissing(['email' => $this->admin->email]);
    }

    public function test_it_agent_escalates_their_ticket_to_the_shared_management_queue(): void
    {
        $ticketId = $this->createTicket();

        Sanctum::actingAs($this->agent);
        $this->postJson("/api/tickets/{$ticketId}/escalate", [
            'notes' => 'Needs supervisor review',
        ])->assertUnprocessable();

        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $this->agent->id])
            ->assertOk();

        $this->postJson("/api/tickets/{$ticketId}/escalate", [
            'notes' => 'Needs supervisor review',
        ])->assertOk()
            ->assertJsonPath('assignedto', null)
            ->assertJsonPath('open_escalation.reason', 'Needs supervisor review')
            ->assertJsonPath('open_escalation.escalatedby', $this->agent->id);

        $this->assertDatabaseHas('ticketescalations', [
            'ticketid' => $ticketId,
            'escalatedby' => $this->agent->id,
            'reviewedat' => null,
        ]);
        $this->assertDatabaseHas('notifications', [
            'userid' => $this->admin->id,
            'ticketid' => $ticketId,
            'type' => 'escalation',
        ]);
        $this->assertDatabaseHas('notifications', [
            'userid' => $this->manager->id,
            'ticketid' => $ticketId,
            'type' => 'escalation',
        ]);
    }

    public function test_it_ticket_lists_show_only_their_assignments_or_the_open_queue(): void
    {
        $agentTicketId = $this->createTicket();
        $otherAgentTicketId = $this->createTicket();
        $unassignedTicketId = $this->createTicket();

        Sanctum::actingAs($this->manager);
        $this->postJson("/api/tickets/{$agentTicketId}/assign", ['assignedto' => $this->agent->id])
            ->assertOk();
        $this->postJson("/api/tickets/{$otherAgentTicketId}/assign", ['assignedto' => $this->otherAgent->id])
            ->assertOk();

        Sanctum::actingAs($this->agent);
        $this->getJson('/api/tickets')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $agentTicketId);

        $this->getJson('/api/tickets?unassigned=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $unassignedTicketId);

        $this->postJson("/api/tickets/{$agentTicketId}/escalate", [
            'notes' => 'Needs supervisor review',
        ])->assertOk();

        $this->getJson('/api/tickets')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        Sanctum::actingAs($this->manager);
        $this->getJson('/api/tickets?escalated=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $agentTicketId);
        $this->getJson('/api/tickets?unassigned=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $unassignedTicketId);

        $this->postJson("/api/tickets/{$agentTicketId}/assign", [
            'assignedto' => $this->otherAgent->id,
            'notes' => 'Assigned after management review',
        ])->assertOk();

        $this->getJson('/api/tickets?escalated=1')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->assertDatabaseHas('ticketescalations', [
            'ticketid' => $agentTicketId,
            'reviewedby' => $this->manager->id,
            'assignedto' => $this->otherAgent->id,
        ]);
    }

    private function createTicket(): int
    {
        Sanctum::actingAs($this->employee);

        return $this->postJson('/api/tickets', [
            'subject' => 'Assignment authorization test',
            'description' => 'Verify role-specific assignment rules.',
            'categoryid' => Category::firstOrFail()->id,
            'priorityid' => Priority::where('name', 'Low')->firstOrFail()->id,
        ])->assertCreated()->json('id');
    }

    private function createUser(string $roleName, string $email): User
    {
        return User::create([
            'roleid' => Role::where('rolename', $roleName)->firstOrFail()->id,
            'fullname' => $roleName.' User '.$email,
            'email' => $email,
            'passwordhash' => 'Password123!',
            'isactive' => true,
        ]);
    }
}
