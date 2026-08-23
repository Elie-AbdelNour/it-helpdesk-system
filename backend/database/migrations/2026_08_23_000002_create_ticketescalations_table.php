<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticketescalations', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('ticketid');
            $table->integer('escalatedby');
            $table->string('reason', 500);
            $table->dateTime('escalatedat')->useCurrent();
            $table->integer('reviewedby')->nullable();
            $table->dateTime('reviewedat')->nullable();
            $table->integer('assignedto')->nullable();

            $table->foreign('ticketid', 'fkescalationsticket')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('escalatedby', 'fkescalationsby')->references('id')->on('users');
            $table->foreign('reviewedby', 'fkescalationsreviewedby')->references('id')->on('users');
            $table->foreign('assignedto', 'fkescalationsassignedto')->references('id')->on('users');

            $table->index(['ticketid', 'reviewedat'], 'idxescalationsticketreviewed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticketescalations');
    }
};
