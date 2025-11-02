import React, { useState } from 'react';
import { PipelineEvent } from '@/components/chessops/Agents/types';

interface PipelineTimelineProps {
  onEvent: (event: PipelineEvent) => void;
}

export const PipelineTimeline: React.FC<PipelineTimelineProps> = ({ onEvent }) => {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setEvents([]);

    const formData = new FormData(event.currentTarget);
    
    try {
      const response = await fetch('http://127.0.0.1:8100/predict-stream', {
        method: 'POST',
        body: formData,
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const message of messages) {
            if (message.startsWith('data: ')) {
              const data = message.substring(6);
              if (data === 'FINISHED') {
                setIsLoading(false);
                return;
              }

              const [type, ...contentParts] = data.split(':');
              const content = contentParts.join(':');

              if (type === 'text') {
                const event = { type: 'text' as const, content };
                setEvents(prev => [...prev, event]);
                onEvent(event);
              } else if (type === 'image') {
                const [title, imageData] = content.split(':data:image/jpeg;base64,');
                const event = { type: 'image' as const, title, content: `data:image/jpeg;base64,${imageData}` };
                setEvents(prev => [...prev, event]);
                onEvent(event);
              }
            }
          }
        }
      };

      processStream();

    } catch (error) {
      console.error('Error processing stream:', error);
      setIsLoading(false);
      setEvents([{ type: 'text', content: `Error: ${error instanceof Error ? error.message : String(error)}` }]);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 text-white rounded-lg">
      <form onSubmit={handleSubmit} className="mb-4 flex items-center gap-4">
        <input type="file" name="image" required className="flex-grow" />
        <select name="a1_pos" defaultValue="BL" className="bg-zinc-800 p-2 rounded">
          <option value="BL">Bottom-Left</option>
          <option value="BR">Bottom-Right</option>
          <option value="TL">Top-Left</option>
          <option value="TR">Top-Right</option>
        </select>
        <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 p-2 rounded disabled:bg-gray-500">
          {isLoading ? 'Processing...' : 'Run Prediction'}
        </button>
      </form>

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="p-4 bg-zinc-800 rounded-lg">
            {event.type === 'text' ? (
              <p className="font-mono whitespace-pre-wrap">{event.content}</p>
            ) : (
              <div>
                <h3 className="font-semibold mb-2">{event.title}</h3>
                <img src={event.content} alt={event.title} className="max-w-full h-auto rounded" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
