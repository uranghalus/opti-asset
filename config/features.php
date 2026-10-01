<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Feature flags
    |--------------------------------------------------------------------------
    */

    // Classification v2: the tree UI split by classification type
    // (Peralatan / Aktiva Tetap). Validation, database constraints, and code
    // generation are always active regardless of this flag — it only gates
    // the presentation. Default off in production until Fase 3 UAT passes;
    // delete the flag once the split UI is stable.
    'classification_v2' => env('FEATURE_CLASSIFICATION_V2', false),

];
