setTimeout(function () {
    const base = Module.findBaseAddress("libil2cpp.so");
    if (!base) {
        console.log("libil2cpp.so not found");
        return;
    }

    const showQuote = base.add(0x16D1740);
    console.log("[+] ShowQuote @", showQuote);

    Interceptor.attach(showQuote, {
        onEnter() {
            console.log("[*] ShowQuote called");
        }
    });
}, 1000);
