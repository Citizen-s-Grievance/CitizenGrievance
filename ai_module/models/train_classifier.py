import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.metrics import accuracy_score

print("Loading Dataset...")

# load dataset
df = pd.read_csv(
    "models/complaint_dataset.csv"
)

print("Dataset Loaded")
print("Total samples:",len(df))

# Input feature
X = df["complaint"]

# Target label
y = df["department"]

print("\nDepartments:")
print(df["department"].value_counts())


# split dataset

X_train,X_test,y_train,y_test=(
train_test_split(

X,
y,

test_size=0.20,

random_state=42,

stratify=y
)
)


print("\nTraining Started...")


# pipeline

model=Pipeline([

(

"tfidf",

TfidfVectorizer(

stop_words="english",

ngram_range=(1,2),

max_features=10000
)

),

(

"classifier",

LogisticRegression(

max_iter=5000

)

)

])


# train

model.fit(

X_train,

y_train
)


print("\nTraining Complete")


# prediction

pred=model.predict(

X_test
)


print("\nAccuracy:")

print(

accuracy_score(
y_test,
pred
)

)


print("\nClassification Report:\n")

print(

classification_report(

y_test,
pred
)

)


# save model

with open(
"models/complaint_classifier.pkl",
"wb"
) as f:

    pickle.dump(
        model,
        f
    )


print("\nModel Saved")

print(
"models/complaint_classifier.pkl"
)



# test samples immediately

print("\n========== TESTING ==========\n")


samples=[

"Large potholes near temple causing accidents",

"No water supply in our colony for four days",

"Street lights not working near bus stand",

"Garbage dumped near market area",

"Drain overflow causing flooding",

"Many stray dogs attacking children",

"Traffic signal not functioning"
]


for s in samples:

    result=model.predict([s])[0]

    print(
    "Complaint:",
    s
    )

    print(
    "Prediction:",
    result
    )

    print("-"*40)