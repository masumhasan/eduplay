import React, { useState, useEffect, useRef } from 'react';
import './DrawingCanvas.css';

export const DrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ED1C24");
  const colors = [
    "#ED1C24",
    "#FBB03B",
    "#00A651",
    "#2E3192",
    "#1BFFFF",
    "#FFFFFF",
    "#000000",
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalAlpha = 1;
    context.lineWidth = 5;
    contextRef.current = context;
  }, []);

  const startDrawing = ({
    nativeEvent,
  }: React.MouseEvent | React.TouchEvent) => {
    const { offsetX, offsetY } = getCoords(nativeEvent);
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = color;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current) return;
    const { offsetX, offsetY } = getCoords(nativeEvent);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const getCoords = (event: MouseEvent | TouchEvent) => {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      return {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
    }
    if (event.touches.length > 0) {
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top,
      };
    }
    return { offsetX: 0, offsetY: 0 };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="drawing-canvas-container">
      <div className="color-palette">
        {colors.map((c) => (
          <button
            key={c}
            style={{ backgroundColor: c }}
            className={color === c ? "active" : ""}
            onClick={() => setColor(c)}
          />
        ))}
        <button onClick={clearCanvas} className="clear-btn">
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={finishDrawing}
        onTouchMove={draw}
        width="300"
        height="200"
        className="drawing-canvas"
      />
    </div>
  );
};
