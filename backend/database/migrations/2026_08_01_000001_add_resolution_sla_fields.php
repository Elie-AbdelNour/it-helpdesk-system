<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('priorities', function (Blueprint $table) {
            $table->unsignedSmallInteger('targetresolutionhours')->nullable()->after('level');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->unsignedSmallInteger('targetresolutionhours')->nullable()->after('assignedto');
            $table->dateTime('resolutiondueat')->nullable()->after('updatedat');

            $table->index('resolutiondueat', 'idxticketsresolutiondue');
            $table->index('resolvedat', 'idxticketsresolved');
            $table->index('closedat', 'idxticketsclosed');
        });

        Schema::table('activitylogs', function (Blueprint $table) {
            $table->index('createdat', 'idxlogscreated');
        });
    }

    public function down(): void
    {
        Schema::table('activitylogs', function (Blueprint $table) {
            $table->dropIndex('idxlogscreated');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('idxticketsresolutiondue');
            $table->dropIndex('idxticketsresolved');
            $table->dropIndex('idxticketsclosed');
            $table->dropColumn(['targetresolutionhours', 'resolutiondueat']);
        });

        Schema::table('priorities', function (Blueprint $table) {
            $table->dropColumn('targetresolutionhours');
        });
    }
};
