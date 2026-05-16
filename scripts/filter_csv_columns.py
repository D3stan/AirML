import csv
import sys


def filter_csv(input_path, output_path):
    with open(input_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if len(rows) < 3:
        print("Not enough rows in CSV")
        return

    headers = rows[0]
    marker_row = rows[2]  # row with x markers (3rd row in file)

    selected_indices = [
        i for i, val in enumerate(marker_row) if val.strip().lower() != "x"
    ]

    filtered_headers = [headers[i] for i in selected_indices]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(filtered_headers)

    print(f"Wrote {len(filtered_headers)} columns to {output_path}")
    print("Selected columns:", filtered_headers)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: python {sys.argv[0]} <input.csv> <output.csv>")
        sys.exit(1)
    filter_csv(sys.argv[1], sys.argv[2])
