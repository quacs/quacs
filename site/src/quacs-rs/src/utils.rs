#[allow(unused_macros)]
use super::BIT_VEC_LEN;

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

pub fn bitwise_and(t1: &[u64; BIT_VEC_LEN], t2: &[u64; BIT_VEC_LEN]) -> [u64; BIT_VEC_LEN] {
    let mut ret = [0; BIT_VEC_LEN];
    for i in 0..BIT_VEC_LEN {
        ret[i] = t1[i] & t2[i];
    }
    ret
}

pub fn bitwise_or(t1: &[u64; BIT_VEC_LEN], t2: &[u64; BIT_VEC_LEN]) -> [u64; BIT_VEC_LEN] {
    let mut ret = [0; BIT_VEC_LEN];
    for i in 0..BIT_VEC_LEN {
        ret[i] = t1[i] | t2[i];
    }
    ret
}

pub fn bitwise_xor(t1: &[u64; BIT_VEC_LEN], t2: &[u64; BIT_VEC_LEN]) -> [u64; BIT_VEC_LEN] {
    let mut ret = [0; BIT_VEC_LEN];
    for i in 0..BIT_VEC_LEN {
        ret[i] = t1[i] ^ t2[i];
    }
    ret
}
