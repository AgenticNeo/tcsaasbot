#!/bin/bash
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
fi
uvicorn app.main:app --host 0.0.0.0 --port 9100 --reload
