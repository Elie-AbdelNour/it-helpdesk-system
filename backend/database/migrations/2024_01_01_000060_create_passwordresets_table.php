<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passwordresets', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('userid');
            $table->string('tokenhash', 255);
            $table->dateTime('expiresat');
            $table->dateTime('usedat')->nullable();
            $table->dateTime('createdat')->useCurrent();

            $table->foreign('userid', 'fkpasswordresetsuser')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passwordresets');
    }
};
