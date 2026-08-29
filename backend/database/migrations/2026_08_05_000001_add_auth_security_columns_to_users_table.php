<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('failed_login_attempts')->default(0)->after('password');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            $table->timestamp('last_failed_login_at')->nullable()->after('locked_until');
            $table->timestamp('password_changed_at')->nullable()->after('last_failed_login_at');
        });
    }
    public function down(): void {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn([
            'failed_login_attempts','locked_until','last_failed_login_at','password_changed_at'
        ]));
    }
};
