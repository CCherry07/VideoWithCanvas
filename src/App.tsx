import { useEffect, useRef, useState } from 'react'
import './App.css'

interface Processor {
  computeFrame: (canvasCtx: CanvasRenderingContext2D, canvasRef: HTMLCanvasElement, videoRef: HTMLVideoElement, config: SizeProps) => void
  mosaic: (canvasCtx: CanvasRenderingContext2D, canvasRef: HTMLCanvasElement, videoRef: HTMLVideoElement, config: SizeProps) => void
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
  const [dataURL, setDataURL] = useState<string>()
  const processor: Processor = {

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
  type PalyType = 'invoke' | 'mosaic' | 'default'
  const handleRequestAnimationFrame = () => {
    if (palyType === 'invoke') {
      processor.computeFrame(canvasCtx!, canvasRef.current!, videoRef.current!, {
        width: 100,
        height: 100,
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
    } else if (palyType === 'default') {
      canvasCtx?.drawImage(videoRef.current!, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
      requestAnimationFrame(handleRequestAnimationFrame)
    }
  }

  useEffect(() => {
    handleRequestAnimationFrame()
  }, [palyType])

  function handlePaly(type: PalyType = 'default') {
    setPalyType(type)
    if (!videoRef.current || !videoRef.current.paused) return;
    videoRef.current.play();
  }
  function handlePause() {
    if (!videoRef.current || videoRef.current.paused) return;
    videoRef.current.pause();
  }
  function handleShot() {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL('image/png');
    setDataURL(dataURL)
  }

  function handleShotDownload() {
    if (!dataURL) {
      alert('请先截图')
      return
    };
    const a = document.createElement('a')
    a.href = dataURL!
    a.download = `${new Date().getTime()}.png`
    a.click()
  }
  return (
    <div className="App">
      <video id="mse" ref={videoRef} loop autoPlay={true} playsInline>
        <source src={videoSrc} type="video/mp4"></source>
      </video>
      <canvas
        ref={canvasRef}
        width="460"
        height="270"
        style={{ border: '1px dashed #375dcf'}}
      ></canvas>
      {dataURL && <img src={dataURL} style={{ height: '290px', width: "460px" }}  alt='视频截图'/>}
      <div>
        <button onClick={() => handlePaly()}>播放</button>
        <button onClick={handlePause}>暂停</button>
        <button onClick={() => handlePaly('invoke')}>反色播放</button>
        <button onClick={() => handlePaly('mosaic')}>马赛克</button>
        <button onClick={handleShot}>视频截图</button>
        <button onClick={handleShotDownload}>下载截图</button>
      </div>
    </div>
  )
}

export default App
