import re
import pymorphy2
import inspect

if not hasattr(inspect, "getargspec"):
    from collections import namedtuple
    ArgSpec = namedtuple("ArgSpec", ["args", "varargs", "keywords", "defaults"])

    def getargspec(func):
        spec = inspect.getfullargspec(func)
        return ArgSpec(spec.args, spec.varargs, spec.varkw, spec.defaults)

    inspect.getargspec = getargspec

class TextProcessor:
    def __init__(self):
        self.morph = None
        self.is_available = False
        try:
            self.morph = pymorphy2.MorphAnalyzer()
            self.is_available = True
        except Exception as e:
            print(f"Pymorphy2 недоступен: {e}")

    def normalize_word(self, word: str) -> str:
        if not self.is_available or len(word) < 2:
            return word.lower()
        try:
            parsed = self.morph.parse(word)[0]
            return parsed.normal_form.lower()
        except Exception:
            return word.lower()

    def clean_text(self, text: str) -> str:
        cleaned = re.sub(r'[^а-яА-ЯёЁ\s]', ' ', text)
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.strip().lower()

    def normalize_text(self, text: str) -> str:
        cleaned = self.clean_text(text)
        words = cleaned.split()
        normalized_words = [self.normalize_word(w) for w in words]
        return ' '.join(normalized_words)

text_processor = TextProcessor()