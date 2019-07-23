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
var nb_play, timeout, interval, avgDebitDownloadLastImage, speedAudio, pitchAudio, repetitionInterval, modifyFirstClick, reverbAudio, playFromAPI, compaAudioAPI, vocoderAudio, compatModeChecked, audioContextNotSupported, audioProcessing, removedTooltipInfo, firstInit, audio_principal_buffer, audio_impulse_response, audio_modulator, img_principal_type, previousSound, errorSound, compaModeStop, compaModeStopSave, lowpassAudio, highpassAudio, phoneAudio, returnAudio, bassboostAudio, limiterAudio, bitCrusherAudio, echoAudio, sliderPlayAudio;

nb_play = timeout = interval = avgDebitDownloadLastImage = previousSound = errorSound = 0;
speedAudio = pitchAudio = img_principal_type = 1;
repetitionInterval = 500;
modifyFirstClick = true;
reverbAudio = echoAudio = playFromAPI = bitCrusherAudio = lowpassAudio = highpassAudio = bassboostAudio = phoneAudio = returnAudio = compaAudioAPI = vocoderAudio = compatModeChecked = audioContextNotSupported = audioProcessing = saveProcessing = removedTooltipInfo = firstInit = false;
limiterAudio = true;
audio_principal_buffer = audio_impulse_response = audio_modulator = null;

var audioFileName = soundBoxList[0][1];
var img_principal_src = soundBoxList[0][2];

if('AudioContext' in window) {
    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var context = new AudioContext();
    } catch(e) {
        if(typeof(window.console.error) !== "undefined") {
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

// Classes
function BufferPlayer() {
    this.buffer;
    this.source;
    this.currentTime = 0;
    this.displayTime = 0;
    this.duration = 0;
    this.interval;
    this.playing = false;
    this.sliding = false;

    var obj = this;

    if(sliderPlayAudio != undefined) {
        sliderPlayAudio.on("slideStart", function() {
            obj.sliding = true;
        });

        sliderPlayAudio.on("slide", function(value) {
            obj.displayTime = Math.round(obj.duration * (value / 100));
            obj.updateInfos();
        });

        sliderPlayAudio.on("slideStop", function(value) {
            obj.sliding = false;
            obj.currentTime = Math.round(obj.duration * (value / 100));
            obj.displayTime = obj.currentTime;

            if(obj.playing) {
                obj.pause();
                obj.start();
            } else {
                obj.updateInfos();
            }
        });
    }

    this.init = function() {
        this.playing = false;
        context.resume();
        this.source = context.createBufferSource();
        this.source.buffer = this.buffer;
        this.duration = this.buffer.duration;
        this.source.connect(context.destination);
        this.updateInfos();
    };

    this.loadBuffer = function(buffer) {
        this.reset();
        this.buffer = buffer;
        this.init();
    };

    this.reset = function() {
        clearInterval(this.interval);
        this.currentTime = 0;
        this.displayTime = 0;
        this.stop();
    };

    this.stop = function() {
        if(this.source != undefined && this.source != null && this.playing) {
            this.source.stop(0);
            this.playing = false;
        }

        this.updateInfos();
    };

    this.start = function() {
        if(this.source != undefined && this.source != null) {
            this.stop();
            this.init();
            this.source.start(0, this.currentTime);
            this.playing = true;

            this.interval = setInterval(function() {
                obj.currentTime += 0.2;

                if(!obj.sliding) {
                    obj.displayTime = obj.currentTime;
                }

                if(obj.currentTime > obj.duration) {
                    obj.reset();
                } else {
                    obj.updateInfos();
                }
            }, 200);
        }
    };

    this.pause = function() {
        clearInterval(this.interval);
        this.stop();
    };

    this.updateInfos = function() {
        var percPlaying = Math.round(this.displayTime / this.duration * 100);

        if(document.getElementById("timePlayingAudio") != null) document.getElementById("timePlayingAudio").innerHTML = ("0" + Math.trunc(this.displayTime / 60)).slice(-2) + ":" + ("0" + Math.trunc(this.displayTime % 60)).slice(-2);
        if(document.getElementById("totalTimePlayingAudio") != null) document.getElementById("totalTimePlayingAudio").innerHTML = ("0" + Math.trunc(this.duration / 60)).slice(-2) + ":" + ("0" + Math.trunc(this.duration % 60)).slice(-2);

        if(!this.sliding && sliderPlayAudio != undefined) {
            sliderPlayAudio.setValue(percPlaying, false, false);
        }

        compaMode();
    };
}

function TimerDownloadTime(id) {
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
// End classes

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

    compaMode();
}

function compaMode() {
    compaAudioAPI = document.getElementById("checkCompa").checked;

    if(!audioProcessing && !saveProcessing) {
        if(typeof(Worker) !== "undefined" && Worker != null) {
            if(compaAudioAPI && checkAudio != true) {
                setTooltip("saveInputModify", "Réactivez le son (décocher la case &laquo; Couper le son &raquo;) pour pouvoir enregistrer en mode de compatibilité.", true, false, "wrapperSave", true);
            } else {
                setTooltip("saveInputModify", null, false, true, "wrapperSave", true);
            }
        } else {
            setTooltip("saveInputModify", "Désolé, cette fonction est incompatible avec votre navigateur.", true, false, "wrapperSave", true);
        }
    }
}

function add(a, b) {
    return a + b;
}

function calcAudioDuration(audio, speed, pitch, reverb, vocode, echo) {
    var duration = audio.duration + 1;

    duration = duration / parseFloat(speed);
    if(reverb || echo) duration = duration + 5;

    return duration;
}

function getTelephonizer(context) {
    var lpf1 = context.createBiquadFilter();
    lpf1.type = "lowpass";
    lpf1.frequency.value = 2000.0;
    var lpf2 = context.createBiquadFilter();
    lpf2.type = "lowpass";
    lpf2.frequency.value = 2000.0;
    var hpf1 = context.createBiquadFilter();
    hpf1.type = "highpass";
    hpf1.frequency.value = 500.0;
    var hpf2 = context.createBiquadFilter();
    hpf2.type = "highpass";
    hpf2.frequency.value = 500.0;
    lpf1.connect(lpf2);
    lpf2.connect(hpf1);
    hpf1.connect(hpf2);
    currentEffectNode = lpf1;

    return {
        "input": lpf1,
        "output": hpf2
    };
}

function getDelay(context, delay, gain) {
    var delayNode = context.createDelay();
    delayNode.delayTime.value = delay;
    dtime = delayNode;

    var gainNode = context.createGain();
    gainNode.gain.value = gain;
    dregen = gainNode;

    gainNode.connect(delayNode);
    delayNode.connect(gainNode);

    return {
        "input": gainNode,
        "output": delayNode
    };
}

function getBitCrusher(context, bits, normFreq, bufferSize, channels) {
    var bitCrusher = context.createScriptProcessor(bufferSize, channels, channels);
    var phaser = 0;
    var last = 0;
    normFreq /= (context.sampleRate / 48000);

    bitCrusher.onaudioprocess = function(e) {
        var step = 2 * Math.pow(1 / 2, bits);

        for(var channel = 0; channel < e.inputBuffer.numberOfChannels; channel++) {
            var input = e.inputBuffer.getChannelData(channel);
            var output = e.outputBuffer.getChannelData(channel);

            for(var i = 0; i < bufferSize; i++) {
                phaser += normFreq;

                if(phaser >= 1.0) {
                    phaser -= 1.0;
                    last = step * Math.floor((input[i] * (1 / step)) + 0.5);
                }

                output[i] = last;
            }
        }
    };

    return bitCrusher;
}

function returnBuffer(buffer) {
    context.resume();

    var bufferReturned = context.createBuffer(2, context.sampleRate * buffer.duration + context.sampleRate * 2, context.sampleRate);

    for(var channel = 0; channel < buffer.numberOfChannels; channel++) {
        var nowBuffering = bufferReturned.getChannelData(channel);

        for(var i = 0; i < bufferReturned.length; i++) {
            nowBuffering[i] = buffer.getChannelData(channel)[buffer.length - 1 - i];
        }
    }

    bufferReturned.buffer = nowBuffering;

    return bufferReturned;
}

function passAll(audioProcessingEvent) {
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.outputBuffer;

    for(var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        var inp = inputBuffer.getChannelData(channel);
        var out = outputBuffer.getChannelData(channel);

        for(var sample = 0; sample < inputBuffer.length; sample++) {
            out[sample] = inp[sample];
        }
    }
}

function enableCompaMode() {
    document.getElementById("checkCompa").checked = true;
    document.getElementById("compatAutoDetected").style.display = "block";
    compaAudioAPI = true;
    compaMode();
}

function renderAudioAPI(audio, speed, pitch, reverb, save, play, audioName, comp, vocode, lowpass, highpass, bassboost, phone, returnAudioParam, echo, bitCrush, enableLimiter, rate, BUFFER_SIZE) {
  // Default parameters
  var speed = speed || 1; // Speed of the audio
  var pitch = pitch || 1; // Pitch of the audio
  var reverb = reverb == undefined ? false : reverb; // Enable or disable reverb
  var save = save == undefined ? false : save; // Save the audio buffer under a wav file
  var play = play == undefined ? false : play; // Play the audio
  var audioName = audioName || "sample"; // The audio buffer variable name (global)
  var comp = comp == undefined ? false : comp; // Enable or disable the compatibility mode
  var vocode = vocode == undefined ? false : vocode; // Enable or disable vocoder
  var lowpass = lowpass == undefined ? false : lowpass; // Enable lowPass filter
  var highpass = highpass == undefined ? false : highpass; // Enable highPass filter
  var bassboost = bassboost == undefined ? false : bassboost; // Enable Bass Boost
  var phone = phone == undefined ? false : phone; // Enable Phone Call
  var returnAudioParam = returnAudioParam == undefined ? false : returnAudioParam; // Enable Audio Return
  var enableLimiter = enableLimiter == undefined ? false : enableLimiter; // Enable Limiter
  var echo = echo == undefined ? false : echo; // Enable Echo
  var bitCrush = bitCrush == undefined ? false : bitCrush; // Enable BitCrusher
  var rate = rate || 1; // Rate of the audio
  var BUFFER_SIZE = BUFFER_SIZE || 4096; // Buffer size of the audio
  // End of default parameters

    if ('AudioContext' in window && !audioContextNotSupported) {
        var durationAudio = calcAudioDuration(audio, speed, pitch, reverb, vocode, echo);

        if(!comp && typeof(window.OfflineAudioContext) !== "undefined") {
            var offlineContext = new OfflineAudioContext(2, context.sampleRate * durationAudio, context.sampleRate);
        } else if(!comp && typeof(window.webkitOfflineAudioContext) !== "undefined") {
            var offlineContext = new webkitOfflineAudioContext(2, context.sampleRate * durationAudio, context.sampleRate);
        } else {
            var offlineContext = context;
        }

        if(typeof(window.OfflineAudioContext) === "undefined" && typeof(window.webkitOfflineAudioContext) === "undefined") {
            enableCompaMode();
            comp = true;
        }

        if(typeof(audio_impulse_response) == "undefined" || audio_impulse_response == null) reverb = false;
        if(typeof(audio_modulator) == "undefined" || audio_modulator == null) vocode = false;

        document.getElementById("processingModifLoader").style.display = "block";
        document.getElementById("validInputModify").disabled = true;
        document.getElementById("saveInputModify").disabled = true;
        audioProcessing = true;

        function renderAudio(buffer) {
            if(returnAudioParam) {
                buffer = returnBuffer(buffer);
            }

            var st = new soundtouch.SoundTouch(44100);
            st.pitch = pitch;
            st.tempo = speed;
            st.rate = rate;
            var filter = new soundtouch.SimpleFilter(new soundtouch.WebAudioBufferSource(buffer), st);
            var node = soundtouch.getWebAudioNode(offlineContext, filter);

            if(bitCrush) {
                var bitCrusher = getBitCrusher(offlineContext, 8.0, 0.15, BUFFER_SIZE, buffer.numberOfChannels);
                node.connect(bitCrusher);
                node = bitCrusher;
            }

            if(lowpass) {
                var lowPassFilter = offlineContext.createBiquadFilter();
                lowPassFilter.type = "lowpass";
                lowPassFilter.frequency.value = 3500;
            }

            if(highpass) {
                var highPassFilter = offlineContext.createBiquadFilter();
                highPassFilter.type = "highpass";
                highPassFilter.frequency.value = 3500;
            }

            if(bassboost) {
                var bassBoostFilter = offlineContext.createBiquadFilter();
                bassBoostFilter.type = "lowshelf";
                bassBoostFilter.frequency.value = 250;
                bassBoostFilter.gain.value = 15;
            }

            var limiterProcessor = offlineContext.createScriptProcessor(BUFFER_SIZE, buffer.numberOfChannels, buffer.numberOfChannels);

            if(!enableLimiter) {
                limiterProcessor.onaudioprocess = passAll;
            } else {
                var limiter = new Limiter(context.sampleRate);
                limiterProcessor.onaudioprocess = limiter.limit;
            }

            if(phone) {
                var tel = getTelephonizer(offlineContext);
            }

            var output = limiterProcessor;

            if(echo) {
                var delayFilter = getDelay(offlineContext, 0.20, 0.75);
                delayFilter["output"].connect(output);
                output = delayFilter["input"];
            }

            if(reverb) {
                convolver.buffer = audio_impulse_response;
                convolver.connect(output);
                output = convolver;
            }

            if(phone) {
                tel["output"].connect(output);
                output = tel["input"];
            }

            if(lowpass && highpass) {
                node.connect(lowPassFilter);
                lowPassFilter.connect(highPassFilter);

                if(bassboost) {
                    highPassFilter.connect(bassBoostFilter);
                    bassBoostFilter.connect(output);
                } else {
                    highPassFilter.connect(output);
                }
            } else if(lowpass) {
                node.connect(lowPassFilter);

                if(bassboost) {
                    lowPassFilter.connect(bassBoostFilter);
                    bassBoostFilter.connect(output);
                } else {
                    lowPassFilter.connect(output);
                }
            } else if(highpass) {
                node.connect(highPassFilter);

                if(bassboost) {
                    highPassFilter.connect(bassBoostFilter);
                    bassBoostFilter.connect(output);
                } else {
                    highPassFilter.connect(output);
                }
            } else {
                if(bassboost) {
                    node.connect(bassBoostFilter);
                    bassBoostFilter.connect(output);
                } else {
                    node.connect(output);
                }
            }

            if(!comp) {
                limiterProcessor.connect(offlineContext.destination);

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
                            enableCompaMode();
                        }

                        compatModeChecked = true;
                    }

                    if(play) {
                        launchPlay_click();
                    }

                    if(save) {
                        saveProcessing = true;
                        saveBuffer(e.renderedBuffer);
                        saveProcessing = false;
                    }
                };

                offlineContext.startRendering();
            } else {
                if(!save && !saveProcessing) {
                    document.getElementById("modify").disabled = false;
                    document.getElementById("validInputModify").disabled = false;
                    document.getElementById("processingModifLoader").style.display = "none";
                    audioProcessing = false;
                    compaMode();
                } else {
                    document.getElementById("processingModifLoader").style.display = "none";
                    document.getElementById("processingSave").style.display = "block";
                }

                if(play) {
                    limiterProcessor.connect(offlineContext.destination);
                    reloadAnimation();

                    if(save) {
                        var rec = new Recorder(limiterProcessor, { workerPath: "assets/js/recorderWorker.js" });

                        saveProcessing = true;
                        rec.record();

                        setTimeout(function() {
                            rec.stop();

                            rec.exportWAV(function(blob) {
                                downloadAudioBlob(blob);

                                document.getElementById("modify").disabled = false;
                                document.getElementById("validInputModify").disabled = false;
                                document.getElementById("processingSave").style.display = "none";
                                audioProcessing = false;
                                saveProcessing = false;
                                compaMode();
                            });
                        }, durationAudio * 1000);
                    }
                }
            }
        }

        if(reverb) var convolver = offlineContext.createConvolver();

        if(vocode && (typeof(window.OfflineAudioContext) !== "undefined" || typeof(window.webkitOfflineAudioContext) !== "undefined")) {
            if(typeof(window.OfflineAudioContext) !== "undefined") {
                var offlineContext2 = new OfflineAudioContext(2, context.sampleRate * durationAudio, context.sampleRate);
            } else if(typeof(window.webkitOfflineAudioContext) !== "undefined") {
                var offlineContext2 = new webkitOfflineAudioContext(2, context.sampleRate * durationAudio, context.sampleRate);
            }

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

function saveBuffer(buffer) {
    if(typeof(Worker) !== "undefined" && Worker != null) {
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
            downloadAudioBlob(e.data);
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

function downloadAudioBlob(e) {
    var fileName = filesDownloadName + "-" + new Date().toISOString() + ".wav";

    if(window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(e, fileName);
    } else {
        var blob = e;
        var a = document.createElement("a");
        var url = URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
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

    if(isNaN(tmp_interval) || tmp_interval == "" || tmp_interval <= 10 || tmp_interval > 2147483647) {
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
        if(document.getElementById("checkLowpass").checked == true) lowpassAudio = true; else lowpassAudio = false;
        if(document.getElementById("checkHighpass").checked == true) highpassAudio = true; else highpassAudio = false;
        if(document.getElementById("checkBassBoost").checked == true) bassboostAudio = true; else bassboostAudio = false;
        if(document.getElementById("checkPhone").checked == true) phoneAudio = true; else phoneAudio = false;
        if(document.getElementById("checkReturnAudio").checked == true) returnAudio = true; else returnAudio = false;
        if(document.getElementById("checkLimiter").checked == true) limiterAudio = true; else limiterAudio = false;
        if(document.getElementById("checkEcho").checked == true) echoAudio = true; else echoAudio = false;
        if(document.getElementById("checkBitCrusher").checked == true) bitCrusherAudio = true; else bitCrusherAudio = false;

        compaMode();

        if(compaAudioAPI) {
            if(checkAudio !== true || play !== true) {
                document.getElementById("modify").disabled = false;
                document.getElementById("validInputModify").disabled = false;
                reloadAnimation();
            }

            if(save) {
                renderAudioAPI(audio_principal_buffer, speedAudio, pitchAudio, reverbAudio, true, true, "audio_principal_processed", compaAudioAPI, vocoderAudio, lowpassAudio, highpassAudio, bassboostAudio, phoneAudio, returnAudio, echoAudio, bitCrusherAudio, limiterAudio);
            } else if(play) {
                launchPlay_click();
            }
        } else {
            renderAudioAPI(audio_principal_buffer, speedAudio, pitchAudio, reverbAudio, save, play, "audio_principal_processed", compaAudioAPI, vocoderAudio, lowpassAudio, highpassAudio, bassboostAudio, phoneAudio, returnAudio, echoAudio, bitCrusherAudio, limiterAudio);
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
            var bufferPlayer = new BufferPlayer();
            bufferPlayer.loadBuffer(audio_principal_processed);
            bufferPlayer.start();
            reloadAnimation();
        } else {
            renderAudioAPI(audio_principal_buffer, speedAudio, pitchAudio, reverbAudio, false, true, "audio_principal_processed", compaAudioAPI, vocoderAudio, lowpassAudio, highpassAudio, bassboostAudio, phoneAudio, returnAudio, echoAudio, bitCrusherAudio, limiterAudio);
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

function resetModify() {
    document.getElementById("checkReverb").checked = false;
    document.getElementById("checkEcho").checked = false;
    document.getElementById("checkVocode").checked = false;
    document.getElementById("checkLowpass").checked = false;
    document.getElementById("checkHighpass").checked = false;
    document.getElementById("checkBassBoost").checked = false;
    document.getElementById("checkPhone").checked = false;
    document.getElementById("checkReturnAudio").checked = false;
    document.getElementById("checkBitCrusher").checked = false;
    document.getElementById("checkLimiter").checked = true;
    slider.setValue(1.0);
    slider2.setValue(1.0);
}

function randomRange(min, max) {
    return ((Math.random() * max) + min).toFixed(1);
}

function randomBool() {
    return Math.round(Math.random()) == 0 ? false : true;
}

function randomModify() {
    var checkReverb = document.getElementById("checkReverb");
    var checkEcho = document.getElementById("checkEcho");
    var checkVocode = document.getElementById("checkVocode");
    var checkLowpass = document.getElementById("checkLowpass");
    var checkHighpass = document.getElementById("checkHighpass");
    var checkBassBoost = document.getElementById("checkBassBoost");
    var checkPhone = document.getElementById("checkPhone");
    var checkReturnAudio = document.getElementById("checkReturnAudio");
    var checkBitCrusher = document.getElementById("checkBitCrusher");

    if(!checkReverb.disabled) {
        checkReverb.checked = randomBool();
    }

    if(!checkEcho.disabled) {
        checkEcho.checked = randomBool();
    }

    if(!checkVocode.disabled) {
        checkVocode.checked = randomBool();
    }

    if(!checkLowpass.disabled) {
        checkLowpass.checked = randomBool();
    }

    if(!checkHighpass.disabled) {
        checkHighpass.checked = randomBool();
    }

    if(!checkBassBoost.disabled) {
        checkBassBoost.checked = randomBool();
    }

    if(!checkPhone.disabled) {
        checkPhone.checked = randomBool();
    }

    if(!checkReturnAudio.disabled) {
        checkReturnAudio.checked = randomBool();
    }

    if(!checkBitCrusher.disabled) {
        checkBitCrusher.checked = randomBool();
    }

    slider.setValue(randomRange(0.1, 5.0));
    slider2.setValue(randomRange(0.1, 5.0));
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

    var timerRemainingTime = new TimerDownloadTime("timerDownloadTime");
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
                if(typeof(audio_modulator) == "undefined" || audio_modulator == null || (typeof(window.OfflineAudioContext) === "undefined" && typeof(window.webkitOfflineAudioContext) === "undefined")) {
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
  loadAudioAPI(audioFileName, "audio_principal_buffer", function() {
    loadAudioAPI(audioArray[1], "audio_impulse_response", function() {
      loadAudioAPI(audioArray[2], "audio_modulator", function() {
        if(typeof(audio_impulse_response) == "undefined" || audio_impulse_response == null || typeof(audio_modulator) == "undefined" || audio_modulator == null) {
          document.getElementById("errorLoading").style.display = "block";
        }
      });
    });
  });
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
    if(document.readyState === 'complete') {
        init();
    }
};

// Do you like ponies ?
