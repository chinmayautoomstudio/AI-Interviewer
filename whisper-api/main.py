# Python Whisper API Service
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import whisper
import tempfile
import os
import uuid
from typing import Optional
import logging
from pydantic import BaseModel
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Whisper Speech-to-Text API",
    description="High-quality speech recognition using OpenAI Whisper",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
whisper_model = None
model_size = "base"  # tiny, base, small, medium, large
executor = ThreadPoolExecutor(max_workers=2)

# Pydantic models
class TranscriptionRequest(BaseModel):
    language: Optional[str] = "en"
    task: Optional[str] = "transcribe"  # transcribe or translate
    temperature: Optional[float] = 0.0
    best_of: Optional[int] = 5
    beam_size: Optional[int] = 5

class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration: float
    segments: list
    processing_time: float

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_size: str

def load_whisper_model():
    """Load Whisper model"""
    global whisper_model
    try:
        logger.info(f"Loading Whisper model: {model_size}")
        whisper_model = whisper.load_model(model_size)
        logger.info("Whisper model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    logger.info("Starting Whisper API service...")
    
    # Load Whisper model in background
    loop = asyncio.get_event_loop()
    success = await loop.run_in_executor(executor, load_whisper_model)
    
    if not success:
        logger.error("Failed to load Whisper model on startup")
    else:
        logger.info("Whisper API service started successfully")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if whisper_model else "unhealthy",
        model_loaded=whisper_model is not None,
        model_size=model_size
    )

@app.get("/models")
async def get_available_models():
    """Get available Whisper models"""
    models = [
        {"name": "tiny", "size": "39 MB", "description": "Fastest, least accurate"},
        {"name": "base", "size": "74 MB", "description": "Balanced speed and accuracy"},
        {"name": "small", "size": "244 MB", "description": "Good accuracy"},
        {"name": "medium", "size": "769 MB", "description": "Better accuracy"},
        {"name": "large", "size": "1550 MB", "description": "Best accuracy"}
    ]
    return {"models": models, "current": model_size}

def transcribe_audio_sync(audio_path: str, language: str, task: str, temperature: float, best_of: int, beam_size: int):
    """Synchronous transcription function"""
    try:
        import time
        start_time = time.time()
        
        # Transcribe audio
        result = whisper_model.transcribe(
            audio_path,
            language=language,
            task=task,
            temperature=temperature,
            best_of=best_of,
            beam_size=beam_size,
            fp16=False  # Use fp32 for better compatibility
        )
        
        processing_time = time.time() - start_time
        
        # Extract segments
        segments = []
        if 'segments' in result:
            for segment in result['segments']:
                segments.append({
                    "id": segment.get('id', 0),
                    "start": segment.get('start', 0.0),
                    "end": segment.get('end', 0.0),
                    "text": segment.get('text', '').strip(),
                    "tokens": segment.get('tokens', []),
                    "temperature": segment.get('temperature', 0.0),
                    "avg_logprob": segment.get('avg_logprob', 0.0),
                    "compression_ratio": segment.get('compression_ratio', 0.0),
                    "no_speech_prob": segment.get('no_speech_prob', 0.0)
                })
        
        return {
            "text": result.get('text', '').strip(),
            "language": result.get('language', language),
            "duration": result.get('duration', 0.0),
            "segments": segments,
            "processing_time": processing_time
        }
        
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise e

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "en",
    task: str = "transcribe",
    temperature: float = 0.0,
    best_of: int = 5,
    beam_size: int = 5
):
    """Transcribe audio file to text"""
    
    if not whisper_model:
        raise HTTPException(status_code=503, detail="Whisper model not loaded")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    temp_file_path = f"/app/audio/{file_id}_{file.filename}"
    
    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Processing audio file: {file.filename} ({len(content)} bytes)")
        
        # Transcribe in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            transcribe_audio_sync,
            temp_file_path,
            language,
            task,
            temperature,
            best_of,
            beam_size
        )
        
        logger.info(f"Transcription completed: {len(result['text'])} characters")
        
        return TranscriptionResponse(**result)
        
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file: {e}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Whisper Speech-to-Text API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
