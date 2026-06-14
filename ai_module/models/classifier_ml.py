import pickle

with open(
"models/complaint_classifier.pkl",
"rb"
) as f:

    model=pickle.load(f)


mapping={

"Road":{
"department":"Road Department",
"category":"Road Damage",
"priority":"High"
},

"Water":{
"department":"Water Department",
"category":"Water Supply",
"priority":"High"
},

"Electricity":{
"department":"Electricity Department",
"category":"Electrical Issue",
"priority":"Medium"
},

"Sanitation":{
"department":"Sanitation Department",
"category":"Garbage Collection",
"priority":"Medium"
},

"Drainage":{
"department":"Drainage Department",
"category":"Drainage Issue",
"priority":"Medium"
},

"Animal":{
"department":"Animal Control",
"category":"Stray Animal Issue",
"priority":"Medium"
},

"Traffic":{
"department":"Traffic Department",
"category":"Traffic Signal Issue",
"priority":"High"
}
}


def classify_complaint(text):

    prediction=model.predict(
        [text]
    )[0]

    return mapping.get(

    prediction,

    {
    "department":"General",
    "category":"Other",
    "priority":"Low"
    }

)