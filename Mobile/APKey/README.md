# Название задания: APKey
Автор: KArtikLESS
## Описание задания:
This app contains some unique keys. Can you get one?
## Ссылка на задание:
https://app.hackthebox.com/challenges/APKey
# Решение:
Для решения этого задания необходимо скачать файл APKey.zip, который содержит необходимый для исследования .apk файл.

Команда для распаковки:
> unzip APKey.zip

Данное приложение затем запускается на эмуляторе в AndroidStudio. Для этого необходимо открыть студию и выбрать вкладку `Profile or Debug APK`.
Выбранный эмулятор: Pixel 4 API 29. 

> Вот так выглядит само исследуемое приложение:
<img width="1874" height="882" alt="image" src="https://github.com/user-attachments/assets/bef38b79-25a1-490b-8a4c-d0f6230cfe41" />


Приложение исходя из своего интерфейса предполагает, что необходимо подобрать правильный логин и пароль для получения флага.
К слову, эмулятор данной версии был выбран не просто так. При попытке запустить приложение APKey.apk на стандартном мобильном эмуляторе с API 36 версии возникала ошибка, из-за которой установленное приложение не запускалось в режиме Debug.

Для того, чтобы понять причину проблемы можно использовать декомпилитор Jadx, который позволит проанализировать файл манифеста приложения `AndroidManifest.xml` на необходимые зависимости и версии, а также механизм работы данного приложения.

> Результат декомпиляции файла манифеста
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0"
    android:compileSdkVersion="30"
    android:compileSdkVersionCodename="11"
    package="com.example.apkey"
    platformBuildVersionCode="30"
    platformBuildVersionName="11">
    <uses-sdk
        android:minSdkVersion="16"
        android:targetSdkVersion="30"/>
    <application
        android:theme="@style/Theme.APKey"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:appComponentFactory="androidx.core.app.CoreComponentFactory">
        <activity android:name="com.example.apkey.MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```
Исходя из анализа файла `AndroidManifest.xml` можно сделать следующие выводы:
- Приложение совместимо с версиями API от 16 до 30 (Android 11)
- Сперва запускается `MainActivity`
- Приложение не запрашивает доступ к камере, контактам и т.д.

С помощью декомпилятора можно также разобраться в бизнес-логике приложения, проведя статический анализ файла.
В `MainActivity` обращено основное внимание к интерфейсу `View.OnClickListener`, который реализует обработку кликов с помощью функций: `onClick` и `onCreate`. Наиболее интересным здесь является функция `onClick`.

```java
public void onClick(android.view.View r5) throws java.security.NoSuchAlgorithmException {
    android.widget.Toast r5;
    java.lang.String r5;
    try {
        if (com.example.apkey.MainActivity.this.f928c.getText().toString().equals("admin")) {
            com.example.apkey.MainActivity r5 = com.example.apkey.MainActivity.this;
            c.b.a.b r1 = r5.e;
            java.lang.String r5 = r5.d.getText().toString();
            try {
                java.security.MessageDigest r1 = java.security.MessageDigest.getInstance("MD5");
                r1.update(r5.getBytes());
                byte[] r5 = r1.digest();
                java.lang.StringBuffer r1 = new java.lang.StringBuffer();
                for (byte r0 : r5) {
                    r1.append(java.lang.Integer.toHexString(r0 & 255));
                }
                r5 = r1.toString();
            } catch (java.security.NoSuchAlgorithmException r5) {
                r5.printStackTrace();
                r5 = "";
            }
            if (r5.equals("a2a3d412e92d896134d9c9126d756f")) {
                android.content.Context r5 = com.example.apkey.MainActivity.this.getApplicationContext();
                com.example.apkey.MainActivity r0 = com.example.apkey.MainActivity.this;
                c.b.a.b r1 = r0.e;
                c.b.a.g r0 = r0.f;
                r5 = android.widget.Toast.makeText(r5, c.b.a.b.a(c.b.a.g.a()), 1);
            } else {
                r5 = android.widget.Toast.makeText(com.example.apkey.MainActivity.this.getApplicationContext(), "Wrong Credentials!", 0);
            }
        }
        r5.show();
    } catch (java.lang.Exception r5) {
        r5.printStackTrace();
    }
}
```

В этой функции чётко видно, что в строке `com.example.apkey.MainActivity.this.f928c.getText().toString().equals("admin")` идёт сравнение со строкой admin. Чуть выше в классе появляется следующая строка `public EditText f928c`. Это серьёзный намёк на то, что сравнение проиcходит по логину с именем admin. f928c, вероятно, обфусцированное имя usernameField.

Таким образом, логин: `admin`.

Далее стоит обратить внимание на строку `r5 = android.widget.Toast.makeText(r5, c.b.a.b.a(c.b.a.g.a()), 1)` в каскадном условии `if (r5.equals("a2a3d412e92d896134d9c9126d756f"))`. 

Само по себе условие проверяет пароль в захешированном/зашифрованном виде. Такие выводы можно сделать на оcновании того, как выглядить условие else c выводом теста `Wrong Credentials!` при неудачном вводе пароля.

<img width="1871" height="895" alt="image" src="https://github.com/user-attachments/assets/359bd9aa-570d-4aca-a85b-ffab0cf5ac64" />

Так что анализ следует проводить непосредственно с методами `c.b.a.b.a(c.b.a.g.a())`, чтобы восстановить логику вывода скрытого текста (искомого флага).

Для начала стоит разобрать класс `c.b.a.b.a`.

## Разбор класса c.b.a.b.a
1. Сам по себе класс выглядит следующим образом:
```java
package c.b.a;

import android.util.Base64;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import javax.crypto.Cipher;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.SecretKeySpec;

/* loaded from: classes.dex */
public class b {
    public static String a(String str) throws NoSuchPaddingException, NoSuchAlgorithmException, InvalidKeyException {
        SecretKeySpec secretKeySpec = new SecretKeySpec((String.valueOf(h.a().charAt(0)) + String.valueOf(a.a().charAt(8)) + String.valueOf(e.a().charAt(5)) + String.valueOf(i.a().charAt(4)) + String.valueOf(h.a().charAt(1)).toLowerCase() + String.valueOf(h.a().charAt(4)) + String.valueOf(h.a().charAt(3)).toLowerCase() + String.valueOf(h.a().charAt(3)) + String.valueOf(h.a().charAt(0)) + String.valueOf(a.a().charAt(8)).toLowerCase() + String.valueOf(a.a().charAt(8)).toLowerCase() + String.valueOf(i.a().charAt(0)) + String.valueOf(c.a().charAt(3)).toLowerCase() + String.valueOf(f.a().charAt(3)) + String.valueOf(f.a().charAt(0)) + String.valueOf(c.a().charAt(0))).getBytes(), g.b());
        Cipher cipher = Cipher.getInstance(g.b());
        cipher.init(2, secretKeySpec);
        return new String(cipher.doFinal(Base64.decode(str, 0)), "utf-8");
    }
}
```

Класс генерирует секретный ключ, используя обращения к другим классам (a.a, b.a, c.a и т.д.).

Для краткости описания приведу пример одного из классов: `c.b.a.a`
```java
package c.b.a;

import java.util.ArrayList;

/* loaded from: classes.dex */
public class a {
    public static String a() {
        ArrayList arrayList = new ArrayList();
        arrayList.add("LmBf5G6h9j");
        arrayList.add("3De3f4HbnK");
        arrayList.add("hdKD7b87yb");
        arrayList.add("85S94kFpV1");
        arrayList.add("dCV4f5G90h");
        arrayList.add("34Jnf8ku4F");
        arrayList.add("ld7HV5F4d2");
        arrayList.add("el0oY7gF54");
        arrayList.add("lsKJt69jo8");
        arrayList.add("Kju87F5dhk");
        return (String) arrayList.get(3);
    }
}
```
Отсюда видно, что данный класс возвращает строку с индексом 3: `85S94kFpV1`.

2. Для составления секретного ключа необходимо вычислить все строки:
```
a.a() = "85S94kFpV1"        // индекс 3
c.a() = "FlEGyL"            // индекс 4  
d.a() = "wAxcoc"            // индекс 0
e.a() = "HyeaX9"            // индекс 7
f.a() = "6HxWkw"            // индекс 1
g.b() = алгоритм (см. ниже)
h.a() = "kHtZuV"            // индекс 6
i.a() = "rSE6qY"            // индекс 4
```

Алгоритм вычисления g.b():
```
g.b() = d.a().charAt(1) + i.a().charAt(2) + i.a().charAt(1)
       = "wAxcoc".charAt(1) + "rSE6qY".charAt(2) + "rSE6qY".charAt(1)
       = "A" + "E" + "S"
       = "AES"
```

Таким образом, для дешифрования сокрытого текста используется алгоритм AES.

3. Проведя вычисление непосредственно самого ключа из класса b, получим: `kV9qhuzZkvvrgW6F`
```
Ключ = 
    h.a().charAt(0) +           // "kHtZuV".charAt(0) = "k"
    a.a().charAt(8) +           // "85S94kFpV1".charAt(8) = "V" 
    e.a().charAt(5) +           // "HyeaX9".charAt(5) = "9"
    i.a().charAt(4) +           // "rSE6qY".charAt(4) = "q"
    h.a().charAt(1).toLowerCase() + // "kHtZuV".charAt(1) = "H" → "h"
    h.a().charAt(4) +           // "kHtZuV".charAt(4) = "u"
    h.a().charAt(3).toLowerCase() + // "kHtZuV".charAt(3) = "Z" → "z"
    h.a().charAt(3) +           // "kHtZuV".charAt(3) = "Z"
    h.a().charAt(0) +           // "kHtZuV".charAt(0) = "k"
    a.a().charAt(8).toLowerCase() + // "85S94kFpV1".charAt(8) = "V" → "v"
    a.a().charAt(8).toLowerCase() + // "85S94kFpV1".charAt(8) = "V" → "v"
    i.a().charAt(0) +           // "rSE6qY".charAt(0) = "r"
    c.a().charAt(3).toLowerCase() + // "FlEGyL".charAt(3) = "G" → "g"
    f.a().charAt(3) +           // "6HxWkw".charAt(3) = "W"
    f.a().charAt(0) +           // "6HxWkw".charAt(0) = "6"
    c.a().charAt(0)             // "FlEGyL".charAt(0) = "F"
```

Отлично! Анализ данного класса дал понимание о методе дешифрования (AES) скрытого флага и использованном для него секретном ключе.

## Разбор класса c.b.a.g.a
1. Принцип разбора данного класса схож с разбором предыдущего класса, поэтому приведу лишь архитектуру самого рассматриваемого класса.
```java
package c.b.a;

import java.util.ArrayList;

/* loaded from: classes.dex */
public class g {
    public static String a() {
        StringBuilder sb = new StringBuilder();
        ArrayList arrayList = new ArrayList();
        arrayList.add("722gFc");
        arrayList.add("n778Hk");
        arrayList.add("jvC5bH");
        arrayList.add("lSu6G6");
        arrayList.add("HG36Hj");
        arrayList.add("97y43E");
        arrayList.add("kjHf5d");
        arrayList.add("85tR5d");
        arrayList.add("1UlBm2");
        arrayList.add("kI94fD");
        sb.append((String) arrayList.get(8));
        sb.append(h.a());
        sb.append(i.a());
        sb.append(f.a());
        sb.append(e.a());
        ArrayList arrayList2 = new ArrayList();
        arrayList2.add("ue7888");
        arrayList2.add("6HxWkw");
        arrayList2.add("gGhy77");
        arrayList2.add("837gtG");
        arrayList2.add("HyTg67");
        arrayList2.add("GHR673");
        arrayList2.add("ftr56r");
        arrayList2.add("kikoi9");
        arrayList2.add("kdoO0o");
        arrayList2.add("2DabnR");
        sb.append((String) arrayList2.get(9));
        sb.append(c.a());
        ArrayList arrayList3 = new ArrayList();
        arrayList3.add("jH67k8");
        arrayList3.add("8Huk89");
        arrayList3.add("fr5GtE");
        arrayList3.add("Hg5f6Y");
        arrayList3.add("o0J8G5");
        arrayList3.add("Wod2bk");
        arrayList3.add("Yuu7Y5");
        arrayList3.add("kI9ko0");
        arrayList3.add("dS4Er5");
        arrayList3.add("h93Fr5");
        sb.append((String) arrayList3.get(5));
        sb.append(d.a());
        sb.append(a.a());
        return sb.toString();
    }

    public static String b() {
        return String.valueOf(d.a().charAt(1)) + String.valueOf(i.a().charAt(2)) + String.valueOf(i.a().charAt(1));
    }
}
```

Можно заметить, что данный класс использует два статических метода. Второй метод использовался для алгоритмизации дешифрования методом AES.

2. Вычисление g.a() даёт следущий результат: `1UlBm2kHtZuVrSE6qY6HxWkwHyeaX92DabnRFlEGyLWod2bkwAxcoc85S94kFpV1`
```
g.a() = 
    arrayList.get(8) +     // "1UlBm2"
    h.a() +                // "kHtZuV"
    i.a() +                // "rSE6qY"
    f.a() +                // "6HxWkw"
    e.a() +                // "HyeaX9"
    arrayList2.get(9) +    // "2DabnR"
    c.a() +                // "FlEGyL"
    arrayList3.get(5) +    // "Wod2bk"
    d.a() +                // "wAxcoc"
    a.a()                  // "85S94kFpV1"
```

Таким образом, получаем алгоритм генерации самого шифртекста.

## Дешифратор на Python
Итак, осталось получить сам флаг по полученным в ходе криптоаналитики данным. 
- Шифртекст: `1UlBm2kHtZuVrSE6qY6HxWkwHyeaX92DabnRFlEGyLWod2bkwAxcoc85S94kFpV1`
- Секретный ключ: `kV9qhuzZkvvrgW6F`
- Алгоритм: AES
  
При анализе исходников выяснилось, что для дешифровки флага используется алгоритм AES. Однако ничего не сказано в каком конкретно режиме он используется. Отсюда вполне естественно предположить, что используется он в режиме ECB, так это самый простой режим, не требующий использования начального вектора инициализации для блочных шифров (синхропосылки). Тем более ничего связанного с синхропосылкой в исходниках приложения найдено не было.

Строка шифртекста хранится в формате Base64. Это способ кодирования бинарных данных в текстовый формат. **AES работает с бинарными данными, а не с текстом**. Поэтому требуется преобразовать полученные данные в бинарный вид.

Когда данные не кратны размеру блока (16 байт для AES), добавляется padding. Поэтому при выводе флага стоит это учитывать. Android использует PKCS#5/PKCS#7 по умолчанию.

<img width="1816" height="425" alt="image" src="https://github.com/user-attachments/assets/216fc0ab-e649-4fca-8f5e-a94f252bfdea" />


Флаг: HTB{m0r3_0bfusc4t1on_w0uld_n0t_hurt}
