<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Super admin role name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your super admin role.
    | Users with this role can do anything.
    */

    'super_admin' => env('SUPER_ADMIN', 'god'),

    /*
    |--------------------------------------------------------------------------
    | Sale Edit Time Limit Restrictions
    |--------------------------------------------------------------------------
    |
    | Setting to restrict if a sale can be edited or deleted after a certain 
    | number of days.
    */

    'sale_edit_time_limit_enabled' => env('SALE_EDIT_TIME_LIMIT_ENABLED', true),
    'sale_edit_time_limit_days' => env('SALE_EDIT_TIME_LIMIT_DAYS', 3),
];
