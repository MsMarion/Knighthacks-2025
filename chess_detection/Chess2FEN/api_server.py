import os
import shutil
import uuid
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse, HTMLResponse, PlainTextResponse, StreamingResponse
import uvicorn
import chess
import chess.svg
from fastapi.middleware.cors import CORSMiddleware

# Assuming the server is run from the Chess2FEN directory
from lc2fen.predict_board import predict_board_onnx, debug_enabled_predictions, debug_enabled_predictions_stream
from make_best_move import best_move_from_fen
from keras.applications.mobilenet_v2 import preprocess_input as prein_mobilenet

# --- Configuration ---
MODEL_PATH_ONNX = "data/models/Xception_last.onnx"
IMG_SIZE_ONNX = 299
PRE_INPUT_ONNX = prein_mobilenet
STOCKFISH_PATH = "stockfish_PC/stockfish-windows-x86-64-avx2/stockfish/stockfish-windows-x86-64-avx2.exe"
TEMP_DIR = "api_temp"

origins = [
    "http://localhost:3000",
    "http://localhost",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8100",
    "null",
]





# --- Stateful Server Data ---
class ServerState:
    def __init__(self):
        self.current_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        self.current_elo = 1500

server_state = ServerState()

app = FastAPI()

app.add_middleware(
     CORSMiddleware,
     allow_origins=origins,
      allow_credentials=True,
     allow_methods=["*"],
       allow_headers=["*"],
    )
class EloRequest(BaseModel):
    elo: int

@app.get("/", response_class=HTMLResponse)
async def root():
    """Returns API documentation and the current board SVG."""
    docs = """Chess2FEN API Documentation

Available Endpoints:

- GET /:
  - Description: Returns this documentation and displays the current board.

- GET /current_board:
  - Description: Returns the current board state as an SVG image.
  - Response: An SVG image of the chessboard.

- GET /visualize_next_move:
  - Description: Calculates the best move for the current board state and returns an SVG of the board with the move visualized as an arrow. This does not change the current board state.
  - Response: An SVG image of the chessboard with the best move shown as a blue arrow.

- GET /nextmove:
  - Description: Calculates the best move for the current board state using Stockfish, updates the board state, and returns the move.
  - Response (JSON):
    - best_move: {uci, san, score}
    - new_fen: The FEN of the board after the move.
    - board_svg_with_move: An SVG of the new board with the move highlighted.

- POST /predict:
  - Description: Predicts the FEN from a chessboard image and sets it as the current board state.
  - Request: Multipart form data with 'image' (the image file) and 'a1_pos' (e.g., "BL", "TR").
  - Response (JSON):
    - fen: The predicted FEN.
    - board_ascii: An ASCII representation of the board.
    - board_svg: An SVG image of the board.

- POST /predict-stream:
  - Description: Predicts the FEN from a chessboard image and streams the real-time debug and timing information to the client using Server-Sent Events.
  - Request: Multipart form data with 'image' (the image file) and 'a1_pos' (e.g., "BL", "TR").
  - Response: A stream of text events (`text/event-stream`). Each event is a line of the debug output.

- POST /set_elo:
  - Description: Sets the Elo rating for the Stockfish engine.
  - Request (JSON): {"elo": <integer between 1320 and 3190>}
  - Response (JSON): A confirmation message.
"""

    try:
        board = chess.Board(server_state.current_fen)
        svg = chess.svg.board(board=board)
    except ValueError:
        svg = "Could not display board: Current FEN is invalid."

    html_content = f"""
    <html>
        <head>
            <title>Chess2FEN API</title>
        </head>
        <body>
            <h1>Chess2FEN API</h1>
            <h2>API Documentation</h2>
            <pre>{docs}</pre>
            <h2>Current Board</h2>
            <div>{svg}</div>
            
        </body>
    </html>
    """
    return html_content

@app.on_event("startup")
async def startup_event():
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)
    if not os.path.exists(STOCKFISH_PATH):
        print(f"WARNING: Stockfish engine not found at '{STOCKFISH_PATH}'. /nextmove and /visualize_next_move endpoints will not work.")

@app.post("/predict")
async def predict_position(
    image: UploadFile = File(...),
    a1_pos: str = Form(...),
):
    """
    Predicts the FEN of a chessboard image and updates the current board state.
    """
    if a1_pos.upper() not in ["BL", "BR", "TL", "TR"]:
        raise HTTPException(status_code=400, detail="Invalid a1_pos value. Must be one of BL, BR, TL, TR.")

    ext = os.path.splitext(image.filename)[1]
    temp_image_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")
    with open(temp_image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        fen = debug_enabled_predictions(
            image_path=temp_image_path,
            a1_pos=a1_pos.upper(),
            model_path=MODEL_PATH_ONNX,
            img_size=IMG_SIZE_ONNX,
            pre_input=PRE_INPUT_ONNX,
            previous_fen=None,
            engine="onnx",
        )

        if not fen:
            raise HTTPException(status_code=500, detail="Failed to predict FEN from the image.")

        board = chess.Board(None)
        board.set_board_fen(fen)
        
        # Update server state
        server_state.current_fen = board.fen()
        
        response_data = {
            "fen": server_state.current_fen,
            "board_ascii": str(board),
            "board_svg": chess.svg.board(board=board, size=200)
        }

        return JSONResponse(content=response_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during processing: {str(e)}")
    finally:
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)


@app.post("/predict-stream")
async def predict_position_stream(
    image: UploadFile = File(...),
    a1_pos: str = Form(...),
):
    """
    Predicts the FEN of a chessboard image and streams the debug output.
    """
    if a1_pos.upper() not in ["BL", "BR", "TL", "TR"]:
        raise HTTPException(status_code=400, detail="Invalid a1_pos value. Must be one of BL, BR, TL, TR.")

    ext = os.path.splitext(image.filename)[1]
    temp_image_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")
    with open(temp_image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    async def generator():
        final_fen = None
        try:
            async for update in debug_enabled_predictions_stream(
                image_path=temp_image_path,
                a1_pos=a1_pos.upper(),
                model_path=MODEL_PATH_ONNX,
                img_size=IMG_SIZE_ONNX,
                pre_input=PRE_INPUT_ONNX,
                engine="onnx",
            ):
                if update.startswith("data: text:FEN: "):
                    final_fen = update.replace("data: text:FEN: ", "").strip()
                yield update
        finally:
            if final_fen:
                try:
                    board = chess.Board(final_fen)
                    server_state.current_fen = board.fen()
                    print(f"Server state updated to FEN: {server_state.current_fen}")
                except ValueError:
                    print(f"Warning: Stream produced an invalid FEN, server state not updated: {final_fen}")
            
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)

    return StreamingResponse(generator(), media_type="text/event-stream")

@app.get("/nextmove")
async def get_next_move():
    """
    Takes the current board FEN, finds the best move, updates the board state,
    and returns the best move.
    """
    if not os.path.exists(STOCKFISH_PATH):
        raise HTTPException(status_code=503, detail=f"Stockfish engine not found at '{STOCKFISH_PATH}'.")

    try:
        board = chess.Board(server_state.current_fen)
        full_fen = board.fen()
        
        best_move = best_move_from_fen(full_fen, server_state.current_elo, STOCKFISH_PATH)
        
        move = chess.Move.from_uci(best_move['uci'])
        board.push(move)
        server_state.current_fen = board.fen()

        response_data = {
            "best_move": best_move,
            "new_fen": server_state.current_fen,
            "board_svg_with_move": chess.svg.board(board=board, lastmove=move, size=200)
        }
        return JSONResponse(content=response_data)

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid FEN string provided.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/set_elo")
async def set_elo(request: EloRequest):
    """
    Sets the Elo for the Stockfish engine.
    """
    if not (1320 <= request.elo <= 3190):
         raise HTTPException(status_code=400, detail="Elo must be between 1320 and 3190.")
    server_state.current_elo = request.elo
    return {"message": f"Elo set to {server_state.current_elo}"}

@app.get("/current_board", response_class=HTMLResponse)
async def get_current_board():
    """
    Returns the current board state as an SVG image.
    """
    try:
        board = chess.Board(server_state.current_fen)
        svg = chess.svg.board(board=board, size=200)
        return svg
    except ValueError:
        raise HTTPException(status_code=500, detail="Current FEN is invalid.")
    
@app.get("/debug_images", response_class=HTMLResponse)
async def get_current_board():
    """
    Returns the current board state as an SVG image.
    """
    try:
        board = chess.Board(server_state.current_fen)
        svg = chess.svg.board(board=board, size=200)
        return svg
    except ValueError:
        raise HTTPException(status_code=500, detail="Current FEN is invalid.")

@app.get("/visualize_next_move", response_class=HTMLResponse)
async def visualize_next_move():
    """
    Calculates the best move for the current board state and returns an SVG
    of the board with the move visualized as an arrow. Does not alter the board state.
    """
    if not os.path.exists(STOCKFISH_PATH):
        raise HTTPException(status_code=503, detail=f"Stockfish engine not found at '{STOCKFISH_PATH}'.")

    try:
        board = chess.Board(server_state.current_fen)
        full_fen = board.fen()
        
        best_move = best_move_from_fen(full_fen, server_state.current_elo, STOCKFISH_PATH)
        
        move_uci = best_move['uci']
        tail_square = chess.SQUARE_NAMES.index(move_uci[:2])
        head_square = chess.SQUARE_NAMES.index(move_uci[2:])
        arrow = chess.svg.Arrow(tail_square, head_square, color="blue")
        
        svg = chess.svg.board(board=board, arrows=[arrow], size=200)
        return svg

    except ValueError:
        raise HTTPException(status_code=500, detail="Current FEN is invalid.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="127.0.0.1", port=8100, reload=True)
