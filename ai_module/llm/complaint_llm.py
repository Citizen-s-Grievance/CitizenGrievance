import requests

URL="https://industrial-briefly-kept-inspector.trycloudflare.com/generate" #/generate


def generate_complaint(
    data,
    info
):

    prompt = f"""
You are generating a complaint for a Government Grievance Portal.

Citizen Name: {data["name"]}
Location: {data["typed_location"]}
Address: {data["resolved_address"]}
Department: {info["department"]}

Complaint:
{data["complaint"]}

Requirements:

1. Write a complete formal complaint letter.
2. Include a subject line.
3. Explain the issue in detail.
4. Mention public inconvenience and safety concerns.
5. Request immediate action.
6. End with:

Yours faithfully,
{data["name"]}

7. Do not use placeholders.
8. Do not generate examples.
9. Do not generate notes.
10. Return only the complaint.
"""

    try:

        response=requests.post(

            URL,

            json={

                "prompt":prompt

            },

            timeout=180
        )


        print(
            "STATUS:",
            response.status_code
        )

        print(
            "TEXT:"
        )

        print(
            response.text
        )


        return response.json().get(
            "response",
            "No response key found"
        )

    except Exception as e:

        print(
            "ERROR:",
            str(e)
        )

        return "Complaint generation failed"