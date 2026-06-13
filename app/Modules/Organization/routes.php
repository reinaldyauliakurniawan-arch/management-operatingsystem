<?php

use App\Modules\Organization\Controllers\OrganizationController;
use Illuminate\Support\Facades\Route;

Route::get('/organization/create', [OrganizationController::class, 'create'])->name('organization.create');
Route::post('/organization', [OrganizationController::class, 'store'])->name('organization.store');
