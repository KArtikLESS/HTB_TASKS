# Название задания: Anchored
Автор: KArtikLESS
## Описание задания:
A client asked me to check if I can intercept the https request and get the value of the secret parameter that is passed along with the user's email. The application is intended to run in a non-rooted device. Can you help me find a way to intercept this value in plain text.
## Ссылка на задание:
https://app.hackthebox.com/challenges/Anchored
# Решение:
Для решения этого задания необходимо скачать файл Anchored.zip, который содержит необходимый для исследования .apk файл.

Команда для распаковки:
> unzip Anchored.zip

После распаковки можно было увидеть следующие данные в файле `Readme.txt`:
> 1. Install this application in an API Level 29 or earlier (i.e. Android 10.0 (Google Play)).

> 2. Install this application in a non-rooted device (i.e. In Android Studio AVD Manager select an image that includes (Google Play)).

Что интересно, так это п.2, который говорит о том, что в динамике будет сложно тестировать приложение.
Данное приложение затем запускается на эмуляторе в AndroidStudio. Для этого необходимо открыть студию и выбрать вкладку `Profile or Debug APK`.
Выбранный эмулятор: Pixel 3a API 29. 

> Интерфейс приложения:
<img width="397" height="842" alt="interface" src="https://github.com/user-attachments/assets/f8a7ab37-c437-4e04-99d3-1177c5b9f109" />

При заполнении данных в поле ввода email ничего не происходило. Никаких всплывающих окон или push-уведомлений не появлялось. Тогда было принято решение провести статический анализ приложения с использованием декомпилятора JADX.

## Статический анализ приложения
В первую очередь был открыт файл `AndroidManifest.xml` для ознакомления с используемыми активностями.
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0"
    android:compileSdkVersion="31"
    android:compileSdkVersionCodename="12"
    package="com.example.anchored"
    platformBuildVersionCode="31"
    platformBuildVersionName="12">
    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="31"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <application
        android:theme="@style/Theme.Anchored"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:networkSecurityConfig="@xml/network_security_config"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:appComponentFactory="androidx.core.app.CoreComponentFactory">
        <activity
            android:name="com.example.anchored.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```
В файле явно выделена активность `MainActivity`. Её дальнейший анализ показал то, что при нажатии кнопки `Request Access` в приложении происходило обращение к сайту.

```java
public void onClick(View view) {
    MainActivity.this.f1945p.setText("Thank you for requesting early access.");
    l.a(MainActivity.this).a(new c(1, "https://anchored.com:4443/test.php", new C0012a(), new b()));
}
```
```java
public Map<String, String> g() {
    HashMap hashMap = new HashMap();
    hashMap.put("Content-Type", "application/x-www-form-urlencoded");
    return hashMap;
}
```
Для `x-www-form-urlencoded` актуальны стандартные атаки: SQL-инъекции, XSS, инъекции команд в параметрах. Однако для тестирования таких методик атак необходимо было инициализировать перехват и модификацию запросов к сайту приложением. С данной целью был использован `Burp Suite`. Но и здесь есть загвоздка. С учётом того, что приложения с достаточно новым API (к ним относится как раз API 29 версии) перестают доверять самоподписанным сертификатам. При этом динамический обход данной защиты не поможет, так как для этого понадобятся рут права.

> Вывод ошибки certificate_unknown в Burp Suite:
<img width="1892" height="100" alt="image" src="https://github.com/user-attachments/assets/da598103-9b0d-46ca-a995-040d3ed79566" />

Тогда было принято решение попробовать поманипулировать с подписью сертификата. В файле манифеста была найдена строка: `android:networkSecurityConfig="@xml/network_security_config`.
Эта строка подключает пользовательскую конфигурацию сетевой безопасности к Android-приложению. Её анализ позволил определить, каким SSL-сертификатам доверяет приложение.

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">anchored.com
        </domain>
        <trust-anchors>
            <certificates src="@raw/certificate"/>
        </trust-anchors>
    </domain-config>
</network-security-config>
```

Доверяет она лишь одному сертификату: `raw/certificate`.
В таком случае можно попробовать создать свой сертификат и заставить приложение ему доверять. Для создание своего сертификата в разделе `Proxy Settings` нужно выбрать следующую кнопку: 

> Импорт или экспорт сертификата:
<img width="1427" height="421" alt="image" src="https://github.com/user-attachments/assets/13eadccf-411e-4d98-ad87-14e370270ce9" />

Далее стоит выбрать экспорт в формате DER:
> Экспорт:
<img width="577" height="547" alt="image" src="https://github.com/user-attachments/assets/6d1407c8-2e8a-4d75-acc6-2533a7235784" />

Получившейся при экспорте файл можно назвать по-разному и добавить в папку с .apk файлом. Мной он был назван `cert_burp.der`.
Чтобы добавить данный сертификат в список доверенных, стоит изменить настройки сетевой защиты приложения и добавить этот сертификат в него соответственно.
Для декомпиляции можно использовать утилиту apktool.

Команда, для декомпиляции: `apktool d anchored.apk -o decompiled`.

<img width="1093" height="261" alt="image" src="https://github.com/user-attachments/assets/7c10d5de-3eb9-4633-a010-6ce36db799cc" />

Сертификат в приложении храниться в формате .pem, поэтому для нашего сертификата тоже стоит изменить расширение.

> Используемый сертификат:
<img width="1552" height="551" alt="image" src="https://github.com/user-attachments/assets/76aaff8c-f704-4216-90a6-6c80b170e887" />

Для конвертации можно использовать `openssl` встроенный в `java`. X.509 - стандарт для инфраструктуры открытых ключей (PKI). Все SSL/TLS сертификаты используют X.509.

Команда, для конвертации файла: `openssl x509 -inform DER -in cert_burp.der -out cert_burp.pem`.
Затем стоит скопировать данный сертификат в директорию, где хранится оригинальный экземпляр и перезаписать его имя.

<img width="1226" height="198" alt="image" src="https://github.com/user-attachments/assets/ee57de94-1273-4154-8bb5-4058bb6a2bcb" />

Следующим шагом является перезапись самого конфига `network_security_config`. Для этого приложению было позваолено доверять системным и пользовательским (Burp) сертификатам.
> Обновлённый `network_security_config`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```
Остаётся лишь пересобрать приложение с изменениями и подписать его. Используемые для этого команды приведены ниже:

- `apktool b decompiled -o anchored_patched.apk`
- `keytool -genkey -v -keystore debug.keystore -alias androiddebugkey ^
  -keyalg RSA -keysize 2048 -validity 10000 ^
  -dname "CN=Android Debug,O=Android,C=US" ^
  -storepass android -keypass android`
- `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 ^
  -keystore debug.keystore anchored_patched.apk androiddebugkey ^
  -storepass android -keypass android`

Теперь необходимо переустановить приложение и перехватить отправляемые им данные через `Burp Suite` для анализа. Флаг оказался в самом теле запроса.

> Перехват запроса:
<img width="757" height="256" alt="image" src="https://github.com/user-attachments/assets/505d2c48-317b-401f-9a34-7cea0b3c6465" />

Флаг: HTB{UnTrUst3d_C3rT1f1C4T3s}
