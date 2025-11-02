# Chess2FEN

This project provides an API to analyze chessboard images, determine the board state (in FEN format), and suggest the best next move using the Stockfish engine.

## Running the Server

1.  Navigate to the `Chess2FEN` project directory.
2.  Ensure all dependencies from `requirements.txt` are installed.
3.  Run the server using the following command:
    ```bash
    python api_server.py
    ```
4.  The server will be available at `http://127.0.0.1:8100`.

## API

Detailed documentation for all available API endpoints can be found in [API.md](API.md).

## Testing the Live Stream

The project includes a simple web page to test the live streaming of the board prediction process.

1.  Make sure the API server is running.
2.  Open the `test_stream.html` file directly in your web browser.
3.  Use the form to upload a chessboard image and provide the position of the `a1` square.
4.  Click "Start Prediction Stream" to see the real-time output from the server, including processing times and debug images.
