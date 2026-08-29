<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->string('service_name');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('assigned_officer_id')->nullable();
            $table->string('status')->default('draft');
            $table->json('data')->nullable();
            $table->unsignedBigInteger('city_id')->nullable();
            $table->unsignedBigInteger('subcity_id')->nullable();
            $table->unsignedBigInteger('woreda_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
