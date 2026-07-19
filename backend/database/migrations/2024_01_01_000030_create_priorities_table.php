<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('priorities', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->string('name', 20)->unique();
            $table->tinyInteger('level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('priorities');
    }
};
