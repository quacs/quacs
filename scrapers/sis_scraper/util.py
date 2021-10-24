#!/usr/bin/env python3
# Python standard library
import datetime

# "COMPUTER SCIENCE I" => "Computer Science I"
def normalize_class_name(name):
    name = list(name)

    for i in range(1, len(name)):
        if name[i - 1] == " ":
            continue
        name[i] = name[i].lower()
    return "".join(name)


# "11:00 AM - 1:00 PM" -> 1100,1300
def timeToMilitary(time):
    def __time_offset(time):
        offset = 0
        if "pm" in time and "12:" not in time:
            offset = 1200
        return int("".join(time.strip().split(":"))[:4]) + offset

    if "TBA" in time:
        return -1, -1
    start, end = time.split("-")
    return __time_offset(start), __time_offset(end)


# 'Uzma   Mushtaque (P), Shianne M.  Hulbert ' -> Uzma Mushtaque, Shianne M. Hulbert
def get_instructor_string(input):
    return ", ".join(
        [" ".join("".join(x.split("(P)")).split()) for x in input.split(",")]
    )


def get_semesters_to_scrape():
    RPI_SEMESTER_MONTH_OFFSETS = {1, 5, 9}
    semesters = []
    date = datetime.date.today()
    month = date.month
    # roll back to nearest RPI start month
    # We can get away with not needing time deltas since we can't wrap years
    # due to January being a semester start month
    while month not in RPI_SEMESTER_MONTH_OFFSETS:
        month -= 1

    date = datetime.date(date.year, month, 1)
    semesters.append(date)

    for _ in range(2):
        # Now roll forward until we find two more semesters
        # Since the maximum amount of days in a month is 31,
        # we can add 32 to guarentee a jump, since timedelta has no months option :(
        date += datetime.timedelta(days=32)
        # Avoid overflowing months, just reset the day back to 1
        date = date.replace(day=1)
        while date.month not in RPI_SEMESTER_MONTH_OFFSETS:
            date += datetime.timedelta(days=32)
            date = date.replace(day=1)

        semesters.append(date)

    return [f"{sem.year}{str(sem.month).zfill(2)}" for sem in semesters]
