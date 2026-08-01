<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticketstatushistories', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('ticketid');
            $table->integer('fromstatusid')->nullable();
            $table->integer('tostatusid');
            $table->integer('changedby');
            $table->string('notes', 500)->nullable();
            $table->dateTime('changedat')->useCurrent();

            $table->foreign('ticketid', 'fkstatushistoriesticket')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('fromstatusid', 'fkstatushistoriesfrom')->references('id')->on('statuses');
            $table->foreign('tostatusid', 'fkstatushistoriesto')->references('id')->on('statuses');
            $table->foreign('changedby', 'fkstatushistoriesuser')->references('id')->on('users');

            $table->index('ticketid', 'idxstatushistoriesticket');
            $table->index('changedat', 'idxstatushistorieschanged');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticketstatushistories');
    }
};
