# Chess2FEN API Documentation

This document provides detailed information about the API endpoints available in the Chess2FEN server.

---

## Endpoints

### `GET /`

- **Description:** Displays the current board state and a brief welcome message.
- **Response:** An HTML page with an SVG of the current chessboard.

### `GET /current_board`

- **Description:** Returns the current board state as an SVG image.
- **Response:** An SVG image of the chessboard (`image/svg+xml`).

### `GET /visualize_next_move`

- **Description:** Calculates the best move for the current board state and returns an SVG of the board with the move visualized as an arrow. This does not change the current board state.
- **Response:** An SVG image of the chessboard with the best move shown as a blue arrow (`image/svg+xml`).

### `GET /nextmove`

- **Description:** Calculates the best move for the current board state using Stockfish, updates the board state, and returns the move.
- **Response (JSON):**
  ```json
  {
    "best_move": {
      "uci": "e2e4",
      "san": "e4",
      "score": 50
    },
    "new_fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    "board_svg_with_move": "<svg>...</svg>"
  }
  ```

### `POST /predict`

- **Description:** Predicts the FEN from a chessboard image and sets it as the current board state.
- **Request:** `multipart/form-data` with two fields:
  - `image`: The image file of the chessboard.
  - `a1_pos`: The position of the a1 square (e.g., "BL", "TR").
- **Response (JSON):**
  ```json
  {
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "board_ascii": "r n b q k b n r\np p p p p p p p\n. . . . . . . .\n. . . . . . . .\n. . . . . . . .\n. . . . . . . .\nP P P P P P P P\nR N B Q K B N R",
    "board_svg": "<svg>...</svg>"
  }
  ```

### `POST /predict-stream`

- **Description:** Predicts the FEN from a chessboard image and streams the real-time debug and timing information to the client using Server-Sent Events.
- **Request:** `multipart/form-data` with two fields:
  - `image`: The image file of the chessboard.
  - `a1_pos`: The position of the a1 square (e.g., "BL", "TR").
- **Response:** A stream of text events (`text/event-stream`). Each event is a line of the debug output, and some events may contain Base64-encoded debug images.

### `POST /set_elo`

- **Description:** Sets the Elo rating for the Stockfish engine.
- **Request (JSON):**
  ```json
  {
    "elo": 1500
  }
  ```
- **Response (JSON):**
  ```json
  {
    "message": "Elo set to 1500"
  }
  ```
