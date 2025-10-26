"""
Test suite for chess logic utilities.

Tests the functionality of chess logic functions including
board state management, move validation, and position analysis.
"""

import pytest
import numpy as np
from pathlib import Path
import sys

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from utils.chess_logic import (
    ChessBoard, square_to_coords, coords_to_square,
    piece_symbol_to_name, validate_fen, get_piece_color,
    calculate_material_balance
)


class TestChessBoard:
    """Test ChessBoard class functionality."""
    
    def test_initialization(self):
        """Test board initialization."""
        board = ChessBoard()
        assert board.get_fen() == "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        assert not board.is_game_over()
    
    def test_custom_fen(self):
        """Test board with custom FEN."""
        fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
        board = ChessBoard(fen)
        assert board.get_fen() == fen
    
    def test_get_piece_at(self):
        """Test getting piece at square."""
        board = ChessBoard()
        
        # Test valid squares
        piece = board.get_piece_at('e1')
        assert piece is not None
        assert piece.symbol() == 'K'
        
        piece = board.get_piece_at('e8')
        assert piece is not None
        assert piece.symbol() == 'k'
        
        # Test empty square
        piece = board.get_piece_at('e4')
        assert piece is None
    
    def test_invalid_square(self):
        """Test invalid square notation."""
        board = ChessBoard()
        piece = board.get_piece_at('invalid')
        assert piece is None
    
    def test_is_valid_move(self):
        """Test move validation."""
        board = ChessBoard()
        
        # Test valid move
        assert board.is_valid_move('e2e4')
        
        # Test invalid move
        assert not board.is_valid_move('e2e5')
        assert not board.is_valid_move('invalid')
    
    def test_make_move(self):
        """Test making moves."""
        board = ChessBoard()
        
        # Test valid move
        assert board.make_move('e2e4')
        assert board.get_fen() != "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        
        # Test invalid move
        board2 = ChessBoard()
        assert not board2.make_move('e2e5')
    
    def test_get_board_array(self):
        """Test board array conversion."""
        board = ChessBoard()
        board_array = board.get_board_array()
        
        assert board_array.shape == (8, 8)
        assert board_array[0, 0] == 'r'  # a8
        assert board_array[7, 4] == 'K'  # e1
    
    def test_game_over_conditions(self):
        """Test game over conditions."""
        board = ChessBoard()
        assert not board.is_game_over()
        assert board.get_game_result() is None


class TestCoordinateFunctions:
    """Test coordinate conversion functions."""
    
    def test_square_to_coords(self):
        """Test square to coordinates conversion."""
        assert square_to_coords('a1') == (7, 0)
        assert square_to_coords('h8') == (0, 7)
        assert square_to_coords('e4') == (4, 4)
    
    def test_coords_to_square(self):
        """Test coordinates to square conversion."""
        assert coords_to_square(7, 0) == 'a1'
        assert coords_to_square(0, 7) == 'h8'
        assert coords_to_square(4, 4) == 'e4'
    
    def test_coordinate_roundtrip(self):
        """Test coordinate conversion roundtrip."""
        squares = ['a1', 'h8', 'e4', 'b3', 'f6']
        for square in squares:
            row, col = square_to_coords(square)
            converted_square = coords_to_square(row, col)
            assert converted_square == square
    
    def test_invalid_coordinates(self):
        """Test invalid coordinate handling."""
        with pytest.raises(ValueError):
            coords_to_square(-1, 0)
        with pytest.raises(ValueError):
            coords_to_square(8, 0)
        with pytest.raises(ValueError):
            coords_to_square(0, -1)
        with pytest.raises(ValueError):
            coords_to_square(0, 8)


class TestPieceFunctions:
    """Test piece-related functions."""
    
    def test_piece_symbol_to_name(self):
        """Test piece symbol to name conversion."""
        assert piece_symbol_to_name('K') == 'white king'
        assert piece_symbol_to_name('Q') == 'white queen'
        assert piece_symbol_to_name('k') == 'black king'
        assert piece_symbol_to_name('q') == 'black queen'
        assert piece_symbol_to_name('P') == 'white pawn'
        assert piece_symbol_to_name('p') == 'black pawn'
    
    def test_get_piece_color(self):
        """Test piece color detection."""
        assert get_piece_color('K') == 'white'
        assert get_piece_color('Q') == 'white'
        assert get_piece_color('k') == 'black'
        assert get_piece_color('q') == 'black'
        assert get_piece_color('.') is None
        assert get_piece_color('X') is None
    
    def test_calculate_material_balance(self):
        """Test material balance calculation."""
        board = ChessBoard()
        balance = calculate_material_balance(board)
        assert balance == 0  # Starting position should be balanced
        
        # Test with custom position
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        board2 = ChessBoard(fen)
        balance2 = calculate_material_balance(board2)
        assert balance2 == 0


class TestFenValidation:
    """Test FEN validation functions."""
    
    def test_valid_fen(self):
        """Test valid FEN strings."""
        valid_fens = [
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
            "8/8/8/8/8/8/8/8 w - - 0 1"
        ]
        
        for fen in valid_fens:
            assert validate_fen(fen)
    
    def test_invalid_fen(self):
        """Test invalid FEN strings."""
        invalid_fens = [
            "invalid fen",
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0",
            ""
        ]
        
        for fen in invalid_fens:
            assert not validate_fen(fen)


class TestBoardState:
    """Test board state management."""
    
    def test_move_history(self):
        """Test move history tracking."""
        board = ChessBoard()
        
        # Make some moves
        board.make_move('e2e4')
        board.make_move('e7e5')
        
        assert len(board.move_history) == 2
        assert board.move_history[0] == 'e2e4'
        assert board.move_history[1] == 'e7e5'
    
    def test_board_state_consistency(self):
        """Test board state consistency."""
        board = ChessBoard()
        initial_fen = board.get_fen()
        
        # Make a move
        board.make_move('e2e4')
        new_fen = board.get_fen()
        
        # FEN should change
        assert initial_fen != new_fen
        
        # Board should still be valid
        assert board.get_fen() is not None


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])