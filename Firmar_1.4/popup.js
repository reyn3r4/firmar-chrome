$(function () {
    var decript = null;
    var init = function () {
        if (window.localStorage.getItem("xetid-extension-sign")) {
            decript = Base64.decode(window.localStorage.getItem("xetid-extension-sign"));
            decript = decript.split("<~>");
            if (decript[0])
                $("input[name=l-form-username]").val(decript[0]);
            if (decript[1])
                $("input[name=l-form-password]").val(decript[1]);
        }
        if (window.localStorage.getItem("xetid-extension-sign-daysofweek")) {
            var dofweek = JSON.parse(window.localStorage.getItem("xetid-extension-sign-daysofweek"));
            $.each($("input[name='dow']"), function () {
                $(this).prop('checked', dofweek.indexOf($(this).val().toString()) >= 0);
            });
        }
        if (window.localStorage.getItem("xetid-extension-sign-itin"))
            $("#sign-it").prop('checked', window.localStorage.getItem("xetid-extension-sign-itin") == 'true');
        if (window.localStorage.getItem("xetid-extension-sign-begin"))
            $("input[name=entrada]").val(window.localStorage.getItem("xetid-extension-sign-begin"));
        if (window.localStorage.getItem("xetid-extension-sign-end"))
            $("input[name=salida]").val(window.localStorage.getItem("xetid-extension-sign-end"));
        if (window.localStorage.getItem("xetid-extension-sign-randomize-ent"))
            $("input[name=randomize-ent]").val(window.localStorage.getItem("xetid-extension-sign-randomize-ent"));
        if (window.localStorage.getItem("xetid-extension-sign-randomize-sal"))
            $("input[name=randomize-sal]").val(window.localStorage.getItem("xetid-extension-sign-randomize-sal"));
        if (window.localStorage.getItem("xetid-extension-sign-starttogle")) {
            $("#toglestart").html("<i uk-icon=\"icon: stop\"></i>");
            $("#togleclock").css({'color': '#666'});
        } else {
            $("#toglestart").html("<i uk-icon=\"icon: play\"></i>");
            $("#togleclock").css({'color': 'rgb(93, 185, 98)'});
        }
        $("#form-sign").change(function () {
            if (formisvalid() && formisditry())
                $("#savechanges").removeAttr("disabled");
            else
                $("#savechanges").attr("disabled", true);
        });
        $("#savechanges").click(function () {
            decript = [$("input[name=l-form-username]").val(), $("input[name=l-form-password]").val()];
            var enccript = Base64.encode(decript[0] + "<~>" + decript[1]);
            window.localStorage.setItem("xetid-extension-sign", enccript);
            var wwd = [];
            $.each($("input[name='dow']:checked"), function () {
                wwd.push($(this).val());
            });
            window.localStorage.setItem("xetid-extension-sign-daysofweek", JSON.stringify(wwd));

            var entrada = $("input[name=entrada]").val();
            if (entrada !== window.localStorage.getItem("xetid-extension-sign-begin") || $("input[name=randomize-ent]").val() !== window.localStorage.getItem("xetid-extension-sign-randomize-ent")) {
                window.localStorage.setItem("xetid-extension-sign-begin", entrada ? entrada : null);
                var randomize = parseInt($("input[name=randomize-ent]").val());
                if (isNaN(randomize) || randomize < 1)
                    window.localStorage.removeItem("xetid-extension-sign-randomize-ent");
                else if ($("input[name=randomize-ent]").val() !== window.localStorage.getItem("xetid-extension-sign-randomize-ent"))
                    window.localStorage.setItem("xetid-extension-sign-randomize-ent", randomize);
                chrome.extension.sendMessage({funct: "generateNextEnt"}, function () {
                    loadLogs();
                });
            }
            var salida = $("input[name=salida]").val();
            if (salida !== window.localStorage.getItem("xetid-extension-sign-end") || $("input[name=randomize-sal]").val() !== window.localStorage.getItem("xetid-extension-sign-randomize-sal")) {
                var randomize = parseInt($("input[name=randomize-sal]").val());
                window.localStorage.setItem("xetid-extension-sign-end", salida ? salida : null);
                if (isNaN(randomize) || randomize < 1)
                    window.localStorage.removeItem("xetid-extension-sign-randomize-sal");
                else if ($("input[name=randomize-sal]").val() !== window.localStorage.getItem("xetid-extension-sign-randomize-sal"))
                    window.localStorage.setItem("xetid-extension-sign-randomize-sal", randomize);
                chrome.extension.sendMessage({funct: "generateNextSal"}, function () {
                    loadLogs();
                });
            }
            $(this).attr("disabled", true);
            systemLog("Cambios guardados.");
        });
        $("#toglestart").click(function () {
            if (window.localStorage.getItem("xetid-extension-sign-starttogle"))
                chrome.extension.sendMessage({funct: "stopService"}, function (response) {
                    if (!response.status) {
                        window.localStorage.removeItem("xetid-extension-sign-starttogle");
                        $("#toglestart").html("<i uk-icon=\"icon: play\"></i>");
                        $("#togleclock").css({'color': 'rgb(93, 185, 98)'});
                    }
                    loadLogs();
                });
            else if (window.localStorage.getItem("xetid-extension-sign") && (window.localStorage.getItem("xetid-extension-sign-begin") || window.localStorage.getItem("xetid-extension-sign-end"))) {
                chrome.extension.sendMessage({funct: "startService"}, function (response) {
                    if (response.status) {
                        window.localStorage.setItem("xetid-extension-sign-starttogle", !0);
                        $("#toglestart").html("<i uk-icon=\"icon: stop\"></i>");
                        $("#togleclock").css({'color': '#666'});
                    }
                    loadLogs();
                });
            }
        });
        $("#clearlogs").click(function () {
            clearLogs();
        });
        $("#sign-it").change(function () {
            window.localStorage.setItem("xetid-extension-sign-itin", $(this).is(':checked'));
        });
        loadLogs();
    };
    var systemLog = function (log) {
        chrome.extension.sendMessage({funct: "systemLog", log: log}, function (response) {
            loadLogs();
        });
    };
    var clearLogs = function () {
        chrome.extension.sendMessage({funct: "clearLogs"}, function (response) {
            loadLogs();
        });
    };
    var loadLogs = function () {
        $("#logs").empty();
        if (window.localStorage.getItem("xetid-extension-sign-log")) {
            var logs = JSON.parse(window.localStorage.getItem("xetid-extension-sign-log"));
            for (var i in logs)
                $("#logs").append("<p class=\"p-log\"><i class=\"date-log\">" + logs[i].date + "</i> " + logs[i].log + "</p>");
        }
    };
    var daysChanged = function () {
        if (window.localStorage.getItem("xetid-extension-sign-daysofweek")) {
            var dofweek = JSON.parse(window.localStorage.getItem("xetid-extension-sign-daysofweek"));
            var res = false;
            $.each($("input[name='dow']"), function () {
                if ($(this).prop('checked')) {
                    if (dofweek.indexOf($(this).val()) < 0) {
                        res = true;
                        return true;
                    }
                } else if (dofweek.indexOf($(this).val()) >= 0) {
                    res = true;
                    return true;
                }
            });
            return res;
        } else
            return true;
    };
    var loguinchange = function () {
        var user = $("input[name=l-form-username]").val();
        var pass = $("input[name=l-form-password]").val();
        return user && user.trim() && pass && pass.trim() && (decript && ((decript[0] && user !== decript[0]) || (decript[1] && pass !== decript[1])));
    };
    var formisditry = function () {
        return(window.localStorage.getItem("xetid-extension-sign-begin") ? window.localStorage.getItem("xetid-extension-sign-begin") !== $("input[name=entrada]").val() : $("input[name=entrada]").val() !== '') || (window.localStorage.getItem("xetid-extension-sign-end") ? window.localStorage.getItem("xetid-extension-sign-end") !== $("input[name=salida]").val() : $("input[name=salida]").val() !== '') || daysChanged() || (window.localStorage.getItem("xetid-extension-sign-randomize-ent") ? window.localStorage.getItem("xetid-extension-sign-randomize-ent") !== $("input[name=randomize-ent]").val() : $("input[name=randomize-ent]").val() !== '') || (window.localStorage.getItem("xetid-extension-sign-randomize-sal") ? window.localStorage.getItem("xetid-extension-sign-randomize-sal") !== $("input[name=randomize-sal]").val() : $("input[name=randomize-sal]").val() !== '') || loguinchange();
    };
    var formisvalid = function () {
        var valid = true;
        var usuario = $("input[name=l-form-username]").val();
        var password = $("input[name=l-form-password]").val();
        if (usuario && usuario.trim())
            $("input[name=l-form-username]").removeClass("uk-form-danger");
        else {
            $("input[name=l-form-username]").addClass("uk-form-danger");
            $("input[name=l-form-username]").attr("placeholder", 'Campo obligatorio.');
            valid = false;
        }
        if (password && password.trim())
            $("input[name=l-form-password]").removeClass("uk-form-danger");
        else {
            $("input[name=l-form-password]").addClass("uk-form-danger");
            $("input[name=l-form-password]").attr("placeholder", 'Campo obligatorio.');
            valid = false;
        }
        var entrada = $("input[name=entrada]").val();
        var salida = $("input[name=salida]").val();
        if (entrada && entrada.trim() && salida && salida.trim()) {
            var ent = entrada.split(":");
            entrada = new Date();
            entrada.setHours(ent[0]);
            entrada.setMinutes(ent[1]);
            var sal = salida.split(":");
            salida = new Date();
            salida.setHours(sal[0]);
            salida.setMinutes(sal[1]);
            if (entrada >= salida) {
                $("input[name=entrada]").addClass("uk-form-danger");
                $("input[name=salida]").addClass("uk-form-danger");
                valid = false;
            } else {
                $("input[name=entrada]").removeClass("uk-form-danger");
                $("input[name=salida]").removeClass("uk-form-danger");
            }
        } else {
            $("input[name=entrada]").removeClass("uk-form-danger");
            $("input[name=salida]").removeClass("uk-form-danger");
        }
        var randomize = parseInt($("input[name=randomize-ent]").val());
        if (!isNaN(randomize) && (randomize < 0 || randomize > 30)) {
            $("input[name=randomize-ent]").addClass("uk-form-danger");
            valid = false;
        } else {
            $("input[name=randomize-ent]").removeClass("uk-form-danger");
        }
        randomize = parseInt($("input[name=randomize-sal]").val());
        if (!isNaN(randomize) && (randomize < 0 || randomize > 30)) {
            $("input[name=randomize-sal]").addClass("uk-form-danger");
            valid = false;
        } else {
            $("input[name=randomize-sal]").removeClass("uk-form-danger");
        }
        return valid;
    };
    init();
});