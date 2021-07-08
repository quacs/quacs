#![cfg(test)]

use crate::context::Context;
use crate::semester_data::SemesterData;

use std::collections::BTreeSet;

use phf::phf_map;
use std::iter::FromIterator;
use wasm_bindgen_test::*;

/// Helper function to generate a sorted list of possible schedules
fn get_sorted_schedules<'a, const N: usize>(ctx: &mut Context<'a, N>) -> Vec<Vec<u32>> {
    let num_schedules = ctx.generate_schedules_and_conflicts();
    (0..num_schedules)
        .map(|i| {
            ctx.get_schedule(i)
                .into_iter()
                .copied()
                .collect::<BTreeSet<u32>>()
                .into_iter()
                .collect::<Vec<u32>>()
        })
        .collect::<BTreeSet<Vec<u32>>>()
        .into_iter()
        .collect::<Vec<Vec<u32>>>()
}

#[wasm_bindgen_test]
#[test]
fn test_empty_diag_one_section_basic() {
    let mut ctx = Context::from_semester_data(SemesterData {
        crn_times: &phf_map! {
            0u32 => [0b0001],
            1u32 => [0b0010],
            2u32 => [0b0100],
            3u32 => [0b1000],
        },
        crn_courses: &phf_map! {
            0u32 => "RUST-1200",
            1u32 => "RUST-1200",
            2u32 => "RUST-1200",
            3u32 => "RUST-1200",
        },
    });

    // No courses selected
    assert_eq!(ctx.generate_schedules_and_conflicts(), 0);
    assert!(!ctx.everything_conflicts());
    for crn in 0..=3 {
        assert!(!ctx.is_in_conflict(crn));
    }
    assert_eq!(ctx.get_schedule(0), Vec::new().into_boxed_slice());
    assert_eq!(ctx.get_schedule(1), Vec::new().into_boxed_slice());

    // Select all sections
    for crn in 0..=3 {
        ctx.set_selected(crn, true);
    }

    // Get schedules
    let schedules = get_sorted_schedules(&mut ctx);
    assert_eq!(schedules, [[0], [1], [2], [3]]);

    // Deselect sections
    ctx.set_selected(2, false);
    ctx.set_selected(1, false);

    // Get schedules
    let schedules = get_sorted_schedules(&mut ctx);
    assert_eq!(schedules, vec![vec![0], vec![3]]);
}

#[wasm_bindgen_test]
#[test]
fn test_freshman_cs() {
    let crn_times = phf_map! {
        50044u32 => [13245679143948],
        52542u32 => [13245679143948],
        50045u32 => [13209171921932],
        52298u32 => [13209171921932],
        51322u32 => [13195750149132],
        50046u32 => [13195750149132],
        50350u32 => [13194542189580],
        52751u32 => [13194542189580],
        52964u32 => [13194240199692],
        53199u32 => [13194240199692],
        52281u32 => [2306687449192989440],
        52282u32 => [2306687449192989440],
        52283u32 => [844439987684096],
        52284u32 => [844439987684096],
        52285u32 => [1153765944586142464],
        52286u32 => [1153765944586142464],
        52287u32 => [844439983489792],
        52288u32 => [844439983489792],
        50282u32 => [144326309357551808],
        50283u32 => [144326309357551808],
        50284u32 => [211121282220224],
        50223u32 => [211121282220224],
        50299u32 => [72268715319623872],
        50300u32 => [72268715319623872],
        50301u32 => [211121281958080],
        50302u32 => [211121281958080],
        50153u32 => [576473948070346764],
        50978u32 => [576473948070346764],
        50285u32 => [13195769020428],
        50547u32 => [13195769020428],
        50975u32 => [288243571918635020],
        50459u32 => [288243571918635020],
        50460u32 => [13195767971852],
        50461u32 => [13195767971852],
        52132u32 => [2306054117073617088],
        52133u32 => [2306054117073617088],
        52134u32 => [211107868311744],
        52135u32 => [211107868311744],
        52269u32 => [1153132612466770112],
        52270u32 => [1153132612466770112],
        52271u32 => [211107864117440],
        52272u32 => [211107864117440],
        52273u32 => [2306687485700211456],
        52274u32 => [2306687485700211456],
        52275u32 => [844476494906112],
        52276u32 => [844476494906112],
        52277u32 => [1153765981093364480],
        52279u32 => [1153765981093364480],
        52278u32 => [844476490711808],
        52280u32 => [844476490711808],
        50095u32 => [18027644205400076],
        50096u32 => [18027644205400076],
        52335u32 => [13245695950860],
        52336u32 => [13245695950860],
        52980u32 => [13524044578029580],
        52981u32 => [13524044578029580],
        52982u32 => [13245695946764],
        52983u32 => [13245695946764],
        53062u32 => [3459327515342929920],
        53063u32 => [3459327515342929920],
        52337u32 => [3458764565389509120],
        52338u32 => [3458764565389509120],
        54304u32 => [3459046040366219264],
        54305u32 => [3459046040366219264],
        54306u32 => [3458764565389508864],
        54312u32 => [3458764565389508864],
        50051u32 => [3458765338466844672],
        50052u32 => [864691953092001792],
        50053u32 => [216173606748291072],
        51461u32 => [864691953092001792],
        50054u32 => [36029621652881408],
        50055u32 => [211930866254016],
        50222u32 => [53601191854128],
        50225u32 => [14018773254156],
        50991u32 => [27022422398005248],
        50992u32 => [53601191854128],
        51462u32 => [211930866254016],
        51509u32 => [36029621652881408],
        52765u32 => [14018773254156],
        53004u32 => [3458765338466844672],
        53060u32 => [216173606748291072],
        54514u32 => [27022422398005248],
        54515u32 => [845249563853568],
        54516u32 => [845249563853568],
        54517u32 => [4123168604163],
        54518u32 => [4123168604163],
        54519u32 => [824633720832],
        52514u32 => [37154696926003200],
        52515u32 => [28147497671114752],
        53297u32 => [37154696926003200],
        53298u32 => [28147497671114752],
    };
    let crn_courses = phf_map! {
        50044u32 => "CSCI-1200",
        52542u32 => "CSCI-1200",
        50045u32 => "CSCI-1200",
        52298u32 => "CSCI-1200",
        51322u32 => "CSCI-1200",
        50046u32 => "CSCI-1200",
        50350u32 => "CSCI-1200",
        52751u32 => "CSCI-1200",
        52964u32 => "CSCI-1200",
        53199u32 => "CSCI-1200",
        52281u32 => "MATH-1010",
        52282u32 => "MATH-1010",
        52283u32 => "MATH-1010",
        52284u32 => "MATH-1010",
        52285u32 => "MATH-1010",
        52286u32 => "MATH-1010",
        52287u32 => "MATH-1010",
        52288u32 => "MATH-1010",
        50282u32 => "MATH-1010",
        50283u32 => "MATH-1010",
        50284u32 => "MATH-1010",
        50223u32 => "MATH-1010",
        50299u32 => "MATH-1010",
        50300u32 => "MATH-1010",
        50301u32 => "MATH-1010",
        50302u32 => "MATH-1010",
        50153u32 => "MATH-1010",
        50978u32 => "MATH-1010",
        50285u32 => "MATH-1010",
        50547u32 => "MATH-1010",
        50975u32 => "MATH-1010",
        50459u32 => "MATH-1010",
        50460u32 => "MATH-1010",
        50461u32 => "MATH-1010",
        52132u32 => "MATH-1010",
        52133u32 => "MATH-1010",
        52134u32 => "MATH-1010",
        52135u32 => "MATH-1010",
        52269u32 => "MATH-1010",
        52270u32 => "MATH-1010",
        52271u32 => "MATH-1010",
        52272u32 => "MATH-1010",
        52273u32 => "MATH-1010",
        52274u32 => "MATH-1010",
        52275u32 => "MATH-1010",
        52276u32 => "MATH-1010",
        52277u32 => "MATH-1010",
        52279u32 => "MATH-1010",
        52278u32 => "MATH-1010",
        52280u32 => "MATH-1010",
        50095u32 => "MATH-1010",
        50096u32 => "MATH-1010",
        52335u32 => "MATH-1010",
        52336u32 => "MATH-1010",
        52980u32 => "MATH-1010",
        52981u32 => "MATH-1010",
        52982u32 => "MATH-1010",
        52983u32 => "MATH-1010",
        53062u32 => "MATH-1010",
        53063u32 => "MATH-1010",
        52337u32 => "MATH-1010",
        52338u32 => "MATH-1010",
        54304u32 => "MATH-1010",
        54305u32 => "MATH-1010",
        54306u32 => "MATH-1010",
        54312u32 => "MATH-1010",
        50051u32 => "PHYS-1100",
        50052u32 => "PHYS-1100",
        50053u32 => "PHYS-1100",
        51461u32 => "PHYS-1100",
        50054u32 => "PHYS-1100",
        50055u32 => "PHYS-1100",
        50222u32 => "PHYS-1100",
        50225u32 => "PHYS-1100",
        50991u32 => "PHYS-1100",
        50992u32 => "PHYS-1100",
        51462u32 => "PHYS-1100",
        51509u32 => "PHYS-1100",
        52765u32 => "PHYS-1100",
        53004u32 => "PHYS-1100",
        53060u32 => "PHYS-1100",
        54514u32 => "PHYS-1100",
        54515u32 => "PHYS-1100",
        54516u32 => "PHYS-1100",
        54517u32 => "PHYS-1100",
        54518u32 => "PHYS-1100",
        54519u32 => "PHYS-1100",
        52514u32 => "IHSS-1140",
        52515u32 => "IHSS-1140",
        53297u32 => "IHSS-1140",
        53298u32 => "IHSS-1140",
    };
    let mut ctx = Context::from_semester_data(SemesterData {
        crn_times: &crn_times,
        crn_courses: &crn_courses,
    });

    // No courses selected
    assert_eq!(ctx.generate_schedules_and_conflicts(), 0);
    assert!(!ctx.everything_conflicts());
    for crn in 0..=3 {
        assert!(!ctx.is_in_conflict(crn));
    }
    assert_eq!(ctx.get_schedule(0), Vec::new().into_boxed_slice());
    assert_eq!(ctx.get_schedule(1), Vec::new().into_boxed_slice());

    // No sections conflict
    assert!(crn_times.keys().all(|crn| !ctx.is_in_conflict(*crn)));

    // Select all sections, recomputing all conflicts after each section
    for (i, crn) in {
        let mut keys = Vec::from_iter(crn_times.keys());
        keys.sort();
        keys
    }
    .iter()
    .enumerate()
    {
        ctx.set_selected(**crn, true);

        // Compute conflicts
        let conflicts = crn_times
            .keys()
            .map(|crn| ctx.is_in_conflict(*crn))
            .collect::<Vec<bool>>();

        println!("{}: {}", i, crn);

        if i < 3 {
            // No sections conflict
            assert!(conflicts.iter().all(|b| !b));
        } else {
            // Some sections conflict
            assert!(conflicts.iter().any(|b| *b));

            // Some sections don't conflict
            assert!(conflicts.iter().any(|b| !b));
        }
    }

    // Get schedules
    let schedules = get_sorted_schedules(&mut ctx);
    assert_eq!(schedules.len(), 16640);
    assert_eq!(
        schedules[..10],
        [
            [50044, 50051, 50223, 52514],
            [50044, 50051, 50223, 52515],
            [50044, 50051, 50223, 53297],
            [50044, 50051, 50223, 53298],
            [50044, 50051, 50282, 52514],
            [50044, 50051, 50282, 52515],
            [50044, 50051, 50282, 53297],
            [50044, 50051, 50282, 53298],
            [50044, 50051, 50283, 52514],
            [50044, 50051, 50283, 52515]
        ]
    );

    // Deselect sections
    ctx.set_selected(50044, false);
    ctx.set_selected(50051, false);

    // Get schedules
    let schedules = get_sorted_schedules(&mut ctx);
    assert_eq!(schedules.len(), 15168);
    assert_eq!(
        schedules[..10],
        [
            [50045, 50052, 52132, 52514],
            [50045, 50052, 52132, 52515],
            [50045, 50052, 52132, 53297],
            [50045, 50052, 52132, 53298],
            [50045, 50052, 52133, 52514],
            [50045, 50052, 52133, 52515],
            [50045, 50052, 52133, 53297],
            [50045, 50052, 52133, 53298],
            [50045, 50052, 52134, 52514],
            [50045, 50052, 52134, 52515]
        ]
    );

    // Compute conflicts
    let conflicts = crn_times
        .keys()
        .map(|crn| ctx.is_in_conflict(*crn))
        .collect::<Vec<bool>>();

    // Some sections conflict
    assert!(conflicts.iter().any(|b| *b));

    // Some sections don't conflict
    assert!(conflicts.iter().any(|b| !b));
}

// TODO: Remove `#[should_panic]` and add `#[wasm_bindgen_test]`
// when there's a way to fix this bug without worsening performance too much.
#[should_panic]
#[test]
fn test_curr_times_bug() {
    let mut ctx = Context::from_semester_data(SemesterData {
        crn_times: &phf_map! {
            0u32 => [0b0011],
            1u32 => [0b1100],
            2u32 => [0b0110],
        },
        crn_courses: &phf_map! {
            0u32 => "SELC-1010",
            1u32 => "SELC-1010",
            2u32 => "CNFL-1200",
        },
    });

    ctx.set_selected(0, true);
    ctx.set_selected(1, true);

    assert!(ctx.is_in_conflict(2));

    ctx.set_selected(2, true);

    let schedules = get_sorted_schedules(&mut ctx);
    assert_eq!(schedules.len(), 0);
}
