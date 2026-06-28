// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Shared monitor constants: the rate-relative band-pace exponents (#724). They
 * live in their own module so the status logic (`monitor-resources.mjs`, which
 * uses all three) and the chart renderer (`render-burndown.mjs`, which draws the
 * throttle curve) share one source of truth — `monitor-resources` already
 * imports from `render-burndown`, so a constant shared the other way would be a
 * circular import.
 *
 * @module constants
 */

// Status is driven by where a service's actual remaining budget falls against
// the sustainable-remaining curve R(t) = (1 - t)^alpha at the elapsed fraction t.
// A lower alpha sits higher, so the bands nest watch > throttle > stop in
// remaining.
export const THROTTLE_ALPHA = 0.9;
export const WATCH_ALPHA = THROTTLE_ALPHA - 0.05; // 0.85
export const STOP_ALPHA = THROTTLE_ALPHA + 0.1; // 1.0
