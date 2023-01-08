import { useEffect, useRef, useState } from 'react'
import './App.css'

interface Processor {
  computeFrame: (canvasCtx: CanvasRenderingContext2D, canvasRef: HTMLCanvasElement, videoRef: HTMLVideoElement, config: SizeProps) => void
  mosaic: (canvasCtx: CanvasRenderingContext2D, canvasRef: HTMLCanvasElement, videoRef: HTMLVideoElement, config: SizeProps) => void
  getColors: (ImageData: ImageData) => {
    r: number;
    g: number;
    b: number;
    a: number;
  }[]
  setColors: (ImageData: ImageData, colors: {
    r: number;
    g: number;
    b: number;
    a: number;
  }[]) => void
}
interface SizeProps {
  width: number
  height: number
  x: number,
  y: number,
}
function App() {
  const [videoSrc, setVideoSrc] = useState('api/html/mov_bbb.mp4')
  const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [palyType, setPalyType] = useState<PalyType>()

  const processor: Processor = {
    getColors: function getColors(ImageData: ImageData) {
      let data = ImageData.data
      let colors = []
      for (var i = 0; i < data.length; i += 4) {
        colors.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          a: data[i + 3],
        })
      }
      return colors
    },

    setColors: function setColors(ImageData: ImageData, colors: {
      r: number;
      g: number;
      b: number;
      a: number;
    }[]) {
      let data = ImageData.data
      colors.forEach((color, index) => {
        data[index] = color.r
        data[index + 1] = color.g
        data[index + 2] = color.b
        data[index + 3] = color.a
      })
    },

    computeFrame: function computeFrame(canvasCtx: CanvasRenderingContext2D, canvasRef: HTMLCanvasElement, videoRef: HTMLVideoElement, config: SizeProps) {
      const { x, y, width, height } = config
      canvasCtx.drawImage(videoRef, 0, 0, canvasRef.width, canvasRef.height);
      let frame = canvasCtx.getImageData(x, y, width, height);
      let data = frame.data
      // invert colors
      for (var i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // red
        data[i + 1] = 255 - data[i + 1]; // green
        data[i + 2] = 255 - data[i + 2]; // blue
      }
      canvasCtx.putImageData(frame, x, y);
      return;
    },

    mosaic: function mosaic(canvasCtx: CanvasRenderingContext2D, canvasRef: HTMLCanvasElement, videoRef: HTMLVideoElement, {
      width = 100,
      height = 100,
      x = 10,
      y = 30,
    }) {
      canvasCtx.drawImage(videoRef, 0, 0, canvasRef.width, canvasRef.height);
      let frame = canvasCtx.getImageData(x, y, width, height);
      const data = frame.data
      let sampleSize = 10;
      for (let i = y; i < y + height; i += sampleSize) {
        for (let j = x; j < x + width; j += sampleSize) {
          let p = (j - x + (i - y) * height) * 4;
          canvasCtx.fillStyle =
            "rgba(" +
            data[p] +
            "," +
            data[p + 1] +
            "," +
            data[p + 2] +
            "," +
            data[p + 3] +
            ")";
          canvasCtx.fillRect(j, i, sampleSize, sampleSize);
        }
      }
    }
  }

  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current!.getContext('2d')!
      setCanvasCtx(context)
    }
  }, [])
  type PalyType = 'invoke' | 'mosaic'
  const handleRequestAnimationFrame = () => {
    if (palyType === 'invoke') {
      processor.computeFrame(canvasCtx!, canvasRef.current!, videoRef.current!, {
        width: 100,
        height: 50,
        x: 100,
        y: 100,
      })
      requestAnimationFrame(handleRequestAnimationFrame)
    } else if (palyType === 'mosaic') {
      processor.mosaic(canvasCtx!, canvasRef.current!, videoRef.current!, {
        width: 100,
        height: 100,
        x: 100,
        y: 100,
      })
      requestAnimationFrame(handleRequestAnimationFrame)
    } else {
      canvasCtx?.drawImage(videoRef.current!, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
      requestAnimationFrame(handleRequestAnimationFrame)
    }
  }
  function setXY(obj: ImageData, x: number, y: number, colors: any[]) {
    var { width } = obj
    colors.forEach(color => {
      obj.data[4 * (y * width + x)] = color['r']
      obj.data[4 * (y * width + x) + 1] = color['g']
      obj.data[4 * (y * width + x) + 2] = color['b']
      obj.data[4 * (y * width + x) + 3] = color['a']
    });
  }

  useEffect(() => {
    handleRequestAnimationFrame()
  }, [palyType])

  function handlePaly(type?: PalyType) {
    console.log('video paly', videoRef.current);
    if (!videoRef.current || !videoRef.current.paused) return;
    videoRef.current.play();
    setPalyType(type)
  }
  function handlePause() {
    if (!videoRef.current || videoRef.current.paused) return;
    videoRef.current.pause();
  }
  return (
    <div className="App">
      <video id="mse" ref={videoRef} autoPlay={true} playsInline controls={true}>
        <source src={videoSrc} type="video/mp4"></source>
      </video>
      <canvas
        ref={canvasRef}
        width="460"
        height="270"
        style={{ border: '1px solid blue' }}
      ></canvas>
      <div>
        <button onClick={() => handlePaly()}>播放</button>
        <button onClick={handlePause}>暂停</button>
        <button onClick={() => handlePaly('invoke')}>反色播放</button>
        <button onClick={() => handlePaly('mosaic')}>马赛克</button>
      </div>
    </div>
  )
}

export default App
