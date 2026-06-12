<?php

use App\Modules\Teams\Controllers\TeamSwitchController;
use Illuminate\Support\Facades\Route;

use App\Modules\Teams\Controllers\TeamMemberController;

Route::post('/teams/switch', [TeamSwitchController::class, 'store'])->name('teams.switch');
Route::get('/team/pick', [TeamSwitchController::class, 'pick'])->name('team.pick');

// Member management
Route::get('/teams/members', [TeamMemberController::class, 'index'])->name('teams.members.index');
Route::post('/teams/members', [TeamMemberController::class, 'store'])->name('teams.members.store');
Route::patch('/teams/members/{member}', [TeamMemberController::class, 'update'])->name('teams.members.update');
Route::delete('/teams/members/{member}', [TeamMemberController::class, 'destroy'])->name('teams.members.destroy');
