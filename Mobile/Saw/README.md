# Название задания: Saw
Автор: KArtikLESS
## Описание задания:
The malware forensics lab identified a new technique for hiding and executing code dynamically. A sample that seems to use this technique has just arrived in their queue. Can you help them?
## Ссылка на задание:
https://app.hackthebox.com/challenges/SAW
# Решение:
Для решения этого задания необходимо скачать файл SAW.zip, который содержит необходимый для исследования .apk файл. В репозитории данного также лежит файл ReadME.md, который
содержит информацию о совместимых с проектом платформы.
> Install this application in an API Level 29 or later (i.e. Android 10.0).

## Статический анализ Java кода
Сначала стоит провести статический анализ данного приложения. Для этого можноиспользовать декомпилятор Jadx. В декомпилированном приложении стоит в первую очередь посмотреть файл манифеста `AndroidManifest.xml`.

> Содержимое файла манифеста приложения:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0"
    android:compileSdkVersion="29"
    android:compileSdkVersionCodename="10"
    package="com.stego.saw"
    platformBuildVersionCode="29"
    platformBuildVersionName="10">
    <uses-sdk
        android:minSdkVersion="15"
        android:targetSdkVersion="29"/>
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
    <application
        android:theme="@style/Theme.AppCompat.Dialog.Alert"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:appComponentFactory="androidx.core.app.CoreComponentFactory">
        <activity android:name="com.stego.saw.MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```
Кажется, в приложении есть только одно `activity`, на котором стоит сосредоточиться: `MainActivity`. Внутри него есть несколько вещей, которые, на мой взгляд, интересны и полезны.

Первым таким триггером послужила загрузка нативных библиотек. Вероятно, часть бизнес-логики хранится именно в нём, либо модуль валидации данных, что тоже часто практикуется.

```java
public native String a(String str, String str2);

static {
    System.loadLibrary("default");
}
```

Следующее на что стоит обратить внимание, так это функция `onCreate`. Для открытия приложений пользователю необходимо указать дополнительные строки внутри Intent. Это означает, что в данном случае прямое открытие файла на устройстве невозможно.
Для запуска приложения через `adb` стоит использовать следующую команду: `adb shell am start -n com.stego.saw/.MainActivity \
  --es "open" "sesame"`
```java
public void onCreate(Bundle bundle) {
    super.onCreate(bundle);
    setContentView(R.layout.activity_main);
    this.FILE_PATH_PREFIX = getApplicationContext().getApplicationInfo().dataDir + File.separatorChar;
    Bundle extras = getIntent().getExtras();
    if (extras == null) {
        finish();
        return;
    }
    if (!extras.getString("open").equalsIgnoreCase("sesame")) {
        finish();
        return;
    }
    Button button = new Button(getApplicationContext());
    button.setText("Click me...");
    button.setBackgroundColor(SupportMenu.CATEGORY_MASK);
    ((WindowManager) getSystemService("window")).addView(button, new WindowManager.LayoutParams(200, 200, 2, 8, -3));
    button.setOnClickListener(new View.OnClickListener() {
        @Override
        public void onClick(View view) {
            MainActivity.this.f();
        }
    });
}
```

Функция ниже также очень любопытна, так как похоже, что она связана с оконным менеджером. Примечательно то, что создание объекта менеджером окон происходит с определёнными параметрами:
- type = 2038 (TYPE_APPLICATION_OVERLAY) — окно поверх всех приложений

Подробнее её реализацию стоит смотреть уже в динамике.

```java
public void f() {
    WindowManager windowManager = (WindowManager) getSystemService("window");
    WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams(200, 200, 2038, 8, -2);
    layoutParams.gravity = 17;
    Button button = new Button(getApplicationContext());
    button.setOnClickListener(new View.OnClickListener() {
        @Override
        public void onClick(View view) {
            MainActivity.this.alert();
        }
    });
    windowManager.addView(button, layoutParams);
}
```

Последней функцией в `MainActivity` является функция `alert`, которая выполняет какое-то действие по работе блока/алгоритма с методом XOR. Здесь было выдвинуто предположение, что логика для этого блока как раз и храниться в нативной библиотеке `libdefault.so`, которое позже подтвердилось. 
```java
public final String alert() {
    final EditText editText = new EditText(this);
    new AlertDialog.Builder(this)
        .setTitle("XOR XOR XOR")
        .setMessage("XOR ME !")
        .setView(editText)
        .setPositiveButton("XORIFY", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {
                MainActivity.this.answer = editText.getText().toString();
                MainActivity mainActivity = MainActivity.this;
                mainActivity.a(mainActivity.FILE_PATH_PREFIX, MainActivity.this.answer);
            }
        })
        .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {
                MainActivity.this.finish();
            }
        })
        .show();
    return this.answer;
}
```

После поверхностного статического анализа внутренней работы основных компонентов Java кода приложения стоит провести попытку его запуска на эмуляторе, для подтверждения выше перечисленных выводов.

## Динамический анализ
Для эмуляции приложения был выбран образ Pixel 5 (API 35) в Android Studio. Для запуска приложения использовалась команда с интентами через `adb`. Далее в динамическом анализе также будет использован фреймворк `Frida` для работы с приложением в запущенном/активном состоянии.
Для этого потребовалось получить root права на телефоне-эмуляторе. Это можно сделать с помощью утилиты rootAVD: https://github.com/newbit1/rootAVD

> Стартовый интерфейс приложения:
<img width="445" height="821" alt="image" src="https://github.com/user-attachments/assets/775244e7-9330-4f0b-be18-b6544471ccf1" />

Интересно то, что при нажатии кнопки в середине экрана, приложение попросту вылетало. Проблема заключалась как раз в том, что при вызове функции `f()` приложение запускало менеджер окон с параметром `показывать поверх других приложений` (это выяснилось ещё на этапе статического анализа), однако по умолчанию это разрешение выключено для всех приложений. Поэтому для дальнейшего анализа необходимо разрешить приложению данную функцию.

> Включённое разрешение:
<img width="468" height="808" alt="image" src="https://github.com/user-attachments/assets/ffa3b34c-b161-46a5-a012-3256f94ee4b2" />

После активации данной функции появлялась ещё одна серая кнопка.

<img width="447" height="812" alt="image" src="https://github.com/user-attachments/assets/6b555b47-e521-4383-bbbb-f70eb1e920db" />

Нажав на неё ещё раз выскакивал `alert` с текстом про XOR.

> Появившийся alert:
<img width="447" height="811" alt="image" src="https://github.com/user-attachments/assets/59631b3a-ac7f-414e-bc94-f861270a756c" />

С использованием `Frida` удалось выяснить, какие нативные методы вызывались при нажатии кнопки обработки ввода: `XORIFY`.

> Стек вызовов нативных методов:
<img width="1202" height="276" alt="image" src="https://github.com/user-attachments/assets/8608e833-d052-47d3-a507-4c1473323bbd" />

Судя по всему, проверка на `XOR ME!` содержится в функции `_Z17_Z1aP7_JNIEnvP8_1PKcS0_()`.
Дальнейший анализ требовал примерное понимание того, что происходит в нативной части приложения. Чтобы это сделать, необходимо с помощью любого дизассемблера, например `IDA`, разобраться в исходниках библиотеки `libdefault.so`.
Чтобы сделать это, сначала нужно получить этот бинарный файл. Для этого можно использовать утилиту apktool. Выполняемая команда для утилиты apktool:
> apktool d SAW.apk -o decompiled

В папке с декомпилированным кодом находим каталог `lib` и саму библиотеку.
> С помощью IDA находим вызов функции `_Z17_Z1aP7_JNIEnvP8_1PKcS0_()`:
<img width="549" height="87" alt="image" src="https://github.com/user-attachments/assets/de7a57bb-0c17-4b70-86c0-fe4b967a1f8c" />
<img width="963" height="731" alt="image" src="https://github.com/user-attachments/assets/b55e884e-9752-4b38-9cdd-f55dda80246c" />

> Адреса массивов, которые используются при сравнении с XOR:
<img width="933" height="207" alt="image" src="https://github.com/user-attachments/assets/10f38d9e-826b-46ae-9019-d941902f6896" />


С помощью кода на frida можно приаттачиться к процессу и выполнить замену текста валидации (проверки), вводимого пользователем, на правильный.
```js
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
```
В консоли при вводе любых значений в поле ввода для `XOR ME!` выводится следующая информация:

```
Hook installed successfully!
Function called, injecting password: fl0ating
Function returned: 0x1
SUCCESS! File should be created.
```

Пароль: fl0ating
Теперь нужно выяснить местоположение файла. Он должен быть в папке /data/data/io.stego.saw/, так как путь берётся из getApplicationContext().getApplicationInfo().dataDir + File.separatorChar.
При статическом анализе функции вычисления строки ввода для `XOR ME! было выяснено, что сепаратором является символ `h`.

```C
v8 = strlen(src);
v9 = (char *)calloc(v8 + 2, 1uLL);
strcpy(v9, src);
*(_WORD *)&v9[strlen(v9)] = 'h';
v10 = fopen(v9, "wb");
if ( v10 )
{
    v11 = v10;
    for ( j = 0LL; j != 0x318; ++j )
        fputc(*((_DWORD *)v3 + j), v11);
    fclose(v11);
}
```

> Полученный флаг:
<img width="888" height="442" alt="image" src="https://github.com/user-attachments/assets/c3ebf171-35fe-408f-8c3d-c31c3da4fda2" />

Флаг: HTB{SawS0DCLing}
