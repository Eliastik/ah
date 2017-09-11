// Pure JS. No Jquery.
// Use parts of : https://github.com/urtzurd/html-audio/
var nb_ah = 0;
var timeout = 0;
var interval = 0;
var img_ah_src = "assets/img/ah.gif";
document.getElementById("checkFull").checked = false;
var repetitionInterval = 500;
var imgArray = ['assets/img/ah.gif', 'assets/img/ah_full.gif'];
var audioArray = ['assets/sounds/ah.mp3'];
var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var source, audioContext, pitchShifterProcessor, spectrumAudioAnalyser, sonogramAudioAnalyser;
var pitchRatio = 1.8, validGranSizes = [256, 512, 1024, 2048, 4096, 8192], grainSize = 8192, overlapRatio = 0.5, spectrumFFTSize = 4096, spectrumSmoothing = 0, sonogramFFTSize = 4096, sonogramSmoothing = 0;

function checkAudio(type) {
    if(!window.HTMLAudioElement) {
        return false;
    }

    var audio = document.createElement("audio");

    if(!audio.canPlayType(type)) {
        return "no mp3 support";
    }

    return true;
}

var checkAudio = checkAudio("audio/mp3");

function full() {
    if(document.getElementById("checkFull").checked == true) {
        img_ah_src = "assets/img/ah_full.gif";
        img_ah_type = 2;
    } else {
        img_ah_src = "assets/img/ah.gif";
        img_ah_type = 1;
    }
    ah();
}

function stopSound() {
    if(document.getElementById("checkSound").checked == true) {
        checkAudio = false;
    } else {
        checkAudio = true;
    }
}

function ah_click() {
    clearTimeout(timeout);
    timeout = setTimeout(ah, 100);
}

function ah_interval() {
    clearInterval(interval);
    ah();
    interval = setInterval(ah, repetitionInterval);
    document.getElementById("formInterval").style.display = "block";
}

function ah_stop() {
    clearInterval(interval);
    clearTimeout(timeout);
    document.getElementById("formInterval").style.display = "none";
}

function validInterval() {
    var tmp_interval = document.getElementById("inputInterval").value;
    if(isNaN(tmp_interval) || tmp_interval == "" || tmp_interval <= 10 || tmp_interval > 2147483647) { // max. interval number = 2147483647 ( https://stackoverflow.com/a/39007143 )
        alert("Intervalle invalide !");
        document.getElementById("inputInterval").value = repetitionInterval;
        return false;
    } else {
        repetitionInterval = tmp_interval;
        ah_stop();
        ah_interval();
        return true;
    }
    return false;
}

function initProcessor() {
    if (pitchShifterProcessor) {
        pitchShifterProcessor.disconnect();
    }

    if (audioContext.createScriptProcessor) {
        pitchShifterProcessor = audioContext.createScriptProcessor(grainSize, 1, 1);
    } else if (audioContext.createJavaScriptNode) {
        pitchShifterProcessor = audioContext.createJavaScriptNode(grainSize, 1, 1);
    }

    pitchShifterProcessor.buffer = new Float32Array(grainSize * 2);
    pitchShifterProcessor.grainWindow = hannWindow(grainSize);
    pitchShifterProcessor.onaudioprocess = function (event) {

        var inputData = event.inputBuffer.getChannelData(0);
        var outputData = event.outputBuffer.getChannelData(0);

        for (i = 0; i < inputData.length; i++) {

            // Apply the window to the input buffer
            inputData[i] *= this.grainWindow[i];

            // Shift half of the buffer
            this.buffer[i] = this.buffer[i + grainSize];

            // Empty the buffer tail
            this.buffer[i + grainSize] = 0.0;
        }

        // Calculate the pitch shifted grain re-sampling and looping the input
        var grainData = new Float32Array(grainSize * 2);
        for (var i = 0, j = 0.0;
             i < grainSize;
             i++, j += pitchRatio) {

            var index = Math.floor(j) % grainSize;
            var a = inputData[index];
            var b = inputData[(index + 1) % grainSize];
            grainData[i] += linearInterpolation(a, b, j % 1.0) * this.grainWindow[i];
        }

        // Copy the grain multiple times overlapping it
        for (i = 0; i < grainSize; i += Math.round(grainSize * (1 - overlapRatio))) {
            for (j = 0; j <= grainSize; j++) {
                this.buffer[i + j] += grainData[j];
            }
        }

        // Output the first half of the buffer
        for (i = 0; i < grainSize; i++) {
            outputData[i] = this.buffer[i];
        }
    };

    pitchShifterProcessor.connect(spectrumAudioAnalyser);
    pitchShifterProcessor.connect(sonogramAudioAnalyser);
    pitchShifterProcessor.connect(audioContext.destination);
}

function initAudio() {
    spectrumAudioAnalyser = audioContext.createAnalyser();
    spectrumAudioAnalyser.fftSize = spectrumFFTSize;
    spectrumAudioAnalyser.smoothingTimeConstant = spectrumSmoothing;

    sonogramAudioAnalyser = audioContext.createAnalyser();
    sonogramAudioAnalyser.fftSize = sonogramFFTSize;
    sonogramAudioAnalyser.smoothingTimeConstant = sonogramSmoothing;

    source = audioContext.createBufferSource();
    initProcessor();
    var request = new XMLHttpRequest();
    request.open('GET', audioArray[0], true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
        var audioData = request.response;

        audioContext.decodeAudioData(audioData, function(buffer) {
            source.buffer = buffer;
                source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.loop = false;
                source.connect(pitchShifterProcessor);
        });
    }

    request.send();
}

function linearInterpolation(a, b, t) {
    return a + (b - a) * t;
}

function hannWindow(length) {
    var window = new Float32Array(length);

    for (var i = 0; i < length; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1)));
    }

    return window;
}

function ah() {
    if(checkAudio == true && !'AudioContext' in window) {
        var ah = new Audio();
        ah.src = "assets/sounds/ah.mp3";
    }
    nb_ah = nb_ah + 1;
    document.getElementById("ah_img").src = "#";
    document.getElementById("ah_img").src = img_ah_src;
    document.getElementById("ah_img").title = "Cliquez ici !";
    if(checkAudio == true && !'AudioContext' in window) ah.play(); else source.start(0);
    document.getElementById("nb_ah").innerHTML = nb_ah;
}

function preloadImages(array) {
    document.getElementById("loading").style.display = "block";
    document.getElementById("loadingInfo").innerHTML = "Chargement des images : 0/" + array.length;
    var loadedImagesCount = 0;
    var imageNames = array;
    var imagesArray = [];
    for (var i = 0; i < imageNames.length; i++) {
        var image = new Image();
        image.src = imageNames[i];
        image.onload = function() {
            loadedImagesCount++;
            document.getElementById("loadingInfo").innerHTML = "Chargement des images : "+ loadedImagesCount +"/"+ array.length;

            if (loadedImagesCount >= imageNames.length) {
                preloadAudios(audioArray);
            }
        };
        image.onerror = function() {
            errorLoadingImages = true;
            loadedImagesCount++;
            document.getElementById("errorLoading").style.display = "block";
            document.getElementById("loadingInfo").innerHTML = "Chargement des images : "+ loadedImagesCount +"/"+ array.length;

            if (loadedImagesCount >= imageNames.length) {
                preloadAudios(audioArray);
            }
        };
        imagesArray.push(image);
    }
    return true;
}

function preloadAudios(array) {
    if (window.HTMLAudioElement) {
        var audioTestMp3 = document.createElement('audio');
        if (audioTestMp3.canPlayType && audioTestMp3.canPlayType("audio/mpeg")) {
            document.getElementById("loadingInfo").innerHTML = "Chargement des sons : 0/"+ array.length;
            var loadedAudioCount = 0;
            var errorLoadingAudio = false;
            var pourcentageLoadingAudio = 0;
            var audioFiles = array;
            var audioFilesLoaded = [];
            var errorLoadingAudioFunction = function() {
                if(audioFilesLoaded.indexOf(this.src) == -1) {
                    loadedAudioCount++;
                    var errorLoadingAudio = true;
                    document.getElementById("loadingInfo").innerHTML = "Chargement des sons : "+ loadedAudioCount +"/"+ array.length;
                    if (loadedAudioCount >= audioFiles.length) {
                        endInit();
                    }
                    audioFilesLoaded.push(this.src);
                }
            };
            var timeOutLoading = setTimeout(function() {
                if(loadedAudioCount == 0) {
                    endInit();
                }
            }, 5000);
            for (var i in audioFiles) {
                (function() {
                    var audioPreload = new Audio();
                    audioPreload.src = audioFiles[i];
                    audioPreload.preload = "auto";
                    audioPreload.oncanplaythrough = function() {
                        if(audioFilesLoaded.indexOf(this.src) == -1) {
                            loadedAudioCount++;
                            var pourcentageLoadingAudio = Math.round((100*loadedAudioCount)/audioFiles.length);
                            document.getElementById("loadingInfo").innerHTML = "Chargement des sons : "+ loadedAudioCount +"/"+ array.length;

                            if (loadedAudioCount >= audioFiles.length) {
                                endInit();
                            }
                            audioFilesLoaded.push(this.src);
                        }
                    };
                    audioPreload.onerror = errorLoadingAudioFunction;
                    audioPreload.onsuspend = errorLoadingAudioFunction;
                    audioPreload.onabort = errorLoadingAudioFunction;
                }());
            }
        } else {
            endInit();
        }
    } else {
        endInit();
    }
}

function init() {
    preloadImages(imgArray);
    if(checkAudio == false) {
        document.getElementById("compa").style.display = "block";
        document.getElementById("compaInfo").innerHTML = "Votre navigateur ne supporte pas la lecture de fichiers audio. Vous n'entendrez pas le Ah de Denis Brogniart !";
    } else if(checkAudio == "no mp3 support") {
        document.getElementById("compa").style.display = "block";
        document.getElementById("compaInfo").innerHTML = "Votre navigateur supporte la lecture de fichiers audio, mais il ne peut pas lire le format MP3. Vous n'entendrez pas le Ah de Denis Brogniart !";
    } else {
        document.getElementById("checkSound").disabled = false;
        document.getElementById("checkSound").checked = false;
        document.getElementById("checkSoundDiv").setAttribute("class", "checkbox");
    }
}

function endInit() {
    document.getElementById("checkFull").disabled = false;
    document.getElementById("checkFullDiv").setAttribute("class", "checkbox");
    document.getElementById("repeat").disabled = false;
    document.getElementById("stop").disabled = false;
    document.getElementById("ah_img").setAttribute("onclick", "ah_click();");
    document.getElementById("ah_img").style.display = "block";
    document.getElementById("loading").style.display = "none";

    if ('AudioContext' in window) {
        document.getElementById("modify").disabled = false;
        initAudio();
    }

    ah_click();
}

// When the page is entirely loaded, calling the init function who load the others assets (images, sounds)
document.onreadystatechange = function() {
    if (document.readyState === 'complete') {
        init();
    }
};

// Do you like ponies ?
