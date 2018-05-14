/*
 * Copyright (C) 2017 Eliastik (eliastiksofts.com)
 *
 * This file is part of "Denis Brogniart – Ah !".
 *
 * "Denis Brogniart – Ah !" is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * "Denis Brogniart – Ah !" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with "Denis Brogniart – Ah !".  If not, see <http://www.gnu.org/licenses/>.
 */

// Pure JS. No Jquery.
// Default variables
var nb_ah = 0;
var timeout = 0;
var interval = 0;
var speedAudio = 1;
var pitchAudio = 1;
var reverbAudio = false;
var playFromAPI = false;
var compaAudioAPI = false;
var vocoderAudio = false;
var compatModeChecked = false;
document.getElementById("checkFull").checked = false;
var repetitionInterval = 500;
var imgArray = ['assets/img/ah.gif', 'assets/img/ah_full.gif'];
var img_ah_src = imgArray[0];
var audioArray = ['assets/sounds/ah.mp3', 'assets/sounds/impulse_response.mp3', 'assets/sounds/modulator.mp3'];
var audio_ah_buffer, audio_impulse_response, audio_modulator = null;
var audioContextNotSupported = false;
var modifyFirstClick = true;
var audioProcessing = false;
var removedTooltipInfo = false;
if('AudioContext' in window) {
    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var context = new AudioContext();
    } catch(e) {
        if(typeof(window.console.error) !== 'undefined') {
            console.error("Error when creating Audio Context (the Web Audio API seem to be unsupported):", e);
        } else {
            console.log("Error when creating Audio Context (the Web Audio API seem to be unsupported):", e);
        }
        var audioContextNotSupported = true;
    }
} else {
    var audioContextNotSupported = true;
}
// End of the default variables

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
        img_ah_src = imgArray[1];
        img_ah_type = 2;
    } else {
        img_ah_src = imgArray[0];
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
    if(!audioProcessing) {
        if(document.getElementById("checkCompa").checked == true) {
            setTooltip("saveInputModify", "Non disponible en mode de compatibilité.", true, false, "wrapperSave", true);
        } else {
            if (typeof(Worker) !== "undefined") {
                setTooltip("saveInputModify", null, false, true, "wrapperSave", true);
            } else {
                setTooltip("saveInputModify", "Désolé, cette fonction est incompatible avec votre navigateur.", true, false, "wrapperSave", true);
            }
        }
    }
}

function add(a, b) {
    return a + b;
}

function renderAudioAPI(audio, speed, pitch, reverb, save, play, audioName, comp, vocode, rate, BUFFER_SIZE) {
    // Default parameters
    var speed = speed || 1; // Speed of the audio
    var pitch = pitch || 1; // Pitch of the audio
    var reverb = reverb || false; // Enable or disable reverb
    var save = save || false; // Save the audio buffer under a wav file
    var play = play || false; // Play the audio
    var audioName = audioName || "sample"; // The audio buffer variable name (global)
    var comp = comp || false; // Enable or disable the compatibility mode
    var vocode = vocode || false; // Enable or disable vocoder
    var rate = rate || 1; // Rate of the audio
    var BUFFER_SIZE = BUFFER_SIZE || 4096; // Buffer size of the audio
    // End of default parameters

    if ('AudioContext' in window && !audioContextNotSupported) {
        if(!comp) {
            var offlineContext = new OfflineAudioContext(2, context.sampleRate*15, context.sampleRate);
        } else {
            var offlineContext = context;
        }

        if(typeof(audio_impulse_response) == "undefined" || audio_impulse_response == null) reverb = false;
        if(typeof(audio_modulator) == "undefined" || audio_modulator == null) vocode = false;

        document.getElementById("processingModifLoader").style.display = "block";
        document.getElementById("validInputModify").disabled = true;
        document.getElementById("saveInputModify").disabled = true;
        audioProcessing = true;

        function renderAudio(buffer) {
            var st = new soundtouch.SoundTouch(44100);
            st.pitch = pitch;
            st.tempo = speed;
            st.rate = rate;
            var filter = new soundtouch.SimpleFilter(new soundtouch.WebAudioBufferSource(buffer), st);
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
                    document.getElementById("processingModifLoader").style.display = "none";
                    audioProcessing = false;
                    compaMode();

                    if(!compatModeChecked) {
                        var sum = e.renderedBuffer.getChannelData(0).reduce(add, 0);

                        if(sum == 0) {
                            document.getElementById("checkCompa").checked = true;
                            compaMode();
                            document.getElementById("compatAutoDetected").style.display = "block";
                            compaAudioAPI = true;
                        }

                        compatModeChecked = true;
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
                document.getElementById("modify").disabled = false;
                document.getElementById("validInputModify").disabled = false;
                document.getElementById("processingModifLoader").style.display = "none";
                audioProcessing = false;
                compaMode();

                if(play && checkAudio && playFromAPI) {
                    if(reverb) {
                        convolver.buffer = audio_impulse_response;
                        node.connect(convolver);
                        convolver.connect(offlineContext.destination);
                    } else {
                        node.connect(offlineContext.destination);
                    }
                }

                reloadAnimation(); // reload the animation
            }
        }

        if(reverb) var convolver = offlineContext.createConvolver();
        if(vocode) {
            var offlineContext2 = new OfflineAudioContext(2, context.sampleRate*15, context.sampleRate);
            offlineContext2.oncomplete = function(e) {
                renderAudio(e.renderedBuffer);
            };
            vocoder(offlineContext2, audio_modulator, audio);
            offlineContext2.startRendering();
        } else {
            renderAudio(audio);
        }
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API not supported by this browser.");
        return false;
    }
}

function playBufferAudioAPI(buffer) {
    if ('AudioContext' in window && !audioContextNotSupported) {
        context.resume();
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

    if ('AudioContext' in window && !audioContextNotSupported) {
        worker.postMessage({
            command: 'init',
            config: {
                sampleRate: context.sampleRate,
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

function validModify(play, save) {
    // Default parameters
    var play = play || false;
    var save = save || false;
    // End of default parameters

    try {
        var tmp_pitch = document.getElementById("pitchRange").value;
        var tmp_speed = document.getElementById("speedRange").value;
    } catch(e) {
        alert("Une erreur est survenue.");
        return false;
    }

    playFromAPI = true;

    if(isNaN(tmp_pitch) || tmp_pitch == "" || tmp_pitch <= 0 || tmp_pitch > 5) {
        alert("Valeur du pitch invalide !");
        document.getElementById("pitchRange").value = pitchAudio;
        document.getElementById("speedRange").value = speedAudio;
        return false;
    } else if(isNaN(tmp_speed) || tmp_speed == "" || tmp_speed <= 0 || tmp_speed > 5) {
        alert("Valeur de la vitesse invalide !");
        document.getElementById("pitchRange").value = pitchAudio;
        document.getElementById("speedRange").value = speedAudio;
        return false;
    } else {
        pitchAudio = tmp_pitch;
        speedAudio = tmp_speed;
        if(document.getElementById("checkReverb").checked == true) reverbAudio = true; else reverbAudio = false;
        if(document.getElementById("checkCompa").checked == true) compaAudioAPI = true; else compaAudioAPI = false;
        if(document.getElementById("checkVocode").checked == true) vocoderAudio = true; else vocoderAudio = false;
        if(compaAudioAPI) {
            if(checkAudio !== true || play !== true) {
                document.getElementById("modify").disabled = false;
                document.getElementById("validInputModify").disabled = false;
                reloadAnimation();
            }

            if(play) {
                ah_click();
            }
        } else {
            renderAudioAPI(audio_ah_buffer, speedAudio, pitchAudio, reverbAudio, save, play, "audio_ah_processed", compaAudioAPI, vocoderAudio);
        }
        return true;
    }

    return false;
}

function setTooltip(element, text, disable, enable,  otherElement, byId, display) {
    // Default parameters
    var element = element || null;
    var otherElement = otherElement || null;
    var text = text || null;
    var disable = disable || false;
    var enable = enable || false;
    var byId = byId || false; // getElementById on element and otherElement
    var display = display || false;
    // End of default parameters

    if(byId) {
        element = document.getElementById(element);
        otherElement = document.getElementById(otherElement);
    }

    if(disable) element.disabled = true;
    if(enable) element.disabled = false;

    if(text !== "" && text !== null) {
        if(otherElement !== null) {
            otherElement.setAttribute("data-original-title", text);
            window[otherElement + "_tooltip"] = new Tooltip(otherElement, {
                placement: 'bottom',
                animation: 'fade',
                delay: 50,
            });

            if(display) setTimeout(function() { window[otherElement + "_tooltip"].show() }, 150);
        } else {
            element.setAttribute("data-original-title", text);
            window[element + "_tooltip"] = new Tooltip(element, {
                placement: 'bottom',
                animation: 'fade',
                delay: 50,
            });

            if(display) setTimeout(function() { window[element + "_tooltip"].show() }, 150);
        }
    } else {
        if(otherElement !== null) {
            otherElement.removeAttribute("data-original-title");
            if(window[otherElement + "_tooltip"] && typeof(window[otherElement + "_tooltip"].hide) !== "undefined") window[otherElement + "_tooltip"].hide();
        } else {
            element.removeAttribute("data-original-title");
            if(window[element + "_tooltip"] && typeof(window[element + "_tooltip"].hide) !== "undefined") window[element + "_tooltip"].hide();
        }
    }

    if(otherElement !== null) {
        if(window[otherElement + "_tooltip"] && typeof(window[otherElement + "_tooltip"].hide) !== "undefined") return window[otherElement + "_tooltip"];
    } else {
        if(window[element + "_tooltip"] && typeof(window[element + "_tooltip"].hide) !== "undefined") return window[element + "_tooltip"];
    }

    return null;
}

function reloadAnimation() {
    nb_ah = nb_ah + 1;
    document.getElementById("ah_img").src = "#";
    document.getElementById("ah_img").src = img_ah_src;
    document.getElementById("nb_ah").innerHTML = nb_ah;
}

function removeTooltipInfo() {
    if(!removedTooltipInfo) {
        setTooltip("ah_img", "", false, true,  null, true, false);
        removedTooltipInfo = true;
    }
}

function ah() {
    if(checkAudio && playFromAPI == false) {
        var ah = new Audio();
        ah.src = audioArray[0];
    }

    if(checkAudio && !'AudioContext' in window && !audioContextNotSupported) {
        ah.play();
        reloadAnimation();
    } else if(checkAudio && 'AudioContext' in window && !audioContextNotSupported && playFromAPI) {
        if(!compaAudioAPI) {
            playBufferAudioAPI(audio_ah_processed);
            reloadAnimation();
        } else {
            renderAudioAPI(audio_ah_buffer, speedAudio, pitchAudio, reverbAudio, false, true, "audio_ah_processed", compaAudioAPI, vocoderAudio);
        }
    } else if(checkAudio && playFromAPI == false) {
        ah.play();
        reloadAnimation();
    } else {
        reloadAnimation();
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
                        initAudioAPI();
                        endInit();
                    }
                    audioFilesLoaded.push(this.src);
                }
            };
            var timeOutLoading = setTimeout(function() {
                if(loadedAudioCount == 0) {
                    initAudioAPI();
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
                                initAudioAPI();
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
            initAudioAPI();
            endInit();
        }
    } else {
        initAudioAPI();
        endInit();
    }
}

function loadAudioAPI(audio, dest) {
    if ('AudioContext' in window && !audioContextNotSupported) {
        var request = new XMLHttpRequest();
        request.open('GET', audio, true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            checkAudioBuffer(dest);

            context.decodeAudioData(request.response, function(data) {
                window[dest] = data;
                checkAudioBuffer(dest);
            });
        }

        request.onreadystatechange = function() {
            checkAudioBuffer(dest);
        }

        request.send();
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API is not supported by this browser.");
        return false;
    }
}

function checkAudioBuffer(bufferName) {
    var errorText = "Une erreur est survenue lors du chargement de certaines données. Cette fonctionnalité est donc indisponible. Essayez de recharger la page (F5).";

    if ('AudioContext' in window && !audioContextNotSupported) {
        switch(bufferName) {
            case "audio_ah_buffer":
                if(typeof(audio_ah_buffer) == "undefined") {
                    setTooltip("modify", errorText, true, false, "wrapperModify", true);
                } else {
                    setTooltip("modify", "", false, true, "wrapperModify", true);
                }
            break;
            case "audio_impulse_response":
                if(typeof(audio_impulse_response) == "undefined") {
                    setTooltip("checkReverb", errorText, true, false, "checkReverbWrapper", true);
                    document.getElementById("checkReverb").checked = false;
                    document.getElementById("checkReverbGroup").setAttribute("class", "input-group checkbox disabled");
                } else {
                    setTooltip("checkReverb", "", false, true, "checkReverbWrapper", true);
                    document.getElementById("checkReverb").checked = false;
                    document.getElementById("checkReverbGroup").setAttribute("class", "input-group checkbox");
                }
            break;
            case "audio_modulator":
                if(typeof(audio_modulator) == "undefined") {
                    setTooltip("checkVocode", errorText, true, false, "checkVocodeWrapper", true);
                    document.getElementById("checkVocode").checked = false;
                    document.getElementById("checkVocodeGroup").setAttribute("class", "input-group checkbox disabled");
                } else {
                    setTooltip("checkVocode", "", false, true, "checkVocodeWrapper", true);
                    document.getElementById("checkVocode").checked = false;
                    document.getElementById("checkVocodeGroup").setAttribute("class", "input-group checkbox");
                }
            break;
        }
    }
}

function initAudioAPI() {
    loadAudioAPI(audioArray[0], "audio_ah_buffer");
    loadAudioAPI(audioArray[1], "audio_impulse_response");
    loadAudioAPI(audioArray[2], "audio_modulator");
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
    document.getElementById("ah_img").setAttribute("onclick", "ah_click(); removeTooltipInfo();");
    document.getElementById("ah_img").style.display = "block";
    document.getElementById("loading").style.display = "none";

    if (!'AudioContext' in window || audioContextNotSupported) {
        setTooltip("modify", "Désolé, cette fonction est incompatible avec votre navigateur.", true, false, "wrapperModify", true);
    }

    if (typeof(Worker) !== "undefined") {
        setTooltip("saveInputModify", "", false, true, "wrapperSave", true);
    } else {
        setTooltip("saveInputModify", "Désolé, cette fonction est incompatible avec votre navigateur.", true, false, "wrapperSave", true);
    }

    stopSound();
    compaMode();
    full();

    setTooltip("ah_img", "Cliquez ici !", false, true,  null, true, true);
}

// When the page is entirely loaded, call the init function who load the others assets (images, sounds)
document.onreadystatechange = function() {
    if (document.readyState === 'complete') {
        init();
    }
};

// Do you like ponies ?
