# ChessOps Dashboard (frontend)

A polished, production-ready dashboard that unifies:
- Chat panel (reuse your existing chat/streaming UI via adapter)
- Dual live camera feeds (robot arm + top-down board)
- Debugging Workbench (timeline + pipeline tabs + scores/heatmaps/board/alerts)
- A2A Agent Observatory (lanes + graph)

## Run
1. `pnpm i` (or npm/yarn) in this `frontend/` folder
2. `cp .env.example .env.local` and set API/stream URLs
3. `pnpm dev`

### API contract (from your repo's Chess2FEN `api_server.py`)
- `POST /predict` (multipart: image, a1_pos) → `{ fen, board_ascii, board_svg }`
- `GET /nextmove` → `{ best_move: { uci, san, score? }, new_fen, board_svg_with_move }`
- `POST /set_elo` → `{ ok: true }` (body: `{ elo }`)
- `GET /current_board` → SVG string of current board

### Configure cameras
Set `NEXT_PUBLIC_CAMERA_ARM_URL` and `NEXT_PUBLIC_CAMERA_TOP_URL` to `mjpeg`, `hls`, or `webrtc` endpoints.
Transport is auto-detected by file extension / scheme; adjust in `CameraWall.tsx` if needed.

### Events (optional)
Provide SSE or WS endpoints for pipeline and agent events. If empty, UI stays functional with cameras + board state.
