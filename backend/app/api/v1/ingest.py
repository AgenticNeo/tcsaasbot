from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from io import BytesIO
from pypdf import PdfReader
import requests
from bs4 import BeautifulSoup

from app.services.rag_service import rag_service
from app.core.security import get_current_user_id
from app.core.database import get_db, DocumentDB, TenantUsageDB
from app.core.logging import logger

router = APIRouter()

def _increment_usage(db: Session, tenant_id: str, field: str):
    usage = db.query(TenantUsageDB).filter(TenantUsageDB.tenant_id == tenant_id).first()
    if not usage:
        usage = TenantUsageDB(tenant_id=tenant_id)
        db.add(usage)
    
    current_val = getattr(usage, field) or 0
    setattr(usage, field, current_val + 1)
    db.commit()

class WebScrapeRequest(BaseModel):
    url: str

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        filename = file.filename
        text = ""

        if filename.lower().endswith('.pdf'):
            try:
                pdf_reader = PdfReader(BytesIO(content))
                for page in pdf_reader.pages:
                    extract = page.extract_text()
                    if extract:
                        text += extract + "\n"
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error parsing PDF: {str(e)}")
        elif filename.lower().endswith(('.txt', '.md')):
            try:
                text = content.decode('utf-8')
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error reading text file: {str(e)}")
        else:
             raise HTTPException(status_code=400, detail="Unsupported file type. Only .pdf, .txt, .md supported.")
             
        if not text.strip():
            raise HTTPException(status_code=400, detail="Empty file content")

        # Reuse Logic: Create DB Record
        db_doc = DocumentDB(
            title=filename,
            source="upload",
            content_snippet=text[:200].replace('\n', ' '),
            tenant_id=tenant_id
        )
        db.add(db_doc)
        db.flush()
        
        # Index
        metadata = {"source": filename, "doc_id": db_doc.id, "title": filename}
        rag_service.ingest_text(text, metadata, collection_name=tenant_id)
        
        _increment_usage(db, tenant_id, "documents_indexed")
        
        db.commit()
        db.refresh(db_doc)

        logger.info("document_uploaded", extra={
            "doc_id": db_doc.id, "filename": filename,
            "tenant_id": tenant_id, "text_length": len(text)
        })
        
        return {"status": "success", "db_id": db_doc.id, "filename": filename}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("upload_failed", extra={
            "tenant_id": tenant_id, "filename": file.filename, "error": str(e)
        })
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class IngestRequest(BaseModel):
    text: str
    metadata: Dict = {}

class DocumentResponse(BaseModel):
    id: int
    title: str
    source: str
    created_at: datetime
    content_snippet: str

@router.post("/")
async def ingest(
    request: IngestRequest, 
    tenant_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        # 1. Save metadata to SQL DB first to get the ID
        title = request.metadata.get("title", "Untitled")
        source = request.metadata.get("source", "unknown")
        snippet = request.text[:100] + "..." if len(request.text) > 100 else request.text
        
        db_doc = DocumentDB(
            title=title,
            source=source,
            content_snippet=snippet,
            tenant_id=tenant_id
        )
        db.add(db_doc)
        db.flush() # Flush to populate db_doc.id
        
        # 2. Ingest into Vector DB (Chroma) with doc_id in metadata
        request.metadata["doc_id"] = db_doc.id
        result = rag_service.ingest_text(request.text, request.metadata, collection_name=tenant_id)
        
        _increment_usage(db, tenant_id, "documents_indexed")
        
        db.commit()
        db.refresh(db_doc)

        logger.info("document_ingested", extra={
            "doc_id": db_doc.id, "title": title, "tenant_id": tenant_id,
            "text_length": len(request.text), "chunks": result.get("chunks_added", 0)
        })
        
        return {"status": "success", "db_id": db_doc.id, "vector_status": result}
    except Exception as e:
        logger.error("ingest_failed", extra={"tenant_id": tenant_id, "error": str(e)})
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: int,
    tenant_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        # 1. Get doc from DB
        db_doc = db.query(DocumentDB).filter(DocumentDB.id == doc_id, DocumentDB.tenant_id == tenant_id).first()
        if not db_doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # 2. Delete from Vector DB
        rag_service.delete_document(doc_id, collection_name=tenant_id)
        
        # 3. Delete from SQL DB
        db.delete(db_doc)
        db.commit()
        
        logger.info("document_deleted", extra={
            "doc_id": doc_id, "tenant_id": tenant_id, "title": db_doc.title
        })
        
        return {"status": "success", "id": doc_id}
    except Exception as e:
        logger.error("document_delete_failed", extra={"doc_id": doc_id, "error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    tenant_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        docs = db.query(DocumentDB).filter(DocumentDB.tenant_id == tenant_id).order_by(DocumentDB.created_at.desc()).all()
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _get_internal_links(soup, base_url, domain):
    from urllib.parse import urljoin, urlparse
    links = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        full_url = urljoin(base_url, href)
        parsed_full = urlparse(full_url)
        if parsed_full.netloc == domain and not parsed_full.fragment:
            clean_url = f"{parsed_full.scheme}://{parsed_full.netloc}{parsed_full.path}"
            links.append(clean_url)
    return links

def _clean_soup_text(soup):
    for script_or_style in soup(["script", "style", "nav", "footer", "header", "form"]):
        script_or_style.decompose()
    
    text = soup.get_text(separator=' ')
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    return '\n'.join(chunk for chunk in chunks if chunk)

def _process_single_page(url, headers, domain, tenant_id, db):
    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract links for the crawler
        new_links = _get_internal_links(soup, url, domain)
        
        # Process content
        clean_text = _clean_soup_text(soup)
        if not clean_text.strip():
            return None, new_links

        title = soup.title.string.strip() if soup.title and soup.title.string else url
        
        # Save & Index
        db_doc = DocumentDB(
            title=title, source=url,
            content_snippet=clean_text[:200].replace('\n', ' '),
            tenant_id=tenant_id
        )
        db.add(db_doc)
        db.flush()
        
        metadata = {"source": url, "doc_id": db_doc.id, "title": title}
        rag_service.ingest_text(clean_text, metadata, collection_name=tenant_id)
        
        _increment_usage(db, tenant_id, "documents_indexed")
        
        return title, new_links
    except Exception as e:
        logger.error(f"Failed to process page {url}: {str(e)}")
        return None, []

def _update_crawl_queue(discovered_links, scraped_urls, urls_to_scrape):
    for link in discovered_links:
        if link not in scraped_urls and link not in urls_to_scrape:
            urls_to_scrape.append(link)

@router.post("/scrape")
async def scrape_website(
    request: WebScrapeRequest,
    tenant_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        base_url = request.url
        if not base_url.startswith(('http://', 'https://')):
            base_url = 'https://' + base_url
            
        from urllib.parse import urlparse
        domain = urlparse(base_url).netloc
        
        urls_to_scrape = [base_url]
        scraped_urls = set()
        pages_processed = []
        max_pages = 50
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        while urls_to_scrape and len(scraped_urls) < max_pages:
            url = urls_to_scrape.pop(0)
            if url in scraped_urls: continue
                
            logger.info(f"Crawl item: {url} ({len(scraped_urls)}/{max_pages})")
            scraped_urls.add(url)
            
            title, discovered_links = _process_single_page(url, headers, domain, tenant_id, db)
            
            if title:
                pages_processed.append(title)
                
            _update_crawl_queue(discovered_links, scraped_urls, urls_to_scrape)
        
        db.commit()
        
        if not pages_processed:
            raise HTTPException(status_code=400, detail="No readable content found on the website")
            
        return {
            "status": "success", 
            "pages_scraped": len(pages_processed),
            "titles": pages_processed[:5]
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch website: {str(e)}")
    except Exception as e:
        logger.error(f"Scraper error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
