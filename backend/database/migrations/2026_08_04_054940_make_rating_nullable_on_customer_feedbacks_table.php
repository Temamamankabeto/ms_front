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
        Schema::table('customer_feedbacks', function (Blueprint $table) {
            $table->enum('rating', [
                'very_satisfied',
                'satisfied',
                'not_satisfied',
                'other',
            ])->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('customer_feedbacks', function (Blueprint $table) {
            $table->enum('rating', [
                'very_satisfied',
                'satisfied',
                'not_satisfied',
                'other',
            ])->nullable(false)->change();
        });
    }
};
