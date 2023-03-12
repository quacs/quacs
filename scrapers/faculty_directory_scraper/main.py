from concurrent import futures
import asyncio
import time
import requests
import aiohttp
from lxml import html
from lxml import etree
from bs4 import BeautifulSoup
import json
import re

BASE_URL = "https://faculty.rpi.edu"
FACULTY_LIST = [
    "/merrill-whitburn-0",
    "/merrill-whitburn",
    "/michael-klein-0",
    "/michael-klein",
    "/abby-kinchy",
    "/adam-dayem",
    "/adam-petela",
    "/adrienne-frank",
    "/agung-julius",
    "/akina-yura",
    "/alan-cutler",
    "/alan-desrochers",
    "/alec-walker",
    "/alexander-hiland",
    "/alexander-ma",
    "/alexandros-tsamis",
    "/alex-gittens",
    "/alex-patterson",
    "/alhussein-abouzeid",
    "/alicia-walf",
    "/ali-shahsavari",
    "/ali-tajer",
    "/allison-hoffman",
    "/amgalanbaatar-baldansuren",
    "/amir-hirsa",
    "/amit-mathur",
    "/ana-milanova",
    "/andrew-fitzgerald",
    "/andrew-steele",
    "/anita-greenfield",
    "/anthony-titus",
    "/antoinette-maniatty",
    "/antonella-zompa",
    "/aparna-gupta",
    "/aric-krause",
    "/arjun-saxena",
    "/arta-yazdanseta",
    "/arthur-sanderson",
    "/arturo-estrella",
    "/ashwani-kapila",
    "/asish-ghosh",
    "/awino-hellen-awino",
    "/azita-hirsa",
    "/barbara-cutler",
    "/belmiro-galo-da-silva",
    "/benjamin-chang",
    "/benjamin-weissman",
    "/bharat-bagepalli",
    "/bill-francis",
    "/bill-siegmann",
    "/billur-aksoy",
    "/bimal-malaviya",
    "/birsen-yazici",
    "/blanca-barquera",
    "/bob-graves",
    "/bob-karlicek",
    "/bolek-szymanski",
    "/bram-van-heuveln",
    "/branda-miller",
    "/brandon-costelloe-kuehn",
    "/brett-fajen",
    "/brett-orzechowski",
    "/brian-bayly",
    "/brian-callahan",
    "/brian-clark",
    "/brian-pertl",
    "/brian-tolle",
    "/bruce-piper",
    "/bruce-watson",
    "/bulent-yener",
    "/b-wayne-bequette",
    "/caleb-white",
    "/cara-wang",
    "/caren-canier-0",
    "/carla-leitao",
    "/carl-mcdaniel",
    "/carlos-varela",
    "/carolin-hofmann",
    "/carolyn-tennant",
    "/cassandra-sammartano",
    "/catalin-picu",
    "/catherine-royer",
    "/cathryn-dwyre",
    "/chaitanya-ullal",
    "/chanaka-edirisinghe",
    "/chan-chung",
    "/charles-martin",
    "/charles-portelli",
    "/cheng-kent-hsu",
    "/chip-kilduff",
    "/chjan-lim",
    "/chris-bystroff",
    "/chris-mcdermott",
    "/chris-perry",
    "/christianna-bennett",
    "/christian-wetzel",
    "/christopher-carothers",
    "/christopher-cioffi",
    "/christopher-donohue",
    "/christopher-fisher-lochhead",
    "/christopher-jeansonne",
    "/christopher-letchford",
    "/christopher-sims",
    "/christopher-tong",
    "/christopher-tozzi",
    "/christoph-steinbruchel",
    "/christos-varsamis",
    "/chrysi-nanou",
    "/chuck-boylen",
    "/chuck-stewart",
    "/chulsung-bae",
    "/chun-leung",
    "/chunyu-wang",
    "/claire-moriarty",
    "/clint-ballinger",
    "/cody-edson",
    "/conor-lennon",
    "/corey-woodcock",
    "/cristina-james",
    "/curt-breneman",
    "/curtis-bahn",
    "/daeyong-lee",
    "/damien-west",
    "/daniel-berg",
    "/daniel-gall",
    "/daniel-lander",
    "/daniel-stevenson",
    "/daniel-stratford",
    "/daniel-thero",
    "/daniel-walczyk",
    "/dan-lewis",
    "/dan-lyles",
    "/darrin-hunt",
    "/david-bebe",
    "/david-bell",
    "/david-corr",
    "/david-goldschmidt",
    "/david-haviland",
    "/david-isaacson",
    "/david-kahn",
    "/david-musser",
    "/david-pacheco",
    "/david-spooner",
    "/david-stec",
    "/deanna-thompson",
    "/deborah-mcguinness",
    "/deepak-vashishth",
    "/dennis-shelden",
    "/diana-borca-tasciuc",
    "/dick-lahey-jr",
    "/donald-drew",
    "/donald-schwendeman",
    "/donald-vitaliano",
    "/dorit-nevo",
    "/doug-swank",
    "/e-fred-schubert",
    "/edmund-palermo",
    "/edwin-fohtung",
    "/edwin-liu",
    "/edwin-rogers",
    "/elaine-renz",
    "/eliane-zerbetto-traldi",
    "/elisabeth-brown",
    "/elizabeth-blaber",
    "/elizabeth-kam",
    "/elizabeth-press",
    "/elliot-anshelevich",
    "/emily-liu",
    "/enrique-ramirez",
    "/ephraim-glinert",
    "/eric-ameres",
    "/eric-rutledge",
    "/eric-schaffer",
    "/ernesto-gutierrez-miravete",
    "/esra-agca-aktunc",
    "/esther-wertz",
    "/etana-ferede",
    "/ethan-brown",
    "/euan-somerscales",
    "/evan-douglis",
    "/evan-runyon",
    "/eyosias-ashenafi",
    "/farhan-gandhi",
    "/faye-duchin",
    "/fengyan-li",
    "/filbert-totsingan",
    "/fleet-hower",
    "/florencia-vetcher",
    "/fotios-kopsaftopoulos",
    "/francisco-cunha",
    "/frank-spear",
    "/fred-willett",
    "/fudong-han",
    "/gaetano-montelione",
    "/ganpati-ramanath",
    "/gary-judd",
    "/gaurav-jain",
    "/geetu-sharma",
    "/george-dalakos-0",
    "/george-habetler",
    "/george-lee",
    "/george-makhatadze",
    "/george-nagy",
    "/georges-belfort",
    "/george-slota",
    "/george-xu",
    "/gerald-korenowski",
    "/ge-wang",
    "/gina-kucinski",
    "/glenn-ciolek",
    "/gregor-kovacic",
    "/gregory-collins",
    "/gunnar-babcock",
    "/gustavo-crembil",
    "/gwo-ching-wang",
    "/gyorgy-korniss",
    "/heidi-newberg",
    "/helen-zha",
    "/helen-zhou",
    "/henrik-hagerup",
    "/henry-scarton-0",
    "/henry-bungay-iii",
    "/hesham-hassan",
    "/himali-stoccatore",
    "/hisham-mohamed",
    "/holly-traver",
    "/hseng-tai-lintner",
    "/huaming-peng",
    "/humberto-terrones-maldonado",
    "/hyun-kang",
    "/ian-chadd",
    "/igor-vamos",
    "/ingrid-wilke",
    "/ishwara-bhat",
    "/ivar-giaever",
    "/j-keith-nelson",
    "/jacob-shelley",
    "/jamecyn-morey",
    "/james-bailey",
    "/james-hendler",
    "/james-lu",
    "/james-malazita",
    "/james-olson",
    "/james-p-zappen-0",
    "/james-rees",
    "/james-richardson",
    "/jami-cotler",
    "/jamshed-mistry",
    "/jane-koretz",
    "/jane-rigler",
    "/jarrett-rose",
    "/jasmine-plum",
    "/jason-hicken",
    "/jason-huh",
    "/jason-jacobskind",
    "/jason-kuruzovich",
    "/jason-warner",
    "/jee-hoon-choi",
    "/jeff-morris",
    "/jeffrey-banks",
    "/jennifer-cardinal",
    "/jennifer-hurley",
    "/jennifer-pazour",
    "/jennifer-wilsey",
    "/jenny-kemp",
    "/jeremy-farrell",
    "/jianjing-lin",
    "/jianling-yue",
    "/jian-shi",
    "/jian-sun",
    "/jianxi-gao",
    "/jidong-xiao",
    "/jie-lian",
    "/jillian-crandall",
    "/jillian-willis",
    "/jingwen-tu",
    "/joe-chow",
    "/joe-donahue",
    "/joel-giedt",
    "/joel-plawsky",
    "/johan-maharjan",
    "/john-brunski",
    "/john-dargenio",
    "/john-gowdy",
    "/john-koller",
    "/john-lagraff",
    "/john-loercher",
    "/john-milanese",
    "/john-mitchell",
    "/john-reilly",
    "/john-schroeder",
    "/johnson-samuel",
    "/john-sturman",
    "/john-tichy",
    "/john-wen",
    "/john-woods",
    "/jonas-braasch",
    "/jonathan-dordick",
    "/jonathan-mckinney",
    "/jonathan-newell",
    "/jonathan-stetler",
    "/jose-holguin-veras",
    "/joseph-markowski",
    "/joseph-michael",
    "/joseph-warden",
    "/joshua-draper",
    "/joshua-hurst",
    "/joyce-diwan",
    "/juan-borja",
    "/juergen-hahn",
    "/julia-carroll",
    "/julia-lee",
    "/julian-georg",
    "/june-deery",
    "/junichi-kanai",
    "/justin-den-herder",
    "/k-v-lakshmi",
    "/karthik-panneerselvam",
    "/kartik-josyula",
    "/karyn-rogers",
    "/katherine-skovira",
    "/kathleen-galloway",
    "/kathleen-ruiz",
    "/kathryn-dannemann",
    "/kathryn-cartini",
    "/kathy-fontaine",
    "/kathy-high",
    "/katrina-pacheco",
    "/keith-fraser",
    "/keith-moo-young",
    "/keith-taylor-0",
    "/kenneth-connor",
    "/kenneth-kramer",
    "/kenneth-miller",
    "/kenneth-ragsdale",
    "/ken-rose",
    "/ken-simons",
    "/kevin-housley",
    "/kevin-rose",
    "/kevin-stewart",
    "/keylon-cheeseman",
    "/kimberly-oakes",
    "/konstantin-kuzmin",
    "/koushik-kar",
    "/kristen-mills",
    "/kristin-bennett",
    "/kristin-johnson",
    "/kseniya-klyachko",
    "/kurt-anderson",
    "/kyle-wilt",
    "/larry-kagan",
    "/larry-reid",
    "/leandro-piazzi",
    "/lee-ligon",
    "/leila-ramagopal-pertl",
    "/lei-yu",
    "/leonard-interrante",
    "/leo-wan",
    "/linnda-caporael",
    "/liping-huang",
    "/lirong-xia",
    "/liu-liu",
    "/liz-sprague",
    "/lonn-combs",
    "/lorelei-wagner",
    "/lucy-zhang",
    "/luigi-vanfretti",
    "/luiz-victor-repolho-cagliari",
    "/lydia-manikonda",
    "/m-hakan-hekimoglu",
    "/mv-shyam-kumar",
    "/malik-magdon-ismail",
    "/marcelo-crespo-da-silva",
    "/marcus-carter",
    "/margaret-mcdermott",
    "/margarita-kirova-snover",
    "/mariah-hahn",
    "/marianne-nyman",
    "/marjorie-mcshane",
    "/mark-embrechts",
    "/mark-foster",
    "/mark-goldberg",
    "/mark-holmes",
    "/mark-kanonik-0",
    "/mark-shephard",
    "/mark-wentland",
    "/marty-schmidt",
    "/marvin-bentley",
    "/mary-anne-staniszewski",
    "/matt-burgermaster",
    "/mattheos-koffas",
    "/matthew-goodheart",
    "/matthew-lopez",
    "/matthew-steckler",
    "/matthew-titus-0",
    "/matt-oehlschlaeger",
    "/maurice-suckling",
    "/maya-kiehl",
    "/mei-si",
    "/meng-wang",
    "/michael-amitay",
    "/michael-blostein",
    "/michael-borbath",
    "/michael-century",
    "/michael-halloran",
    "/michael-hanna",
    "/michael-hughes",
    "/michael-jensen",
    "/michael-mcdermott",
    "/michael-orourke",
    "/michael-oatman",
    "/michael-shur",
    "/michael-stradley",
    "/michael-symans",
    "/michael-wozny",
    "/michael-z-podowski",
    "/miles-kimball",
    "/mina-mahmoudi",
    "/minor-gordon",
    "/minoru-tomozawa",
    "/mohammed-zaki",
    "/mona-hella",
    "/monica-agarwal",
    "/monica-hughes",
    "/morgan-schaller",
    "/mourad-zeghal",
    "/moussa-ngom",
    "/murali-chari",
    "/nadarajah-narendran",
    "/nancy-campbell",
    "/natalia-maldonado-martinez",
    "/nathan-meltz",
    "/neil-rolnick",
    "/nicholas-l-clesceri",
    "/nicholas-mizer",
    "/nick-platts",
    "/nihat-baysal",
    "/nikhil-koratkar",
    "/nima-ahmadi",
    "/nina-stanley",
    "/ning-xiang",
    "/nishtha-langer",
    "/norman-thibodeau",
    "/omar-el-shafee",
    "/omar-williams",
    "/onkar-sahni",
    "/oshani-seneviratne",
    "/pankaj-karande",
    "/partha-dutta",
    "/pasquale-sullo",
    "/patricia-search",
    "/patrick-burke",
    "/patrick-quinn",
    "/patrick-royer",
    "/patrick-underhill",
    "/paul-chow",
    "/paul-hohenberg",
    "/paul-keblinski",
    "/paul-mccoy-0",
    "/paul-quigley",
    "/paul-schoch",
    "/paul-stoler",
    "/svedberg",
    "/peter-boyce",
    "/peter-dinolfo",
    "/peter-j-bonitatibus",
    "/peter-kramer",
    "/peter-olausson",
    "/peter-persans",
    "/peter-wayner",
    "/pingkun-yan",
    "/prabhakar-neti",
    "/prabhat-hajela",
    "/prakrati-thakur",
    "/qiang-ji",
    "/radoslav-ivanov",
    "/raffi-garcia",
    "/raghu-raghavachari",
    "/rahmi-ozisik",
    "/ralph-noble",
    "/raquel-velho",
    "/ravishankar-sundararaman",
    "/rebecca-benjamin",
    "/rena-huang",
    "/rhett-russo",
    "/ricardo-dobry",
    "/richard-bonocora",
    "/richard-chapman-0",
    "/richard-gross",
    "/richard-neal",
    "/richard-plotka",
    "/richard-smith",
    "/rich-radke",
    "/rick-relyea",
    "/robert-block",
    "/robert-hull",
    "/robert-jones",
    "/robert-linhardt",
    "/robert-maccrone",
    "/robert-nideffer",
    "/robert-niemiec",
    "/robert-parsons",
    "/robert-whalen",
    "/rob-hamilton",
    "/roger-wright",
    "/ronald-bailey",
    "/ronald-hedden",
    "/rongjie-lai",
    "/ron-gutmann",
    "/ron-sun",
    "/rosaline-lee",
    "/rosemary-armao",
    "/ross-rice",
    "/rostyslav-korolov",
    "/rui-fan",
    "/rushabh-padalia",
    "/russell-kraft",
    "/ryan-gilbert",
    "/ryosuke-imaeda",
    "/sama-rakhshan-pouri",
    "/sam-estabrooks",
    "/sam-miller",
    "/samuel-chabot",
    "/sandeep-singh",
    "/sandipan-mishra",
    "/sandra-nierzwicki-bauer",
    "/sang-han",
    "/sangwoo-lee",
    "/santiago-paternain",
    "/sarah-cadieux",
    "/sarah-felix",
    "/sarah-gold",
    "/sarah-greene",
    "/sarah-ward",
    "/sara-tack",
    "/sasha-wagner",
    "/scott-forth",
    "/sean-x-he",
    "/sebastian-souyris",
    "/seemanti-ramanath",
    "/selma-cohen",
    "/selmer-bringsjord",
    "/sergei-nirenburg",
    "/shanbin-shi",
    "/shankar-narayan",
    "/shaowu-pan",
    "/shawn-yu-lin",
    "/shayla-sawyer",
    "/shekhar-garde",
    "/shengbai-zhang",
    "/shep-salon",
    "/shun-uchida",
    "/sibel-adali",
    "/silvia-ruzanka",
    "/simona-bortis-schultz",
    "/skye-anicca",
    "/stacy-patterson",
    "/stefanie-reay",
    "/stephanie-loveless",
    "/stephen-signell",
    "/steve-derby",
    "/steven-cramer",
    "/steven-hagy",
    "/steven-roecker",
    "/steven-tysoe",
    "/sufei-shi",
    "/susan-gilbert",
    "/susan-smith",
    "/t-ravichandran",
    "/tamar-gordon",
    "/tarek-abdoun",
    "/tathagata-bhaduri",
    "/ted-krueger",
    "/theo-borca-tasciuc",
    "/thierry-blanchet",
    "/thilanka-munasinghe",
    "/thomas-abbott",
    "/thomas-begley",
    "/thomas-bickley",
    "/thomas-gerbino",
    "/thomas-ingram",
    "/thomas-willemain",
    "/thomas-zimmie",
    "/tianyi-chen",
    "/timothy-golden",
    "/todd-przybycien",
    "/toh-ming-lu",
    "/tomek-strzalkowski",
    "/tom-haley",
    "/tomie-hahn",
    "/tong-zhang",
    "/trevor-rhone",
    "/ukwatte-lokuliyanage-indika-perera",
    "/uwe-kruger",
    "/uzma-mushtaque",
    "/victoria-bennett",
    "/victor-robles-sanchez",
    "/vidhya-chakrapani",
    "/vivek-ghosal",
    "/walaid-sehwail",
    "/wayne-gray",
    "/wayne-roberge",
    "/wei-ji",
    "/weina-ran",
    "/wes-turner",
    "/wilfredo-colon",
    "/william-bill-pearlman",
    "/william-henshaw",
    "/william-stillman",
    "/william-wallace",
    "/wolf-von-maltzahn",
    "/w-randolph-franklin",
    "/xavier-intes",
    "/xun-wang",
    "/yael-erel",
    "/yangyang-xu",
    "/yaron-danon",
    "/yinan-wang",
    "/yingrui-yang",
    "/yong-sung-kim",
    "/yong-zheng",
    "/yunfeng-shi",
    "/yuri-lvov",
    "/ze-wille-kielwagen",
]


def clean_string(string):
    # Remove newlines and nbsp
    return re.sub("[\n\u00a0 ]+", " ", string).strip()


async def get_professor(session, url, data):
    async with session.get(f"{BASE_URL}/{url}") as response:
        print(url)
        soup = BeautifulSoup(await response.text("utf8"), "lxml")
        entry = {}
        entry["name"] = soup.find("span", {"class": "field--name-title"}).text
        entry["portrait"] = BASE_URL + soup.find("img", {"class": "img-fluid"})["src"]

        # Sometimes the title is in field--name-field-title, and sometimes
        # it is in field--name-field-alternate-title. No explanation for that.
        if not (title := soup.find("div", {"class", "field--name-field-title"})):
            title = soup.find("div", {"class", "field--name-field-alternate-title"})
        # There will also sometimes not be a title.
        if title:
            entry["title"] = title.text
        else:
            entry["title"] = ""

        department = soup.find("div", {"class": "field--name-field-primary-department"})
        if department:
            if title:
                entry["title"] += ", "
            entry["title"] += department.text

        # Sometimes there is no bio, focus area, etc so we use this if statement patterm
        if bio := soup.find("div", {"class": "field--name-field-bio"}):
            entry["biography"] = clean_string(bio.text)

        if area := soup.find("div", {"class": "field--name-field-focus-area"}):
            entry["area"] = clean_string(
                area.find("div", {"class", "field__item"}).text
            )

        if primary_area := soup.find(
            "div", {"class": "field--name-field-primary-research-focus"}
        ):
            entry["primary-area"] = clean_string(
                primary_area.find("div", {"class", "field__item"}).text
            )

        if education := soup.find("div", {"class": "field--name-field-education"}):
            # The purpose of doing this is to prevent paragraphs in the education block from getting smushed together
            entry["education"] = clean_string(
                " ".join(
                    [
                        x.text.strip()
                        for x in education.find(
                            "div", {"class", "field__item"}
                        ).find_all(recursive=False)
                    ]
                )
            )

        if teaching := soup.find(
            "div", {"class": "field--name-field-teaching-summary"}
        ):
            entry["teaching"] = clean_string(teaching.text)

        if research := soup.find(
            "div", {"class": "field--name-field-research-summary"}
        ):
            entry["research"] = clean_string(research.text)

        if office := soup.find("div", {"class": "field--name-field-location"}):
            entry["office"] = clean_string(office.text)

        # Disabled to avoid spamming professors.
        # if phone := soup.find("div",{"class":"field--name-field-phone-number"}):
        #    entry["phone"] = clean_string(phone.text)

        if website := soup.find(
            "div", {"class": "field--name-field-website field--type-link"}
        ):
            entry["website"] = clean_string(website.text)

        # Scraping the email and ORCID (see Gittens) is a bit more complicated because neither is not wrapped in a classed tag
        # Disabled to avoid spamming professors.
        # if envelope_icon := soup.find("i",{"class":"fa-envelope"}):
        #    if email := envelope_icon.parent.find("a"):
        #        entry["email"] = clean_string(email.text)

        if orcid_icon := soup.find("i", {"class": "fa-orcid"}):
            entry["orcid"] = clean_string(orcid_icon.parent.text)

        data[url] = entry


async def entry_to_professor(session, url, faculty_list):
    async with session.get(f"{BASE_URL}/{url}") as response:
        soup = BeautifulSoup(await response.text("utf8"), "lxml")
        canonical_url = (
            "/" + soup.find("link", {"rel": "canonical"})["href"].split("/")[-1]
        )

        # If we are not at a search page, then we are at a faculty page.
        # So add it to the list.
        if canonical_url != "/search":
            faculty_list.append(canonical_url)
            return

        # If we are at a search page, then we selected a name that has multiple professors.
        # e.g. Michael Klein
        # so we need to add both

        # Getting each entry in the search results
        for entry in soup.findAll("div", {"class": "views-field-title"}):
            faculty_list.append(entry.find("a")["href"])


async def main():
    # Gets the faculty directory page
    response = requests.get(BASE_URL)
    faculty_entries = html.fromstring(
        response.content.decode(response.apparent_encoding)
    ).xpath('//select[@data-drupal-facet-id="name"]/option/@value')

    async with aiohttp.ClientSession() as session:
        # when two professors have the same name, the faculty_entries variable
        # only has one entry for both, so we need to account for this
        # faculty_list = []
        # for faculty_url in faculty_entries:
        #    await entry_to_professor(session, faculty_url, faculty_list)
        # now that we actually have a list of professors, we will fill in the
        # data object with the relevant information
        # print(faculty_list)
        data = {}
        for professor_url in FACULTY_LIST:
            await get_professor(session, professor_url, data)

    with open("faculty.json", "w") as outfile:
        json.dump(data, outfile, sort_keys=True, indent=2)


asyncio.run(main())
