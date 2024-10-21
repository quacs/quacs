# Is this RPI related? Nope :)

import aiohttp
import asyncio
import json
from tqdm.asyncio import tqdm  # Async version of tqdm
import statistics
import numpy as np
import folium
from folium.plugins import BeautifyIcon
from datetime import datetime



# Boroughs and combined data container
boroughs = ("Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island")
combined_data = []


async def fetch_borough_data(session, borough):
    """Fetch the restaurant data for a single borough."""
    async with session.get(f"https://a816-health.nyc.gov/ABCEatsRestaurants/App/GetEntitiesByBoro/{borough}") as response:
        data = await response.json()
        return data


async def fetch_restaurant_details(session, restaurant):
    """Fetch restaurant details by CurrentDecalNumber async."""
    camis_id = restaurant['CurrentDecalNumber']
    url = f"https://a816-health.nyc.gov/ABCEatsRestaurants/App/GetEntityDetail?camisId={camis_id}"
    async with session.get(url) as response:
        restaurant_details = await response.json()
        restaurant['details'] = restaurant_details


async def main():
    """Handle the execution of borough and restaurant detail fetching asynchronously."""
    global combined_data
    async with aiohttp.ClientSession() as session:

        # Fetch borough-level data first
        borough_tasks = [fetch_borough_data(session, borough) for borough in boroughs]
        borough_results = await asyncio.gather(*borough_tasks)

        # Combine the results from all boroughs into a single list
        for data in borough_results:
            combined_data.extend(data)
        # Prepare tasks to fetch details for each restaurant concurrently
        detail_tasks = [fetch_restaurant_details(session, restaurant) for restaurant in combined_data]

        # Use tqdm to display progress as tasks process concurrently
        for f in tqdm.as_completed(detail_tasks, total=len(detail_tasks)):
            await f

        # Save the final data to a file
        with open("data.json", "w") as f:
            json.dump(combined_data, f, indent=4, sort_keys=True)


# Scrape the data
# asyncio.run(main())

# Re-load the data from file
with open('data.json', 'r') as file:
    data = json.load(file)

worst_grades_of_all_time = []
for restaurant in data:
    for detail in restaurant['details']['InspectionCollection']:
        if detail['TotalScore'] != "" and detail['TotalScore'] != "n/a":
            worst_grades_of_all_time.append((detail['TotalScore'], restaurant['EntityName'], restaurant['CurrentDecalNumber']))

# Sort by the total score
worst_grades_of_all_time.sort(key=lambda x: x[0], reverse=True)

# print(worst_grades_of_all_time[:10])



# restaurant_scores = []
# for restaurant in data:
#     scores = [int(detail['TotalScore']) for detail in restaurant['details']['InspectionCollection']
#               if detail['TotalScore'].isdigit()]
#     if scores:
#         average_score = statistics.mean(scores)
#         variance = statistics.variance(scores) if len(scores) > 1 else 0
#         restaurant_scores.append((average_score, variance, len(scores), restaurant['EntityName'], restaurant['CurrentDecalNumber']))

# restaurant_scores.sort(key=lambda x: (x[0], -x[2], x[1]))

# print(restaurant_scores[:10])


# Collect all scores to calculate m and C
all_scores = []
for restaurant in data:
    for detail in restaurant['details']['InspectionCollection']:
        if detail['TotalScore'] not in ["", "n/a"]:
            all_scores.append(float(detail['TotalScore']))

# Calculate m (average number of reviews per restaurant) and C (mean score across all restaurants)
m = np.mean([len(restaurant['details']['InspectionCollection']) for restaurant in data])
C = np.mean(all_scores)

# Compute Bayesian scores
bayesian_scores = []
for restaurant in data:
    scores = [
        float(detail['TotalScore'])
        for detail in restaurant['details']['InspectionCollection']
        if detail['TotalScore'] not in ["", "n/a"]
    ]
    if scores:
        n = len(scores)
        avg_score = np.mean(scores)
        bayesian_score = (n / (n + m)) * avg_score + (m / (n + m)) * C
        bayesian_scores.append((bayesian_score, restaurant['EntityName'], restaurant['CurrentDecalNumber']))

        restaurant['bayesian_score'] = bayesian_score

bayesian_scores.sort(key=lambda x: x[0])
print(bayesian_scores[:10])


# sort the data by the Bayesian score
data.sort(key=lambda x: x.get('bayesian_score', 9999))
# Add a rank to each restaurant based on the Bayesian score
for rank, restaurant in enumerate(data, start=1):
    restaurant['bayesian_rank'] = rank

# save the data to a file
with open('data_with_bayesian_scores.json', 'w') as file:
    json.dump(data, file, indent=4, sort_keys=True)







# Parameters for weighting based on the time decay factor
today = datetime.today()
decay_factor = 0.9  # Adjust this decay factor for time sensitivity (the smaller, the faster older reviews decay)

def time_weighted_score(date_str):
    """ Calculate the weight for a score based on how recent the date is """
    review_date = datetime.strptime(date_str, '%Y-%m-%d')
    days_diff = (today - review_date).days
    return decay_factor ** (days_diff / 365)

# Compute time-weighted Bayesian scores
weighted_bayesian_scores = []
for restaurant in data:
    weighted_scores = []
    for detail in restaurant['details']['InspectionCollection']:
        if detail['TotalScore'] not in ["", "n/a"] and 'InspectionDate' in detail:
            score = float(detail['TotalScore'])
            weight = time_weighted_score(detail['InspectionDate'])  # Calculate time-based weight
            weighted_scores.append(score * weight)

    if weighted_scores:
        n = len(weighted_scores)
        avg_score = np.sum(weighted_scores) / np.sum([time_weighted_score(detail['InspectionDate'])
                                                      for detail in restaurant['details']['InspectionCollection']
                                                      if detail['TotalScore'] not in ["", "n/a"]])
        time_weighted_bayesian_score = (n / (n + m)) * avg_score + (m / (n + m)) * C
        weighted_bayesian_scores.append((time_weighted_bayesian_score, restaurant['EntityName'], restaurant['CurrentDecalNumber']))

        restaurant['bayesian_score_time_weighted'] = time_weighted_bayesian_score

# Sort restaurants by time-weighted Bayesian score
weighted_bayesian_scores.sort(key=lambda x: x[0])
print(weighted_bayesian_scores[:10])

# sort the data by the Bayesian score
data.sort(key=lambda x: x.get('bayesian_score_time_weighted', 9999))
# Add a rank to each restaurant based on the Bayesian score
for rank, restaurant in enumerate(data, start=1):
    restaurant['bayesian_time_weighted_rank'] = rank

# Save the updated data with second score to a new JSON file
with open('data_with_weighted_bayesian_scores.json', 'w') as file:
    json.dump(data, file, indent=4, sort_keys=True)






# NYC's approximate center latitude and longitude
nyc_lat = 40.7128
nyc_lon = -74.0060

# Initialize the map centered around NYC
map = folium.Map(location=[nyc_lat, nyc_lon], zoom_start=12)

# Add markers for the top places with their Bayesian score
for restaurant in data:
    bayesian_score = restaurant['bayesian_score'] if 'bayesian_score' in restaurant else 9999
    entity_name = restaurant['EntityName']
    decal_number = restaurant['CurrentDecalNumber']
    # bayesian_rank = restaurant['bayesian_rank']
    bayesian_time_weighted_rank = restaurant['bayesian_time_weighted_rank']
    latitude = restaurant.get('MostRecent_Latitude')
    longitude = restaurant.get('MostRecent_Longitude')

    # if bayesian_score > 10.25 or bayesian_score < 9.75:
    #     continue

    if bayesian_time_weighted_rank > 5000:
        continue


    # Add marker to the map
    if latitude and longitude:
        url = f"https://a816-health.nyc.gov/ABCEatsRestaurants/#!/Search/{decal_number}"
        popup_text = f'[{bayesian_time_weighted_rank}] <a href="{url}" target="_blank">{entity_name}</a> (Score: {bayesian_score:.2f}, Decal Number: {decal_number})'

        icon = BeautifyIcon(
            icon_shape='marker',
            border_color='#b3334f',
            text_color='black',
            number=str(bayesian_time_weighted_rank),
            inner_icon_style='font-size:12px;padding-top:2px;'
        )

        folium.Marker([latitude, longitude], popup=popup_text, icon=icon).add_to(map)

# Save map to an HTML file
map.save('top_restaurants_map.html')
