/**
 * @author Neeraj Krishna <ms.neerajkrishna@gmail.com>
 */

const processor = {
    timerCallBack() { // function which runs for every frame
        if (this.video.ended) {
            return;
        } else if (this.video.paused){
            this.initializeCropper();
            return;
        }

        if (this.cropper) {
            this.cropper.destroy();
        }
        this.drawFrame(); // draw frame on the canvas
        setTimeout(() => {
            this.timerCallBack();
        }, 0);
    },

    doLoad() { // initialize all variables when loaded and run the process

        // get elements
        this.video = document.getElementById("myVideo");
        this.canvas = document.getElementById("myCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.cropper;

        // get modal elements
        this.modalBg = document.querySelector(".modal-bg");
        this.modalClose = document.querySelector(".modal-close");
        this.croppedImgContainer = document.querySelector(".cropped-img-container");
        this.croppedImg = this.croppedImgContainer.firstElementChild;
        this.processingSpan = document.querySelector("span.processing");
        this.modalHeading = document.querySelector("h2.modal-heading");
        this.labelHeading = document.querySelector("h3.prediction-label");
        this.probabilityHeading = document.querySelector("h3.prediction-prob");
        this.predictBtn = document.getElementById("make-prediction");
        this.uploadBtn = document.getElementById("vid-file");

        // set cropper options
        this.options = {
            viewMode: 1,
            checkCrossOrigin: false,
            autoCrop: false
        }

        // set dimensions of the canvas
        this.canvas.width = this.video.clientWidth;
        this.canvas.height = this.video.clientHeight;

        // fill the canvas with black color
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.video.setAttribute("hidden", "true")

        // get the button container
        this.btnContainer = document.querySelector(".btn-container");

        // add event listeners to the button container
        this.btnContainer.addEventListener("click", (event) => {
            this.performAction(event);
        })

        // add event listener to the modal close btn
        this.modalClose.addEventListener("click", () => {
            this.closeModal()
        })

        // add event listener to predict btn
        this.predictBtn.addEventListener("click", () => {
            this.predict();
        })

        // add event listener to upload button
        this.uploadBtn.addEventListener("change", () => {
            this.upload();
        });
        
        // load the mobilenet model
        this.loadModel();

        this.video.addEventListener("play", () => this.timerCallBack(), false);
    },

    drawFrame() {
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        return;
    },

    initializeCropper() {
        if (this.cropper) {
            this.cropper.destroy()
        }
        this.cropper = new Cropper(this.canvas, this.options);
        return;
    },

    performAction(event) {
        
        if (!event.target) {
        return;
        }

        const nodeName = event.target.nodeName;
        var element;
        if (nodeName == "I") {
        element = event.target.parentElement;
        } else if (nodeName == "BUTTON") {
        element = event.target;
        }

        const textContent = element.textContent;
        
        switch (textContent) {
            case " Play":
                this.video.play();
                break;

            case " Pause":
                this.video.pause();
                break;

            case " Crop":
                this.launchModal();
                break;

            case " Zoom In":
                if (!this.cropper) {
                    return;
                }
                this.cropper.zoom(0.1);
                break;

            case " Zoom Out":
                if (!this.cropper) {
                    return;
                }
                this.cropper.zoom(-0.1);                
                break;

            case " Rotate Left":
                if (!this.cropper) {
                    return;
                }
                this.cropper.rotate(-10);
                break;

            case " Rotate Right":
                if (!this.cropper) {
                    return;
                }
                this.cropper.rotate(10);                
                break;

            case " Upload":
                this.uploadBtn.click();
                break;
        }
    },

    launchModal() {
        if (!this.cropper) {
            return;
        }
        this.modalBg.classList.add("bg-active");
        const croppedDataURL = this.cropper.getCroppedCanvas().toDataURL();
        this.croppedImg.setAttribute("src", croppedDataURL);
    },

    closeModal() {
        this.modalBg.classList.remove("bg-active");
        this.predictBtn.removeAttribute("hidden");
        this.processingSpan.setAttribute("hidden", "true");
        this.modalHeading.textContent = "Cropped Result";
        this.labelHeading.setAttribute("hidden", "true");
        this.probabilityHeading.setAttribute("hidden", "true");
    },

    async loadModel() {
        console.log('Loading mobilenet..');
        
        // Load the model.
        this.mobileNet = await mobilenet.load();
        console.log('Successfully loaded model');
    },

    async predict() {
        this.predictBtn.setAttribute("hidden", "true");
        this.processingSpan.removeAttribute("hidden");
        const start = new Date();
        const result = await this.mobileNet.classify(this.croppedImg);
        const endTime = new Date();
        const elapsedTime = endTime - start;
        console.log("The Model Latency is: ", elapsedTime, " Milliseconds");
        this.croppedImg.setAttribute("src", "");
        this.modalHeading.textContent = "Prediction Result";
        this.processingSpan.setAttribute("hidden", "true");
        const className = result[0].className;
        const probability = result[0].probability;
        this.labelHeading.textContent = "Label: " + className;
        this.probabilityHeading.textContent = "Probability: " + probability;
        this.labelHeading.removeAttribute("hidden");
        this.probabilityHeading.removeAttribute("hidden");
    },

    upload() {
        const file = this.uploadBtn.files[0];
        if (file) {
          const reader = new FileReader();
          reader.addEventListener("load", () => {
            this.video.setAttribute("src", reader.result);
          });
          reader.readAsDataURL(file);
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    processor.doLoad();
  });