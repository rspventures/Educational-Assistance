from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class ValidatorAgent:
    def __init__(self):
        self.validation_rules = {
            'content_length': self.validate_content_length,
            'response_format': self.validate_response_format,
            'safety_check': self.validate_safety
        }

    def validate_content_length(self, content: str) -> Dict[str, Any]:
        """Validate if the content length is appropriate"""
        min_length = 10
        max_length = 2000
        
        if len(content) < min_length:
            return {
                'valid': False,
                'message': f'Response is too short (minimum {min_length} characters)'
            }
        elif len(content) > max_length:
            return {
                'valid': False,
                'message': f'Response is too long (maximum {max_length} characters)'
            }
        
        return {'valid': True}

    def validate_response_format(self, content: str) -> Dict[str, Any]:
        """Validate if the response format is appropriate"""
        # Check if response contains at least one sentence
        if not any(char in content for char in '.!?'):
            return {
                'valid': False,
                'message': 'Response should contain at least one complete sentence'
            }
        
        return {'valid': True}

    def validate_safety(self, content: str) -> Dict[str, Any]:
        """Basic safety check for inappropriate content"""
        inappropriate_words = ['bad_word1', 'bad_word2']  # Add your list of inappropriate words
        
        for word in inappropriate_words:
            if word.lower() in content.lower():
                return {
                    'valid': False,
                    'message': 'Response contains inappropriate content'
                }
        
        return {'valid': True}

    def validate(self, content: str) -> Dict[str, Any]:
        """Run all validation rules on the content"""
        validation_results = {}
        
        for rule_name, rule_func in self.validation_rules.items():
            try:
                validation_results[rule_name] = rule_func(content)
            except Exception as e:
                logger.error(f"Error in validation rule {rule_name}: {str(e)}")
                validation_results[rule_name] = {
                    'valid': False,
                    'message': f'Error in validation: {str(e)}'
                }
        
        # Check if all validations passed
        all_valid = all(result['valid'] for result in validation_results.values())
        
        return {
            'is_valid': all_valid,
            'validation_results': validation_results
        } 