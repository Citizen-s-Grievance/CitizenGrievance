from geopy.geocoders import Nominatim

geolocator = Nominatim(
    user_agent="grievance_app"
)

def get_address(lat, lon):

    try:

        location = geolocator.reverse(
            f"{lat},{lon}"
        )

        if location:

            raw = location.address

            parts = raw.split(",")

            short = ",".join(
                parts[:4]
            )

            return short

        return "Address not found"

    except Exception:

        return "Address unavailable"