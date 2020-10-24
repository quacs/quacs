#[allow(unused_macros)]
use super::TimeBitVec;

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

pub fn bitwise_and(t1: &TimeBitVec, t2: &TimeBitVec) -> TimeBitVec {
    let mut ret = [0; 9];
    for i in 0..9 {
        ret[i] = t1[i] & t2[i];
    }
    ret
}

pub fn bitwise_or(t1: &TimeBitVec, t2: &TimeBitVec) -> TimeBitVec {
    let mut ret = [0; 9];
    for i in 0..9 {
        ret[i] = t1[i] | t2[i];
    }
    ret
}

pub fn bitwise_xor(t1: &TimeBitVec, t2: &TimeBitVec) -> TimeBitVec {
    let mut ret = [0; 9];
    for i in 0..9 {
        ret[i] = t1[i] ^ t2[i];
    }
    ret
}
