# Modified code based off the licence below
# MIT License
#
# Copyright (c) 2018 Rodantny Reyes
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.


import requests
import json
import math


def createprofessorlist():  # creates List object that include basic information on all Professors from the IDed University
    tempprofessorlist = []
    num_of_prof = GetNumOfProfessors(UniversityId)
    num_of_pages = math.ceil(num_of_prof / 20)
    i = 1
    while i <= num_of_pages:  # the loop insert all professor into list
        page = requests.get(
            "http://www.ratemyprofessors.com/filter/professor/?&page="
            + str(i)
            + "&filter=teacherlastname_sort_s+asc&query=*%3A*&queryoption=TEACHER&queryBy=schoolId&sid="
            + str(UniversityId)
        )
        temp_jsonpage = json.loads(page.content)
        temp_list = temp_jsonpage["professors"]
        tempprofessorlist.extend(temp_list)
        i += 1
    return tempprofessorlist


def GetNumOfProfessors(
    id,
):  # function returns the number of professors in the university of the given ID.
    page = requests.get(
        "http://www.ratemyprofessors.com/filter/professor/?&page=1&filter=teacherlastname_sort_s+asc&query=*%3A*&queryoption=TEACHER&queryBy=schoolId&sid="
        + str(id)
    )  # get request for page
    temp_jsonpage = json.loads(page.content)
    num_of_prof = (
        temp_jsonpage["remaining"] + 20
    )  # get the number of professors at William Paterson University
    return num_of_prof


UniversityId = 795
rpiProfessorlist = createprofessorlist()

print(json.dumps(rpiProfessorlist, indent=4, sort_keys=True))
with open(f"rmp.json", "w") as outfile:  # -{os.getenv("CURRENT_TERM")}
    json.dump(rpiProfessorlist, outfile, sort_keys=False, indent=2)
