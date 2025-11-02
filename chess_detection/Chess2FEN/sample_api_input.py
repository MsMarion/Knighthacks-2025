import requests
import os

def call_predict_api():
    """
    A sample script to call the /predict endpoint of the Chess2FEN API.
    """
    # The URL of your running API server
    url = "http://127.0.0.1:8100/predict"

    # The path to the image you want to send.
    # Make sure the api_server.py is running from the Chess2FEN directory,
    # and this script is also run from the Chess2FEN directory.
    image_path = os.path.join("data", "predictions", "test1.jpg")

    # The orientation of the a1 square in the image
    a1_pos = "BL"

    if not os.path.exists(image_path):
        print(f"Error: Sample image not found at {image_path}")
        print("Please make sure you are running this script from the 'Chess2FEN' directory.")
        return

    print(f"Sending request to {url} with image: {image_path}")

    # Open the image file in binary mode
    with open(image_path, "rb") as image_file:
        # 'files' dictionary for the image part of the multipart request
        files = {"image": (os.path.basename(image_path), image_file, "image/jpeg")}
        
        # 'data' dictionary for the other form fields
        data = {"a1_pos": a1_pos}
        
        try:
            # Send the POST request
            response = requests.post(url, files=files, data=data)

            # Check the response
            if response.status_code == 200:
                print("\nPrediction successful!")
                print("Response JSON:")
                print(response.json())
            else:
                print(f"\nError: Received status code {response.status_code}")
                print("Response content:")
                print(response.text)

        except requests.exceptions.ConnectionError as e:
            print(f"\nConnection Error: Could not connect to the server at {url}.")
            print("Please make sure the api_server.py is running.")

if __name__ == "__main__":
    call_predict_api()
