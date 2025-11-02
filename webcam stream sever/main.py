import cv2
import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

# Initialize the FastAPI app
app = FastAPI()

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Initialize the webcam
# 0 is usually the default built-in webcam
cap = cv2.VideoCapture(0)

# Check if the webcam is opened correctly
if not cap.isOpened():
    raise IOError("Cannot open webcam")

def generate_frames():
    """
    A generator function that captures frames from the webcam,
    encodes them as JPEG, and yields them as a byte string
    in the MJPEG format.
    """
    while True:
        # Read a frame from the webcam
        success, frame = cap.read()
        if not success:
            break
        else:
            # Encode the frame as JPEG
            # ret is a boolean, buffer is the encoded image
            ret, buffer = cv2.imencode('.jpg', frame)
            
            if not ret:
                continue
                
            # Convert the buffer to bytes
            frame_bytes = buffer.tobytes()
            
            # Yield the frame in the multipart format
            # This is the "magic" part that creates the MJPEG stream
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """
    Serves the index.html page.
    """
    return templates.TemplateResponse("index.html", {"request": request})


#@app.get("/video_feed")
@app.get("/stream.mjpg")
def video_feed():
    """
    This is the main API endpoint that streams the video.
    We return a StreamingResponse, passing it our generator function.
    """
    return StreamingResponse(
        generate_frames(),
        media_type='multipart/x-mixed-replace; boundary=frame'
    )




if __name__ == '__main__':
    # This part is for running the app directly with python main.py
    # For production, you'd use: uvicorn main:app --host 0.0.0.0 --port 8000
    uvicorn.run(app, host='127.0.0.1', port=8081)

# When the app shuts down, release the webcam
@app.on_event("shutdown")
def shutdown_event():
    cap.release()