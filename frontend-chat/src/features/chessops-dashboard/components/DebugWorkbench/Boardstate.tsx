/**
 * Boardstate Component
 * 
 * Live chess position visualization with FEN/PGN display
 */

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Copy, ArrowRight, Crown } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

// Unicode chess pieces
const PIECE_SYMBOLS: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

interface BoardCell {
  cell: string;
  piece: string | null;
  file: number; // 0-7
  rank: number; // 0-7
  isLight: boolean;
}

function parseFEN(fen: string): BoardCell[] {
  const board: BoardCell[] = [];
  const ranks = fen.split(' ')[0].split('/');
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  ranks.forEach((rank, rankIdx) => {
    let fileIdx = 0;
    for (const char of rank) {
      if (/\d/.test(char)) {
        const emptySquares = parseInt(char);
        for (let i = 0; i < emptySquares; i++) {
          const cell = `${files[fileIdx]}${8 - rankIdx}`;
          board.push({
            cell,
            piece: null,
            file: fileIdx,
            rank: 7 - rankIdx,
            isLight: (fileIdx + (7 - rankIdx)) % 2 === 0,
          });
          fileIdx++;
        }
      } else {
        const cell = `${files[fileIdx]}${8 - rankIdx}`;
        board.push({
          cell,
          piece: char,
          file: fileIdx,
          rank: 7 - rankIdx,
          isLight: (fileIdx + (7 - rankIdx)) % 2 === 0,
        });
        fileIdx++;
      }
    }
  });

  return board;
}

export function Boardstate() {
  const { pipelineEvents, selection } = useDashboardStore();

  // Get the selected frame or the latest frame
  const selectedEvent = selection.selected_frame_id
    ? pipelineEvents.find((e) => e.frame_id === selection.selected_frame_id)
    : pipelineEvents[pipelineEvents.length - 1];

  const boardState = selectedEvent?.accepted_board_state;
  const fen = boardState?.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  const board = useMemo(() => parseFEN(fen), [fen]);

  const fenParts = fen.split(' ');
  const sideToMove = fenParts[1] === 'w' ? 'White' : 'Black';
  const castlingRights = fenParts[2] || '-';
  const enPassant = fenParts[3] || '-';
  const halfmoveClock = fenParts[4] || '0';
  const fullmoveNumber = fenParts[5] || '1';

  const handleCopyFEN = () => {
    navigator.clipboard.writeText(fen);
  };

  const handleCopyPGN = () => {
    const pgn = boardState?.pgn || "No PGN available";
    navigator.clipboard.writeText(pgn);
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Board State</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedEvent
              ? `Frame ${selectedEvent.frame_id.slice(-8)}`
              : "No frame selected"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              sideToMove === "White"
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-gray-500/50 bg-gray-500/10"
            }
          >
            <Crown className="h-3 w-3 mr-1" />
            {sideToMove} to move
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Chessboard */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-xl">
            {/* Board */}
            <div className="grid grid-cols-8 gap-0 p-4 bg-muted/30 rounded-2xl border-2 border-border shadow-xl">
              {[...Array(8)].map((_, rankIdx) =>
                [...Array(8)].map((_, fileIdx) => {
                  const cellData = board.find(
                    (c) => c.file === fileIdx && c.rank === 7 - rankIdx
                  );
                  if (!cellData) return null;

                  const isSelected = selection.selected_cells?.includes(cellData.cell);
                  const isHovered = selection.hovered_cell === cellData.cell;

                  return (
                    <div
                      key={cellData.cell}
                      className={`aspect-square flex items-center justify-center relative transition-all duration-200 ${
                        isSelected ? "ring-4 ring-primary z-10" : ""
                      } ${isHovered ? "scale-110 z-10 shadow-2xl" : ""}`}
                      style={{
                        backgroundColor: cellData.isLight
                          ? "hsl(var(--muted))"
                          : "hsl(var(--accent))",
                      }}
                    >
                      {/* Piece */}
                      {cellData.piece && (
                        <span
                          className="text-4xl transition-transform hover:scale-125 cursor-pointer select-none"
                          style={{
                            color: /[A-Z]/.test(cellData.piece)
                              ? "hsl(var(--foreground))"
                              : "hsl(var(--muted-foreground))",
                            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          }}
                        >
                          {PIECE_SYMBOLS[cellData.piece] || cellData.piece}
                        </span>
                      )}

                      {/* Cell Label (on hover) */}
                      <div className="absolute top-1 left-1 text-[8px] font-mono opacity-40">
                        {cellData.cell}
                      </div>

                      {/* Last Move Highlight */}
                      {boardState?.last_move && (
                        (boardState.last_move.includes(cellData.cell) && (
                          <div className="absolute inset-0 bg-yellow-500/20 animate-pulse" />
                        ))
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Rank Labels (Left) */}
            <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-around text-xs font-mono text-muted-foreground">
              {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank) => (
                <div key={rank} className="flex items-center justify-end pr-2">
                  {rank}
                </div>
              ))}
            </div>

            {/* File Labels (Bottom) */}
            <div className="flex justify-around mt-2 text-xs font-mono text-muted-foreground">
              {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => (
                <div key={file}>{file}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          {/* FEN */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">FEN Notation</h4>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopyFEN}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <code className="text-xs font-mono block bg-muted p-2 rounded break-all">
              {fen}
            </code>
          </Card>

          {/* Position Info */}
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-3">Position Info</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Castling:</span>
                <span className="font-mono">{castlingRights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">En Passant:</span>
                <span className="font-mono">{enPassant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Halfmove Clock:</span>
                <span className="font-mono">{halfmoveClock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fullmove:</span>
                <span className="font-mono">{fullmoveNumber}</span>
              </div>
            </div>
          </Card>

          {/* Last Move */}
          {boardState?.last_move && (
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2">Last Move</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {boardState.last_move.slice(0, 2)}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="font-mono">
                  {boardState.last_move.slice(2, 4)}
                </Badge>
              </div>
            </Card>
          )}

          {/* PGN */}
          {boardState?.pgn && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">PGN</h4>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopyPGN}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <code className="text-xs font-mono block bg-muted p-2 rounded max-h-32 overflow-y-auto">
                {boardState.pgn}
              </code>
            </Card>
          )}

          {/* Diff */}
          {boardState?.diff && (
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-3">Changes from Previous</h4>
              <div className="space-y-2 text-xs">
                {boardState.diff.added && boardState.diff.added.length > 0 && (
                  <div>
                    <span className="text-green-500 font-medium">Added:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {boardState.diff.added.map((cell) => (
                        <Badge key={cell} variant="outline" className="border-green-500/50 bg-green-500/10">
                          {cell}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {boardState.diff.removed && boardState.diff.removed.length > 0 && (
                  <div>
                    <span className="text-red-500 font-medium">Removed:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {boardState.diff.removed.map((cell) => (
                        <Badge key={cell} variant="outline" className="border-red-500/50 bg-red-500/10">
                          {cell}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {boardState.diff.moved && boardState.diff.moved.length > 0 && (
                  <div>
                    <span className="text-blue-500 font-medium">Moved:</span>
                    <div className="space-y-1 mt-1">
                      {boardState.diff.moved.map((move, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10">
                            {move.from}
                          </Badge>
                          <ArrowRight className="h-3 w-3" />
                          <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10">
                            {move.to}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Card>
  );
}

