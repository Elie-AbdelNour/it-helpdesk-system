<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kbarticles', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('categoryid')->nullable();
            $table->integer('createdby');
            $table->string('title', 200);
            $table->text('content');
            $table->enum('status', ['draft', 'pendingapproval', 'published'])->default('draft');
            $table->dateTime('createdat')->useCurrent();
            $table->dateTime('updatedat')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('categoryid', 'fkkbcategory')->references('id')->on('categories');
            $table->foreign('createdby', 'fkkbauthor')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kbarticles');
    }
};
