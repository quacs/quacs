# Python standard library
from datetime import date
from itertools import combinations
import math
import time


def gen(term, data):
    divide = range(1, 61)
    unique_ranges = set()
    end_date = date.today()
    # Compute necessary preconditions for the optimization logic
    for dept in data:
        for course in dept["courses"]:
            for section in course["sections"]:
                for timeslot in section["timeslots"]:
                    start_date = timeslot["dateStart"]
                    if start_date == None:
                        continue
                    end_date = max(end_date, timeslot["dateEnd"])
                    unique_ranges.add(start_date)
                    """
                    divide = filter(
                        lambda x: timeslot["timeStart"] % x
                        == timeslot["timeEnd"] % x
                        == 0,
                        divide,
                    )
                    """

    MINUTE_GRANULARITY = 1
    NUM_MIN_PER_HOUR = 60 // MINUTE_GRANULARITY

    # Generate binary conflict output
    # day * 24 hours/day * NUM_MIN_PER_HOUR = total buckets
    offset = lambda x: x * 24 * NUM_MIN_PER_HOUR

    day_offsets = {
        "M": offset(0),
        "T": offset(1),
        "W": offset(2),
        "R": offset(3),
        "F": offset(4),
        "S": offset(5),
        "U": offset(6),
    }

    BITS_PER_SLICE = offset(len(day_offsets))
    BIT_VEC_SIZE = BITS_PER_SLICE * len(unique_ranges)

    conflicts = {}
    crn_to_courses = {}

    # A table consisting of lists of classes that conflict on the 'x'th bit
    sem_conflict_table = []

    for _ in range(BIT_VEC_SIZE):
        sem_conflict_table.append([])
    for dept in data:
        for course in dept["courses"]:
            for section in course["sections"]:
                conflict = [0] * BIT_VEC_SIZE
                for time in section["timeslots"]:
                    my_end = time["dateEnd"]
                    my_start = time["dateStart"]
                    for i, date_range in enumerate(unique_ranges):
                        # check to see if we are in this range
                        if my_end < date_range:
                            continue
                        if my_start > date_range:
                            continue

                        for day in time["days"]:
                            for hour in range(0, 2400, 100):
                                for minute in range(0, 60, MINUTE_GRANULARITY):
                                    if (
                                        time["timeStart"] <= hour + minute
                                        and time["timeEnd"] > hour + minute
                                    ):
                                        minute_idx = minute
                                        hour_idx = hour // 100
                                        index = BITS_PER_SLICE * i + (
                                            day_offsets[day]
                                            + hour_idx * NUM_MIN_PER_HOUR
                                            + minute_idx
                                        )
                                        conflict[index] = 1
                                        sem_conflict_table[index].append(section["crn"])

                if sum(conflict) == 0:
                    continue
                crn_to_courses[section["crn"]] = course["id"]
                conflicts[section["crn"]] = conflict

    # Compute unnecessary conflict bits - where a bit is defined as unnecessary if its removal does not affect the result conflict checking
    # The following code computes a list of candidates that fit this criteria
    unnecessary_indices = set()

    for index1 in range(BIT_VEC_SIZE):
        for index2 in range(index1 + 1, BIT_VEC_SIZE):
            if (
                index2 not in unnecessary_indices
                and sem_conflict_table[index1] == sem_conflict_table[index2]
            ):
                unnecessary_indices.add(index2)

    # Reverse the list as to not break earlier offsets
    conflicts_to_prune = list(unnecessary_indices)
    conflicts_to_prune.sort(reverse=True)

    # Prune the bits in `conflicts_to_prune` from all the bitstrings
    for section_crn in conflicts:
        for bit in conflicts_to_prune:
            del conflicts[section_crn][bit]

    for x in conflicts_to_prune:
        del sem_conflict_table[x]

    BIT_VEC_SIZE -= len(unnecessary_indices)
    unnecessary_indices.clear()

    sem_conflict_dict = dict()

    for index1 in range(BIT_VEC_SIZE):
        for crn in sem_conflict_table[index1]:
            if crn not in sem_conflict_dict:
                sem_conflict_dict[crn] = set()

            sem_conflict_dict[crn].add(index1)

    # Optimization phase 2:
    # Now that we're on a (greatly) reduced working space, we can now prune using this
    # less efficient algorithm
    for index1 in range(BIT_VEC_SIZE):
        # We want all (unordered) pairs of conflicting courses on the bit `index1`
        pair_list = [pair for pair in combinations(sem_conflict_table[index1], 2)]

        # This part essentially tries to see if some other bit(s) other than the current one will create a conflict
        # for the conflicting classes in pair_list
        # If there is, we can safely discard this bit.
        pairs_to_delete = set()
        for pair in pair_list:
            table1 = sem_conflict_dict[pair[0]]
            table2 = sem_conflict_dict[pair[1]]
            for x in table1:
                if x != index1 and x in table2:
                    pairs_to_delete.add(pair)

        if len(pairs_to_delete) == len(pair_list):
            for pair in pair_list:
                table1 = sem_conflict_dict[pair[0]]
                table2 = sem_conflict_dict[pair[1]]

                table1.discard(index1)
                table2.discard(index1)

            unnecessary_indices.add(index1)

    # Reverse the list as to not break earlier offsets
    conflicts_to_prune = list(unnecessary_indices)
    conflicts_to_prune.sort(reverse=True)

    # Prune the bits in `conflicts_to_prune` from all the bitstrings
    for section_crn in conflicts:
        for bit in conflicts_to_prune:
            del conflicts[section_crn][bit]

        # Convert to a string for the quacs-rs rust codegen
        conflicts[section_crn] = "".join(str(x) for x in conflicts[section_crn])

    # Compute the proper bit vec length for quacs-rs
    BIT_VEC_SIZE = math.ceil((BIT_VEC_SIZE - len(unnecessary_indices)) / 64)
    with open(f"data/{term}/mod.rs", "w") as f:  # -{os.getenv("CURRENT_TERM")}
        f.write(
            """\
//This file was automatically generated. Please do not modify it directly
use ::phf::{{phf_map, Map}};
pub const BIT_VEC_LEN: usize = """
            + str(BIT_VEC_SIZE)
            + """;
pub static CRN_TIMES: Map<u32, [u64; BIT_VEC_LEN]> = phf_map! {
"""
        )

        for crn, conflict in conflicts.items():
            rust_array = f"\t{crn}u32 => ["
            for i in range(0, BIT_VEC_SIZE * 64, 64):
                if i != 0:
                    rust_array += ", "
                rust_array += str(int(conflict[i : i + 64], 2))
            rust_array += "],\n"

            f.write(rust_array)

        f.write(
            """
};
pub static CRN_COURSES: Map<u32, &'static str> = phf_map! {
"""
        )

        for crn, course in crn_to_courses.items():
            f.write(f'\t{crn}u32 => "{course}",\n')
        f.write("};")
