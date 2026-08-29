<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_application_data', function (Blueprint $table) {

            $table->id();

            $table->foreignId('application_id')
                ->constrained('service_applications')
                ->cascadeOnDelete();

            $table->string('field_name');

            $table->longText('field_value')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'service_application_data'
        );
    }
};