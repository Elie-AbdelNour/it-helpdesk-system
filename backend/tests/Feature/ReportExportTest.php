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

class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_csv_export_contains_expected_rows(): void
    {
        [$employee, , $ticket] = $this->seedTicket();

        Sanctum::actingAs($employee);

        $response = $this->get('/api/reports/export?format=csv')->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('Subject,Category,Priority,Status', $csv);
        $this->assertStringContainsString($ticket->ticketrefno, $csv);
    }

    public function test_pdf_export_returns_pdf_content_type(): void
    {
        [$employee] = $this->seedTicket();

        Sanctum::actingAs($employee);

        $response = $this->get('/api/reports/export?format=pdf')->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_summary_scopes_to_own_tickets_for_non_managing_user(): void
    {
        [$employee, $agent, $ticket] = $this->seedTicket();
        $otherEmployee = $this->createUser('Employee', 'other@example.test');

        Sanctum::actingAs($otherEmployee);
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();
        $this->postJson('/api/tickets', [
            'subject' => 'Someone else ticket',
            'description' => 'Not visible to first employee.',
            'categoryid' => $category->id,
            'priorityid' => $priority->id,
        ])->assertCreated();

        Sanctum::actingAs($employee);
        $summary = $this->getJson('/api/reports/summary')->assertOk()->json();
        $this->assertSame(1, $summary['totals']['count']);
        $this->assertArrayNotHasKey('byagent', $summary);

        Sanctum::actingAs($agent);
        $managerSummary = $this->getJson('/api/reports/summary')->assertOk()->json();
        $this->assertSame(2, $managerSummary['totals']['count']);
        $this->assertArrayHasKey('byagent', $managerSummary);
    }

    /** @return array{0: User, 1: User, 2: \App\Models\Ticket} */
    private function seedTicket(): array
    {
        $this->seed([RolesSeeder::class, CategoriesSeeder::class, PrioritiesSeeder::class, StatusesSeeder::class]);

        $employee = $this->createUser('Employee', 'employee@example.test');
        $agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();

        Sanctum::actingAs($employee);
        $ticketId = $this->postJson('/api/tickets', [
            'subject' => 'Printer jam',
            'description' => 'Paper stuck in tray 2.',
            'categoryid' => $category->id,
            'priorityid' => $priority->id,
        ])->assertCreated()->json('id');

        return [$employee, $agent, \App\Models\Ticket::findOrFail($ticketId)];
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
