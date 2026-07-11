<?php

use App\Modules\LeadershipAssessment\Controllers\LeadershipAssessmentController;
use Illuminate\Support\Facades\Route;

Route::prefix('leadership-assessment')->name('leadership-assessment.')->group(function () {
    Route::get('/', [LeadershipAssessmentController::class, 'index'])->name('index');

    // Cycle CRUD (leader only)
    Route::post('/cycles', [LeadershipAssessmentController::class, 'storeCycle'])->name('cycles.store');
    Route::post('/cycles/{cycle}/assign', [LeadershipAssessmentController::class, 'assignAssessee'])->name('cycles.assign');
    Route::post('/assignments/{assignment}/extra-assessors', [LeadershipAssessmentController::class, 'addExtraAssessor'])->name('assignments.extra-assessors.store');
    Route::delete('/assignments/{assignment}/extra-assessors/{extra}', [LeadershipAssessmentController::class, 'removeExtraAssessor'])->name('assignments.extra-assessors.destroy');
    Route::post('/cycles/{cycle}/close', [LeadershipAssessmentController::class, 'closeCycle'])->name('cycles.close');
    Route::get('/cycles/{cycle}/assess/{assessee}', [LeadershipAssessmentController::class, 'takeAssessment'])->name('take');
    Route::post('/cycles/{cycle}/assess/{assessee}', [LeadershipAssessmentController::class, 'submitResponse'])->name('submit');
    Route::get('/cycles/{cycle}/results/{assessee}', [LeadershipAssessmentController::class, 'results'])->name('results');
    Route::patch('/cycles/{cycle}', [LeadershipAssessmentController::class, 'updateCycle'])->name('cycles.update');
    Route::delete('/cycles/{cycle}', [LeadershipAssessmentController::class, 'destroyCycle'])->name('cycles.destroy');

    // Rubrik admin (org admin only)
    Route::get('/rubrik', [LeadershipAssessmentController::class, 'rubrikIndex'])->name('rubrik.index');
    Route::post('/rubrik/types', [LeadershipAssessmentController::class, 'storeType'])->name('rubrik.types.store');
    Route::post('/rubrik/types/{type}/items', [LeadershipAssessmentController::class, 'storeItem'])->name('rubrik.items.store');
    Route::post('/rubrik/items/{item}/rubrics', [LeadershipAssessmentController::class, 'storeRubric'])->name('rubrik.rubrics.store');
    Route::patch('/rubrik/types/{type}', [LeadershipAssessmentController::class, 'updateType'])->name('rubrik.types.update');
    Route::patch('/rubrik/items/{item}', [LeadershipAssessmentController::class, 'updateItem'])->name('rubrik.items.update');
    Route::patch('/rubrik/rubrics/{rubric}', [LeadershipAssessmentController::class, 'updateRubric'])->name('rubrik.rubrics.update');
    Route::delete('/rubrik/types/{type}', [LeadershipAssessmentController::class, 'destroyType'])->name('rubrik.types.destroy');
    Route::delete('/rubrik/items/{item}', [LeadershipAssessmentController::class, 'destroyItem'])->name('rubrik.items.destroy');
    Route::delete('/rubrik/rubrics/{rubric}', [LeadershipAssessmentController::class, 'destroyRubric'])->name('rubrik.rubrics.destroy');
});
