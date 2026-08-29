<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_application_histories', function (Blueprint $table) {
            if (!Schema::hasColumn('service_application_histories', 'sender_id')) {
                $table->unsignedBigInteger('sender_id')->nullable()->after('actor_id')->index();
            }
            if (!Schema::hasColumn('service_application_histories', 'receiver_id')) {
                $table->unsignedBigInteger('receiver_id')->nullable()->after('sender_id')->index();
            }
            if (!Schema::hasColumn('service_application_histories', 'from_window_id')) {
                $table->unsignedBigInteger('from_window_id')->nullable()->after('receiver_id')->index();
            }
            if (!Schema::hasColumn('service_application_histories', 'to_window_id')) {
                $table->unsignedBigInteger('to_window_id')->nullable()->after('from_window_id')->index();
            }
            if (!Schema::hasColumn('service_application_histories', 'administrative_level')) {
                $table->string('administrative_level', 20)->nullable()->after('to_window_id')->index();
            }
            if (!Schema::hasColumn('service_application_histories', 'status')) {
                $table->string('status', 60)->nullable()->after('administrative_level')->index();
            }
            if (!Schema::hasColumn('service_application_histories', 'escalation_details')) {
                $table->json('escalation_details')->nullable()->after('metadata');
            }
        });
    }

    public function down(): void
    {
        Schema::table('service_application_histories', function (Blueprint $table) {
            foreach ([
                'sender_id', 'receiver_id', 'from_window_id', 'to_window_id',
                'administrative_level', 'status', 'escalation_details',
            ] as $column) {
                if (Schema::hasColumn('service_application_histories', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
