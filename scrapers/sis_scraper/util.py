#!/usr/bin/env python3
# Python standard library
from copy import deepcopy
import datetime
import time

# "11:00 AM - 1:00 PM" -> 1100,1300
def time_to_military(time):
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


def calculate_score(columns):
    if not columns:
        return 99999999999  # some arbitrarily large number

    def column_sum(column):
        return sum(map(lambda x: len(x["depts"]) + 3, column))

    mean = sum(map(column_sum, columns)) / len(columns)
    return sum(map(lambda x: abs(mean - column_sum(x)), columns)) / len(columns)


# Recursively finds the most balanced set of columns.
# Since `best` needs to be passed by reference, it's
# actually [best], so we only manipulate best[0].
def optimize_ordering_inner(data, i, columns, best):
    if i == len(data):
        this_score = calculate_score(columns)
        best_score = calculate_score(best[0])

        if this_score < best_score:
            best[0] = deepcopy(columns)
        return

    for column in columns:
        column.append(data[i])
        optimize_ordering_inner(data, i + 1, columns, best)
        column.pop()


def optimize_column_ordering(data, num_columns=3):
    """
    Because we want the QuACS homepage to be as "square-like" as possible,
    we need to re-order departments in such a way that once they're laid out
    in multiple columns, each column is a similar height.
    """

    columns = [[] for _ in range(num_columns)]
    best_result = [[]]

    optimize_ordering_inner(data, 0, columns, best_result)

    best_result = best_result[0]

    for i in range(len(best_result)):
        best_result[i] = sorted(
            best_result[i], key=lambda s: len(s["depts"]), reverse=True
        )

    best_result = sorted(best_result, key=lambda c: len(c[0]["depts"]), reverse=True)

    flattened = []
    for column in best_result:
        flattened.extend(column)

    return flattened


def get_date(input_str):
    """
    Converts a date from SIS into the Python representation
    """
    return datetime.date.fromtimestamp(
        time.mktime(time.strptime(input_str, "%b %d, %Y"))
    )
