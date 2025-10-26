"""
Chess logic utilities for piece validation and board state management.

Provides functions for validating chess moves, converting between
different board representations, and handling chess rules.
"""

import chess
import numpy as np
from typing import Dict, List, Optional, Tuple


class ChessBoard:
    """
    Wrapper around python-chess Board with additional utilities.
    
    Provides methods for board state management, move validation,
    and conversion between different representations.
    """
    
    def __init__(self, fen: str = chess.STARTING_FEN):
        """
        Initialize chess board.
        
        Args:
            fen: FEN string representing board state
        """
        self.board = chess.Board(fen)
        self.move_history = []
    
    def get_piece_at(self, square: str) -> Optional[chess.Piece]:
        """
        Get piece at given square.
        
        Args:
            square: Square notation (e.g., 'e4')
            
        Returns:
            Piece object or None if empty
        """
        try:
            square_index = chess.parse_square(square)
            return self.board.piece_at(square_index)
        except ValueError:
            return None
    
    def is_valid_move(self, move_uci: str) -> bool:
        """
        Check if move is valid.
        
        Args:
            move_uci: Move in UCI format (e.g., 'e2e4')
            
        Returns:
            True if move is legal
        """
        try:
            move = chess.Move.from_uci(move_uci)
            return move in self.board.legal_moves
        except ValueError:
            return False
    
    def make_move(self, move_uci: str) -> bool:
        """
        Make a move on the board.
        
        Args:
            move_uci: Move in UCI format
            
        Returns:
            True if move was successful
        """
        try:
            move = chess.Move.from_uci(move_uci)
            if move in self.board.legal_moves:
                self.board.push(move)
                self.move_history.append(move_uci)
                return True
            return False
        except ValueError:
            return False
    
    def get_board_array(self) -> np.ndarray:
        """
        Get board as 8x8 numpy array.
        
        Returns:
            8x8 array with piece symbols
        """
        board_array = np.full((8, 8), '.', dtype=object)
        
        for square in chess.SQUARES:
            piece = self.board.piece_at(square)
            if piece:
                row = 7 - (square // 8)
                col = square % 8
                board_array[row, col] = piece.symbol()
        
        return board_array
    
    def get_fen(self) -> str:
        """Get current FEN string."""
        return self.board.fen()
    
    def is_game_over(self) -> bool:
        """Check if game is over."""
        return self.board.is_game_over()
    
    def get_game_result(self) -> Optional[str]:
        """
        Get game result.
        
        Returns:
            '1-0', '0-1', '1/2-1/2', or None if ongoing
        """
        if self.board.is_checkmate():
            return '0-1' if self.board.turn else '1-0'
        elif self.board.is_stalemate():
            return '1/2-1/2'
        elif self.board.is_insufficient_material():
            return '1/2-1/2'
        elif self.board.is_seventyfive_moves():
            return '1/2-1/2'
        elif self.board.is_fivefold_repetition():
            return '1/2-1/2'
        else:
            return None


def square_to_coords(square: str) -> Tuple[int, int]:
    """
    Convert square notation to coordinates.
    
    Args:
        square: Square notation (e.g., 'e4')
        
    Returns:
        (row, col) coordinates (0-7)
    """
    try:
        square_index = chess.parse_square(square)
        row = 7 - (square_index // 8)
        col = square_index % 8
        return row, col
    except ValueError:
        raise ValueError(f"Invalid square notation: {square}")


def coords_to_square(row: int, col: int) -> str:
    """
    Convert coordinates to square notation.
    
    Args:
        row: Row index (0-7)
        col: Column index (0-7)
        
    Returns:
        Square notation (e.g., 'e4')
    """
    if not (0 <= row < 8 and 0 <= col < 8):
        raise ValueError(f"Invalid coordinates: ({row}, {col})")
    
    square_index = (7 - row) * 8 + col
    return chess.square_name(square_index)


def piece_symbol_to_name(symbol: str) -> str:
    """
    Convert piece symbol to full name.
    
    Args:
        symbol: Piece symbol (e.g., 'K', 'q', 'P')
        
    Returns:
        Full piece name (e.g., 'white king', 'black queen')
    """
    piece_map = {
        'K': 'white king', 'Q': 'white queen', 'R': 'white rook',
        'B': 'white bishop', 'N': 'white knight', 'P': 'white pawn',
        'k': 'black king', 'q': 'black queen', 'r': 'black rook',
        'b': 'black bishop', 'n': 'black knight', 'p': 'black pawn'
    }
    
    return piece_map.get(symbol, 'unknown')


def validate_fen(fen: str) -> bool:
    """
    Validate FEN string format.
    
    Args:
        fen: FEN string to validate
        
    Returns:
        True if FEN is valid
    """
    try:
        chess.Board(fen)
        return True
    except ValueError:
        return False


def get_piece_color(piece_symbol: str) -> Optional[str]:
    """
    Get piece color from symbol.
    
    Args:
        piece_symbol: Piece symbol
        
    Returns:
        'white', 'black', or None
    """
    if piece_symbol.isupper():
        return 'white'
    elif piece_symbol.islower():
        return 'black'
    else:
        return None


def calculate_material_balance(board: ChessBoard) -> int:
    """
    Calculate material balance (white - black).
    
    Args:
        board: ChessBoard instance
        
    Returns:
        Material balance (positive = white advantage)
    """
    piece_values = {
        'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
        'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 'k': 0
    }
    
    balance = 0
    for square in chess.SQUARES:
        piece = board.board.piece_at(square)
        if piece:
            balance += piece_values.get(piece.symbol(), 0)
    
    return balance