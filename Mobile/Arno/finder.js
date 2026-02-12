// ===== GLOBAL =====
var flagControlInstance = null;
var alreadyDone = false;

// ===== MAIN =====
setTimeout(function () {
    const base = Module.findBaseAddress("libil2cpp.so");
    if (!base) {
        console.log("libil2cpp.so not found");
        return;
    }

    const showQuote = base.add(0x16D1740);
    console.log("[+] ShowQuote @", showQuote);

    Interceptor.attach(showQuote, {
        onEnter(args) {
            if (alreadyDone) return;

            flagControlInstance = args[0];
            console.log("[+] FlagControl instance =", flagControlInstance);

            // === CALL FLAG LOGIC IMMEDIATELY ===
            try {
                function fn(offset, ret, args) {
                    return new NativeFunction(base.add(offset), ret, args);
                }

                const GetKey  = fn(0x16D1838, "pointer", ["pointer"]);
                const GetIV   = fn(0x16D18A8, "pointer", ["pointer"]);
                const GetFlag = fn(0x16D1918, "pointer", ["pointer"]);

                const Decrypt = fn(
                    0x16D1988,
                    "pointer",
                    ["pointer", "pointer", "pointer", "pointer"]
                );

                const key  = GetKey(flagControlInstance);
                const iv   = GetIV(flagControlInstance);
                const enc  = GetFlag(flagControlInstance);

                const res = Decrypt(flagControlInstance, key, iv, enc);

                const len = Memory.readU32(res.add(0x10));
                const txt = Memory.readUtf16String(res.add(0x14), len);

                console.log("\nFLAG:\n" + txt + "\n");

                alreadyDone = true;

            } catch (e) {
                console.log("Error:", e);
            }
        }
    });

}, 1000);
