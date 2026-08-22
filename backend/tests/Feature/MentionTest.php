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
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MentionTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentioning_a_manager_in_a_comment_creates_a_distinct_mention_notification(): void
    {
        Mail::fake();
        $this->seed([RolesSeeder::class, CategoriesSeeder::class, PrioritiesSeeder::class, StatusesSeeder::class]);

        $employee = $this->createUser('Employee', 'employee@example.test');
        $agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $manager = $this->createUser('Manager', 'manager@example.test');
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();

        Sanctum::actingAs($employee);
        $ticketId = $this->postJson('/api/tickets', [
            'subject' => 'Cannot connect to VPN',
            'description' => 'Client fails on login.',
            'categoryid' => $category->id,
            'priorityid' => $priority->id,
        ])->assertCreated()->json('id');

        Sanctum::actingAs($agent);
        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $agent->id])->assertOk();

        Sanctum::actingAs($employee);
        $this->postJson("/api/tickets/{$ticketId}/comments", [
            'commenttext' => 'Escalating visibility, @Manager User can you take a look too?',
        ])->assertCreated();

        // Standard "other side" notification still goes to the assigned agent.
        $this->assertDatabaseHas('notifications', [
            'userid' => $agent->id,
            'ticketid' => $ticketId,
            'type' => 'comment',
        ]);

        // The mentioned manager gets a separate, distinct mention notification.
        $this->assertDatabaseHas('notifications', [
            'userid' => $manager->id,
            'ticketid' => $ticketId,
            'type' => 'mention',
        ]);
    }

    public function test_mentions_are_not_parsed_for_internal_notes(): void
    {
        Mail::fake();
        $this->seed([RolesSeeder::class, CategoriesSeeder::class, PrioritiesSeeder::class, StatusesSeeder::class]);

        $employee = $this->createUser('Employee', 'employee@example.test');
        $agent = $this->createUser('IT Support Agent', 'agent@example.test');
        $manager = $this->createUser('Manager', 'manager@example.test');
        $category = Category::firstOrFail();
        $priority = Priority::where('name', 'Medium')->firstOrFail();

        Sanctum::actingAs($employee);
        $ticketId = $this->postJson('/api/tickets', [
            'subject' => 'Cannot connect to VPN',
            'description' => 'Client fails on login.',
            'categoryid' => $category->id,
            'priorityid' => $priority->id,
        ])->assertCreated()->json('id');

        Sanctum::actingAs($agent);
        $this->postJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $agent->id])->assertOk();
        $this->postJson("/api/tickets/{$ticketId}/comments", [
            'commenttext' => 'Internal note mentioning @Manager User',
            'isinternal' => true,
        ])->assertCreated();

        $this->assertDatabaseMissing('notifications', ['userid' => $manager->id, 'type' => 'mention']);
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
