<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('roleid');
            $table->string('fullname', 100);
            $table->string('email', 150)->unique();
            $table->string('passwordhash', 255);
            $table->string('phone', 30)->nullable();
            $table->boolean('isactive')->default(true);
            $table->dateTime('lastloginat')->nullable();
            $table->dateTime('createdat')->useCurrent();
            $table->dateTime('updatedat')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('roleid', 'fkusersrole')->references('id')->on('roles');
            $table->index('roleid', 'idxusersrole');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
