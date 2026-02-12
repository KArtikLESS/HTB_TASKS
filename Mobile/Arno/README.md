# Название задания: Arno
Автор: KArtikLESS
## Описание задания:
Arno Dorian is known for his memorable quotes, but he also has a knack for letting his sharp tongue get him into trouble, often saying the wrong thing at the worst possible moments. Can you make him say the magic words?
## Ссылка на задание:
https://app.hackthebox.com/challenges/Arno
# Решение:
Для решения этого задания необходимо скачать файл Arno.zip, который содержит необходимый для исследования .apk файл.

Команда для распаковки:
> unzip Arno.zip

Данное приложение затем запускается на эмуляторе в AndroidStudio. Для этого необходимо открыть студию и выбрать вкладку `Profile or Debug APK`.
Выбранный эмулятор: Pixel 3a API 29.

Однако здесь сразу стоит отметить, что при анализе приложения потребуется динамически подключаться к библиотекам ARM (libgame.so, libil2cpp.so), что не получалось сделать с помощью эмулятора в AndroidStudio, так как железо не позволяло запускать эмуляторы архитектуры отличающиеся от x86/x64. Используемый фреймворк `frida` просто не видел загруженные в память приложения библиотеки для анализа. Перехват функционала был невозможен.
\
\
Поэтому далее было принято решение использовать настоящий девайс: Redmi note 9S. Для начала на нём необходимо было получить рут права. Для этого можно следовать инструкциям из следующей статьи: https://root-device.com/root-prava/xiaomi/617-xiaomi-redmi-note-9s.html.
\
После получения рут прав можно было запустить приложение и ознакомиться с его интерфейсом.

> Интерфейс исследуемого приложения:

![photo_2026-02-12_11-59-56](https://github.com/user-attachments/assets/2a1ee682-f2b6-479f-a86a-bde5f2b33bc7)

При нажатии на кнопку `Show Quote` появлялось сообщение в графе с цитатами. Из задания было понятно то, что необходимо каким-то образом выявить логику генерации этих цитат, чтобы получить необходимый ключ-цитату.

## Статический анализ приложения:
Для декомпиляции .apk файла можно использовать приложение JADX. Файл манифеста дал понять, что данное приложение написано на движке Unity. Также об этом говорил набор нативных библиотек. Отсюда было выдвинуто предположение, что основная логика хранится где-то в нативной части приложения.

> Файл манифеста приложения:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0"
    android:installLocation="preferExternal"
    android:compileSdkVersion="35"
    android:compileSdkVersionCodename="15"
    package="com.Z4ki.Arno"
    platformBuildVersionCode="35"
    platformBuildVersionName="15">
    <uses-sdk
        android:minSdkVersion="23"
        android:targetSdkVersion="35"/>
    <supports-screens
        android:anyDensity="true"
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-feature android:glEsVersion="0x30000"/>
    <uses-feature
        android:name="android.hardware.vulkan.version"
        android:required="false"/>
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false"/>
    <uses-feature
        android:name="android.hardware.touchscreen.multitouch"
        android:required="false"/>
    <uses-feature
        android:name="android.hardware.touchscreen.multitouch.distinct"
        android:required="false"/>
    <permission
        android:name="com.Z4ki.Arno.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
        android:protectionLevel="signature"/>
    <uses-permission android:name="com.Z4ki.Arno.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/>
    <application
        android:label="@string/app_name"
        android:icon="@mipmap/app_icon"
        android:extractNativeLibs="true"
        android:appComponentFactory="androidx.core.app.CoreComponentFactory"
        android:enableOnBackInvokedCallback="false">
        <meta-data
            android:name="unity.splash-mode"
            android:value="0"/>
        <meta-data
            android:name="unity.splash-enable"
            android:value="true"/>
        <meta-data
            android:name="unity.launch-fullscreen"
            android:value="true"/>
        <meta-data
            android:name="unity.render-outside-safearea"
            android:value="true"/>
        <meta-data
            android:name="notch.config"
            android:value="portrait|landscape"/>
        <meta-data
            android:name="unity.auto-report-fully-drawn"
            android:value="true"/>
        <meta-data
            android:name="unity.auto-set-game-state"
            android:value="true"/>
        <meta-data
            android:name="unity.strip-engine-code"
            android:value="true"/>
        <activity
            android:theme="@style/BaseUnityGameActivityTheme"
            android:name="com.unity3d.player.UnityPlayerGameActivity"
            android:enabled="true"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="fullUser"
            android:configChanges="fontScale|layoutDirection|density|smallestScreenSize|screenSize|uiMode|screenLayout|orientation|navigation|keyboardHidden|keyboard|touchscreen|locale|mnc|mcc"
            android:hardwareAccelerated="false"
            android:resizeableActivity="true">
            <intent-filter>
                <category android:name="android.intent.category.LAUNCHER"/>
                <action android:name="android.intent.action.MAIN"/>
            </intent-filter>
            <meta-data
                android:name="unityplayer.UnityActivity"
                android:value="true"/>
            <meta-data
                android:name="android.app.lib_name"
                android:value="game"/>
            <meta-data
                android:name="WindowManagerPreference:FreeformWindowSize"
                android:value="@string/FreeformWindowSize_maximize"/>
            <meta-data
                android:name="WindowManagerPreference:FreeformWindowOrientation"
                android:value="@string/FreeformWindowOrientation_landscape"/>
            <meta-data
                android:name="notch_support"
                android:value="true"/>
        </activity>
        <provider
            android:name="androidx.startup.InitializationProvider"
            android:exported="false"
            android:authorities="com.Z4ki.Arno.androidx-startup">
            <meta-data
                android:name="androidx.emoji2.text.EmojiCompatInitializer"
                android:value="androidx.startup"/>
            <meta-data
                android:name="androidx.lifecycle.ProcessLifecycleInitializer"
                android:value="androidx.startup"/>
        </provider>
    </application>
</manifest>
```

> Нативные библиотеки:
<img width="412" height="210" alt="image" src="https://github.com/user-attachments/assets/c9d2070e-d987-48cc-9f58-9aa12a908bcf" />


Анализ Java-кода не дал какого-то представления о генерации цитат или их хаотическом выборе, соответственно оставался вариант изучения нативных библиотек.

## Динамический анализ приложения:
Для динамического анализа использовался фреймворк `frida` как упоминалось ранее. Сначала было проведено исследование с помощью `frida-trace` для отслеживания того, какие функции могут использоваться при нажатии на кнопку генерации цитат в приложении. Команда представлена ниже:

> frida-trace -U -n Arno -i "*click*" -i "*button*" -i "*touch*" -i "*tap*" -i "*press*" -i "*event*" -i "*quote*"
```xml
  6493 ms  android_app_clear_key_events()
  6493 ms  android_app_clear_motion_events()
  6526 ms  android_app_clear_key_events()
  6526 ms  android_app_clear_motion_events()
 11038 ms  android_app_clear_key_events()
 11038 ms  android_app_clear_motion_events()
 11071 ms  android_app_clear_key_events()
 11071 ms  android_app_clear_motion_events()
 11104 ms  android_app_clear_key_events()
 11104 ms  android_app_clear_motion_events()
```
\
Трассировка дала понять, что происходит вызов стандртных методов, которые являются частью Android NDK (Native Development Kit). Однако можно написать скрипт `backtrace.js`, который позволяет выполнить backtrace вызовов, чтобы понять, какие методы использовались выше по стеку вызовов.

```xml
[+] Found: android_app_clear_key_events @ 0x72e8eb0f0c
[+] Found: android_app_clear_motion_events @ 0x72e8eb0e84
[Redmi Note 9S::Arno ]->
[*] android_app_clear_key_events
    Thread: 30164
    Timestamp: 1770809747303
    Backtrace:
         0x72e8eabfe0 libgame.so!_ZN5Unity16UnityApplication16CleanInputEventsEv+0x20
         0x72e8ea9134 libgame.so!_ZN5Unity16UnityApplication12ProcessFrameEv+0x50
         0x72e8ea9338 libgame.so!_ZN5Unity16UnityApplication4LoopEv+0x194
         0x72e8eabc84 libgame.so!_Z8MainLoopP11android_app+0x40
         0x72e8eabd50 libgame.so!android_main+0x9c
         0x72e8eb2328 libgame.so!0x1d328
         0x73914f7df8 libc.so!_ZL15__pthread_startPv+0x10c
         0x7391494640 libc.so!__start_thread+0x48
         0x7391494640 libc.so!__start_thread+0x48

[*] android_app_clear_motion_events
    Thread: 30164
    Timestamp: 1770809748464
    Backtrace:
         0x72e8eabfe8 libgame.so!_ZN5Unity16UnityApplication16CleanInputEventsEv+0x28
         0x72e8ea9134 libgame.so!_ZN5Unity16UnityApplication12ProcessFrameEv+0x50
         0x72e8ea9338 libgame.so!_ZN5Unity16UnityApplication4LoopEv+0x194
         0x72e8eabc84 libgame.so!_Z8MainLoopP11android_app+0x40
         0x72e8eabd50 libgame.so!android_main+0x9c
         0x72e8eb2328 libgame.so!0x1d328
         0x73914f7df8 libc.so!_ZL15__pthread_startPv+0x10c
         0x7391494640 libc.so!__start_thread+0x48
         0x7391494640 libc.so!__start_thread+0x48

[*] android_app_clear_key_events
    Thread: 30164
    Timestamp: 1770809748559
    Backtrace:
         0x72e8eabfe0 libgame.so!_ZN5Unity16UnityApplication16CleanInputEventsEv+0x20
         0x72e8ea9134 libgame.so!_ZN5Unity16UnityApplication12ProcessFrameEv+0x50
         0x72e8ea9338 libgame.so!_ZN5Unity16UnityApplication4LoopEv+0x194
         0x72e8eabc84 libgame.so!_Z8MainLoopP11android_app+0x40
         0x72e8eabd50 libgame.so!android_main+0x9c
         0x72e8eb2328 libgame.so!0x1d328
         0x73914f7df8 libc.so!_ZL15__pthread_startPv+0x10c
         0x7391494640 libc.so!__start_thread+0x48
         0x7391494640 libc.so!__start_thread+0x48

[*] android_app_clear_motion_events
    Thread: 30164
    Timestamp: 1770809748651
    Backtrace:
         0x72e8eabfe8 libgame.so!_ZN5Unity16UnityApplication16CleanInputEventsEv+0x28
         0x72e8ea9134 libgame.so!_ZN5Unity16UnityApplication12ProcessFrameEv+0x50
         0x72e8ea9338 libgame.so!_ZN5Unity16UnityApplication4LoopEv+0x194
         0x72e8eabc84 libgame.so!_Z8MainLoopP11android_app+0x40
         0x72e8eabd50 libgame.so!android_main+0x9c
         0x72e8eb2328 libgame.so!0x1d328
         0x73914f7df8 libc.so!_ZL15__pthread_startPv+0x10c
         0x7391494640 libc.so!__start_thread+0x48
         0x7391494640 libc.so!__start_thread+0x48
[Redmi Note 9S::Arno ]->
[Redmi Note 9S::Arno ]-> exit
```

Отсюда выяснилось, что libgame.so — это Unity runtime, а не логика кнопки. И действительно, анализ libgame.so показал, что по факту — это цикл. А вот самый большой нативный файл как раз libil2cpp.so. Скорее всего, он и хранил всю бизнес-логику генератора цитат.
\
Для того, чтобы проверить эту гипотезу, можно использовать утилиту Il2CppDumper.
\
\
Il2CppDumper — это инструмент, который используется для извлечения и анализа данных из приложений, скомпилированных с использованием технологии IL2CPP (Intermediate Language to C++). IL2CPP часто используется в Unity для повышения производительности и безопасности приложений.

Команда для использования утилиты:
> Il2CppDumper libil2cpp.so global-metadata.dat out

При использовании дампера на выходе получались файлы для анализа: Получишь: dump.cs, script.json.

## Анализ dump.cs:
При анализе данного файла происходил поиск по ключевым словам: Quote, Show, Button, OnClick, Random. Внимание может привлечь следущий класс:
```cs
// Namespace: 
public class FlagControl : MonoBehaviour // TypeDefIndex: 8092
{
	// Fields
	public GameObject textField; // 0x20
	public List<string> quotes; // 0x28

	// Methods

	// RVA: 0x16D135C Offset: 0x16D035C VA: 0x16D135C
	public void PopulateQuotes() { }

	// RVA: 0x16D1740 Offset: 0x16D0740 VA: 0x16D1740
	public void ShowQuote() { }

	// RVA: 0x16D1834 Offset: 0x16D0834 VA: 0x16D1834
	private void Start() { }

	// RVA: 0x16D1838 Offset: 0x16D0838 VA: 0x16D1838
	public byte[] GetKey() { }

	// RVA: 0x16D18A8 Offset: 0x16D08A8 VA: 0x16D18A8
	public byte[] GetIV() { }

	// RVA: 0x16D1918 Offset: 0x16D0918 VA: 0x16D1918
	public byte[] GetFlag() { }

	// RVA: 0x16D1988 Offset: 0x16D0988 VA: 0x16D1988
	public string DecryptFlag(byte[] key, byte[] iv, byte[] encryptedData) { }

	// RVA: 0x16D2120 Offset: 0x16D1120 VA: 0x16D2120
	public void .ctor() { }
}
```

Для проверки вызова метода `ShowQuote` можно также написать скрипт `ShowQuote.js`. При нажатии кнопки в приложении вывод был следующим:
```xml
[+] ShowQuote @ 0x72788d7740
[*] ShowQuote called
[*] ShowQuote called
[*] ShowQuote called
```
Итак, значит это то, что надо. Настоящие нужные методы:
```cs
public byte[] GetKey()
public byte[] GetIV()
public byte[] GetFlag()
public string DecryptFlag(byte[] key, byte[] iv, byte[] encryptedData)
```

Для того, чтобы перехватить абсолютно всю логику генерации флага, необходимо узнать адрес класса FlagControl, а дальше реализовать логику расшифровки флага.
```js
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
```

```xml
[+] ShowQuote @ 0x72786d1740
[+] FlagControl instance = 0x714a375200

FLAG: 
HTB{c@n_90u_533_w17h_90ur_5h@rp_e9e5}
```
