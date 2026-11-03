//! Monotonic timing for tracing instrumentation.
//!
//! `std` ships no clock for wasm32-unknown-unknown, where the browser scanner
//! runs, and `Instant::now` panics there.  A reading from here is therefore
//! best effort: zero on a platform with no monotonic clock, which is also
//! where no subscriber reads the span it feeds.

#[cfg(not(target_arch = "wasm32"))]
pub(crate) type Instant = std::time::Instant;

#[cfg(target_arch = "wasm32")]
#[derive(Clone, Copy)]
pub(crate) struct Instant;

pub(crate) fn now() -> Instant {
    #[cfg(not(target_arch = "wasm32"))]
    {
        std::time::Instant::now()
    }
    #[cfg(target_arch = "wasm32")]
    {
        Instant
    }
}

pub(crate) fn elapsed_ms(started: Instant) -> u64 {
    #[cfg(not(target_arch = "wasm32"))]
    {
        started.elapsed().as_millis() as u64
    }
    #[cfg(target_arch = "wasm32")]
    {
        let _ = started;
        0
    }
}
