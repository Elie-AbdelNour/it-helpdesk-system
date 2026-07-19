<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticketattachments', function (Blueprint $table) {
            $table->integer('id')->autoIncrement();
            $table->integer('ticketid');
            $table->integer('uploadedby');
            $table->string('filename', 255);
            $table->string('filepath', 500);
            $table->integer('filesize');
            $table->string('filetype', 50);
            $table->dateTime('uploadedat')->useCurrent();

            $table->foreign('ticketid', 'fkattachmentsticket')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('uploadedby', 'fkattachmentsuser')->references('id')->on('users');

            $table->index('ticketid', 'idxattachmentsticket');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticketattachments');
    }
};
