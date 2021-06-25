const videoElement = document.querySelector("video");
const videoSelect = document.querySelector("select#videoSource");
const stopBtn = document.getElementById('stop');
const captureBtn = document.getElementById('captureBtn');
const voucherText = document.getElementById('voucher');
const parsedOutput = document.getElementById('parsedOutput');




navigator.mediaDevices
  .enumerateDevices()
  .then(gotDevices)
  .then(getStream)
  .catch(handleError);

videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || "camera " + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    } else {
      console.log("Found another kind of device: ", deviceInfo);
    }
  }
}

stopBtn.onclick = () => {
    window.stream.getTracks().forEach(function (track) {
        track.stop();
    });
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(function (track) {
      track.stop();
    });
  }

  const constraints = {
    video: {
        deviceId: { exact: videoSelect.value },
    }
  };
  if(videoSelect.value == ""){
      constraints.video = true
  }

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  videoElement.srcObject = stream;
}

function handleError(error) {
  console.error("Error: ", error);
}



// ------------------ To capture screenshot


var f = false; // to show the Final output.
const img = document.getElementById("screenshot-img");
const canvas = document.getElementById("my-canvas");
var text = "";
var textArray = "";

captureBtn.onclick = () => {
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext("2d").drawImage(videoElement, 0, 0);
    canvas.style.display="none";
    // Other browsers will fall back to image/png
    img.src = canvas.toDataURL("image/webp");

    img.style.display = "block"
    //--------------- Now send this image (base64) to OCR API.
    var myHeaders = new Headers();
    myHeaders.append("apikey", "d8bf16649188957");

    var formdata = new FormData();
    formdata.append("base64Image", img.src.trim());
    formdata.append('language', 'eng');

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: formdata,
    redirect: 'follow'
    };

    fetch("https://api.ocr.space/parse/image", requestOptions)
    .then(response => response.json())
    .then(
        result => {
            console.log(result)
            img.style.display = "none" // hide the image.
                if(result.ParsedResults.length > 0){
                    text = result.ParsedResults[0].ParsedText.trim().replaceAll('\r', '').replaceAll('\n', ' ')
                    parsedOutput.innerHTML = text.length > 0 ? text : '<b>Can\'t parse the image</b>';
                    parsedOutput.style.display = "block";
                    parsedOutput.classList.add('border','p-2')
                    textArray = text.split(' ');
                    textArray.forEach(word => {
                      if(word.match(/^[a-z0-9]+$/i) && word.length == 30){ // <======================== VOCUHER_LENGTH
                        voucherText.innerText = word
                        f = true
                      }
                    })
                    if(!f){
                      voucherText.innerText = "Voucher not found";
                    }
                }
                else{
                    alert('Some error occurred! Or image might not be clear.');
                }
        })
    .catch(error => console.log('error', error));

}


function handleSuccess(stream) {
    captureBtn.disabled = false;
    videoElement.srcObject = stream;
}