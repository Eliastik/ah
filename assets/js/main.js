/*
 * Copyright (C) 2017-2019 Eliastik (eliastiksofts.com)
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
var nb_play, timeout, interval, avgDebitDownloadLastImage, speedAudio, pitchAudio, repetitionInterval, modifyFirstClick, reverbAudio, playFromAPI, compaAudioAPI, vocoderAudio, compatModeChecked, audioContextNotSupported, audioProcessing, removedTooltipInfo, firstInit, audio_principal_buffer, audio_impulse_response, audio_modulator, img_principal_type, previousSound, errorSound;

nb_play = timeout = interval = avgDebitDownloadLastImage = previousSound = errorSound = 0;
speedAudio = pitchAudio = img_principal_type = 1;
repetitionInterval = 500;
modifyFirstClick = true;
reverbAudio = playFromAPI = compaAudioAPI = vocoderAudio = compatModeChecked = audioContextNotSupported = audioProcessing = removedTooltipInfo = firstInit = false;
audio_principal_buffer = audio_impulse_response = audio_modulator = null;

// Settings
var filesDownloadName = "ah";
var checkFullEnabled = true;
var checkFullImg = ["assets/img/ah.gif", "assets/img/ah_full.gif"];
var imgArray = [
    ["assets/img/ah.gif", 365961],
    ["assets/img/ah_full.gif", 1821614]
]; // images to be loaded when launching the app + size
var audioArray = ["assets/sounds/ah.mp3", "assets/sounds/impulse_response.mp3", "assets/sounds/modulator.mp3"]; // audio to be loaded when launching the app

var soundBoxList = [ // sound name - path to the sound - path to the animation - size of the animation (bytes)
    ["Ah !", "assets/sounds/ah.mp3", "assets/img/ah.gif", 365961]
];
// End of the settings

var audioFileName = soundBoxList[0][1];
var img_principal_src = soundBoxList[0][2];

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

var slider = new Slider("#pitchRange", {
    formatter: function(value) {
        return value;
    }
});

var slider2 = new Slider("#speedRange", {
    formatter: function(value) {
        return value;
    }
});

document.getElementById("inputInterval").onkeyup = function(e) {
    if(e.keyCode === 13) {
        validInterval();
    }
};

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

function checkListSounds() {
    var value = '';

    for(var i = 0, l = soundBoxList.length; i < l; i++) {
        value += '<option value="' + i + '">' + soundBoxList[i][0] + '</option>';
    }

    document.getElementById("soundChoice").innerHTML = value;
    document.getElementById("soundChoice").disabled = "";
}

function changeSound(index) {
    var index = parseInt(index);

    if(index < soundBoxList.length && index >= 0) {
        document.getElementById("soundChoice").value = index;
        document.getElementById("loading").style.display = "block";
        document.getElementById("errorLoading").style.display = "none";
        document.getElementById("soundChoice").disabled = "disabled";

        preloadImages(makeArrayForPreload(soundBoxList, 2, index, index + 1), makeArrayForPreload(soundBoxList, 3, index, index + 1), function(result) {
            if(result) {
                img_principal_src = soundBoxList[index][2];
                audioFileName = soundBoxList[index][1];
                audio_principal_buffer = null;

                loadAudioAPI(audioFileName, "audio_principal_buffer", function(result2) {
                    document.getElementById("loading").style.display = "none";
                    document.getElementById("soundChoice").disabled = "";
                    previousSound = index;

                    if(playFromAPI) {
                        validModify(true, false);
                    } else {
                        launchPlay();
                        validModify(false, false);
                    }
                });
            } else {
                document.getElementById("loading").style.display = "none";
                document.getElementById("soundChoice").disabled = "";
                document.getElementById("soundChoice").value = previousSound;
                errorSound = index;
            }
        });
    }
}

document.getElementById("soundChoice").onchange = function() {
    changeSound(this.value);
};

function reloadData() {
    initAudioAPI();
    changeSound(errorSound);
}

var checkAudio = checkAudio("audio/mp3");

function full() {
    if(checkFullEnabled) {
        if(document.getElementById("checkFull").checked == true) {
            img_principal_src = checkFullImg[1];
            img_principal_type = 2;
        } else {
            img_principal_src = checkFullImg[0];
            img_principal_type = 1;
        }
    }

    launchPlay();
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
                        launchPlay_click();
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
        var worker = new Worker("assets/js/recorderWorker.js");
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Workers are not supported by this browser.");
        return false;
    }

    if ('AudioContext' in window && !audioContextNotSupported) {
        worker.postMessage({
            command: "init",
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
            a.download = filesDownloadName + "-" + new Date().toISOString() + ".wav";
            a.click();
            window.URL.revokeObjectURL(url);
        };

        worker.postMessage({
            command: "record",

            buffer: [
                buffer.getChannelData(0),
                buffer.getChannelData(1)
            ]
        });

        worker.postMessage({
            command: "exportWAV",
            type: "audio/wav"
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
        launchPlay_stop();
        launchPlay_interval();
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

    if(play) {
        playFromAPI = true;
    }

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
                launchPlay_click();
            }
        } else {
            renderAudioAPI(audio_principal_buffer, speedAudio, pitchAudio, reverbAudio, save, play, "audio_principal_processed", compaAudioAPI, vocoderAudio);
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
    nb_play = nb_play + 1;
    document.getElementById("animation_img").src = "#";
    document.getElementById("animation_img").src = img_principal_src;
    document.getElementById("nb_play").innerHTML = nb_play;
}

function removeTooltipInfo() {
    if(!removedTooltipInfo) {
        setTooltip("animation_img", "", false, true,  null, true, false);
        removedTooltipInfo = true;
    }
}

function launchPlay() {
    if(checkAudio && playFromAPI == false) {
        var audioSound = new Audio();
        audioSound.src = audioFileName;
    }

    if(checkAudio && !'AudioContext' in window && !audioContextNotSupported) {
        audioSound.play();
        reloadAnimation();
    } else if(checkAudio && 'AudioContext' in window && !audioContextNotSupported && playFromAPI) {
        if(!compaAudioAPI) {
            playBufferAudioAPI(audio_principal_processed);
            reloadAnimation();
        } else {
            renderAudioAPI(audio_principal_buffer, speedAudio, pitchAudio, reverbAudio, false, true, "audio_principal_processed", compaAudioAPI, vocoderAudio);
        }
    } else if(checkAudio && playFromAPI == false) {
        audioSound.play();
        reloadAnimation();
    } else {
        reloadAnimation();
    }
}

function launchPlay_click() {
    clearTimeout(timeout);
    timeout = setTimeout(launchPlay, 50);
}

function launchPlay_interval() {
    clearInterval(interval);
    playFromAPI = false;
    launchPlay();
    interval = setInterval(launchPlay, repetitionInterval);
    document.getElementById("formInterval").style.display = "block";
    document.getElementById("formModify").style.display = "none";
}

function launchPlay_stop() {
    clearInterval(interval);
    playFromAPI = false;
    clearTimeout(timeout);
    document.getElementById("formInterval").style.display = "none";
    document.getElementById("formModify").style.display = "none";
}

function launchPlay_modify() {
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

function autoConvertOctets(size) { // debit en octets/secondes
    if(size >= 1000000000) {
        return (size / 1000000000).toFixed(2).replace(".", ",") + " Go";
    } else if(size >= 1000000) {
        return (size / 1000000).toFixed(2).replace(".", ",") + " Mo";
    } else if(size >= 1000) {
        return (size / 1000).toFixed(2).replace(".", ",") + " Ko";
    } else {
        return size + " o";
    }
}

function timeRemaining(size, debit) {
    if(!isNaN(size) && !isNaN(debit)) {
        return "Temps restant estimé : <span id='timerDownloadTime'>" + Math.round((size / debit)) + "</span> seconde(s) (débit moyen : " + autoConvertOctets(debit) + "/s) – Taille des données : " + autoConvertOctets(size);
    }

    return "";
}

function timerDownloadTime(id) {
    this.id = id;
    this.seconds;
    this.interval;

    this.start = function() {
        if(document.getElementById(id) != null)  {
            this.seconds = parseInt(document.getElementById(id).innerHTML);
        } else {
            this.seconds = 0;
        }

        var self = this;

        this.interval = setInterval(function() {
            self.count();
        }, 1000);
    };

    this.stop = function() {
        clearInterval(this.interval);
    };

    this.count = function() {
        this.seconds -= 1;

        if(document.getElementById(id) != null) document.getElementById(id).innerHTML = this.seconds;

        if(this.seconds <= 0) {
            this.stop();
        }
    };
}

function sumImgSizes(array) {
    var sum = 0;

    for(var i = 0, l = array.length; i < l; i++) {
        if(!isNaN(array[i])) {
            sum += array[i];
        }
    }

    return sum;
}

function makeArrayForPreload(array, index, from, to) {
    var output = [];

    for(var i = from; i < to; i++) {
        output.push(array[i][index]);
    }

    return output;
}

function preloadImages(array, sizeArray, func) {
    var sizeTot = sumImgSizes(sizeArray);

    var timerRemainingTime = new timerDownloadTime("timerDownloadTime");
    var msgLoading = "Chargement des données graphiques : ";

    var timeStart = Date.now() / 1000; // secondes
    var timeTot = 0;

    document.getElementById("timeLoadingInfo").innerHTML = "";
    document.getElementById("loadingInfo").innerHTML = msgLoading + " 0/" + array.length;

    if(avgDebitDownloadLastImage > 0) {
        document.getElementById("timeLoadingInfo").innerHTML = timeRemaining(sizeTot, avgDebitDownloadLastImage);
        timerRemainingTime.start();
    }

    var loadedImagesCount = 0;
    var imageNames = array;
    var imagesArray = [];

    if(imageNames.length > 0) {
        for(var i = 0; i < imageNames.length; i++) {
            var image = new Image();
            image.src = imageNames[i];

            image.onload = function() {
                timeTot = ((Date.now() / 1000) - timeStart);
                timerRemainingTime.stop();

                if(timeTot > 1) {
                    avgDebitDownloadLastImage = sizeTot / timeTot;
                }

                loadedImagesCount++;

                document.getElementById("loadingInfo").innerHTML = msgLoading + loadedImagesCount + "/" + array.length;

                if(loadedImagesCount >= imageNames.length) {
                    if(typeof func !== 'undefined') {
                        return func(true);
                    } else {
                        return true;
                    }
                }
            };

            image.onerror = function() {
                avgDebitDownloadLastImage = 0;
                timerRemainingTime.stop();

                errorLoadingImages = true;
                loadedImagesCount++;
                document.getElementById("errorLoading").style.display = "block";
                document.getElementById("loadingInfo").innerHTML = msgLoading + loadedImagesCount + "/" + array.length;

                if(loadedImagesCount >= imageNames.length) {
                    if(typeof func !== 'undefined') {
                        return func(false);
                    } else {
                        return false;
                    }
                }
            };

            imagesArray.push(image);
        }
    } else {
        timerRemainingTime.stop();

        if(typeof func !== 'undefined') {
            return func(false);
        } else {
            return false;
        }
    }
}

function preloadAudios(array, func) {
    var msgLoading = "Chargement des données audio : ";

    if(window.HTMLAudioElement) {
        var audioTestMp3 = document.createElement('audio');

        if(audioTestMp3.canPlayType && audioTestMp3.canPlayType("audio/mpeg")) {
            document.getElementById("loadingInfo").innerHTML = msgLoading + "0/" + array.length;
            document.getElementById("timeLoadingInfo").innerHTML = "";

            var loadedAudioCount = 0;
            var errorLoadingAudio = false;
            var audioFiles = array;
            var audioFilesLoaded = [];

            var errorLoadingAudioFunction = function() {
                if(audioFilesLoaded.indexOf(this.src) == -1) {
                    var errorLoadingAudio = true;

                    loadedAudioCount++;
                    document.getElementById("loadingInfo").innerHTML = msgLoading + loadedAudioCount + "/" + array.length;
                    document.getElementById("errorLoading").style.display = "block";

                    audioFilesLoaded.push(this.src);

                    if(loadedAudioCount >= audioFiles.length) {
                        if(typeof func !== 'undefined') {
                            return func(false);
                        } else {
                            return false;
                        }
                    }
                }
            };

            var timeOutLoading = setTimeout(function() {
                if(loadedAudioCount == 0) {
                    if(typeof func !== 'undefined') {
                        return func(false);
                    } else {
                        return false;
                    }
                }
            }, 5000);

            for(var i = 0; i < audioFiles.length; i++) {
                var audioPreload = new Audio();
                audioPreload.src = audioFiles[i];
                audioPreload.preload = "auto";

                audioPreload.oncanplaythrough = function() {
                    if(audioFilesLoaded.indexOf(this.src) == -1) {
                        loadedAudioCount++;
                        document.getElementById("loadingInfo").innerHTML = msgLoading + loadedAudioCount + "/" + array.length;

                        audioFilesLoaded.push(this.src);

                        if(loadedAudioCount >= audioFiles.length) {
                            if(typeof func !== 'undefined') {
                                return func(true);
                            } else {
                                return true;
                            }
                        }
                    }
                };

                audioPreload.onerror = errorLoadingAudioFunction;
                audioPreload.onstalled = errorLoadingAudioFunction;
            }
        } else {
            if(typeof func !== 'undefined') {
                return func(false);
            } else {
                return false;
            }
        }
    } else {
        if(typeof func !== 'undefined') {
            return func(false);
        } else {
            return false;
        }
    }
}

function loadAudioAPI(audio, dest, func) {
    if('AudioContext' in window && !audioContextNotSupported) {
        var request = new XMLHttpRequest();
        request.open('GET', audio, true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            checkAudioBuffer(dest);

            context.decodeAudioData(request.response, function(data) {
                window[dest] = data;
                checkAudioBuffer(dest);

                if(typeof func !== 'undefined') {
                    return func(true);
                }
            });
        }

        request.onreadystatechange = function() {
            checkAudioBuffer(dest);
        }

        request.onerror = function() {
            if(typeof func !== 'undefined') {
                return func(false);
            }
        }

        request.send();
    } else {
        if(typeof(window.console.error) !== 'undefined') console.error("Web Audio API is not supported by this browser.");

        if(typeof func !== 'undefined') {
            return func(false);
        } else {
            return false;
        }
    }
}

function checkAudioBuffer(bufferName) {
    var errorText = "Une erreur est survenue lors du chargement de certaines données. Cette fonctionnalité est donc indisponible. Essayez de recharger la page (F5).";

    if ('AudioContext' in window && !audioContextNotSupported) {
        switch(bufferName) {
            case "audio_principal_buffer":
                if(typeof(audio_principal_buffer) == "undefined" || audio_principal_buffer == null) {
                    setTooltip("modify", errorText, true, false, "wrapperModify", true);
                } else {
                    setTooltip("modify", "", false, true, "wrapperModify", true);
                }
            break;
            case "audio_impulse_response":
                if(typeof(audio_impulse_response) == "undefined" || audio_impulse_response == null) {
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
                if(typeof(audio_modulator) == "undefined" || audio_modulator == null) {
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
    loadAudioAPI(audioFileName, "audio_principal_buffer");
    loadAudioAPI(audioArray[1], "audio_impulse_response");
    loadAudioAPI(audioArray[2], "audio_modulator");
}

function init(func) {
    if(checkFullEnabled) {
        document.getElementById("checkFullDiv").style.display = "block";
    }

    document.getElementById("loading").style.display = "block";
    document.getElementById("errorLoading").style.display = "none";

    if(soundBoxList.length <= 1) {
        document.getElementById("formSoundChoice").style.display = "none";
    }

    preloadImages(makeArrayForPreload(imgArray, 0, 0, imgArray.length), makeArrayForPreload(imgArray, 1, 0, imgArray.length), function(result) {
        preloadAudios(audioArray, function(result2) {
            if(!firstInit) {
                firstInit = true;
                initAudioAPI();

                if(checkFullEnabled) {
                    document.getElementById("checkFull").disabled = false;
                    document.getElementById("checkFullDiv").setAttribute("class", "checkbox");
                }

                document.getElementById("repeat").disabled = false;
                document.getElementById("stop").disabled = false;
                document.getElementById("animation_img").setAttribute("onclick", "launchPlay_click(); removeTooltipInfo();");
                document.getElementById("animation_img").style.display = "block";
                document.getElementById("loading").style.display = "none";

                if (!'AudioContext' in window || audioContextNotSupported) {
                    setTooltip("modify", "Désolé, cette fonction est incompatible avec votre navigateur.", true, false, "wrapperModify", true);
                }

                if (typeof(Worker) !== "undefined") {
                    setTooltip("saveInputModify", "", false, true, "wrapperSave", true);
                } else {
                    setTooltip("saveInputModify", "Désolé, cette fonction est incompatible avec votre navigateur.", true, false, "wrapperSave", true);
                }

                checkListSounds();
                stopSound();
                compaMode();
                full();

                setTooltip("animation_img", "Cliquez ici !", false, true,  null, true, true);

                if(typeof func !== 'undefined') {
                    return func(true);
                } else {
                    return true;
                }
            }
        });
    });

    if(checkAudio == false) {
        document.getElementById("compa").style.display = "block";
        document.getElementById("compaInfo").innerHTML = "Votre navigateur ne supporte pas la lecture de fichiers audio. Vous n'entendrez rien !";
    } else if(checkAudio == "no mp3 support") {
        document.getElementById("compa").style.display = "block";
        document.getElementById("compaInfo").innerHTML = "Votre navigateur supporte la lecture de fichiers audio, mais il ne peut pas lire le format MP3. Vous n'entendrez rien !";
    } else {
        document.getElementById("checkSound").disabled = false;
        document.getElementById("checkSound").checked = false;
        document.getElementById("checkSoundDiv").setAttribute("class", "checkbox");
    }
}

// When the page is entirely loaded, call the init function who load the others assets (images, sounds)
document.onreadystatechange = function() {
    if (document.readyState === 'complete') {
        init();
    }
};

// Do you like ponies ?
