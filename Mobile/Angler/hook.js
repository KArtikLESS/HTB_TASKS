Interceptor.attach(Module.findExportByName(null, "strcmp"), {
    onEnter: function (args) {
        try {
            const s1 = args[0].readCString();
            const s2 = args[1].readCString();

            if (s1.length > 0 && s2.length > 0) {
                console.log("[strcmp]");
                console.log("  arg1:", s1);
                console.log("  arg2:", s2);
            }
        } catch (e) {}
    }
});
