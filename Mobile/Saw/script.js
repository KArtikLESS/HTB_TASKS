Java.perform(function() {
    // Значения из дампа
    var l = [0x0A, 0x0B, 0x18, 0x0F, 0x5E, 0x31, 0x0C, 0x0F];
    var m = [0x6C, 0x67, 0x28, 0x6E, 0x2A, 0x58, 0x62, 0x68];
    
    // Вычисляем пароль
    var password = "";
    for (var i = 0; i < 8; i++) {
        var xor_val = l[i] ^ m[i];
        password += String.fromCharCode(xor_val);
    }
    
    console.log("Password calculated:", password);
    
    // Хук основной функции
    var mainFunc = Module.findExportByName("libdefault.so", "_Z17_Z1aP7_JNIEnvP8_1PKcS0_");
    
    if (mainFunc) {
        Interceptor.attach(mainFunc, {
            onEnter: function(args) {
                console.log("Function called, injecting password:", password);
                // Подменяем пароль
                Memory.writeUtf8String(args[1], password);
            },
            onLeave: function(retval) {
                console.log("Function returned:", retval);
                if (retval == 1) {
                    console.log("SUCCESS! File should be created.");
                }
            }
        });
        
        console.log("Hook installed successfully!");
    } else {
        console.log("Function not found!");
    }
});