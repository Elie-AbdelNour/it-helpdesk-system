<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticketcomments', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('ticketid');
            $table->integer('userid');
            $table->text('commenttext');
            $table->boolean('isinternal')->default(false);
            $table->dateTime('createdat')->useCurrent();

            $table->foreign('ticketid', 'fkcommentsticket')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('userid', 'fkcommentsuser')->references('id')->on('users');

            $table->index('ticketid', 'idxcommentsticket');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticketcomments');
    }
};
