#[derive(Copy, Clone)]
pub struct SemesterData<'a, const N: usize> {
    pub crn_times: &'a phf::Map<u32, [u64; N]>,
    pub crn_courses: &'a phf::Map<u32, &'static str>,
}

impl SemesterData<'static, { crate::data::BIT_VEC_LEN }> {
    pub fn from_mod() -> Self {
        Self {
            crn_times: &crate::data::CRN_TIMES,
            crn_courses: &crate::data::CRN_COURSES,
        }
    }
}
