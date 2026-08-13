<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Priority;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\CategoriesSeeder;
use Database\Seeders\PrioritiesSeeder;
use Database\Seeders\RolesSeeder;
use Database\Seeders\StatusesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketAttachmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_creator_can_upload_and_download_an_attachment(): void
    {
        Storage::fake('local');
        [$employee, , $ticket] = $this->seedTicket();

        Sanctum::actingAs($employee);

        $response = $this->postJson("/api/tickets/{$ticket->id}/attachments", [
            'file' => UploadedFile::fake()->create('screenshot.png', 500, 'image/png'),
        ])->assertCreated();

        $this->assertDatabaseHas('ticketattachments', [
            'ticketid' => $ticket->id,
            'uploadedby' => $employee->id,
            'commentid' => null,
        ]);

        $attachmentId = $response->json('id');

        $this->getJson("/api/tickets/{$ticket->id}/attachments/{$attachmentId}/download")->assertOk();
    }

    public function test_attachment_upload_rejects_files_over_10mb(): void
    {
        Storage::fake('local');
        [$employee, , $ticket] = $this->seedTicket();

        Sanctum::actingAs($employee);

        $this->postJson("/api/tickets/{$ticket->id}/attachments", [
            'file' => UploadedFile::fake()->create('big.pdf', 10241, 'application/pdf'),
        ])->assertStatus(422);
    }

    public function test_attachment_upload_rejects_dangerous_extensions(): void
    {
        Storage::fake('local');
        [$employee, , $ticket] = $this->seedTicket();

        Sanctum::actingAs($employee);

        $this->postJson("/api/tickets/{$ticket->id}/attachments", [
            'file' => UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload'),
        ])->assertStatus(422);
    }

    public function test_non_participant_cannot_download_attachment(): void
    {
        Storage::fake('local');
        [$employee, , $ticket] = $this->seedTicket();
        $outsider = $this->createUser('Employee', 'outsider@example.test');

        Sanctum::actingAs($employee);
        $attachmentId = $this->postJson("/api/tickets/{$ticket->id}/attachments", [
            'file' => UploadedFile::fake()->create('screenshot.png', 500, 'image/png'),
        ])->assertCreated()->json('id');

        Sanctum::actingAs($outsider);
        $this->getJson("/api/tickets/{$ticket->id}/attachments/{$attachmentId}/download")->assertForbidden();
    }

    public function test_any_participant_can_attach_an_image_to_a_comment(): void
    {
        Storage::fake('local');
        [$employee, $agent, $ticket] = $this->seedTicket();

        Sanctum::actingAs($agent);
        $this->postJson("/api/tickets/{$ticket->id}/assign", ['assignedto' => $agent->id])->assertOk();

        Sanctum::actingAs($employee);
        $commentId = $this->postJson("/api/tickets/{$ticket->id}/comments", [
            'commenttext' => 'Here is a screenshot',
        ])->assertCreated()->json('id');

        $this->postJson("/api/tickets/{$ticket->id}/attachments", [
            'commentid' => $commentId,
            'file' => UploadedFile::fake()->create('proof.jpg', 200, 'image/jpeg'),
        ])->assertCreated();

        $this->assertDatabaseHas('ticketattachments', ['commentid' => $commentId]);

        // Non-image extensions are rejected for comment attachments even though they're allowed at ticket level.
        $this->postJson("/api/tickets/{$ticket->id}/attachments", [
            'commentid' => $commentId,
            'file' => UploadedFile::fake()->create('notes.pdf', 200, 'application/pdf'),
        ])->assertStatus(422);
    }

    /** @return array{0: User, 1: User, 2: Ticket} */
    private function seedTicket(): array
    {
        $this->seed([RolesSeeder::class, CategoriesSeeder::class, PrioritiesSeeder::class, StatusesSeeder::class]);

        $employee = $this->createUser('Employee', 'employee@example.test');
        $agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();

        Sanctum::actingAs($employee);
        $ticketId = $this->postJson('/api/tickets', [
            'subject' => 'Cannot print',
            'description' => 'Printer offline.',
            'categoryid' => $category->id,
            'priorityid' => $priority->id,
        ])->assertCreated()->json('id');

        return [$employee, $agent, Ticket::findOrFail($ticketId)];
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
