def classify_complaint(text):

    text=text.lower()

    categories={

    "Road":[
    "pothole",
    "road",
    "accident",
    "hole",
    "path"
    ],

    "Water":[
    "water",
    "supply",
    "leak"
    ],

    "Electricity":[
    "street light",
    "power"
    ],

    "Sanitation":[
    "garbage",
    "waste",
    "sewage"
    ],

    "Drainage":[
    "drain",
    "overflow"
    ]
    }


    for category,words in categories.items():

        if any(
            word in text
            for word in words
        ):

            if category=="Road":

                return{

                "department":
                "Road Department",

                "category":
                "Road Damage",

                "priority":
                "High"
                }

            elif category=="Water":

                return{

                "department":
                "Water Department",

                "category":
                "Water Supply",

                "priority":
                "High"
                }

    return{

    "department":
    "General",

    "category":
    "Other",

    "priority":
    "Low"
    }