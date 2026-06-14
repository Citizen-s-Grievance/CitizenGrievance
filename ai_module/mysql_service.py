import mysql.connector


conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="12345678",
    database="CitizenGrievance"
)


def get_sent_complaints():

    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM complaintmysql
        WHERE status='SENT'
        """
    )

    return cursor.fetchall()


def update_status(
    complaint_id,
    status
):

    cursor = conn.cursor()

    cursor.execute(

        """
        UPDATE complaintmysql
        SET status=%s
        WHERE complaint_id=%s
        """,

        (
            status,
            complaint_id
        )
    )

    conn.commit()
