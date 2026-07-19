<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activitylogs', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('userid')->nullable();
            $table->string('action', 100);
            $table->string('entitytype', 50)->nullable();
            $table->integer('entityid')->nullable();
            $table->string('details', 500)->nullable();
            $table->string('ipaddress', 45)->nullable();
            $table->dateTime('createdat')->useCurrent();

            $table->foreign('userid', 'fklogsuser')->references('id')->on('users')->nullOnDelete();

            $table->index('userid', 'idxlogsuser');
            $table->index(['entitytype', 'entityid'], 'idxlogsentity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activitylogs');
    }
};
