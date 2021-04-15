#![allow(unused_macros)]

macro_rules! console_log {
    ( $( $t:tt )* ) => {
        if cfg!(feature = "debug") {
            web_sys::console::log_1(&format!( $( $t )* ).into());
        }
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

pub fn bitwise_and<const N: usize>(t1: &[u64; N], t2: &[u64; N]) -> [u64; N] {
    let mut ret = [0; N];
    for i in 0..N {
        ret[i] = t1[i] & t2[i];
    }
    ret
}

pub fn bitwise_or<const N: usize>(t1: &[u64; N], t2: &[u64; N]) -> [u64; N] {
    let mut ret = [0; N];
    for i in 0..N {
        ret[i] = t1[i] | t2[i];
    }
    ret
}

pub fn bitwise_xor<const N: usize>(t1: &[u64; N], t2: &[u64; N]) -> [u64; N] {
    let mut ret = [0; N];
    for i in 0..N {
        ret[i] = t1[i] ^ t2[i];
    }
    ret
}
