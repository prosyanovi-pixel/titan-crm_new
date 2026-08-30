# This is a placeholder file to demonstrate the structure.
# The actual implementation of the rules would go here.

class RuleEngine:
    def __init__(self):
        self.rules = {
            "language": "русский",
            "response_format": "формат ответа на русском языке",
            "code_examples": "примеры кода включают имя файла и язык",
            "file_naming": "всегда указывать имя файла при предоставлении блоков кода"
        }
    
    def get_response_rules(self):
        return self.rules

# Example usage
if __name__ == "__main__":
    engine = RuleEngine()
    print(engine.get_response_rules())