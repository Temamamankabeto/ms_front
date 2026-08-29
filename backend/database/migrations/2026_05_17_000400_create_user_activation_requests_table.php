<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('woreda_id')->index();
            }

            if (!Schema::hasColumn('users', 'activated_by')) {
                $table->unsignedBigInteger('activated_by')->nullable()->after('created_by')->index();
            }

            if (!Schema::hasColumn('users', 'activated_at')) {
                $table->timestamp('activated_at')->nullable()->after('activated_by');
            }
        });

        Schema::create('user_activation_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('requested_by')->index();
            $table->unsignedBigInteger('verified_by')->nullable()->index();
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable()->index();
            $table->timestamp('approved_at')->nullable();

            $table->string('status', 40)->default('pending_city_approval')->index();
            $table->string('request_level', 20)->nullable()->index();

            $table->unsignedBigInteger('city_id')->nullable()->index();
            $table->unsignedBigInteger('subcity_id')->nullable()->index();
            $table->unsignedBigInteger('woreda_id')->nullable()->index();

            $table->text('request_note')->nullable();
            $table->text('verification_note')->nullable();
            $table->text('approval_note')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'status'], 'uar_user_status_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_activation_requests');

        Schema::table('users', function (Blueprint $table) {
            foreach (['created_by', 'activated_by', 'activated_at'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
