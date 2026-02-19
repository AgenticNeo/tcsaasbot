import os
import time
import re
from typing import List, Dict, Optional

from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain.chains import create_retrieval_chain, create_history_aware_retriever
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from app.core.config import get_settings
from app.core.logging import logger
from app.core.telemetry import get_tracer

settings = get_settings()
tracer = get_tracer("rag_service")


def _get_llm():
    """Get the LLM based on the configured provider."""
    if settings.LLM_PROVIDER == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.3,
            convert_system_message_to_human=True,
        )
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model="gpt-4o-mini",
            temperature=0.3,
        )


def _get_embeddings():
    """Get embeddings based on the configured provider."""
    if settings.LLM_PROVIDER == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        return GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.GOOGLE_API_KEY,
        )
    else:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY,
            model="text-embedding-3-small",
        )


class RAGService:
    def __init__(self):
        self.embeddings = _get_embeddings()
        self.persist_directory = settings.CHROMA_DB_DIR
        logger.info("rag_service_initialized", extra={
            "persist_directory": self.persist_directory,
            "llm_provider": settings.LLM_PROVIDER,
        })
        
    def _sanitize_collection_name(self, name: str) -> str:
        # Replace @ with _at_ specifically for emails
        name = name.replace("@", "_at_")
        # Replace non-alphanumeric chars (except _ and - and .) with _
        name = re.sub(r'[^a-zA-Z0-9._-]', '_', name)
        
        # Ensure it starts and ends with alphanumeric
        if not re.match(r'^[a-zA-Z0-9]', name):
            name = "c" + name
        if not re.match(r'.*[a-zA-Z0-9]$', name):
            name = name + "c"
            
        # Truncate to 63 chars (Chroma max)
        if len(name) > 63:
            name = name[:63]
            # Re-check end
            if not re.match(r'.*[a-zA-Z0-9]$', name):
                name = name[:-1] + "c"
        
        # Min length 3
        if len(name) < 3:
            name = name.ljust(3, '_')
            
        return name

    def get_vector_store(self, collection_name: str):
        safe_collection_name = self._sanitize_collection_name(collection_name)
        return Chroma(
            collection_name=safe_collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

    def ingest_text(self, text: str, metadata: Dict, collection_name: str = "default"):
        with tracer.start_as_current_span("rag_ingest") as span:
            span.set_attribute("collection", collection_name)
            span.set_attribute("text_length", len(text))

            start = time.perf_counter()
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            docs = [Document(page_content=x, metadata=metadata) for x in text_splitter.split_text(text)]
            vector_store = self.get_vector_store(collection_name)
            vector_store.add_documents(docs)
            duration_ms = round((time.perf_counter() - start) * 1000, 2)

            span.set_attribute("chunks_added", len(docs))
            span.set_attribute("duration_ms", duration_ms)

            logger.info("rag_ingest_completed", extra={
                "collection": collection_name,
                "chunks_added": len(docs),
                "text_length": len(text),
                "duration_ms": duration_ms,
            })
            return {"status": "success", "chunks_added": len(docs)}

    def delete_document(self, doc_id: int, collection_name: str = "default"):
        vector_store = self.get_vector_store(collection_name)
        vector_store._collection.delete(where={"doc_id": doc_id})
        logger.info("rag_document_deleted", extra={
            "doc_id": doc_id, "collection": collection_name
        })
        return {"status": "success"}

    def query(self, question: str, collection_name: str = "default", chat_history: List = None):
        with tracer.start_as_current_span("rag_query") as span:
            span.set_attribute("collection", collection_name)
            span.set_attribute("question_length", len(question))

            start = time.perf_counter()
            vector_store = self.get_vector_store(collection_name)
            llm = _get_llm()
            
            # 1. Setup Retrieval with History Awareness
            contextualize_q_system_prompt = (
                "Given a chat history and the latest user question "
                "which might reference context in the chat history, "
                "formulate a standalone question which can be understood "
                "without the chat history. Do NOT answer the question, "
                "just reformulate it if needed and otherwise return it as is."
            )
            contextualize_q_prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", contextualize_q_system_prompt),
                    MessagesPlaceholder("chat_history"),
                    ("human", "{input}"),
                ]
            )
            
            retriever = vector_store.as_retriever(search_kwargs={"k": 5})
            history_aware_retriever = create_history_aware_retriever(
                llm, retriever, contextualize_q_prompt
            )

            # 2. Setup Chain with System Prompt
            system_prompt = (
                "You are a professional assistant for a SaaS platform. "
                "Use the following pieces of retrieved context to answer the question. "
                "If the context doesn't contain the answer, use your general knowledge but mention if you are unsure. "
                "Keep the answer concise and use markdown formatting where appropriate.\n\n"
                "{context}"
            )
            qa_prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", system_prompt),
                    MessagesPlaceholder("chat_history"),
                    ("human", "{input}"),
                ]
            )
            
            question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
            rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
            
            # Format history
            history = chat_history or []
            
            result = rag_chain.invoke({"input": question, "chat_history": history})
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            sources = [doc.metadata for doc in result.get("context", [])]

            span.set_attribute("answer_length", len(result["answer"]))
            span.set_attribute("source_count", len(sources))
            span.set_attribute("duration_ms", duration_ms)

            logger.info("rag_query_completed", extra={
                "collection": collection_name,
                "question_length": len(question),
                "answer_length": len(result["answer"]),
                "source_count": len(sources),
                "history_length": len(history),
                "duration_ms": duration_ms,
            })
            
            return {
                "answer": result["answer"],
                "sources": sources
            }

rag_service = RAGService()
