// Pure JS. No Jquery.
var nb_ah = 0;
var timeout = 0;
var interval = 0;
var speedAudio = 1;
var pitchAudio = 1;
var reverbAudio = false;
var playFromAPI = false;
var compaAudioAPI = false;
var img_ah_src = "assets/img/ah.gif";
document.getElementById("checkFull").checked = false;
var repetitionInterval = 500;
var imgArray = ['assets/img/ah.gif', 'assets/img/ah_full.gif'];
var audioArray = ['assets/sounds/ah.mp3', 'assets/sounds/impulse_response.mp3'];
if('AudioContext' in window) {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
}
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

function compaMode() {
    if(document.getElementById("checkCompa").checked == true) {
        document.getElementById("saveInputModify").disabled = true;
        document.getElementById("saveInputModify").setAttribute("title", "Non disponible en mode de compatibilité.");
    } else {
        document.getElementById("saveInputModify").disabled = false;
        document.getElementById("saveInputModify").setAttribute("title", "");
    }
}

function renderAudioAPI(audio, speed = 1, pitch = 1, reverb = false, save = false, play = false, audioName = "sample", comp = false, rate = 1, BUFFER_SIZE = 4096) {
    if ('AudioContext' in window) {
        if(!comp) {
            var offlineContext = new OfflineAudioContext(2, 48000*15, 48000);
        } else {
            var offlineContext = context;
        }
        
        if(reverb) var convolver = offlineContext.createConvolver();
        
        var st = new soundtouch.SoundTouch(48000);
        st.pitch = pitch;
        st.tempo = speed;
        st.rate = rate;
        var filter = new soundtouch.SimpleFilter(new soundtouch.WebAudioBufferSource(audio), st);
        var node = soundtouch.getWebAudioNode(offlineContext, filter);
        
        if(!comp) {
            if(reverb) {
                convolver.buffer = audio_impulse_response;
                node.connect(convolver);
                convolver.connect(offlineContext.destination);
            } else {
                node.connect(offlineContext.destination);
            }
            
            offlineContext.oncomplete = function(e) {
                window[audioName] = e.renderedBuffer;
                
                document.getElementById("modify").disabled = false;
                document.getElementById("validInputModify").disabled = false;
                if (typeof(Worker) !== "undefined") {
                    document.getElementById("saveInputModify").disabled = false;
                    document.getElementById("saveInputModify").setAttribute("title", "");
                } else {
                    document.getElementById("saveInputModify").disabled = true;
                    document.getElementById("saveInputModify").setAttribute("title", "Désolé, votre navigateur est incompatible avec cette fonction.");
                }

                if(play) {
                    ah_click();
                }

                if(save) {
                    saveBuffer(e.renderedBuffer);
                }
            };
            
            offlineContext.startRendering();
        } else {
            document.getElementById("saveInputModify").disabled = true;
            document.getElementById("saveInputModify").setAttribute("title", "Non disponible en mode de compatibilité.");
        
            document.getElementById("modify").disabled = false;
            document.getElementById("validInputModify").disabled = false;
            if(play && checkAudio && playFromAPI) {
                if(reverb) {
                    convolver.buffer = audio_impulse_response;
                    node.connect(convolver);
                    convolver.connect(offlineContext.destination);
                } else {
                    node.connect(offlineContext.destination);
                }
            }
        }
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API not supported by this browser.");
        return false;
    }
}

function playBufferAudioAPI(buffer) {
    if ('AudioContext' in window) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.start(0);
        source.connect(context.destination);
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API not supported by this browser.");
        return false;
    }
}

/* https://stackoverflow.com/questions/22560413/html5-web-audio-convert-audio-buffer-into-wav-file */
function saveBuffer(buffer) {
    if (typeof(Worker) !== "undefined") {
        var worker = new Worker('assets/js/recorderWorker.js');
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Workers are not supported by this browser.");
        return false;
    }
    
    if ('AudioContext' in window) {
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
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API not supported by this browser.");
        return false;
    }
}

function ah_click() {
    clearTimeout(timeout);
    timeout = setTimeout(ah, 50);
}

function ah_interval() {
    clearInterval(interval);
    playFromAPI = false;
    ah();
    interval = setInterval(ah, repetitionInterval);
    document.getElementById("formInterval").style.display = "block";
    document.getElementById("formModify").style.display = "none";
}

function ah_stop() {
    clearInterval(interval);
    playFromAPI = false;
    clearTimeout(timeout);
    document.getElementById("formInterval").style.display = "none";
    document.getElementById("formModify").style.display = "none";
}

function ah_modify() {
    clearInterval(interval);
    clearTimeout(timeout);
    playFromAPI = true;
    document.getElementById("formInterval").style.display = "none";
    document.getElementById("formModify").style.display = "block";
    if(modifyFirstClick) {
        document.getElementById("modify").disabled = true;
        validModify(false, false);
        modifyFirstClick = false;
    }
}

function validInterval() {
    try {
        var tmp_interval = document.getElementById("inputInterval").value;
    } catch(e) {
        alert("Une erreur est survenue.");
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
        alert("Une erreur est survenue.");
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
        if(document.getElementById("checkCompa").checked == true) compaAudioAPI = true; else compaAudioAPI = false;
        document.getElementById("validInputModify").disabled = true;
        document.getElementById("saveInputModify").disabled = true;
        if(compaAudioAPI) {
            if(checkAudio !== true || play !== true) {
                document.getElementById("modify").disabled = false;
                document.getElementById("validInputModify").disabled = false;
            }
            
            if(play) {
                ah_click();
            }
        } else {
            renderAudioAPI(audio_ah_buffer, speedAudio, pitchAudio, reverbAudio, save, play, "audio_ah_processed", compaAudioAPI);
        }
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
        if(!compaAudioAPI) {
            playBufferAudioAPI(audio_ah_processed);
        } else {
            renderAudioAPI(audio_ah_buffer, speedAudio, pitchAudio, reverbAudio, false, true, "audio_ah_processed", compaAudioAPI);
        }
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
            });
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
    compaMode();
    full();
}

// When the page is entirely loaded, call the init function who load the others assets (images, sounds)
document.onreadystatechange = function() {
    if (document.readyState === 'complete') {
        init();
    }
};

// Do you like ponies ?
