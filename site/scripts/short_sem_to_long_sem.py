import sys

short_sem = sys.argv[1]

year = short_sem[:4]
term = short_sem[4:]

if term == "01":
    long_term = "spring"
elif term == "05":
    long_term = "summer"
elif term == "09":
    long_term = "fall"

print(long_term + year)
