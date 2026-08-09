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

    private User $employee;

    private User $agent;

    private User $admin;

    private Ticket $ticket;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

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
                'subject' => 'Printer offline',
                'description' => 'Cannot print from the third floor.',
                'categoryid' => Category::firstOrFail()->id,
                'priorityid' => Priority::where('name', 'Medium')->firstOrFail()->id,
            ])
            ->assertCreated()
            ->json('id');

        $this->ticket = Ticket::findOrFail($ticketId);
    }

    public function test_participant_can_upload_a_ticket_level_document(): void
    {
        Sanctum::actingAs($this->employee);

        $file = UploadedFile::fake()->create('error-log.txt', 100, 'text/plain');

        $this
            ->postJson("/api/tickets/{$this->ticket->id}/attachments", ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('filename', 'error-log.txt');

        $this->assertDatabaseHas('ticketattachments', [
            'ticketid' => $this->ticket->id,
            'commentid' => null,
            'filename' => 'error-log.txt',
        ]);
    }

    public function test_upload_over_ten_megabytes_is_rejected(): void
    {
        Sanctum::actingAs($this->employee);

        $file = UploadedFile::fake()->create('big-file.pdf', 10241, 'application/pdf');

        $this
            ->postJson("/api/tickets/{$this->ticket->id}/attachments", ['file' => $file])
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_dangerous_extensions_are_rejected(): void
    {
        Sanctum::actingAs($this->employee);

        $file = UploadedFile::fake()->create('setup.exe', 100, 'application/x-msdownload');

        $this
            ->postJson("/api/tickets/{$this->ticket->id}/attachments", ['file' => $file])
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_participant_can_attach_an_image_to_a_comment_and_notifies_the_other_side(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/tickets/{$this->ticket->id}/assign", ['assignedto' => $this->agent->id]);

        Sanctum::actingAs($this->employee);
        $commentId = $this
            ->postJson("/api/tickets/{$this->ticket->id}/comments", ['commenttext' => 'Here is a screenshot.'])
            ->assertCreated()
            ->json('id');

        $image = UploadedFile::fake()->image('screenshot.png');

        $this
            ->postJson("/api/tickets/{$this->ticket->id}/attachments", [
                'file' => $image,
                'commentid' => $commentId,
            ])
            ->assertCreated()
            ->assertJsonPath('commentid', $commentId);

        $this->assertDatabaseHas('notifications', [
            'userid' => $this->agent->id,
            'ticketid' => $this->ticket->id,
            'type' => 'attachment',
        ]);
    }

    public function test_only_ticket_view_is_allowed_to_download_an_attachment(): void
    {
        Sanctum::actingAs($this->employee);

        $file = UploadedFile::fake()->create('notes.txt', 50, 'text/plain');
        $attachmentId = $this
            ->postJson("/api/tickets/{$this->ticket->id}/attachments", ['file' => $file])
            ->assertCreated()
            ->json('id');

        $this
            ->get("/api/tickets/{$this->ticket->id}/attachments/{$attachmentId}/download")
            ->assertOk();

        $unrelatedEmployee = $this->createUser('Employee', 'other@example.test');
        Sanctum::actingAs($unrelatedEmployee);

        $this
            ->get("/api/tickets/{$this->ticket->id}/attachments/{$attachmentId}/download")
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
