import os
import re
import pickle
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import pymupdf as fitz  # PyMuPDF
import numpy as np
import pandas as pd
import faiss
import requests
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ResearchCopilot")


class ResearchCopilot:
    """
    Core AI engine for AI Research Copilot.
    Handles embedding generation, FAISS semantic search, dynamic document indexing,
    Ollama LLM interactions, and academic analytical modules.
    """

    def __init__(
        self,
        base_dir: Optional[str] = None,
        embedding_model_dir: Optional[str] = None,
        index_file: Optional[str] = None,
        chunks_file: Optional[str] = None,
        papers_dir: Optional[str] = None,
        ollama_url: str = "http://localhost:11434/api/generate",
        ollama_model: str = "qwen2.5:3b",
    ):
        # Resolve base directory (default to project root if called from backend/)
        current_dir = Path(__file__).resolve().parent
        if (current_dir / "research_copilot.py").exists() and current_dir.name == "backend":
            self.root_dir = current_dir.parent
        else:
            self.root_dir = current_dir

        if base_dir:
            self.root_dir = Path(base_dir).resolve()

        # Component paths
        self.model_dir = Path(embedding_model_dir) if embedding_model_dir else self.root_dir / "model" / "embedding_model"
        self.index_path = Path(index_file) if index_file else self.root_dir / "vector_db" / "research.index"
        self.chunks_path = Path(chunks_file) if chunks_file else self.root_dir / "vector_db" / "chunks.pkl"
        self.papers_dir = Path(papers_dir) if papers_dir else self.root_dir / "research_papers"
        self.extracted_dir = self.root_dir / "extracted_text"
        self.outputs_dir = self.root_dir / "outputs"

        # Ensure directories exist
        self.papers_dir.mkdir(parents=True, exist_ok=True)
        self.extracted_dir.mkdir(parents=True, exist_ok=True)
        self.outputs_dir.mkdir(parents=True, exist_ok=True)
        self.index_path.parent.mkdir(parents=True, exist_ok=True)

        self.ollama_url = ollama_url
        self.ollama_model = ollama_model
        self.embedding_dim = 384  # MiniLM-L6-v2 dimension

        # Load AI models and vector DB
        self._load_embedding_model()
        self._load_vector_db()

    def _load_embedding_model(self):
        """Loads the SentenceTransformer embedding model from the local model folder."""
        logger.info(f"Loading embedding model from {self.model_dir}...")
        if self.model_dir.exists():
            self.embedding_model = SentenceTransformer(str(self.model_dir))
        else:
            logger.warning(f"Local model path {self.model_dir} not found! Falling back to sentence-transformers/all-MiniLM-L6-v2")
            self.embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        logger.info("Embedding model loaded successfully.")

    def _load_vector_db(self):
        """Loads FAISS index and chunks DataFrame from disk."""
        if self.index_path.exists() and self.chunks_path.exists():
            logger.info(f"Loading FAISS index from {self.index_path}...")
            self.index = faiss.read_index(str(self.index_path))
            with open(self.chunks_path, "rb") as f:
                self.chunks_df = pickle.load(f)
            logger.info(f"FAISS index loaded. Total vectors: {self.index.ntotal}, Chunks: {len(self.chunks_df)}")
        else:
            logger.warning("FAISS index or chunks.pkl not found. Initializing empty vector database.")
            self.index = faiss.IndexFlatIP(self.embedding_dim)
            self.chunks_df = pd.DataFrame(columns=["source", "page", "text"])
            self._persist_vector_db()

    def _persist_vector_db(self):
        """Saves current FAISS index and chunks DataFrame to disk."""
        faiss.write_index(self.index, str(self.index_path))
        with open(self.chunks_path, "wb") as f:
            pickle.dump(self.chunks_df, f)
        logger.info("Vector database persisted successfully.")

    # -------------------------------------------------------------
    # LLM Interaction
    # -------------------------------------------------------------
    def check_ollama(self) -> Dict[str, Any]:
        """Checks if local Ollama service is reachable and model is available."""
        try:
            # Check tags / available models
            tags_url = self.ollama_url.replace("/api/generate", "/api/tags")
            resp = requests.get(tags_url, timeout=5)
            if resp.status_code == 200:
                models = [m.get("name") for m in resp.json().get("models", [])]
                model_ready = any(self.ollama_model in m for m in models)
                return {
                    "online": True,
                    "model_available": model_ready,
                    "model": self.ollama_model,
                    "available_models": models,
                }
            return {"online": True, "model_available": False, "model": self.ollama_model}
        except Exception as e:
            return {"online": False, "model_available": False, "error": str(e)}

    def ask_llm(self, prompt: str, system_prompt: Optional[str] = None, timeout: int = 120) -> str:
        """Sends prompt to local Ollama instance running qwen2.5:3b."""
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System: {system_prompt}\n\nUser: {prompt}"

        payload = {
            "model": self.ollama_model,
            "prompt": full_prompt,
            "stream": False,
        }

        try:
            response = requests.post(self.ollama_url, json=payload, timeout=timeout)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip()
        except requests.exceptions.ConnectionError:
            raise RuntimeError(
                f"Cannot connect to Ollama at {self.ollama_url}. Please ensure Ollama is running (`ollama serve`)."
            )
        except requests.exceptions.Timeout:
            raise RuntimeError(f"Ollama request timed out after {timeout} seconds.")
        except Exception as e:
            raise RuntimeError(f"Ollama generation failed: {str(e)}")

    # -------------------------------------------------------------
    # Semantic Search & Retrieval
    # -------------------------------------------------------------
    def search(
        self,
        query: str,
        top_k: int = 6,
        paper_filter: Optional[List[str]] = None,
        score_threshold: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search on FAISS using normalized cosine similarity.
        Optionally filters results to a specific subset of papers and score threshold.
        """
        if self.index.ntotal == 0 or len(self.chunks_df) == 0:
            return []

        # Generate and normalize query embedding
        query_emb = self.embedding_model.encode([query], convert_to_numpy=True).astype(np.float32)
        faiss.normalize_L2(query_emb)

        # If filtering by papers, retrieve more initial candidates
        fetch_k = min(self.index.ntotal, top_k * 4 if paper_filter else top_k)
        scores, indices = self.index.search(query_emb, fetch_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or idx >= len(self.chunks_df):
                continue

            similarity = float(score)
            if similarity < score_threshold:
                continue

            row = self.chunks_df.iloc[idx]
            paper_name = row["source"]

            if paper_filter and paper_name not in paper_filter:
                continue

            results.append({
                "paper": paper_name,
                "page": int(row["page"]),
                "score": round(similarity, 4),
                "text": str(row["text"]).strip(),
            })

            if len(results) >= top_k:
                break

        return results

    def search_specific_paper(self, paper_name: str, query: str, top_k: int = 6) -> List[Dict[str, Any]]:
        """Searches within a single specific paper."""
        return self.search(query=query, top_k=top_k, paper_filter=[paper_name])

    # -------------------------------------------------------------
    # RAG Question Answering
    # -------------------------------------------------------------
    def ask(self, question: str, top_k: int = 6, paper_filter: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Retrieval-Augmented Generation (RAG) question answering.
        Retrieves context, formats prompt, queries LLM, and attaches citations.
        """
        chunks = self.search(query=question, top_k=top_k, paper_filter=paper_filter)

        if not chunks:
            return {
                "answer": "No relevant information found in the indexed research papers to answer your question.",
                "sources": [],
            }

        # Build context string
        context_parts = []
        for i, c in enumerate(chunks, start=1):
            context_parts.append(
                f"[Source {i} | Paper: {c['paper']} | Page: {c['page']} | Score: {c['score']}]\n{c['text']}"
            )
        context_str = "\n\n---\n\n".join(context_parts)

        system_instruction = (
            "You are an AI Research Copilot. Answer the user's question using only the supplied research-paper context.\n"
            "Strict Rules:\n"
            "1. Answer using ONLY the supplied research-paper context.\n"
            "2. Never fabricate research results, datasets, algorithms, authors, or citations.\n"
            "3. Cite the source paper names and page numbers whenever referencing findings.\n"
            "4. If the answer cannot be determined from the supplied context, clearly state that the information was not found in the uploaded papers.\n"
            "5. Structure your response clearly using bullet points or paragraphs as appropriate."
        )

        prompt = (
            f"Context from uploaded research papers:\n"
            f"====================================\n"
            f"{context_str}\n"
            f"====================================\n\n"
            f"User Question: {question}\n\n"
            f"Provide a rigorous, fact-based research answer based strictly on the context above. Cite sources with paper name and page numbers."
        )

        answer = self.ask_llm(prompt=prompt, system_prompt=system_instruction)

        return {
            "answer": answer,
            "sources": [
                {"paper": c["paper"], "page": c["page"], "score": c["score"]}
                for c in chunks
            ],
        }

    # -------------------------------------------------------------
    # Dynamic Indexing (PDF Upload & Processing)
    # -------------------------------------------------------------
    def clean_text(self, text: str) -> str:
        """Cleans extracted PDF text while preserving sentence structure."""
        text = re.sub(r"\x00", "", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\s*\n+", "\n\n", text)
        return text.strip()

    def chunk_paper_pages(
        self,
        pages_text: List[Dict[str, Any]],
        chunk_size: int = 500,
        overlap: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Splits extracted pages into ~500 word chunks with ~100 word overlap.
        Preserves paper filename and page number metadata.
        """
        chunks = []
        for page_info in pages_text:
            source = page_info["source"]
            page_num = page_info["page"]
            text = page_info["text"]

            words = text.split()
            if not words:
                continue

            if len(words) <= chunk_size:
                chunks.append({"source": source, "page": page_num, "text": text})
            else:
                start = 0
                step = chunk_size - overlap
                while start < len(words):
                    chunk_words = words[start : start + chunk_size]
                    chunk_text = " ".join(chunk_words)
                    chunks.append({"source": source, "page": page_num, "text": chunk_text})
                    if start + chunk_size >= len(words):
                        break
                    start += step

        return chunks

    def add_paper(self, pdf_path: str, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts, chunks, embeds, and indexes a new PDF dynamically into FAISS.
        No server restart is required.
        """
        path = Path(pdf_path)
        paper_name = filename or path.name

        if not path.exists():
            raise FileNotFoundError(f"PDF file not found at {path}")

        logger.info(f"Processing PDF: {paper_name}")
        doc = fitz.open(str(path))
        total_pages = len(doc)

        if total_pages == 0:
            doc.close()
            raise ValueError(f"The PDF {paper_name} contains no pages.")

        pages_data = []
        total_chars = 0
        for page_idx in range(total_pages):
            page = doc[page_idx]
            raw_text = page.get_text("text")
            cleaned = self.clean_text(raw_text)
            total_chars += len(cleaned)
            if cleaned:
                pages_data.append({
                    "source": paper_name,
                    "page": page_idx + 1,
                    "text": cleaned,
                })
        doc.close()

        if total_chars < 50:
            raise ValueError(
                f"The PDF '{paper_name}' appears to be empty or image-only/scanned with no extractable text."
            )

        # Chunk the text
        new_chunks = self.chunk_paper_pages(pages_data, chunk_size=500, overlap=100)
        if not new_chunks:
            raise ValueError(f"Could not generate text chunks from {paper_name}.")

        logger.info(f"Generated {len(new_chunks)} chunks for {paper_name}. Generating embeddings...")

        # If paper was already in index, remove its old chunks first to prevent duplicates
        if not self.chunks_df.empty and (self.chunks_df["source"] == paper_name).any():
            logger.info(f"Paper {paper_name} already exists. Removing old chunks prior to re-indexing.")
            self.delete_paper(paper_name, delete_file=False)

        # Embed new chunks
        chunk_texts = [c["text"] for c in new_chunks]
        embeddings = self.embedding_model.encode(
            chunk_texts, batch_size=32, show_progress_bar=False, convert_to_numpy=True
        ).astype(np.float32)

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        # Add to FAISS index
        self.index.add(embeddings)

        # Append to metadata DataFrame
        new_df = pd.DataFrame(new_chunks)
        self.chunks_df = pd.concat([self.chunks_df, new_df], ignore_index=True)

        # Persist updated index and metadata
        self._persist_vector_db()

        logger.info(f"Successfully indexed {paper_name}: {total_pages} pages, {len(new_chunks)} chunks.")
        return {
            "status": "success",
            "paper": paper_name,
            "pages": total_pages,
            "chunks_added": len(new_chunks),
            "total_indexed_chunks": len(self.chunks_df),
        }

    def delete_paper(self, paper_name: str, delete_file: bool = True) -> Dict[str, Any]:
        """
        Deletes a paper from the system and safely re-indexes remaining chunks in FAISS
        to guarantee perfect synchronization between FAISS vectors and chunks.pkl.
        """
        logger.info(f"Deleting paper: {paper_name}")

        # Delete physical file
        if delete_file:
            file_path = self.papers_dir / paper_name
            if file_path.exists():
                try:
                    os.remove(file_path)
                    logger.info(f"Deleted physical file {file_path}")
                except Exception as e:
                    logger.warning(f"Failed to delete physical file {file_path}: {e}")

        # Filter out paper chunks
        initial_chunk_count = len(self.chunks_df)
        remaining_df = self.chunks_df[self.chunks_df["source"] != paper_name].reset_index(drop=True)
        chunks_removed = initial_chunk_count - len(remaining_df)

        self.chunks_df = remaining_df

        # Rebuild FAISS index from remaining chunks
        if len(self.chunks_df) > 0:
            logger.info(f"Rebuilding FAISS index for {len(self.chunks_df)} remaining chunks...")
            all_texts = self.chunks_df["text"].tolist()
            embeddings = self.embedding_model.encode(
                all_texts, batch_size=32, show_progress_bar=False, convert_to_numpy=True
            ).astype(np.float32)
            faiss.normalize_L2(embeddings)

            self.index = faiss.IndexFlatIP(self.embedding_dim)
            self.index.add(embeddings)
        else:
            logger.info("No remaining chunks. Resetting to empty FAISS index.")
            self.index = faiss.IndexFlatIP(self.embedding_dim)

        self._persist_vector_db()

        return {
            "status": "success",
            "paper": paper_name,
            "chunks_removed": chunks_removed,
            "remaining_chunks": len(self.chunks_df),
        }

    # -------------------------------------------------------------
    # Metadata & Health
    # -------------------------------------------------------------
    def get_indexed_papers(self) -> List[Dict[str, Any]]:
        """Returns list of currently indexed papers with chunk counts and disk status."""
        papers = []
        if self.chunks_df.empty:
            return papers

        grouped = self.chunks_df.groupby("source")
        for name, group in grouped:
            pdf_path = self.papers_dir / name
            file_exists = pdf_path.exists()
            file_size_kb = round(pdf_path.stat().st_size / 1024, 1) if file_exists else 0
            page_count = int(group["page"].max()) if not group.empty else 0

            papers.append({
                "name": str(name),
                "chunks": int(len(group)),
                "pages": page_count,
                "file_size_kb": file_size_kb,
                "file_exists": file_exists,
            })
        return sorted(papers, key=lambda x: x["name"])

    def get_health(self) -> Dict[str, Any]:
        """Provides status of embedding model, FAISS index, chunk metadata, and Ollama."""
        ollama_status = self.check_ollama()
        papers = self.get_indexed_papers()
        return {
            "status": "ok",
            "embedding_model": {
                "name": "sentence-transformers/all-MiniLM-L6-v2",
                "dimension": self.embedding_dim,
                "loaded": self.embedding_model is not None,
            },
            "vector_database": {
                "type": "faiss.IndexFlatIP",
                "total_vectors": int(self.index.ntotal),
                "total_chunks": int(len(self.chunks_df)),
                "synchronized": int(self.index.ntotal) == int(len(self.chunks_df)),
            },
            "papers_count": len(papers),
            "papers": [p["name"] for p in papers],
            "ollama": ollama_status,
        }

    # -------------------------------------------------------------
    # Specialized Analytical Modules
    # -------------------------------------------------------------
    def analyze_paper(self, paper_name: str) -> Dict[str, Any]:
        """
        Deeply analyzes an individual paper and outputs structured sections:
        Title, Problem, Objectives, Methodology, Dataset, Algorithms, Results,
        Advantages, Limitations, Future Work, Key Contribution.
        """
        paper_chunks = self.chunks_df[self.chunks_df["source"] == paper_name]
        if paper_chunks.empty:
            raise ValueError(f"Paper '{paper_name}' not found in the indexed database.")

        # Take up to 12 representative chunks (abstract/intro, methodology, results/conclusion)
        num_chunks = len(paper_chunks)
        selected_indices = []
        if num_chunks <= 12:
            selected_indices = list(range(num_chunks))
        else:
            # Sample early chunks (intro/abstract), middle (methodology), and end (results/conclusion)
            selected_indices = list(range(0, 4)) + list(range(num_chunks // 2 - 2, num_chunks // 2 + 2)) + list(range(num_chunks - 4, num_chunks))

        context_texts = []
        for idx in selected_indices:
            row = paper_chunks.iloc[idx]
            context_texts.append(f"[Page {row['page']}]: {row['text']}")

        context_str = "\n\n".join(context_texts)

        prompt = (
            f"You are an expert AI Research Analyst. Thoroughly analyze the following research paper context from '{paper_name}'.\n\n"
            f"Research Paper Context:\n{context_str}\n\n"
            f"Provide a comprehensive, structured academic analysis with the following EXACT headings:\n"
            f"1. Title & Scope\n"
            f"2. Research Problem & Motivation\n"
            f"3. Research Objectives\n"
            f"4. Abstract Summary\n"
            f"5. Methodology & System Architecture\n"
            f"6. Datasets Used (or indicate if not specified)\n"
            f"7. Algorithms, AI Models & Mathematical Formulations\n"
            f"8. Tools, Frameworks & Hardware/Software Technologies\n"
            f"9. Experimental Setup & Evaluation Metrics\n"
            f"10. Key Results & Findings\n"
            f"11. Advantages & Strengths\n"
            f"12. Limitations & Weaknesses\n"
            f"13. Proposed Future Work\n"
            f"14. Core Research Contribution\n\n"
            f"Rules: Answer using ONLY facts from the provided text. Mention page numbers where relevant. Do not invent missing details."
        )

        analysis = self.ask_llm(prompt=prompt)
        return {
            "paper": paper_name,
            "analysis": analysis,
            "total_chunks_analyzed": len(selected_indices),
        }

    def compare_papers(self, paper_names: List[str]) -> Dict[str, Any]:
        """
        Compares multiple research papers across problem, methodology, datasets,
        algorithms, performance, limitations, similarities, and differences.
        """
        if len(paper_names) < 2:
            raise ValueError("Please select at least 2 papers to compare.")

        context_sections = []
        for name in paper_names:
            p_chunks = self.chunks_df[self.chunks_df["source"] == name]
            if p_chunks.empty:
                continue
            # Sample up to 6 key chunks per paper
            sample_count = min(len(p_chunks), 6)
            sampled = p_chunks.iloc[:sample_count]
            p_text = "\n".join([f"[{name} - Page {r['page']}]: {r['text'][:400]}..." for _, r in sampled.iterrows()])
            context_sections.append(f"### Context for Paper: {name}\n{p_text}")

        combined_context = "\n\n".join(context_sections)

        prompt = (
            f"You are an expert academic reviewer. Perform a comprehensive multi-paper comparison between the following research papers:\n"
            f"{', '.join(paper_names)}\n\n"
            f"Paper Contexts:\n{combined_context}\n\n"
            f"Generate a rigorous comparative analysis containing:\n"
            f"1. Comparative Overview Table (Columns: Dimension, {', '.join(paper_names)})\n"
            f"   Dimensions to compare: Research Problem, Methodology, Dataset, AI Models/Algorithms, Evaluation Metrics, Key Results, Limitations.\n"
            f"2. Methodological Similarities\n"
            f"3. Architectural & Algorithmic Differences\n"
            f"4. Performance Trade-offs\n"
            f"5. Dataset & Benchmark Comparison\n"
            f"6. Comparative Limitations & Unresolved Challenges\n"
            f"7. Synthesis & Practical Recommendations\n\n"
            f"Do not hallucinate facts. If a paper does not specify a detail, state 'Not Specified'."
        )

        comparison = self.ask_llm(prompt=prompt)
        return {
            "papers": paper_names,
            "comparison": comparison,
        }

    def detect_research_gaps(self, paper_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Detects persistent research gaps, dataset limitations, hardware/real-time bottlenecks,
        and unaddressed problems across selected or all indexed papers.
        """
        target_papers = paper_names if paper_names else self.get_indexed_papers()
        paper_list = [p["name"] if isinstance(p, dict) else p for p in target_papers]

        if not paper_list:
            raise ValueError("No indexed papers available for research gap detection.")

        # Search for limitations, future work, challenges, gaps
        gap_queries = ["limitations weaknesses future work", "unsolved challenges open problems", "dataset constraints real-time scalability"]
        retrieved = []
        for q in gap_queries:
            results = self.search(q, top_k=4, paper_filter=paper_list)
            retrieved.extend(results)

        # Deduplicate
        seen = set()
        unique_chunks = []
        for r in retrieved:
            key = (r["paper"], r["page"], r["text"][:60])
            if key not in seen:
                seen.add(key)
                unique_chunks.append(r)

        context_str = "\n\n".join([f"[{c['paper']} | Page {c['page']}]: {c['text']}" for c in unique_chunks[:10]])

        prompt = (
            f"You are a Senior AI Research Scientist identifying novel dissertation-level research gaps.\n"
            f"Selected Papers: {', '.join(paper_list)}\n\n"
            f"Relevant Excerpts (Limitations & Open Challenges):\n{context_str}\n\n"
            f"Analyze the papers and provide a comprehensive Research Gap Report structured as:\n"
            f"1. Executive Synthesis of Current State-of-the-Art\n"
            f"2. At Least 5 Explicit Research Gaps (Supported by Evidence):\n"
            f"   - Research Gap Title\n"
            f"   - Description of the Gap\n"
            f"   - Affected Papers & Evidence (Paper name & page)\n"
            f"   - Impact / Severity (High/Medium)\n"
            f"3. Specific Dimensions Evaluated:\n"
            f"   - Dataset Diversity & Real-World Generalization Gaps\n"
            f"   - Real-Time, Edge & Hardware Constraints\n"
            f"   - Algorithmic, Explainability & Scalability Bottlenecks\n"
            f"   - IoT & Deployment Feasibility\n"
            f"4. Concrete Future Research Directions & Novel Project Ideas\n\n"
            f"Base all claims strictly on the uploaded evidence."
        )

        analysis = self.ask_llm(prompt=prompt)
        return {
            "papers": paper_list,
            "research_gaps": analysis,
            "evidence_sources": [{"paper": c["paper"], "page": c["page"]} for c in unique_chunks[:6]],
        }

    def generate_literature_review(self, paper_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Generates an academic-grade literature review structured as Chapter 2 (2.1 to 2.8).
        """
        target_papers = paper_names if paper_names else [p["name"] for p in self.get_indexed_papers()]

        if not target_papers:
            raise ValueError("No indexed papers available to generate a literature review.")

        # Retrieve high-level chunks
        results = self.search("methodology architecture experimental results findings", top_k=8, paper_filter=target_papers)
        context_str = "\n\n".join([f"[{c['paper']} | Page {c['page']}]: {c['text']}" for c in results])

        prompt = (
            f"You are an academic thesis supervisor. Write a formal Chapter 2: Literature Review based on the following papers:\n"
            f"{', '.join(target_papers)}\n\n"
            f"Context Evidence:\n{context_str}\n\n"
            f"Follow this EXACT academic thesis structure:\n"
            f"2. LITERATURE REVIEW\n"
            f"2.1 Introduction & Theoretical Background\n"
            f"2.2 Evolution of Existing Approaches\n"
            f"2.3 Traditional & Classical Machine Learning Methods\n"
            f"2.4 Deep Learning, Transformer & Generative AI Methods\n"
            f"2.5 Synthesis & Comparative Matrix of Existing Research\n"
            f"2.6 Critical Limitations of Existing Systems\n"
            f"2.7 Identified Research Gaps\n"
            f"2.8 Chapter Summary\n\n"
            f"Write in formal academic language. Compare and synthesize the works rather than simply listing them. Cite the specific paper names in text."
        )

        review = self.ask_llm(prompt=prompt)
        return {
            "papers": target_papers,
            "literature_review": review,
        }

    def generate_citation(self, paper_name: str, style: str = "IEEE") -> Dict[str, Any]:
        """
        Extracts bibliographic metadata from paper chunks (page 1) and formats
        citations in IEEE, APA, MLA, or Chicago style.
        """
        paper_chunks = self.chunks_df[self.chunks_df["source"] == paper_name]
        if paper_chunks.empty:
            raise ValueError(f"Paper '{paper_name}' not found.")

        # Take first 2 chunks which contain title, authors, journal, volume, year, DOI
        first_chunks = paper_chunks.iloc[:2]
        header_text = "\n".join(first_chunks["text"].tolist())

        style_upper = style.upper()
        prompt = (
            f"You are a bibliographic metadata extractor and citation generator.\n"
            f"Paper text from page 1 of '{paper_name}':\n\n"
            f"{header_text}\n\n"
            f"Task:\n"
            f"1. Extract the Title, Authors, Journal/Conference, Publication Year, Volume/Issue, Page Range, and DOI.\n"
            f"2. Format the citation strictly according to the {style_upper} citation style standard.\n"
            f"If any field cannot be found, use 'Unknown' or omit according to standard style rules. Do not hallucinate fictitious authors or DOIs.\n\n"
            f"Output Format:\n"
            f"Title: <extracted title>\n"
            f"Authors: <extracted authors>\n"
            f"Venue/Journal: <extracted journal/conference>\n"
            f"Year: <year>\n"
            f"DOI: <doi or Unknown>\n\n"
            f"Formatted Citation ({style_upper}):\n"
            f"<single formatted citation string>"
        )

        llm_response = self.ask_llm(prompt=prompt)
        return {
            "paper": paper_name,
            "style": style_upper,
            "citation": llm_response,
        }
