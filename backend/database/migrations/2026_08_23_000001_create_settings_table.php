<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->string('settingkey', 100)->unique();
            $table->string('settingvalue', 255);
            $table->dateTime('updatedat')->useCurrent();
        });

        DB::table('settings')->insert([
            'settingkey' => 'email_notifications_enabled',
            'settingvalue' => '1',
            'updatedat' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
