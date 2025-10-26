"""
Board state predictor for chess position analysis.

Implements board state prediction from detected pieces
with FEN generation and position validation.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Union
from pathlib import Path

from ..utils.chess_logic import ChessBoard, validate_fen, square_to_coords, coords_to_square
from ..utils.logger import get_global_logger


class BoardPredictor:
    """
    Board state predictor for chess position analysis.
    
    Provides board state prediction from detected pieces
    with FEN generation and position validation.
    """
    
    def __init__(
        self,
        board_size: int = 8,
        piece_mapping: Optional[Dict[str, str]] = None,
        confidence_threshold: float = 0.5
    ):
        """
        Initialize board predictor.
        
        Args:
            board_size: Size of chess board (default 8x8)
            piece_mapping: Mapping from detected classes to FEN symbols
            confidence_threshold: Minimum confidence for piece placement
        """
        self.board_size = board_size
        self.confidence_threshold = confidence_threshold
        self.piece_mapping = piece_mapping or self._get_default_piece_mapping()
        
        # Initialize logger
        self.logger = get_global_logger()
    
    def _get_default_piece_mapping(self) -> Dict[str, str]:
        """Get default piece mapping to FEN symbols."""
        return {
            'white_pawn': 'P', 'white_rook': 'R', 'white_knight': 'N',
            'white_bishop': 'B', 'white_queen': 'Q', 'white_king': 'K',
            'black_pawn': 'p', 'black_rook': 'r', 'black_knight': 'n',
            'black_bishop': 'b', 'black_queen': 'q', 'black_king': 'k'
        }
    
    def predict_board_state(
        self,
        detections: List[Dict],
        board_positions: Dict[str, Tuple[int, int]]
    ) -> Dict[str, Union[str, Dict, List]]:
        """
        Predict board state from detections.
        
        Args:
            detections: List of piece detections
            board_positions: Mapping of board positions to coordinates
            
        Returns:
            Dictionary containing board state information
        """
        try:
            # Create empty board
            board = np.full((self.board_size, self.board_size), '.', dtype=object)
            piece_confidence = np.zeros((self.board_size, self.board_size))
            
            # Place pieces on board
            placed_pieces = 0
            for detection in detections:
                if self._place_piece_on_board(detection, board, piece_confidence, board_positions):
                    placed_pieces += 1
            
            # Generate FEN from board
            fen = self._board_to_fen(board)
            
            # Validate FEN
            is_valid = validate_fen(fen)
            
            # Get board statistics
            stats = self._get_board_statistics(board, piece_confidence)
            
            return {
                'success': True,
                'fen': fen,
                'is_valid': is_valid,
                'board': board,
                'piece_confidence': piece_confidence,
                'placed_pieces': placed_pieces,
                'total_detections': len(detections),
                'statistics': stats
            }
            
        except Exception as e:
            self.logger.log_error(e, "predict_board_state")
            return {
                'success': False,
                'error': str(e),
                'fen': None,
                'is_valid': False
            }
    
    def _place_piece_on_board(
        self,
        detection: Dict,
        board: np.ndarray,
        piece_confidence: np.ndarray,
        board_positions: Dict[str, Tuple[int, int]]
    ) -> bool:
        """
        Place piece on board based on detection.
        
        Args:
            detection: Piece detection
            board: Board array
            piece_confidence: Confidence array
            board_positions: Board position mapping
            
        Returns:
            True if piece was placed successfully
        """
        if detection['confidence'] < self.confidence_threshold:
            return False
        
        class_name = detection['class_name']
        if class_name not in self.piece_mapping:
            return False
        
        fen_symbol = self.piece_mapping[class_name]
        center = detection['center']
        
        # Find closest board position
        closest_position = self._find_closest_board_position(center, board_positions)
        if not closest_position:
            return False
        
        # Convert position to board coordinates
        row, col = square_to_coords(closest_position)
        
        # Check if position is already occupied
        if board[row, col] != '.':
            # If confidence is higher, replace the piece
            if detection['confidence'] > piece_confidence[row, col]:
                board[row, col] = fen_symbol
                piece_confidence[row, col] = detection['confidence']
                return True
            else:
                return False
        else:
            board[row, col] = fen_symbol
            piece_confidence[row, col] = detection['confidence']
            return True
    
    def _find_closest_board_position(
        self,
        center: Tuple[int, int],
        board_positions: Dict[str, Tuple[int, int]]
    ) -> Optional[str]:
        """
        Find closest board position to piece center.
        
        Args:
            center: Piece center coordinates
            board_positions: Board position mapping
            
        Returns:
            Closest board position or None
        """
        min_distance = float('inf')
        closest_position = None
        
        for position, coords in board_positions.items():
            distance = np.sqrt((center[0] - coords[0])**2 + (center[1] - coords[1])**2)
            if distance < min_distance:
                min_distance = distance
                closest_position = position
        
        # Only return if within reasonable distance
        if min_distance < 100:  # Adjust threshold as needed
            return closest_position
        
        return None
    
    def _board_to_fen(self, board: np.ndarray) -> str:
        """
        Convert board array to FEN string.
        
        Args:
            board: Board array
            
        Returns:
            FEN string
        """
        fen_rows = []
        
        for row in board:
            fen_row = ""
            empty_count = 0
            
            for piece in row:
                if piece == '.':
                    empty_count += 1
                else:
                    if empty_count > 0:
                        fen_row += str(empty_count)
                        empty_count = 0
                    fen_row += piece
            
            if empty_count > 0:
                fen_row += str(empty_count)
            
            fen_rows.append(fen_row)
        
        # Join rows with '/'
        fen = '/'.join(fen_rows)
        
        # Add additional FEN components (simplified)
        fen += " w - - 0 1"  # Default: white to move, no castling, no en passant, move 1
        
        return fen
    
    def _get_board_statistics(
        self,
        board: np.ndarray,
        piece_confidence: np.ndarray
    ) -> Dict[str, Union[int, float, List]]:
        """
        Get board statistics.
        
        Args:
            board: Board array
            piece_confidence: Confidence array
            
        Returns:
            Dictionary containing board statistics
        """
        # Count pieces by type
        piece_counts = {}
        for piece in board.flatten():
            if piece != '.':
                piece_counts[piece] = piece_counts.get(piece, 0) + 1
        
        # Count pieces by color
        white_pieces = sum(1 for piece in board.flatten() if piece.isupper() and piece != '.')
        black_pieces = sum(1 for piece in board.flatten() if piece.islower() and piece != '.')
        
        # Calculate average confidence
        occupied_positions = piece_confidence > 0
        avg_confidence = np.mean(piece_confidence[occupied_positions]) if np.any(occupied_positions) else 0.0
        
        # Find low confidence pieces
        low_confidence_pieces = []
        for row in range(self.board_size):
            for col in range(self.board_size):
                if board[row, col] != '.' and piece_confidence[row, col] < 0.7:
                    position = coords_to_square(row, col)
                    low_confidence_pieces.append({
                        'position': position,
                        'piece': board[row, col],
                        'confidence': piece_confidence[row, col]
                    })
        
        return {
            'total_pieces': white_pieces + black_pieces,
            'white_pieces': white_pieces,
            'black_pieces': black_pieces,
            'piece_counts': piece_counts,
            'average_confidence': float(avg_confidence),
            'low_confidence_pieces': low_confidence_pieces,
            'occupied_squares': int(np.sum(board != '.'))
        }
    
    def validate_board_state(self, fen: str) -> Dict[str, Union[bool, str, List]]:
        """
        Validate board state for chess rules.
        
        Args:
            fen: FEN string to validate
            
        Returns:
            Dictionary containing validation results
        """
        try:
            # Create chess board from FEN
            chess_board = ChessBoard(fen)
            
            # Check basic validity
            is_valid = chess_board.board.is_valid()
            
            # Check for impossible positions
            issues = []
            
            # Check king counts
            white_kings = sum(1 for piece in chess_board.board.piece_map().values() if piece.symbol() == 'K')
            black_kings = sum(1 for piece in chess_board.board.piece_map().values() if piece.symbol() == 'k')
            
            if white_kings != 1:
                issues.append(f"Invalid white king count: {white_kings}")
            if black_kings != 1:
                issues.append(f"Invalid black king count: {black_kings}")
            
            # Check pawn positions
            for square, piece in chess_board.board.piece_map().items():
                row = 7 - (square // 8)
                if piece.symbol().lower() == 'p':
                    if row == 0 or row == 7:  # Pawns on first/last rank
                        issues.append(f"Pawn on invalid rank: {chess.square_name(square)}")
            
            # Check for check
            is_check = chess_board.board.is_check()
            
            # Check for checkmate
            is_checkmate = chess_board.board.is_checkmate()
            
            # Check for stalemate
            is_stalemate = chess_board.board.is_stalemate()
            
            return {
                'is_valid': is_valid and len(issues) == 0,
                'is_check': is_check,
                'is_checkmate': is_checkmate,
                'is_stalemate': is_stalemate,
                'issues': issues,
                'fen': fen
            }
            
        except Exception as e:
            self.logger.log_error(e, "validate_board_state")
            return {
                'is_valid': False,
                'is_check': False,
                'is_checkmate': False,
                'is_stalemate': False,
                'issues': [f"FEN parsing error: {str(e)}"],
                'fen': fen
            }
    
    def get_predictor_info(self) -> Dict:
        """Get predictor information."""
        return {
            'board_size': self.board_size,
            'confidence_threshold': self.confidence_threshold,
            'piece_mapping': self.piece_mapping,
            'num_piece_types': len(self.piece_mapping)
        }