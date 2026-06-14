from database.mongo_service import save_llm_record

mongo_id = save_llm_record(

    101,

    "generated_docs/complaint.docx",

    "This is a test complaint"

)

print(
    "Mongo ID:",
    mongo_id
)