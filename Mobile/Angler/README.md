# Название задания: Angler
Автор: KArtikLESS
## Описание задания:
The skilled fisherman used his full strength and expertise to hook the fish. Can you beat him and set the fish free?
## Ссылка на задание:
https://app.hackthebox.com/challenges/Angler
# Решение:
Для решения этого задания необходимо скачать файл Angler.zip, который содержит необходимый для исследования .apk файл.

Команда для распаковки:
> unzip Angler.zip

Данное приложение затем запускается на эмуляторе в AndroidStudio. Для этого необходимо открыть студию и выбрать вкладку `Profile or Debug APK`.
Выбранный эмулятор: Pixel 3a API 29. 

> Интерфейс приложения:
<img width="432" height="816" alt="i am strong" src="https://github.com/user-attachments/assets/598e360b-6e4b-4495-9cc5-6caeb5a9b3d8" />

В связи с тем, что в приложении нет никаких кликабельных элементов, было решено сразу провести статический анализ с целью выяснить, что вообще может в нём происходить.

## Статический анализ приложения:
Для проведения статического анализа приложения был выбран декомпилятор JADX. Для начала был исследован файл манифеста Android-приложения: `AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0"
    android:compileSdkVersion="32"
    android:compileSdkVersionCodename="12"
    package="com.example.angler"
    platformBuildVersionCode="32"
    platformBuildVersionName="12">
    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="32"/>
    <application
        android:theme="@style/Theme.Angler"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:fullBackupContent="@xml/backup_rules"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:appComponentFactory="androidx.core.app.CoreComponentFactory"
        android:dataExtractionRules="@xml/data_extraction_rules">
        <activity
            android:name="com.example.angler.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        <provider
            android:name="androidx.startup.InitializationProvider"
            android:exported="false"
            android:authorities="com.example.angler.androidx-startup">
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

Из его анализа можно заметить, что вся бизнес-логика так или иначе проходит через одну активность: `MainActivity`. Следом был произведён её анализ. 

```java
package com.example.angler;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.Window;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import d.g;
import java.io.PrintStream;
import java.util.Objects;
import s.d;

/* loaded from: classes.dex */
public class MainActivity extends g {
    public static final /* synthetic */ int A = 0;
    public TextView v;

    /* renamed from: w, reason: collision with root package name */
    public TextView f1753w;

    /* renamed from: x, reason: collision with root package name */
    public ImageView f1754x;

    /* renamed from: y, reason: collision with root package name */
    public String f1755y = "@|uqcu0t\u007f~7d0{y||0}u1\u001aY7||0du||0i\u007fe0gxubu0dxu0v|qw0yc>";

    /* renamed from: z, reason: collision with root package name */
    public final a f1756z = new a();

    /* loaded from: classes.dex */
    public class a extends BroadcastReceiver {
        public a() {
        }

        @Override // android.content.BroadcastReceiver
        public final void onReceive(Context context, Intent intent) {
            PrintStream printStream;
            String str;
            if (intent.getStringExtra("Is_on").equals("yes")) {
                MainActivity mainActivity = MainActivity.this;
                int i3 = MainActivity.A;
                Window window = mainActivity.getWindow();
                window.addFlags(Integer.MIN_VALUE);
                window.clearFlags(67108864);
                window.setStatusBarColor(mainActivity.getResources().getColor(R.color.purple_200));
                d.a r3 = mainActivity.r();
                Objects.requireNonNull(r3);
                r3.b(new ColorDrawable(mainActivity.getResources().getColor(R.color.teal_700)));
                mainActivity.f1754x.setImageResource(R.drawable.please);
                mainActivity.v.setTextColor(mainActivity.getResources().getColor(R.color.purple_200));
                mainActivity.v.setText("1%");
                mainActivity.f1753w.setText(d.d(mainActivity.f1755y));
                Toast.makeText(context, "Look me inside", 1).show();
                printStream = System.out;
                str = MainActivity.this.getInfo(d.d("XDR"));
            } else {
                printStream = System.out;
                str = "I am Strong, no one can defeat me";
            }
            printStream.println(str);
        }
    }

    static {
        System.loadLibrary("angler");
    }

    public native String getInfo(String str);

    @Override // androidx.fragment.app.p, androidx.activity.ComponentActivity, w.g, android.app.Activity
    public final void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        setContentView(R.layout.activity_main);
        this.v = (TextView) findViewById(R.id.textView2);
        this.f1753w = (TextView) findViewById(R.id.textView);
        this.f1754x = (ImageView) findViewById(R.id.imageView);
        registerReceiver(this.f1756z, new IntentFilter("android.intent.action.BATTERY_LOW"));
    }
}
```

Стоит отметить, что используемый метод обфускации в данном приложении не один из самых серьёзных, так как всё же можно прочитать некоторые строки, которые хранятся в открытом виде в коде приложения. Но в коде всё же присутствует зашифрованная строка `f1755y`. Вызов функции `mainActivity.f1753w.setText(d.d(mainActivity.f1755y));` расшифровывал её согласно следующему алгоритму.

```java
public static String d(String str) {
    char[] charArray = str.toCharArray();
    for (int i3 = 0; i3 < charArray.length; i3++) {
        charArray[i3] = (char)(charArray[i3] ^ 16);
    }
    return String.valueOf(charArray);
}
```

Такую же функцию выполнял и вызов `str = MainActivity.this.getInfo(d.d("XDR"));`. Была предпринята попытка расшифровать данную строку с помощью написанного на питоне скрипта.
> Кастомный декриптор:
<img width="1312" height="797" alt="encrypt str" src="https://github.com/user-attachments/assets/94927c7f-f172-4b82-81c2-700d19d1f409" />

Однако судя по всему эта информация не является флагом, а лишь выводом текста на экран приложения.\
\
Анализ также дал чётко понять, что приложение использует функцию `registerReceiver`, которая реагирует на получение системного интента андроида: `android.intent.action.BATTERY_LOW`. Он отправляется системой, когда уровень заряда батареи опускается ниже определенного порога. Когда система отправляет этот broadcast, срабатывает onReceive(). Примечательно также то, что сам метод требует системный интент не провоцирует выполнение ветки `if (intent.getStringExtra("Is_on").equals("yes"))`. Для этого требуется отправлять эти дополнительные данные вместе с системным вызовом, что в реальных условиях никогда не произойдёт!!! Соответственно нужно симулировать ситуации самостоятельно.

## Динамический анализ приложения:
Для этого стоит войти в окружение `shell` устройства (в моём случае телефон также имел рут права):

> generic_x86_64:/ # am broadcast -a "android.intent.action.BATTERY_LOW" --es "Is_on" "yes" \
> Broadcasting: Intent { act=android.intent.action.BATTERY_LOW flg=0x400000 (has extras) } \
> Broadcast completed: result=0

> Обновлённый интерфейс приложения:
<img width="410" height="817" alt="low2" src="https://github.com/user-attachments/assets/9383f163-2e59-46d4-9bae-9e0edeb02194" />

Расшифрованный ранее текст действительно оказался выводом на экран сообщения. Также было замечено сообщение `Look me inside`, которое, скорее всего, должно было натолкнуть на мысль, что флаг нужно искать либо в отладчике, либо в нативной части.\
\
При анализе логов через Android Studio был получен следующий вывод во время вызова broadcast команды:

<img width="1672" height="430" alt="Logcat" src="https://github.com/user-attachments/assets/39dc0559-adf5-4e81-abd8-484fa59fcb3c" />

При попытке поиска данной строки внутри JADX ничего не вышло. Однако при анализе `MainActivity` было также замечено, что приложение использует вызов нативной библиотеки `angler`.
> Вызов нативной библиотеки:
```java
static {
    System.loadLibrary("angler");
}
```
Для её анализа стоило сначала декомпилировать приложение с помощью утилиты apktool:
> apktool d Angler.apk -o decompiled

Далее нативную библиотеку можно исследовать с помощью дизассемблера IDA Pro. Поиск строки `I am not here, I am there` дал положительный результат.
> Искомая строка:
<img width="787" height="347" alt="here flag" src="https://github.com/user-attachments/assets/22decd9d-c3d8-4b57-ad71-ad9c8fca5662" />

Судя по всему, флаг хранится в аргументах функции `srcmp`. Для проверки этой гипотезы был написан скрипт `Frida` для перехвата аргументов функции сравнения строк. Стоит отметить, что для этого шага требуются рут права, которые можно получить, например, с помощью утилиты `rootAVD`: https://github.com/newbit1/rootAVD.

> Написанная хук-функция:
```js
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
```

> Перехваченные аргументы:
<img width="595" height="187" alt="image" src="https://github.com/user-attachments/assets/fd97f31e-a763-4352-b846-4ea506445c63" />

Судя по выводу, это и есть наш флаг. Однако он храниться в виде HEX значения. С помощью ChatGPT можно его быстро привести к нужному формату:

<img width="922" height="376" alt="Flag decode" src="https://github.com/user-attachments/assets/32fb9db9-a9d7-40ae-a3e4-2ddeb02de967" />

Флаг: HTB{you_4r3_good_4t_h00k1n9}
