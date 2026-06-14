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

 "Adilabad","Kumuram Bheem Asifabad","Mancherial","Nirmal",
            "Nizamabad","Jagtial","Peddapalli","Kamareddy","Rajanna Sircilla",
            "Karimnagar","Jayashankar Bhupalpally","Sangareddy","Medak",
            "Siddipet","Jangaon","Hanumakonda","Warangal","Mulugu",
            "Bhadradri Kothagudem","Khammam","Mahabubabad","Suryapet",
            "Nalgonda","Yadadri Bhuvanagiri","Medchal Malkajgiri","Hyderabad",
            "Ranga Reddy","Vikarabad","Mahabubnagar","Narayanpet",
            "Jogulamba Gadwal","Wanaparthy","Nagarkurnool"

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