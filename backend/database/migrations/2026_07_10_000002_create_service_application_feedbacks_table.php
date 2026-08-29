<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('service_application_feedbacks')) return;
        Schema::create('service_application_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('service_applications')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('satisfaction_scale')->default('satisfied');
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_application_feedbacks');
    }
};
