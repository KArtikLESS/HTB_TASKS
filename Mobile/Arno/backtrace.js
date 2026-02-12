var module = Process.findModuleByName("libgame.so");
if (module) {
    var functions = [
        "android_app_clear_key_events",
        "android_app_clear_motion_events"
    ];
    
    functions.forEach(function(funcName) {
        var func = module.findExportByName(funcName);
        if (func) {
            console.log("[+] Found:", funcName, "@", func);
            
            Interceptor.attach(func, {
                onEnter: function(args) {
                    console.log("\n[*]", funcName);
                    console.log("    Thread:", Process.getCurrentThreadId());
                    console.log("    Timestamp:", Date.now());
                    
                    console.log("    Backtrace:");
                    var trace = Thread.backtrace(this.context, Backtracer.ACCURATE)
                        .map(DebugSymbol.fromAddress)
                        .forEach(function(line) {
                            console.log("        ", line);
                        });
                }
            });
        }
    });
}