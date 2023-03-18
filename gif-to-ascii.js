// gif-to-ascii.js

const ASCII_CHARS = ["@", "#", "S", "%", "?", "*", "+", ";", ":", ",", "."];
const asciiOutput = document.getElementById("ascii-output");
const inputGif = document.getElementById("input-gif");

let gif = null;
let numFrames = 0;
let currentFrame = 0;
let frameDurations = [];

inputGif.addEventListener("change", function (event) {
    const file = event.target.files[0];
    processGifFile(file);
});

function imageToAscii(canvas, width) {
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const asciiChars = " .:-=+*%@#";
    const scaleFactorX = canvas.width / width;
    const scaleFactorY = canvas.width / width * 1.5;
    let asciiArt = "";

    for (let y = 0; y < canvas.height; y += scaleFactorY) {
        for (let x = 0; x < canvas.width; x += scaleFactorX) {
            const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
            const r = imgData.data[i];
            const g = imgData.data[i + 1];
            const b = imgData.data[i + 2];
            const brightness = (r + g + b) / 3;
            const asciiIndex = Math.round((asciiChars.length - 1) * brightness / 255);
            asciiArt += asciiChars[asciiIndex];
        }
        asciiArt += "\n";
    }

    return asciiArt;
}

function estimateFrameDuration(canvas) {
    return 60;
    // フレーム遅延時間を推定するロジック
    // これはあなたが適切だと思う方法でフレーム遅延を推定する必要があります
    // 例: 平均値、固定値（100 ms）、または他の方法
}

function displayNextFrame() {
    const asciiFrame = imageToAscii(gif.get_canvas(), 60);
    asciiOutput.textContent = asciiFrame;

    gif.move_relative(1); // 1フレーム進める
    currentFrame = (currentFrame + 1) % numFrames;
    const frameDuration = frameDurations[currentFrame];
    setTimeout(displayNextFrame, frameDuration);
}

function processGifFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
            gif = new SuperGif({ gif: img });
            gif.load(function () {
                numFrames = gif.get_length();
                for (let i = 0; i < numFrames; i++) {
                    gif.move_to(i);
                    frameDurations.push(estimateFrameDuration(gif.get_canvas()));
                }
                gif.move_to(0);
                displayNextFrame();
            });
        };
    };
    reader.readAsDataURL(file);

    // GIFの作成と保存に関するコード
    const saveButton = document.getElementById("save-button");
    saveButton.addEventListener("click", () => {
        const asciiGif = new GIF({
            workers: 2,
            quality: 10,
            width: 320, // GIFの幅を指定
            height: 240, // GIFの高さを指定
        });

        for (let i = 0; i < numFrames; i++) {
            gif.move_to(i);
            const asciiFrame = imageToAscii(gif.get_canvas(), 60);
            const canvas = document.createElement("canvas");
            canvas.width = 320; // canvasの幅を指定
            canvas.height = 240; // canvasの高さを指定
            asciiToCanvas(asciiFrame, canvas, canvas.width, canvas.height);
            asciiGif.addFrame(canvas, { delay: frameDurations[i] });
        }

        asciiGif.on("finished", (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "ascii-animation.gif";
            link.click();
        });

        asciiGif.render();
    });
}

function asciiToCanvas(asciiArt, canvas, width, height) {
    const ctx = canvas.getContext("2d");
    const lineHeight = height / asciiArt.split("\n").length;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.font = lineHeight + "px monospace";
    ctx.textBaseline = "top";

    asciiArt.split("\n").forEach((line, index) => {
        ctx.fillText(line, 0, index * lineHeight);
    });
}