<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_application_files', function (Blueprint $table) {
            $table->id();

            $table->foreignId('application_id')
                ->constrained('service_applications')
                ->cascadeOnDelete();

            $table->string('field_name');

            $table->string('original_name');

            $table->string('stored_name');

            $table->string('path');

            $table->string('mime_type')->nullable();

            $table->unsignedBigInteger('size')->default(0);

            $table->foreignId('uploaded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_application_files');
    }
};