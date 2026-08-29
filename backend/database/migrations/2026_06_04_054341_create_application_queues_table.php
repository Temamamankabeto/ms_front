<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('application_queues', function (Blueprint $table) {
    $table->id();

    $table->foreignId('service_application_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->string('queue_number')->unique();

    $table->integer('position');

    $table->enum('status', [
        'waiting',
        'serving',
        'completed',
        'skipped'
    ])->default('waiting');

    $table->timestamp('called_at')->nullable();

    $table->timestamp('completed_at')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_queues');
    }
};
