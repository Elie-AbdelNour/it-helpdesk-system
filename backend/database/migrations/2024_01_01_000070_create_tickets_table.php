<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->string('ticketrefno', 20)->unique();
            $table->string('subject', 200);
            $table->text('description');
            $table->integer('categoryid');
            $table->integer('priorityid');
            $table->integer('statusid');
            $table->integer('createdby');
            $table->integer('assignedto')->nullable();
            $table->dateTime('createdat')->useCurrent();
            $table->dateTime('updatedat')->useCurrent()->useCurrentOnUpdate();
            $table->dateTime('resolvedat')->nullable();
            $table->dateTime('closedat')->nullable();

            $table->foreign('categoryid', 'fkticketscategory')->references('id')->on('categories');
            $table->foreign('priorityid', 'fkticketspriority')->references('id')->on('priorities');
            $table->foreign('statusid', 'fkticketsstatus')->references('id')->on('statuses');
            $table->foreign('createdby', 'fkticketscreator')->references('id')->on('users');
            $table->foreign('assignedto', 'fkticketsagent')->references('id')->on('users');

            $table->index('statusid', 'idxticketsstatus');
            $table->index('priorityid', 'idxticketspriority');
            $table->index('categoryid', 'idxticketscategory');
            $table->index('createdby', 'idxticketscreator');
            $table->index('assignedto', 'idxticketsagent');
            $table->index('createdat', 'idxticketscreated');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
