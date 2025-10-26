"""
Move validator for chess position analysis.

Implements move validation, position analysis, and game state
evaluation for chess positions.
"""

import chess
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
from pathlib import Path

from ..utils.chess_logic import ChessBoard, calculate_material_balance
from ..utils.logger import get_global_logger


class MoveValidator:
    """
    Move validator for chess position analysis.
    
    Provides move validation, position analysis, and game state
    evaluation for chess positions.
    """
    
    def __init__(
        self,
        position_history: Optional[List[str]] = None,
        max_history: int = 100
    ):
        """
        Initialize move validator.
        
        Args:
            position_history: History of previous positions
            max_history: Maximum number of positions to keep in history
        """
        self.position_history = position_history or []
        self.max_history = max_history
        
        # Initialize logger
        self.logger = get_global_logger()
    
    def validate_move(
        self,
        fen: str,
        move_uci: str,
        previous_fen: Optional[str] = None
    ) -> Dict[str, Union[bool, str, Dict]]:
        """
        Validate a chess move.
        
        Args:
            fen: Current position FEN
            move_uci: Move in UCI format
            previous_fen: Previous position FEN (optional)
            
        Returns:
            Dictionary containing validation results
        """
        try:
            # Create chess board from FEN
            chess_board = ChessBoard(fen)
            
            # Check if move is legal
            is_legal = chess_board.is_valid_move(move_uci)
            
            if not is_legal:
                return {
                    'is_valid': False,
                    'reason': 'Illegal move',
                    'legal_moves': self._get_legal_moves(chess_board),
                    'move': move_uci
                }
            
            # Make the move
            move_success = chess_board.make_move(move_uci)
            
            if not move_success:
                return {
                    'is_valid': False,
                    'reason': 'Move execution failed',
                    'legal_moves': self._get_legal_moves(chess_board),
                    'move': move_uci
                }
            
            # Get new position
            new_fen = chess_board.get_fen()
            
            # Check for special conditions
            special_conditions = self._check_special_conditions(chess_board)
            
            # Analyze position
            position_analysis = self._analyze_position(chess_board)
            
            # Update history
            self._update_position_history(new_fen)
            
            return {
                'is_valid': True,
                'move': move_uci,
                'new_fen': new_fen,
                'special_conditions': special_conditions,
                'position_analysis': position_analysis,
                'game_result': chess_board.get_game_result()
            }
            
        except Exception as e:
            self.logger.log_error(e, "validate_move")
            return {
                'is_valid': False,
                'reason': f'Validation error: {str(e)}',
                'move': move_uci
            }
    
    def _get_legal_moves(self, chess_board: ChessBoard) -> List[str]:
        """
        Get list of legal moves from current position.
        
        Args:
            chess_board: Chess board instance
            
        Returns:
            List of legal moves in UCI format
        """
        legal_moves = []
        for move in chess_board.board.legal_moves:
            legal_moves.append(move.uci())
        return legal_moves
    
    def _check_special_conditions(self, chess_board: ChessBoard) -> Dict[str, bool]:
        """
        Check for special chess conditions.
        
        Args:
            chess_board: Chess board instance
            
        Returns:
            Dictionary of special conditions
        """
        return {
            'is_check': chess_board.board.is_check(),
            'is_checkmate': chess_board.board.is_checkmate(),
            'is_stalemate': chess_board.board.is_stalemate(),
            'is_insufficient_material': chess_board.board.is_insufficient_material(),
            'is_seventyfive_moves': chess_board.board.is_seventyfive_moves(),
            'is_fivefold_repetition': chess_board.board.is_fivefold_repetition()
        }
    
    def _analyze_position(self, chess_board: ChessBoard) -> Dict[str, Union[int, float, List]]:
        """
        Analyze current position.
        
        Args:
            chess_board: Chess board instance
            
        Returns:
            Dictionary containing position analysis
        """
        # Calculate material balance
        material_balance = calculate_material_balance(chess_board)
        
        # Count pieces by type
        piece_counts = {}
        for piece in chess_board.board.piece_map().values():
            symbol = piece.symbol()
            piece_counts[symbol] = piece_counts.get(symbol, 0) + 1
        
        # Count pieces by color
        white_pieces = sum(1 for piece in chess_board.board.piece_map().values() if piece.symbol().isupper())
        black_pieces = sum(1 for piece in chess_board.board.piece_map().values() if piece.symbol().islower())
        
        # Get legal moves count
        legal_moves_count = len(list(chess_board.board.legal_moves))
        
        # Check for pins and skewers
        pins = self._find_pins(chess_board)
        skewers = self._find_skewers(chess_board)
        
        # Calculate position evaluation
        evaluation = self._evaluate_position(chess_board)
        
        return {
            'material_balance': material_balance,
            'piece_counts': piece_counts,
            'white_pieces': white_pieces,
            'black_pieces': black_pieces,
            'legal_moves_count': legal_moves_count,
            'pins': pins,
            'skewers': skewers,
            'evaluation': evaluation
        }
    
    def _find_pins(self, chess_board: ChessBoard) -> List[Dict]:
        """
        Find pinned pieces.
        
        Args:
            chess_board: Chess board instance
            
        Returns:
            List of pinned pieces
        """
        pins = []
        board = chess_board.board
        
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece is None:
                continue
            
            # Check if piece is pinned
            if board.is_pinned(chess_board.board.turn, square):
                pins.append({
                    'square': chess.square_name(square),
                    'piece': piece.symbol(),
                    'color': 'white' if piece.symbol().isupper() else 'black'
                })
        
        return pins
    
    def _find_skewers(self, chess_board: ChessBoard) -> List[Dict]:
        """
        Find skewered pieces.
        
        Args:
            chess_board: Chess board instance
            
        Returns:
            List of skewered pieces
        """
        # This is a simplified implementation
        # In practice, you would implement more sophisticated skewer detection
        skewers = []
        
        # Check for discovered attacks
        for square in chess.SQUARES:
            piece = chess_board.board.piece_at(square)
            if piece is None:
                continue
            
            # Check if piece can attack through another piece
            # This is a placeholder - actual skewer detection is more complex
            pass
        
        return skewers
    
    def _evaluate_position(self, chess_board: ChessBoard) -> float:
        """
        Evaluate position strength.
        
        Args:
            chess_board: Chess board instance
            
        Returns:
            Position evaluation score
        """
        # Simple material-based evaluation
        material_balance = calculate_material_balance(chess_board)
        
        # Add mobility bonus
        legal_moves = len(list(chess_board.board.legal_moves))
        mobility_bonus = legal_moves * 0.1
        
        # Add center control bonus
        center_control = self._calculate_center_control(chess_board)
        
        # Add king safety bonus
        king_safety = self._calculate_king_safety(chess_board)
        
        evaluation = material_balance + mobility_bonus + center_control + king_safety
        
        return evaluation
    
    def _calculate_center_control(self, chess_board: ChessBoard) -> float:
        """
        Calculate center control score.
        
        Args:
            chess_board: Chess board instance
            
        Returns:
            Center control score
        """
        center_squares = [chess.E4, chess.D4, chess.E5, chess.D5]
        center_control = 0.0
        
        for square in center_squares:
            piece = chess_board.board.piece_at(square)
            if piece is not None:
                if piece.symbol().isupper():
                    center_control += 1.0
                else:
                    center_control -= 1.0
        
        return center_control
    
    def _calculate_king_safety(self, chess_board: ChessBoard) -> float:
        """
        Calculate king safety score.
        
        Args:
            chess_board: Chess board instance
            
        Returns:
            King safety score
        """
        # Simplified king safety calculation
        # In practice, this would be more sophisticated
        king_safety = 0.0
        
        # Check if kings are in check
        if chess_board.board.is_check():
            if chess_board.board.turn:
                king_safety -= 2.0  # White king in check
            else:
                king_safety += 2.0  # Black king in check
        
        return king_safety
    
    def _update_position_history(self, fen: str):
        """
        Update position history.
        
        Args:
            fen: FEN string to add to history
        """
        self.position_history.append(fen)
        
        # Keep only recent history
        if len(self.position_history) > self.max_history:
            self.position_history.pop(0)
    
    def detect_position_repetition(self, fen: str) -> Dict[str, Union[bool, int, List]]:
        """
        Detect position repetition.
        
        Args:
            fen: FEN string to check
            
        Returns:
            Dictionary containing repetition information
        """
        # Count occurrences of current position
        position_count = self.position_history.count(fen)
        
        # Find all occurrences
        occurrences = []
        for i, pos in enumerate(self.position_history):
            if pos == fen:
                occurrences.append(i)
        
        return {
            'is_repeated': position_count > 1,
            'repetition_count': position_count,
            'occurrences': occurrences,
            'total_positions': len(self.position_history)
        }
    
    def get_position_history(self) -> List[str]:
        """Get position history."""
        return self.position_history.copy()
    
    def clear_position_history(self):
        """Clear position history."""
        self.position_history.clear()
    
    def get_validator_info(self) -> Dict:
        """Get validator information."""
        return {
            'position_history_length': len(self.position_history),
            'max_history': self.max_history,
            'has_history': len(self.position_history) > 0
        }