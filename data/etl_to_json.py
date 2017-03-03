import pandas as pd


def main():
    with open("raw_data.csv", "rb") as f:
        df = pd.read_csv(f, header=1)

    df = df[df.State == "CA"]
    df = df[["Utility Name", "Plant Name", "Street Address", "City", "State", "Zip", "County", "Latitude", "Longitude", "NERC Region", "Balancing Authority Name", "Transmission or Distribution System Owner"]]
    df = df.reset_index(drop=True)

    print df.head()

    with open("data.json", "wb") as f:
        df.to_json(f, orient="index")


if __name__ == "__main__":
    main()
