import "./App.css";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { Textarea } from "./components/ui/textarea";
import { ChessOpsDashboard } from "./features/chessops-dashboard";

// Feature flag for ChessOps Dashboard
// Default to true for development
const ENABLE_DASHBOARD = import.meta.env.VITE_FEATURE_CHESSOPS_DASHBOARD !== "false";

function App() {
  // If dashboard is enabled, render it instead of the simple chat
  if (ENABLE_DASHBOARD) {
    return <ChessOpsDashboard />;
  }

  // Otherwise, render the original simple chat UI
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">ChessBot</h1>
          <p className="text-muted-foreground mt-2">An agentic chess player.</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            {/* Chat Container */}
            <div className="space-y-6">
              {/* Messages Area */}
              <div className="rounded-lg border bg-card">
                <ScrollArea className="h-[500px] p-6">
                  <div className="space-y-6">
                    {/* AI Message */}
                    <div className="flex gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="AI"
                        />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            AI Assistant
                          </span>
                          <span className="text-xs text-muted-foreground">
                            2:30 PM
                          </span>
                        </div>
                        <div className="rounded-md bg-muted p-3">
                          <p className="text-sm">
                            Hello! I'm here to help you with any questions you
                            might have. How can I assist you today?
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* User Message */}
                    <div className="flex gap-4 justify-end">
                      <div className="flex-1 space-y-2 max-w-[80%]">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">
                            2:31 PM
                          </span>
                          <span className="text-sm font-medium">You</span>
                        </div>
                        <div className="rounded-md bg-primary text-primary-foreground p-3">
                          <p className="text-sm">
                            This looks much better now! The shadcn style is so
                            clean.
                          </p>
                        </div>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Another AI Message */}
                    <div className="flex gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="AI"
                        />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            AI Assistant
                          </span>
                          <span className="text-xs text-muted-foreground">
                            2:32 PM
                          </span>
                        </div>
                        <div className="rounded-md bg-muted p-3">
                          <p className="text-sm">
                            I'm glad you like it! The shadcn design system
                            really emphasizes clean, accessible, and beautiful
                            components. Is there anything specific you'd like to
                            know about building interfaces with these
                            components?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message here..."
                    className="min-h-[48px] max-h-40 resize-none"
                  />
                  <Button type="submit" className="px-6 h-[48px]">
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Side Display */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex gap-4 h-60">
              <img
                className="rounded-lg"
                src="https://github.com/shadcn.png"
                alt="camera-1"
              />

              <img
                className="rounded-lg"
                src="https://github.com/shadcn.png"
                alt="camera-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
