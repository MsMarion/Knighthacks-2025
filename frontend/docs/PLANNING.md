# ChessOps Dashboard — Discovery & Reuse Plan

## What exists to reuse
- FastAPI Chess2FEN service with endpoints:
  - `POST /predict` (image + a1_pos → FEN + board SVG)
  - `GET /nextmove` (Stockfish move + SVG)
  - `POST /set_elo`
  - `GET /current_board`, `GET /visualize_next_move`
- These map to `src/lib/api.ts`.

## Wrap/extend
- Camera transport abstracted (mjpeg/hls/webrtc).
- Pipeline & Agent events via SSE/WS (optional); UI degrades gracefully.
- Chat is wrapped behind `ChatAdapter` to reuse your streaming renderer.

## Missing / to expose
- Pipeline events stream (frame timings, confidences, crops).
- Agent events stream (message/tool_call/tool_result/status + causal links).

## Risks / questions
- Chat primitive location & props?
- Production camera URLs and transport support.
- Event retention policies server-side.

## Next steps
- Ship dashboard with cameras + board state now; add streams later with no UI refactor.
