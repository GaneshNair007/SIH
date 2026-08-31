import os
import glob
import math
import re
from typing import List, Dict, Any, Tuple
from backend.config import settings

class RAGChunk:
    def __init__(self, doc_name: str, title: str, content: str):
        self.doc_name = doc_name
        self.title = title
        self.content = content
        self.tokens = self._tokenize(f"{title} {content}")

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r'\w+', text.lower())

class HybridRAGRetriever:
    def __init__(self, corpus_dir: str = None):
        if corpus_dir is None:
            corpus_dir = os.path.join(os.path.dirname(__file__), "corpus")
        self.corpus_dir = corpus_dir
        self.chunks: List[RAGChunk] = []
        self._load_corpus()

    def _load_corpus(self):
        self.chunks = []
        md_files = glob.glob(os.path.join(self.corpus_dir, "*.md"))
        for file_path in md_files:
            doc_name = os.path.basename(file_path)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
                # Split by sections (# or ##)
                sections = re.split(r'\n(?=##?\s)', text)
                for sec in sections:
                    lines = sec.strip().split("\n")
                    if lines:
                        title = lines[0].replace("#", "").strip()
                        content = "\n".join(lines[1:]).strip()
                        if content:
                            self.chunks.append(RAGChunk(doc_name, title, content))
            except Exception as e:
                print(f"Error loading corpus file {file_path}: {e}")

    def query(self, query_text: str, top_k: int = 3) -> Tuple[List[Dict[str, Any]], float]:
        """
        Performs hybrid retrieval over regulatory chunks.
        Returns: (list_of_matched_chunks, max_confidence_score)
        """
        if not self.chunks:
            self._load_corpus()
            if not self.chunks:
                return [], 0.0

        query_tokens = re.findall(r'\w+', query_text.lower())
        if not query_tokens:
            return [], 0.0

        scores: List[Tuple[float, RAGChunk]] = []

        # BM25-like TF-IDF scoring
        for chunk in self.chunks:
            match_count = sum(1 for qt in query_tokens if qt in chunk.tokens)
            if match_count == 0:
                continue

            # Term frequency & overlap ratio
            overlap_ratio = match_count / len(set(query_tokens))
            density = match_count / (len(chunk.tokens) + 10)
            
            # Title match boost
            title_tokens = set(re.findall(r'\w+', chunk.title.lower()))
            title_boost = 1.3 if any(qt in title_tokens for qt in query_tokens) else 1.0

            # Composite normalized score
            score = min(1.0, (0.65 * overlap_ratio + 0.35 * min(1.0, density * 50)) * title_boost)
            scores.append((round(score, 4), chunk))

        scores.sort(key=lambda x: x[0], reverse=True)
        top_results = scores[:top_k]

        max_confidence = top_results[0][0] if top_results else 0.0

        results = [
            {
                "doc_name": chunk.doc_name,
                "title": chunk.title,
                "content": chunk.content,
                "score": score
            }
            for score, chunk in top_results
        ]

        return results, max_confidence

# Global retriever singleton
retriever = HybridRAGRetriever()
