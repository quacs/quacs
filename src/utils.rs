#[allow(unused_macros)]

macro_rules! console_log {
    ( $( $t:tt )* ) => {
        #[cfg(feature = "debug")]
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

macro_rules! bm_start {
    ( $name:tt) => {
        #[cfg(feature = "benchmark")]
        web_sys::console::time_with_label($name);
    };
}

macro_rules! bm_end {
    ( $name:tt) => {
        #[cfg(feature = "benchmark")]
        web_sys::console::time_end_with_label($name);
    };
}
