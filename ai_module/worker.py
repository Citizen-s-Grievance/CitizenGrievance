import time
import threading

from mysql_service import (
    get_sent_complaints,
    update_status
)

from database.mongo_service import (
    update_ai_output
)

from models.classifier_ml import (
    classify_complaint
)

from llm.complaint_llm import (
    generate_complaint
)

from pdf_generator import (
    create_complaint_pdf
)
def process_complaint(
    complaint
):

    complaint_id = complaint["complaint_id"]

    print(
        f"Processing {complaint_id}"
    )

    try:

        # Mark AI processing started

        update_status(
            complaint_id,
            "IN_PROGRESS"
        )

        data = {

            "name":
            "Citizen",

            "complaint":
            complaint[
                "complaints_in_words"
            ],

            "latitude":
            float(
                complaint["latitude"]
            ),

            "longitude":
            float(
                complaint["longitude"]
            ),

            "typed_location":
            complaint["landmark"],

            "resolved_address":
            complaint["district"],

            "time":
            str(
                complaint["date_time"]
            )
        }

        # ML Classification

        info = classify_complaint(
            data["complaint"]
        )

        # LLM Complaint Generation

        formal = generate_complaint(
            data,
            info
        )

        # PDF Generation

        pdf_path = create_complaint_pdf(
            data,
            info,
            formal,
            complaint_id
        )

        # Read PDF

        with open(
            pdf_path,
            "rb"
        ) as f:

            pdf_bytes = f.read()

        # MongoDB Update

        update_ai_output(

            complaint_id,

            pdf_bytes,

            formal

        )

        # AI completed successfully

        update_status(
            complaint_id,
            "IN_PROGRESS"
        )

        print(
            f"Completed {complaint_id}"
        )

    except Exception as e:

        print(
            f"Failed {complaint_id}:",
            e
        )

        update_status(
            complaint_id,
            "AI_FAILED"
        )

def worker_loop():

    while True:

        try:

            complaints = (
                get_sent_complaints()
            )

            print(
                f"Found {len(complaints)} complaints"
            )

            for complaint in complaints:

                process_complaint(
                    complaint
                )

        except Exception as e:

            print(
                "WORKER ERROR:",
                e
            )

        time.sleep(
            300
        )
        
def start_worker():

    thread = threading.Thread(

        target=worker_loop,

        daemon=True

    )

    thread.start()