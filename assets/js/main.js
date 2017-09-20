// Pure JS. No Jquery.
var nb_ah = 0;
var timeout = 0;
var interval = 0;
var speedAudio = 1;
var pitchAudio = 1;
var reverbAudio = false;
var playFromAPI = false;
var img_ah_src = "assets/img/ah.gif";
document.getElementById("checkFull").checked = false;
var repetitionInterval = 500;
var imgArray = ['assets/img/ah.gif', 'assets/img/ah_full.gif'];
var audioArray = ['assets/sounds/ah.mp3', 'assets/sounds/impulse_response.mp3'];
if('AudioContext' in window) var context = new AudioContext();
var modifyFirstClick = true;

var slider = new Slider('#pitchRange', {
    formatter: function(value) {
        return value;
    }
});

var slider2 = new Slider('#speedRange', {
    formatter: function(value) {
        return value;
    }
});

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

/* Original, modifié : https://peteris.rocks/blog/web-audio-api-playback-rate-preserve-pitch/ */
function renderAudioAPI(audio, speed = 1, pitch = 1, reverb = false, save = false, play = false, audioName = "sample", rate = 1, BUFFER_SIZE = 2048) {
    if ('AudioContext' in window) {
        if(reverb) {
            var offlineContext = new OfflineAudioContext(2, 48000*20, 48000);
        } else {
            var offlineContext = new OfflineAudioContext(2, 48000*20, 48000);
        }

        var st = new SoundTouch(true);
        st.pitch = pitch;
        st.tempo = speed;
        st.rate = rate;

        if(reverb) var convolver = offlineContext.createConvolver();

        var samples = new Float32Array(BUFFER_SIZE * 2);
        var node = offlineContext.createScriptProcessor(BUFFER_SIZE, 2, 2);

        node.onaudioprocess = function (e) {
            var l = e.outputBuffer.getChannelData(0);
            var r = e.outputBuffer.getChannelData(1);
            var framesExtracted = f.extract(samples, BUFFER_SIZE);
            if (framesExtracted == 0) {
                node.disconnect();
            }
            for (var i = 0; i < framesExtracted; i++) {
                l[i] = samples[i * 2];
                r[i] = samples[i * 2 + 1];
            }
        };

        if(reverb) {
            convolver.buffer = audio_impulse_response;
            node.connect(convolver);
            convolver.connect(offlineContext.destination);
        } else {
            node.connect(offlineContext.destination);
        }

        offlineContext.oncomplete = function(e) {
            window[audioName] = e.renderedBuffer;
            document.getElementById("validInputModify").disabled = false;
            if (typeof(Worker) !== "undefined") {
                document.getElementById("saveInputModify").disabled = false;
                document.getElementById("saveInputModify").setAttribute("title", "");
            } else {
                document.getElementById("saveInputModify").disabled = true;
                document.getElementById("saveInputModify").setAttribute("title", "Désolé, votre navigateur est incompatible avec cette fonction.");
            }
            document.getElementById("modify").disabled = false;

            if(play) {
                ah_click();
            }

            if(save) {
                saveBuffer(e.renderedBuffer);
            }
        };

        var source = {
            extract: function (target, numFrames, position) {
                var l = audio.getChannelData(0);
                var r = audio.getChannelData(1);
                for (var i = 0; i < numFrames; i++) {
                    target[i * 2] = l[i + position];
                    target[i * 2 + 1] = r[i + position];
                }
                return Math.min(numFrames, l.length - position);
            }
        };

        f = new SimpleFilter(source, st);
        offlineContext.startRendering();
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API not supported by this browser.");
        return false;
    }
}

function playBufferAudioAPI(buffer) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
}

/* https://stackoverflow.com/questions/22560413/html5-web-audio-convert-audio-buffer-into-wav-file */
function saveBuffer(buffer) {
    if (typeof(Worker) !== "undefined") {
        var worker = new Worker('assets/js/recorderWorker.js');
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API is not supported by this browser.");
        return false;
    }

    worker.postMessage({
        command: 'init',
        config: {
            sampleRate: 48000,
            numChannels: 2
        }
    });

    worker.onmessage = function(e) {
        var blob = e.data;
        var a = document.createElement("a");
        var url = URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = 'ah-' + new Date().toISOString() + '.wav';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    worker.postMessage({
        command: 'record',
        buffer: [
            buffer.getChannelData(0),
            buffer.getChannelData(1)
        ]
    });

    worker.postMessage({
        command: 'exportWAV',
        type: 'audio/wav'
    });
}

function ah_click() {
    clearTimeout(timeout);
    timeout = setTimeout(ah, 50);
}

function ah_interval() {
    clearInterval(interval);
    ah();
    interval = setInterval(ah, repetitionInterval);
    document.getElementById("formInterval").style.display = "block";
    document.getElementById("formModify").style.display = "none";
    playFromAPI = false;
}

function ah_stop() {
    clearInterval(interval);
    clearTimeout(timeout);
    document.getElementById("formInterval").style.display = "none";
    document.getElementById("formModify").style.display = "none";
    playFromAPI = false;
}

function ah_modify() {
    clearInterval(interval);
    clearTimeout(timeout);
    document.getElementById("formInterval").style.display = "none";
    document.getElementById("formModify").style.display = "block";
    if(modifyFirstClick) {
        document.getElementById("modify").disabled = true;
        validModify(false, false);
        modifyFirstClick = false;
    }
    playFromAPI = true;
}

function validInterval() {
    try {
        var tmp_interval = document.getElementById("inputInterval").value;
    } catch(e) {
        alert("Une erreur est survenue");
        return false;
    }

    playFromAPI = false;

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

function validModify(play = false, save = false) {
    try {
        var tmp_pitch = document.getElementById("pitchRange").value;
        var tmp_speed = document.getElementById("speedRange").value;
    } catch(e) {
        alert("Une erreur est survenue");
        return false;
    }

    playFromAPI = true;

    if(isNaN(tmp_pitch) || tmp_pitch == "" || tmp_pitch <= 0 || tmp_pitch > 2) {
        alert("Valeur du pitch invalide !");
        document.getElementById("pitchRange").value = pitchAudio;
        document.getElementById("speedRange").value = speedAudio;
        return false;
    } else if(isNaN(tmp_speed) || tmp_speed == "" || tmp_speed <= 0 || tmp_speed > 2) {
        alert("Valeur de la vitesse invalide !");
        document.getElementById("pitchRange").value = pitchAudio;
        document.getElementById("speedRange").value = speedAudio;
        return false;
    } else {
        pitchAudio = tmp_pitch;
        speedAudio = tmp_speed;
        if(document.getElementById("checkReverb").checked == true) reverbAudio = true; else reverbAudio = false;
        document.getElementById("validInputModify").disabled = true;
        document.getElementById("saveInputModify").disabled = true;
        renderAudioAPI(audio_ah_buffer, speedAudio, pitchAudio, reverbAudio, save, play, "audio_ah_processed");
        return true;
    }

    return false;
}

function ah() {
    if(checkAudio && playFromAPI == false) {
        var ah = new Audio();
        ah.src = audioArray[0];
    }
    
    nb_ah = nb_ah + 1;
    document.getElementById("ah_img").src = "#";
    document.getElementById("ah_img").src = img_ah_src;
    document.getElementById("ah_img").title = "Cliquez ici !";

    if(checkAudio && !'AudioContext' in window) {
        ah.play();
    } else if(checkAudio && 'AudioContext' in window && playFromAPI) {
        playBufferAudioAPI(audio_ah_processed);
    } else if(checkAudio && playFromAPI == false) {
        ah.play();
    }

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

function loadAudioAPI(audio, dest) {
    if ('AudioContext' in window) {
        var request = new XMLHttpRequest();
        request.open('GET', audio, true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            context.decodeAudioData(request.response, function(data) {
                window[dest] = data;
            })
        }

        request.send();
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API is not supported by this browser.");
        return false;
    }
}

function init() {
    preloadImages(imgArray);
    loadAudioAPI(audioArray[0], "audio_ah_buffer");
    loadAudioAPI(audioArray[1], "audio_impulse_response");
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
        document.getElementById("modify").setAttribute("title", "");
    } else {
        document.getElementById("modify").disabled = true;
        document.getElementById("modify").setAttribute("title", "Désolé, votre navigateur est incompatible avec cette fonction.");
    }
    
    if (typeof(Worker) !== "undefined") {
        document.getElementById("saveInputModify").disabled = false;
        document.getElementById("saveInputModify").setAttribute("title", "");
    } else {
        document.getElementById("saveInputModify").disabled = true;
        document.getElementById("saveInputModify").setAttribute("title", "Désolé, votre navigateur est incompatible avec cette fonction.");
    }
    
    stopSound();
    full();
}

// When the page is entirely loaded, call the init function who load the others assets (images, sounds)
document.onreadystatechange = function() {
    if (document.readyState === 'complete') {
        init();
    }
};

// Do you like ponies ?
