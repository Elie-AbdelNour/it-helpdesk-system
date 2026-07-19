<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('userid');
            $table->integer('ticketid')->nullable();
            $table->string('message', 255);
            $table->string('type', 50)->default('general');
            $table->boolean('isread')->default(false);
            $table->dateTime('createdat')->useCurrent();

            $table->foreign('userid', 'fknotificationsuser')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('ticketid', 'fknotificationsticket')->references('id')->on('tickets')->cascadeOnDelete();

            $table->index(['userid', 'isread'], 'idxnotificationsuserread');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
