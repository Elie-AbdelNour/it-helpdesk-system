<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignmenthistories', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('ticketid');
            $table->integer('assignedfrom')->nullable();
            $table->integer('assignedto');
            $table->integer('assignedby');
            $table->string('notes', 255)->nullable();
            $table->dateTime('assignedat')->useCurrent();

            $table->foreign('ticketid', 'fkassignmentsticket')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('assignedfrom', 'fkassignmentsfrom')->references('id')->on('users');
            $table->foreign('assignedto', 'fkassignmentsto')->references('id')->on('users');
            $table->foreign('assignedby', 'fkassignmentsby')->references('id')->on('users');

            $table->index('ticketid', 'idxassignmentsticket');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignmenthistories');
    }
};
