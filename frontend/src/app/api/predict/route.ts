import { NextRequest, NextResponse } from 'next/server';
import http from 'http';

export async function POST(request: NextRequest) {
  try {
    // Send a clear message to the WebSocket server to clear previous data
    const clearMessage = JSON.stringify({ type: 'clear' });
    const clearOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(clearMessage),
      },
    };

    const clearReq = http.request(clearOptions, (res) => {
      res.on('data', (d) => {
        process.stdout.write(d);
      });
    });

    clearReq.on('error', (error) => {
      console.error('Error sending clear message to WebSocket server:', error);
    });

    clearReq.write(clearMessage);
    clearReq.end();

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const a1_pos = formData.get('a1_pos') as string;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append('image', file);
    backendFormData.append('a1_pos', a1_pos);

    const backendUrl = process.env.NEXT_PUBLIC_CHESS_API_URL ? `${process.env.NEXT_PUBLIC_CHESS_API_URL}/predict-stream` : 'http://127.0.0.1:8100/predict-stream';

    const response = await fetch(backendUrl, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.body) {
      return new NextResponse(JSON.stringify({ error: 'No response body from backend' }), { status: 500 });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const processStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        const postData = chunk;
        const options = {
          hostname: 'localhost',
          port: 3002,
          path: '/',
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(postData),
          },
        };

        const req = http.request(options, (res) => {
          res.on('data', (d) => {
            process.stdout.write(d);
          });
        });

        req.on('error', (error) => {
          console.error(error);
        });

        req.write(postData);
        req.end();
      }
    };

    processStream();

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Error in predict API route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
