<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Priority;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CategoriesSeeder;
use Database\Seeders\PrioritiesSeeder;
use Database\Seeders\RolesSeeder;
use Database\Seeders\StatusesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_workflow_tracks_assignment_comments_history_and_real_resolution_duration(): void
    {
        $this->beforeApplicationDestroyed(fn () => Carbon::setTestNow());

        $this->seed([
            RolesSeeder::class,
            CategoriesSeeder::class,
            PrioritiesSeeder::class,
            StatusesSeeder::class,
        ]);

        $admin = $this->createUser('Admin', 'admin@example.test');
        $agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $employee = $this->createUser('Employee', 'employee@example.test');
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();
        $resolvedStatus = Status::where('name', 'Resolved')->firstOrFail();

        Carbon::setTestNow(Carbon::parse('2026-08-01 09:00:00'));
        Sanctum::actingAs($employee);

        $ticketId = $this
            ->postJson('/api/tickets', [
                'subject' => 'Laptop cannot connect to VPN',
                'description' => 'VPN client fails after login.',
                'categoryid' => $category->id,
                'priorityid' => $priority->id,
            ])
            ->assertCreated()
            ->assertJsonPath('targetresolutionhours', 48)
            ->assertJsonPath('resolutionstate', 'open')
            ->json('id');

        Carbon::setTestNow(Carbon::parse('2026-08-01 10:00:00'));
        Sanctum::actingAs($admin);

        $this
            ->postJson("/api/tickets/{$ticketId}/assign", [
                'assignedto' => $agent->id,
                'notes' => 'VPN queue',
            ])
            ->assertOk()
            ->assertJsonPath('assignedto', $agent->id);

        Carbon::setTestNow(Carbon::parse('2026-08-01 13:00:00'));

        $this
            ->postJson("/api/tickets/{$ticketId}/status", [
                'statusid' => $resolvedStatus->id,
                'notes' => 'VPN profile rebuilt',
            ])
            ->assertOk()
            ->assertJsonPath('actualresolutionminutes', 240)
            ->assertJsonPath('resolutionstate', 'resolved_within_target');

        $this
            ->postJson("/api/tickets/{$ticketId}/comments", [
                'commenttext' => 'Internal troubleshooting details',
                'isinternal' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('isinternal', true);

        Sanctum::actingAs($employee);
        $this
            ->getJson("/api/tickets/{$ticketId}")
            ->assertOk()
            ->assertJsonMissing(['commenttext' => 'Internal troubleshooting details']);

        Sanctum::actingAs($admin);
        $this
            ->getJson("/api/tickets/{$ticketId}/history?datefrom=2026-08-01&dateto=2026-08-01")
            ->assertOk()
            ->assertJsonCount(1, 'assignmenthistories')
            ->assertJsonCount(4, 'activitylogs');

        $this->assertDatabaseHas('tickets', [
            'id' => $ticketId,
            'assignedto' => $agent->id,
            'targetresolutionhours' => 48,
        ]);
        $this->assertDatabaseCount('assignmenthistories', 1);
        $this->assertDatabaseCount('ticketcomments', 1);
        $this->assertDatabaseHas('activitylogs', [
            'entitytype' => 'ticket',
            'entityid' => $ticketId,
            'action' => 'status_updated',
        ]);

        Carbon::setTestNow();
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
