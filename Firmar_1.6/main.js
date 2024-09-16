    var index = "https://asistencia.xetid.cu/";
    var signed, intervalstatus, fail, failcount;
    var interval = 30000;
    function systemLog(log) {
        try {
            var date = new Date();
            var local = window.localStorage.getItem("xetid-extension-sign-log") ? JSON.parse(window.localStorage.getItem("xetid-extension-sign-log")) : [];
            if (local.length > 50)
                local = [];
            local.splice(0, 0, {date: date.toLocaleString(), log: log});
            window.localStorage.setItem("xetid-extension-sign-log", JSON.stringify(local));
        } catch (Exception) {
            throw Exception;
        }
    }
    function clearLogs() {
        try {
            window.localStorage.removeItem("xetid-extension-sign-log");
            failcount = null;
            chrome.browserAction.setBadgeText({text: ''});
            return failcount;
        } catch (Exception) {
            throw Exception;
        }
    }
    function signInOut(cb) {
        try {
            $.ajax({type: "POST", url: index + 'firmar.php', success: function (data) {
                    if (cb && typeof cb === 'function')
                        cb(data);
                    return data;
                }, error: function (XMLHttpRequest, textStatus, errorThrown) {
                    cb(false, {XMLHttpRequest: XMLHttpRequest, textStatus: textStatus, errorThrown: errorThrown});
                }});
        } catch (Exception) {
            throw Exception;
        }
    }
    function logOut(cb) {
        try {
            $.ajax({type: "POST", url: index + 'logout.php', success: function (data) {
                    if (cb && typeof cb === 'function')
                        cb(data);
                    return data;
                }, error: function (XMLHttpRequest, textStatus, errorThrown) {
                    cb(false, {XMLHttpRequest: XMLHttpRequest, textStatus: textStatus, errorThrown: errorThrown});
                }});
        } catch (e) {
            throw e;
        }
    }
    function logIn(user, pass, cb) {
        try {
            $.ajax({type: "POST", url: index + 'app.php', data: {'l-form-username': user, 'l-form-password': pass}, success: function (data) {
                    if (cb && typeof cb === 'function')
                        cb(true, data);
                    return data;
                }, error: function (XMLHttpRequest, textStatus, errorThrown) {
                    cb(false, {XMLHttpRequest: XMLHttpRequest, textStatus: textStatus, errorThrown: errorThrown});
                }});
        } catch (e) {
            throw e;
        }
    }
    function getEntradaSalida() {
        try {
            var entrada = window.localStorage.getItem("xetid-extension-sign-begin-gen") ? window.localStorage.getItem("xetid-extension-sign-begin-gen") : window.localStorage.getItem("xetid-extension-sign-begin");
            if (entrada) {
                var ent = entrada.split(":");
                entrada = new Date();
                entrada.setHours(ent[0]);
                entrada.setMinutes(ent[1]);
            }
            var salida = window.localStorage.getItem("xetid-extension-sign-end-gen") ? window.localStorage.getItem("xetid-extension-sign-end-gen") : window.localStorage.getItem("xetid-extension-sign-end");
            if (salida) {
                var sal = salida.split(":");
                salida = new Date();
                salida.setHours(sal[0]);
                salida.setMinutes(sal[1]);
            }
            return{entrada: entrada, salida: salida};
        } catch (Exception) {
            throw Exception;
        }
    }
    function generateNextEnt() {
        if (window.localStorage.getItem("xetid-extension-sign-randomize-ent")) {
            var next = generateNext(window.localStorage.getItem("xetid-extension-sign-randomize-ent"), window.localStorage.getItem("xetid-extension-sign-begin"));
            window.localStorage.setItem("xetid-extension-sign-begin-gen", next.time);
            systemLog("Siguiente entrada programada " + next.time);
            return next.datetime;
        } else
            window.localStorage.removeItem("xetid-extension-sign-begin-gen");
        return null;
    }
    function generateNextSal() {
        if (window.localStorage.getItem("xetid-extension-sign-randomize-sal")) {
            var next = generateNext(window.localStorage.getItem("xetid-extension-sign-randomize-sal"), window.localStorage.getItem("xetid-extension-sign-end"));
            window.localStorage.setItem("xetid-extension-sign-end-gen", next.time);
            systemLog("Siguiente salida programada " + next.time);
            return next.datetime;
        } else
            window.localStorage.removeItem("xetid-extension-sign-end-gen");
        return null;
    }
    function generateNext(randomize, hour) {
        try {
            if (randomize) {
                var max = parseInt(randomize);
                if (!isNaN(max)) {
                    var randMin = Math.floor(Math.random() * max);
                    var generatorDate = new Date();
                    if (hour) {
                        var initial = hour.split(":");
                        generatorDate.setHours(initial[0]);
                        generatorDate.setMinutes(Boolean(Math.floor(Math.random() * 2)) ? parseInt(initial[1]) + randMin : parseInt(initial[1]) - randMin);
                    }
                    return {
                        datetime: generatorDate,
                        time: generatorDate.getHours() + ":" + generatorDate.getMinutes()
                    };
                }
            }
            return;
        } catch (Exception) {
            throw Exception;
        }
    }
    function isLaborable(fecha) {
        try {
            if (window.localStorage.getItem("xetid-extension-sign-daysofweek")) {
                var wwd = JSON.parse(window.localStorage.getItem("xetid-extension-sign-daysofweek"));
                return wwd.indexOf(fecha.getUTCDay().toString()) >= 0;
            } else
                return!1;
        } catch (Exception) {
            throw Exception;
        }
    }
    function intervalEject() {
        try {
            if (window.localStorage.getItem("xetid-extension-sign")) {
                var horaInicio = new Date();
                if (isLaborable(horaInicio)) {
                    var entradasalida = getEntradaSalida(), horaFin = new Date();
                    horaFin.setMinutes(horaInicio.getMinutes() + 2);
                    var entrada = (fail && fail.entrada) || entradasalida.entrada && entradasalida.entrada < horaFin && entradasalida.entrada > horaInicio;
                    var salida = (fail && fail.salida) || entradasalida.salida && entradasalida.salida < horaFin && entradasalida.salida > horaInicio;
                    if (!signed && (entrada || salida)) {
                        var decript = Base64.decode(window.localStorage.getItem("xetid-extension-sign"));
                        var decript = decript.split("<~>");
                        logIn(decript[0], decript[1], function (success, logd) {
                            if (success && logd) {
                                var validation = {loguin: logd.search('href="logout.php"') > 0, entradafirmada: logd.search('<a class="btn btn-danger btn-lg disabled" href="firmar.php">Firmar Entrada</a>') > 0, salidafirmada: logd.search('<a class="btn btn-danger btn-lg disabled" href="firmar.php">Firmar Salida</a>') > 0};
                                if (validation.loguin) {
                                    systemLog("Logueando usuario.");
                                    if ((entrada && !validation.entradafirmada) || (salida && !validation.salidafirmada)) {
                                        signInOut(function () {
                                            systemLog("Firmando " + (entrada ? "entrada." : "salida."));
                                            logOut(function () {
                                                if (entrada)
                                                    signed = generateNextEnt();
                                                else
                                                    signed = generateNextSal();
                                                signed = signed ? signed : new Date(), fail = null;
                                                if (!failcount) {
                                                    chrome.browserAction.setBadgeBackgroundColor({color: "#4285F4"});
                                                    chrome.browserAction.setBadgeText({text: '*'});
                                                }
                                                systemLog("Deslogueando usuario.");
                                            });
                                        });
                                    } else {
                                        systemLog("Ya se ha firmado.");
                                        logOut(function () {
                                            signed = new Date(), fail = null;
                                            systemLog("Deslogueando usuario.");
                                        });
                                    }
                                } else {
                                    signed = new Date(), fail = null;
                                    systemLog("Usuario o contraseña incorrectos.");
                                    failcount = failcount ? failcount + 1 : 1;
                                    chrome.browserAction.setBadgeBackgroundColor({color: "red"});
                                    chrome.browserAction.setBadgeText({text: String(failcount)});
                                    return;
                                }
                            } else if (logd) {
                                signed = null, fail = window.localStorage.getItem("xetid-extension-sign-itin") == 'true' ? {
                                    entrada: entrada,
                                    salida: salida
                                } : null;
                                failcount = failcount ? failcount + 1 : 1;
                                chrome.browserAction.setBadgeBackgroundColor({color: "red"});
                                chrome.browserAction.setBadgeText({text: String(failcount)});
                                systemLog('Error al conectar.');
                            }
                        });
                    }
                    if (!entrada && !salida && signed && signed < horaInicio)
                        signed = fail = null;
                }
            } else
                throw{textStatus: 'Usuario o contraseña no definidos', errorThrown: 255};
        } catch (e) {
            throw e;
        }
    }
    function togleInterval(start) {
        try {
            if (start && !intervalstatus) {
                intervalstatus = setInterval(intervalEject, interval);
                systemLog("Servicio iniciado.");
            } else if (!start && intervalstatus) {
                clearInterval(intervalstatus);
                intervalstatus = signed = fail = null;
                systemLog("Servicio detenido.");
            }
            return Boolean(intervalstatus);
        } catch (e) {
            console.error(e);
        }
    }
    
		chrome.runtime.onInstalled.addListener(() => {
			chrome.storage.local.set({
				name: "Rey"
			});
		}); 

		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
				chrome.scripting.insertCSS({
					target: { tabId: tabId },
					files: ["./foreground_styles.css"]
				})
					.then(() => {
						console.log("INJECTED THE FOREGROUND STYLES.");

						chrome.scripting.executeScript({
							target: { tabId: tabId },
							files: ["./foreground.js"]
						})
							.then(() => {
								console.log("INJECTED THE FOREGROUND SCRIPT.");
							});
					})
					.catch(err => console.log(err));
			}
		});
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            switch (request.funct) {
                case "myTogleFunc":
                case "toglefunction":
                    var status = togleInterval(request.status);
                    sendResponse({status: status, message: request.status !== status ? 'Service togled.' : 'Fail.'});
                    break;
                case "startService":
                    var status = togleInterval(true);
                    sendResponse({status: status, message: status ? 'Service started.' : 'Fail.'});
                    break;
                case "stopService":
                    var status = togleInterval(false);
                    sendResponse({status: status, message: !status ? 'Service stoped.' : 'Fail.'});
                    break;
                case "clearLogs":
                    sendResponse({fails: clearLogs()});
                    break;
                case "generateNextEnt":
                    generateNextEnt();
                    sendResponse({success: true});
                    break;
                case "generateNextSal":
                    generateNextSal();
                    sendResponse({success: true});
                    break;
                case "systemLog":
                    systemLog(request.log);
                    sendResponse({success: true});
                    break;
                default:
                    sendResponse({error: !0, message: 'Undefined function.'});
                    console.error({textStatus: 'Call to undefined function.', errorThrown: 204});
                    break
                    
                    
				if (chrome.runtime.lastError) {
					sendResponse({
						error: !0,
						message: 'fail'
					});
					return;
				}
				
				return true;
            }
        });
        if (window.localStorage.getItem("xetid-extension-sign-starttogle"))
            togleInterval(true);
