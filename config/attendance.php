<?php

return [

    /*
    | How many past days the scheduled `attendance:process` run recalculates, on top of today.
    | Door devices can upload punches late; anything older than this needs
    | `php artisan attendance:process --from=YYYY-MM-DD`.
    */
    'recompute_days' => (int) env('ATTENDANCE_RECOMPUTE_DAYS', 3),

];
