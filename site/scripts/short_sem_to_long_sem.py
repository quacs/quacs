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
elif term == "12":
    long_term = "winter-enrichment"
else:
    # unknown - just spit out the year
    long_term = term

print(long_term + year)
