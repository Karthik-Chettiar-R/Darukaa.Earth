import os
from datetime import date

import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set in backend/.env")

DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://", 1)
SITE_IDS = range(5, 14)
RECORDED_DATES = [date(2026, month, 1) for month in range(5, 10)]


def main():
    with psycopg.connect(DATABASE_URL) as connection:
        existing_sites = {
            row[0]
            for row in connection.execute(
                "SELECT id FROM sites WHERE id BETWEEN %s AND %s",
                (min(SITE_IDS), max(SITE_IDS)),
            ).fetchall()
        }

        missing_sites = sorted(set(SITE_IDS) - existing_sites)
        if missing_sites:
            raise RuntimeError(f"These site IDs do not exist: {missing_sites}")

        connection.execute(
            """
            SELECT setval(
                pg_get_serial_sequence('site_analytics', 'id'),
                COALESCE((SELECT MAX(id) FROM site_analytics), 0),
                true
            )
            """
        )

        rows = [
            (
                site_id,
                recorded_at,
                round(100 + site_id * 8 + month_index * 12.5, 2),
                round(40 + site_id * 1.5 + month_index * 2.25, 2),
            )
            for site_id in SITE_IDS
            for month_index, recorded_at in enumerate(RECORDED_DATES)
        ]

        with connection.cursor() as cursor:
            cursor.executemany(
                """
                INSERT INTO site_analytics (
                    site_id,
                    recorded_at,
                    carbon_storage,
                    biodiversity_index
                )
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (site_id, recorded_at)
                DO UPDATE SET
                    carbon_storage = EXCLUDED.carbon_storage,
                    biodiversity_index = EXCLUDED.biodiversity_index
                """,
                rows,
            )

        seeded_count = connection.execute(
            """
            SELECT COUNT(*)
            FROM site_analytics
            WHERE site_id BETWEEN %s AND %s
              AND recorded_at BETWEEN %s AND %s
            """,
            (min(SITE_IDS), max(SITE_IDS), RECORDED_DATES[0], RECORDED_DATES[-1]),
        ).fetchone()[0]

    expected_count = len(SITE_IDS) * len(RECORDED_DATES)
    print(f"Seeded {seeded_count} analytics rows for sites {min(SITE_IDS)}-{max(SITE_IDS)}.")
    if seeded_count != expected_count:
        raise RuntimeError(f"Expected {expected_count} rows, found {seeded_count}")


if __name__ == "__main__":
    main()
