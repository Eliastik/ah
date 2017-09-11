// Pure JS. No Jquery.
var nb_ah = 0;
var timeout = 0;
var interval = 0;
var speedAudio = 1;
var pitchAudio = 1;
var playFromAPI = false;
var img_ah_src = "assets/img/ah.gif";
document.getElementById("checkFull").checked = false;
var repetitionInterval = 500;
var imgArray = ['assets/img/ah.gif', 'assets/img/ah_full.gif'];
var audioArray = ['assets/sounds/ah.mp3'];

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

/* https://peteris.rocks/blog/web-audio-api-playback-rate-preserve-pitch/ */
function playAudioAPI(audio, speed = 1, pitch = 1, rate = 1, BUFFER_SIZE = 1024) {
    if ('AudioContext' in window) {
        var st = new SoundTouch(true);
        st.pitch = pitch;
        st.tempo = speed;
        st.rate = rate;

        var context = new AudioContext();
        var buffer;

        var request = new XMLHttpRequest();
        request.open('GET', audio, true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            context.decodeAudioData(request.response, function(data) {
                buffer = data;
                node.connect(context.destination);

                var source = {
                    extract: function (target, numFrames, position) {
                        var l = buffer.getChannelData(0);
                        var r = buffer.getChannelData(1);
                        for (var i = 0; i < numFrames; i++) {
                            target[i * 2] = l[i + position];
                            target[i * 2 + 1] = r[i + position];
                        }
                        return Math.min(numFrames, l.length - position);
                    }
                };

                f = new SimpleFilter(source, st);
            })
        }

        request.send();

        var samples = new Float32Array(BUFFER_SIZE * 2);
        var node = context.createScriptProcessor(BUFFER_SIZE, 2, 2);

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
    } else {
        console.error("Web Audio API not supported by this browser.");
        return false;
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

function validModify() {
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
        ah_click();
        return true;
    }

    return false;
}

function ah() {
    if(checkAudio && playFromAPI == false) {
        var ah = new Audio();
        ah.src = "assets/sounds/ah.mp3";
    }
    nb_ah = nb_ah + 1;
    document.getElementById("ah_img").src = "#";
    document.getElementById("ah_img").src = img_ah_src;
    document.getElementById("ah_img").title = "Cliquez ici !";
    
    if(checkAudio && !'AudioContext' in window) {
        ah.play();
    } else if(checkAudio && 'AudioContext' in window && playFromAPI) {
        playAudioAPI(audioArray[0], speedAudio, pitchAudio);
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
