from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from speech_handler import speech_to_text

from models.classifier_ml import classify_complaint
from llm.complaint_llm import generate_complaint

from pdf_generator import create_complaint_pdf
from location_service import get_address
from complaint_record import create_record
from database.mongo_service import save_llm_record
import uuid


import os

app = FastAPI()


class ComplaintRequest(BaseModel):

    name:str
    complaint:str
    latitude:float
    longitude:float
    typed_location:str
    time:str


@app.post("/process-complaint")
def process(data: ComplaintRequest):

    data = data.dict()

    complaint_id = str(
        uuid.uuid4()
    )

    # Classification

    info = classify_complaint(
        data["complaint"]
    )

    # Address

    address = get_address(
        data["latitude"],
        data["longitude"]
    )

    data["resolved_address"] = address

    # LLM

    formal = generate_complaint(
        data,
        info
    )

    # PDF

    file = create_complaint_pdf(
        data,
        info,
        formal,
        complaint_id
    )
    
    # MongoDB

    mongo_id = save_llm_record(
    complaint_id,
    file,
    formal,
    data,
    info
)
    # Record

    record = create_record(
        complaint_id,
        data,
        info,
        formal,
        file
    )

    

    record["mongoId"] = mongo_id

    return record



@app.post("/voice-complaint")
async def voice_complaint(

    audio:UploadFile=File(...)

):


    temp_file=f"temp_{audio.filename}"


    with open(

        temp_file,
        "wb"

    ) as f:

        content=await audio.read()

        f.write(content)



    # speech → text

    voice_text=speech_to_text(

        temp_file

    )


    # delete temp audio

    os.remove(

        temp_file

    )


    # ML classification

    info=classify_complaint(

        voice_text

    )


    # temporary values
    # frontend later sends real data

    data={

        "name":"Voice User",

        "complaint":voice_text,

        "latitude":18.67,

        "longitude":78.09,

        "typed_location":"Voice Location",

        "time":"Live Voice Input"

    }


    address=get_address(

        data["latitude"],
        data["longitude"]

    )


    data["resolved_address"]=address


    complaint_id = str(
    uuid.uuid4()
)

    formal = generate_complaint(
    data,
    info
)

    file = create_complaint_pdf(
    data,
    info,
    formal,
    complaint_id
)
    
    mongo_id = save_llm_record(
    complaint_id,
    file,
    formal,
    data,
    info
)

    record = create_record(
    complaint_id,
    data,
    info,
    formal,
    file
)


    record["mongoId"] = mongo_id

    record["voice_text"] = voice_text

    return record