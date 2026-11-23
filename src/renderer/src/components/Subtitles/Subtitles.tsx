import "../../assets/Subtitles/Subtitles.css"
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom";

export default function Subtitles()
{
    
    //Navigation
    const navigate = useNavigate();
    //Video reference and canvas reference
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    //Checks if any pixels have changed
    const pixels = useRef<Uint8ClampedArray | null>(null);
    //Sleep
    const sleep = (secs) => new Promise((resolve)=>setTimeout(resolve, secs))
    //The video playing
    const getVideo = async() => {
        //Let the video play everything on the screen
        const streamVideo = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});

        //Checks if the video is still playing
        if(videoRef.current)
        {
            //Keeps playing
            videoRef.current.srcObject = streamVideo;
            videoRef.current.onplaying = () => {
                //Shows what is the canvas at the moment
                getCanvas();
                
            }
        }
    };


    //A canvas that takes a picture of the screen
    const getCanvas = async () => {
        //Gets the video current value and canvas current value
        const video = videoRef.current;
        const canvas = canvasRef.current;
        //Gets the information about the screen size
        const getScreenSizeInfo = await window.api.screenSize();
        //Reads the languages
        const readLanguages = await window.api.readLanguages();
        
        //Checks if the video and canvas exists
        if(video && canvas)
        {
            //await sleep(5000)
            //Gets the information about the canvas
            const ctx = canvas.getContext("2d");
            if(ctx)
            {
                //Gets the size of the shape of the canvas screen and window
                const rect = canvas.getBoundingClientRect();
                const screenWidth = getScreenSizeInfo["screenWidth"];
                const screenHeight = getScreenSizeInfo["screenHeight"];
                const screenX = getScreenSizeInfo["screenX"];
                const screenY = getScreenSizeInfo["screenY"];

                 //Position of the webpage content—not the outside window border
                const contentScreenX = window.screenX + (window.outerWidth - window.innerWidth) / 2
                //COntent Screen Y
                const contentScreenY = window.screenY +(window.outerHeight - window.innerHeight) / 2;
                //Scales
                const scaleX = video.videoWidth / screenWidth;
                //Y
                const scaleY = video.videoHeight / screenHeight;
                //SOurce X
                const sourceX = (contentScreenX - screenX + rect.left) * scaleX;
                //Source Y
                const sourceY = (contentScreenY - screenY + rect.top) * scaleY;
                //WIdth
                const sourceWidth = rect.width * scaleX
                //Heigh
                const sourceHeight = rect.height * scaleY
                //Width
                canvas.width = Math.round(rect.width);
                //Height
                canvas.height = Math.round(rect.height);

                //Draws the image
                ctx.drawImage(video, Math.round(sourceX), Math.round(sourceY), Math.round(sourceWidth), Math.round(sourceHeight), 0, 0, canvas.width, canvas.height);
                //Gets the current pixel data
                const getPixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                //Sets the current pixel data
                const prevPixels = pixels.current;

                //This ensures that an image is created
                canvas.toBlob(async (blob : Blob | null)=>{
                    if(!blob) return;
                    
                    //Checks if we are on pixel mode
                    if(findDifference(prevPixels, getPixels))
                    {
                        //Finds the pixel image
                        const imageArrayBuffer = await blob.arrayBuffer();
                        const getMessage = await window.api.getTextImageResults(imageArrayBuffer, readLanguages["lan1"], readLanguages["lan2"]);
                        pixels.current = getPixels;
                        window.api.sendText(getMessage);
                    }

                    //Sleeps for 3000ms
                    await sleep(3000);
                    requestAnimationFrame(getCanvas);
                }, "image/png")
                
            }
            else
            {
                return;
            }
        }
        else
        {
            return;
        }
    }

    //Looks between two arrays and see if they are different
    function findDifference(prevPixels : Uint8ClampedArray | null, currPixels : Uint8ClampedArray) : Boolean 
    {   
        if(prevPixels != null)
        {
            for(let i : number = 0; i < currPixels.length; i += 4)
            {
                const currRed = currPixels[i];
                const currGreen = currPixels[i + 1];
                const currBlue = currPixels[i + 2];
                const prevRed = prevPixels[i];
                const prevGreen = prevPixels[i + 1];
                const prevBlue = prevPixels[i + 2];
                if(currRed != prevRed || currGreen != prevGreen || currBlue != prevBlue)
                {
                    return true;
                }
            }
            return false;
        }
        return true;
        
    }
    useEffect(()=>{
        const removeWindow = window.api.backToMainScreen(()=>{
            navigate("/")
        });
        
        getVideo();
        return removeWindow;
    }, [navigate]);

    return (
    <>
    <div className="subtitleBody">
        {/* Screen itself */}
         <canvas className="screen"  ref={canvasRef} width={500} height={400} style={{visibility: "hidden"}}/>
        <video id="screen-sharing-video" ref={videoRef} autoPlay muted playsInline style={{display: "none"}}></video>
        <br></br>
    </div>
   
    </>
    );
}