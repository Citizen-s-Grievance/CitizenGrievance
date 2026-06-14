from pymongo import MongoClient
from bson.binary import Binary

client = MongoClient(
    "mongodb://localhost:27017"
)

db = client["CitizenGrievanceDB"]

collection = db["complaints"]


def update_ai_output(
    complaint_id,
    pdf_bytes,
    llm_text
):

    print("Searching:", complaint_id)

    doc = collection.find_one(
        {
            "_id": int(complaint_id)
        }
    )

    print("FOUND DOC:", doc)

    result = collection.update_one(

        {
            "_id": int(complaint_id)
        },

        {
            "$set": {

                "pdfLLM":
                Binary(pdf_bytes),

                "complaintDescriptionLLM":
                llm_text

            }
        }
    )

    print("Matched:", result.matched_count)
    print("Modified:", result.modified_count)

    updated_doc = collection.find_one(
        {
            "_id": int(complaint_id)
        }
    )

    print(
        "PDF EXISTS:",
        "pdfLLM" in updated_doc
    )


# def save_llm_record():
#     return None