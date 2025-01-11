import { useEffect, useRef, useState } from "react";

interface EditorProps {
  image: string;
  onMaskChange?: (maskData: string) => void;
}

export function Editor({ image, onMaskChange }: EditorProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [activeTool, setActiveTool] = useState<"pan" | "draw">("pan");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "rgba(255, 0, 0, 0.8)";
        setCtx(context);
      }
    }
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;

    const delta = -e.deltaY / 1000;
    const newZoom = Math.min(Math.max(0.1, zoom + delta), 5);

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPosition({
      x: mouseX - (mouseX - position.x) * (newZoom / zoom),
      y: mouseY - (mouseY - position.y) * (newZoom / zoom),
    });

    setZoom(newZoom);
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate coordinates relative to the container
    const containerX = clientX - containerRect.left;
    const containerY = clientY - containerRect.top;

    // Apply inverse transformations for pan and zoom
    return {
      x: (containerX - position.x) / zoom,
      y: (containerY - position.y) / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left clicks and ignore events from controls
    if (
      e.button !== 0 ||
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "INPUT"
    )
      return;
    e.preventDefault();

    if (activeTool === "pan") {
      setIsDragging(true);
    } else if (activeTool === "draw") {
      if (!ctx) return;
      setIsDrawing(true);
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Ignore events when interacting with controls
    if (
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "INPUT"
    ) {
      return;
    }

    if (activeTool === "pan" && isDragging) {
      e.preventDefault();
      setPosition((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    } else if (activeTool === "draw" && isDrawing && ctx) {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      ctx.lineTo(x, y);
      ctx.lineWidth = brushSize / zoom;
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDrawing(false);
    if (canvasRef.current && onMaskChange) {
      onMaskChange(canvasRef.current.toDataURL());
    }
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden p-0 m-0"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 p-0 m-0">
        <img
          src={image}
          alt="Selected"
          className="absolute h-full w-full object-contain p-0 m-0"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          draggable="false"
        />
        <canvas
          ref={canvasRef}
          className="absolute h-full w-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            pointerEvents: isDragging ? "none" : "auto",
            cursor:
              activeTool === "draw"
                ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='rgba(255,0,0,0.5)'/%3E%3C/svg%3E") ${
                    brushSize / 2
                  } ${brushSize / 2}, crosshair`
                : "grab",
          }}
          width={containerRef.current?.clientWidth}
          height={containerRef.current?.clientHeight}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            if (canvasRef.current) {
              canvasRef.current.width = img.naturalWidth;
              canvasRef.current.height = img.naturalHeight;
            }
          }}
        />
      </div>
      <div className="absolute bottom-2 right-2 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTool("pan")}
            className={`rounded-lg px-4 py-2 text-white backdrop-blur ${
              activeTool === "pan"
                ? "bg-blue-600/50 hover:bg-blue-700/50"
                : "bg-gray-800/50 hover:bg-gray-700/50"
            }`}
          >
            Pan
          </button>
          <button
            onClick={() => setActiveTool("draw")}
            className={`rounded-lg px-4 py-2 text-white backdrop-blur ${
              activeTool === "draw"
                ? "bg-blue-600/50 hover:bg-blue-700/50"
                : "bg-gray-800/50 hover:bg-gray-700/50"
            }`}
          >
            Draw
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetView}
            className="rounded-lg bg-gray-800/50 px-4 py-2 text-white backdrop-blur hover:bg-gray-700/50"
          >
            Reset View
          </button>
          {activeTool === "draw" && (
            <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-lg backdrop-blur">
              <span className="text-white">Brush Size:</span>
              <input
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
