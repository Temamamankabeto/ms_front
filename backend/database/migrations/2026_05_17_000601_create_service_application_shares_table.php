<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_application_shares', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('application_id')->index();
            $table->unsignedBigInteger('shared_from_officer_id')->index();
            $table->unsignedBigInteger('shared_to_officer_id')->index();

            $table->unsignedBigInteger('from_window_id')->nullable()->index();
            $table->unsignedBigInteger('to_window_id')->index();

            $table->string('administrative_level', 20)->index();
            $table->text('note')->nullable();
            $table->timestamp('shared_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_application_shares');
    }
};
