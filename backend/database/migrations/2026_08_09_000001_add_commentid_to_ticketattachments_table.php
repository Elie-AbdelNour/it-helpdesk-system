<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticketattachments', function (Blueprint $table) {
            $table->integer('commentid')->nullable()->after('ticketid');

            $table->foreign('commentid', 'fkattachmentscomment')->references('id')->on('ticketcomments')->cascadeOnDelete();

            $table->index('commentid', 'idxattachmentscomment');
        });
    }

    public function down(): void
    {
        Schema::table('ticketattachments', function (Blueprint $table) {
            $table->dropForeign('fkattachmentscomment');
            $table->dropIndex('idxattachmentscomment');
            $table->dropColumn('commentid');
        });
    }
};
