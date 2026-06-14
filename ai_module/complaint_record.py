from datetime import datetime
import uuid

def create_record(
    complaint_id,
    data,
    info,
    formal,
    file
):

    complaint_id=str(
        uuid.uuid4()
    )

    district="Unknown"

    address=data[
        "resolved_address"
    ]

    telangana_districts=[

"Adilabad",
"Bhadradri Kothagudem",
"Hanamkonda",
"Hyderabad",
"Jagtial",
"Jangaon",
"Jayashankar Bhupalpally",
"Jogulamba Gadwal",
"Kamareddy",
"Karimnagar",
"Khammam",
"Komaram Bheem Asifabad",
"Mahabubabad",
"Mahabubnagar",
"Mancherial",
"Medak",
"Medchal-Malkajgiri",
"Mulugu",
"Nagarkurnool",
"Nalgonda",
"Narayanpet",
"Nirmal",
"Nizamabad",
"Peddapalli",
"Rajanna Sircilla",
"Rangareddy",
"Sangareddy",
"Siddipet",
"Suryapet",
"Vikarabad",
"Wanaparthy",
"Warangal",
"Yadadri Bhuvanagiri"

]

    for d in telangana_districts:

        if d in address:

            district=d
            break


    record={

    "complaintId": complaint_id,

    "citizenName":
    data["name"],

    "rawComplaint":
    data["complaint"],

    "formalComplaint":
    formal,

    "department":
    info["department"],

    "category":
    info["category"],

    "priority":
    info["priority"],

    "latitude":
    data["latitude"],

    "longitude":
    data["longitude"],

    "typedLocation":
    data["typed_location"],

    "resolvedAddress":
    data["resolved_address"],

    "district":
    district,

    "assignedAuthorityId":
    None,

    "status":
    "PENDING",

    "createdAt":
    str(datetime.now()),

    "documentURL":
    file

    }

    return record