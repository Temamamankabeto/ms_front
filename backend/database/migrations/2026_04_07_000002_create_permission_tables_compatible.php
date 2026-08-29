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
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');

        // Permissions
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();

            $table->string('name', 125);

            $table->string('guard_name', 125);

            $table->timestamps();

            $table->unique(
                ['name', 'guard_name'],
                'permissions_name_guard_name_unique'
            );
        });

        // Roles
        Schema::create('roles', function (Blueprint $table) {
            $table->id();

            $table->string('name', 125);

            $table->string('guard_name', 125);

            $table->timestamps();

            $table->unique(
                ['name', 'guard_name'],
                'roles_name_guard_name_unique'
            );
        });

        // Model Has Permissions
        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->foreignId('permission_id')
                ->constrained('permissions')
                ->cascadeOnDelete();

            $table->string('model_type');

            $table->unsignedBigInteger('model_id');

            $table->primary(
                ['permission_id', 'model_id', 'model_type'],
                'model_has_permissions_primary'
            );

            $table->index(
                ['model_id', 'model_type'],
                'model_has_permissions_model_id_model_type_index'
            );
        });

        // Model Has Roles
        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->foreignId('role_id')
                ->constrained('roles')
                ->cascadeOnDelete();

            $table->string('model_type');

            $table->unsignedBigInteger('model_id');

            $table->primary(
                ['role_id', 'model_id', 'model_type'],
                'model_has_roles_primary'
            );

            $table->index(
                ['model_id', 'model_type'],
                'model_has_roles_model_id_model_type_index'
            );
        });

        // Role Has Permissions
        Schema::create('role_has_permissions', function (Blueprint $table) {
            $table->foreignId('permission_id')
                ->constrained('permissions')
                ->cascadeOnDelete();

            $table->foreignId('role_id')
                ->constrained('roles')
                ->cascadeOnDelete();

            $table->primary(
                ['permission_id', 'role_id'],
                'role_has_permissions_primary'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_has_permissions');

        Schema::dropIfExists('model_has_roles');

        Schema::dropIfExists('role_has_permissions');

        Schema::dropIfExists('roles');

        Schema::dropIfExists('permissions');
    }
};