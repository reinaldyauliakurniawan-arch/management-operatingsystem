<?php

use App\Modules\Teams\Controllers\TeamSwitchController;
use Illuminate\Support\Facades\Route;

use App\Modules\Teams\Controllers\TeamMemberController;

use App\Modules\Teams\Controllers\TeamController;

Route::post('/teams/switch', [TeamSwitchController::class, 'store'])->name('teams.switch');
Route::get('/team/pick', [TeamSwitchController::class, 'pick'])->name('team.pick');

// Team CRUD (org admin only)
Route::get('/teams', [TeamController::class, 'index'])->name('teams.index');
Route::post('/teams', [TeamController::class, 'store'])->name('teams.store');
Route::patch('/teams/{team}', [TeamController::class, 'update'])->name('teams.update');
Route::post('/teams/{team}/assign-leader', [TeamController::class, 'assignLeader'])->name('teams.assignLeader');
Route::delete('/teams/{team}', [TeamController::class, 'destroy'])->name('teams.destroy');

// Member management
Route::get('/teams/members', [TeamMemberController::class, 'index'])->name('teams.members.index');
Route::post('/teams/members', [TeamMemberController::class, 'store'])->name('teams.members.store');
Route::patch('/teams/members/{member}', [TeamMemberController::class, 'update'])->name('teams.members.update');
Route::delete('/teams/members/{member}', [TeamMemberController::class, 'destroy'])->name('teams.members.destroy');
